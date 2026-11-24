"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import {
  getIdTokenResult,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "app/firebase/firebase";
import {
  ContentReference,
  ContentReview,
  Review,
  ReviewDimensions,
} from "app/types";
import { isValidReviewDimension, isValidReviewRating } from "app/content";

const dimensionFields: {
  key: keyof ReviewDimensions;
  label: string;
}[] = [
  { key: "story", label: "Story" },
  { key: "craft", label: "Craft" },
  { key: "emotionalImpact", label: "Emotional impact" },
  { key: "rewatchability", label: "Rewatchability" },
];

export function ContentReviews({ content }: { content: ContentReference }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isVerifiedCritic, setIsVerifiedCritic] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("");
  const [dimensions, setDimensions] = useState<
    Partial<Record<keyof ReviewDimensions, string>>
  >({});
  const [scheduleAt, setScheduleAt] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const seasonNumber =
    "seasonNumber" in content ? content.seasonNumber : undefined;
  const episodeNumber =
    "episodeNumber" in content ? content.episodeNumber : undefined;

  const contentKey = useMemo(
    () =>
      [
        content.contentType,
        content.tmdbId,
        seasonNumber ?? "",
        episodeNumber ?? "",
      ].join("_"),
    [content.contentType, content.tmdbId, seasonNumber, episodeNumber]
  );
  const reviewId = user ? `${user.uid}_${contentKey}` : "";

  const readPublishedReviews = useCallback(async () => {
    setLoading(true);
    try {
      const publishedQuery = query(
        collection(db, "reviews"),
        where("contentKey", "==", contentKey),
        where("status", "==", "published")
      );
      const snapshot = await getDocs(publishedQuery);
      const canonicalReviews = snapshot.docs.map(
        (item) => item.data() as ContentReview
      );
      let legacyReviews: ContentReview[] = [];
      if (content.contentType === "movie") {
        const legacyMovie = await getDoc(
          doc(db, "movies", String(content.tmdbId))
        );
        const existingReviews = legacyMovie.data()?.reviews;
        if (Array.isArray(existingReviews)) {
          legacyReviews = existingReviews.map((review: any, index: number) => ({
            id: `legacy_${review.uid ?? "member"}_${index}`,
            uid: review.uid ?? "",
            userName: review.userName ?? "Member",
            userURL: review.userURL ?? "",
            content,
            review: review.review ?? "",
            rating: review.rating,
            dimensions: review.dimensions,
            status: "published",
            createdAt: legacyTimestamp(review.timestamp),
            updatedAt: legacyTimestamp(review.timestamp),
            publishedAt: legacyTimestamp(review.timestamp),
            legacySource: {
              movieId: String(content.tmdbId),
              review: review as Review,
            },
          }));
        }
      }

      const canonicalAuthors = new Set(
        canonicalReviews.map((review) => `${review.uid}_${review.review}`)
      );
      setReviews([
        ...canonicalReviews,
        ...legacyReviews.filter(
          (review) => !canonicalAuthors.has(`${review.uid}_${review.review}`)
        ),
      ]);
    } catch (error) {
      console.error("Unable to load published reviews:", error);
      setStatusMessage("Reviews could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [
    contentKey,
    content.contentType,
    content.tmdbId,
    content.title,
    content.poster_path,
    content.backdrop_path,
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsVerifiedCritic(false);
      if (currentUser) {
        try {
          const token = await getIdTokenResult(currentUser);
          setIsVerifiedCritic(token.claims.verifiedCritic === true);
        } catch (error) {
          console.error("Unable to read critic verification:", error);
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    readPublishedReviews();
  }, [readPublishedReviews]);

  useEffect(() => {
    if (!reviewId) return;
    getDoc(doc(db, "reviews", reviewId))
      .then((snapshot) => {
        if (!snapshot.exists() || snapshot.data().status !== "draft") return;
        const draft = snapshot.data();
        setReviewText(draft.review ?? "");
        setRating(draft.rating === undefined ? "" : String(draft.rating));
        setDimensions({
          story:
            draft.dimensions?.story === undefined
              ? ""
              : String(draft.dimensions.story),
          craft:
            draft.dimensions?.craft === undefined
              ? ""
              : String(draft.dimensions.craft),
          emotionalImpact:
            draft.dimensions?.emotionalImpact === undefined
              ? ""
              : String(draft.dimensions.emotionalImpact),
          rewatchability:
            draft.dimensions?.rewatchability === undefined
              ? ""
              : String(draft.dimensions.rewatchability),
        });
      })
      .catch((error) => {
        console.error("Unable to load review draft:", error);
      });
  }, [reviewId]);

  const readDimensions = (): ReviewDimensions => {
    const result: ReviewDimensions = {};
    for (const { key } of dimensionFields) {
      const rawValue = dimensions[key];
      if (rawValue !== undefined && rawValue !== "") {
        result[key] = Number(rawValue);
      }
    }
    return result;
  };

  const validateReview = () => {
    if (!user || !reviewText.trim()) {
      setStatusMessage("Sign in and write a review before saving.");
      return false;
    }
    if (rating && !isValidReviewRating(Number(rating))) {
      setStatusMessage(
        "Overall rating must use half-star increments from 0.5 to 5."
      );
      return false;
    }
    if (
      Object.values(readDimensions()).some(
        (score) => score === undefined || !isValidReviewDimension(score)
      )
    ) {
      setStatusMessage(
        "Each optional dimension must be a whole-number score from 0 to 5."
      );
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    if (!validateReview() || !user) return;
    setSaving(true);
    setStatusMessage("");
    try {
      const existing = await getDoc(doc(db, "reviews", reviewId));
      const now = new Date().toISOString();
      await setDoc(
        doc(db, "reviews", reviewId),
        {
          id: reviewId,
          uid: user.uid,
          userName: user.displayName ?? "Member",
          userURL: user.photoURL ?? "",
          content,
          contentKey,
          review: reviewText.trim(),
          ...(rating ? { rating: Number(rating) } : {}),
          dimensions: readDimensions(),
          status: "draft",
          createdAt: existing.data()?.createdAt ?? now,
          updatedAt: now,
        },
        { merge: true }
      );
      setStatusMessage("Draft saved privately.");
    } catch (error) {
      console.error("Unable to save review draft:", error);
      setStatusMessage("Draft could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const callReviewFunction = async (
    functionName: "publishReview" | "scheduleReview",
    payload: { reviewId: string; scheduledAt?: string }
  ) => {
    if (!validateReview() || !user) return;
    setSaving(true);
    setStatusMessage("");
    try {
      const existing = await getDoc(doc(db, "reviews", reviewId));
      const now = new Date().toISOString();
      await setDoc(
        doc(db, "reviews", reviewId),
        {
          id: reviewId,
          uid: user.uid,
          userName: user.displayName ?? "Member",
          userURL: user.photoURL ?? "",
          content,
          contentKey,
          review: reviewText.trim(),
          ...(rating ? { rating: Number(rating) } : {}),
          dimensions: readDimensions(),
          status: "draft",
          createdAt: existing.data()?.createdAt ?? now,
          updatedAt: now,
        },
        { merge: true }
      );
      const call = httpsCallable(getFunctions(), functionName);
      await call(payload);
      setStatusMessage(
        functionName === "publishReview"
          ? "Review published."
          : "Review scheduled."
      );
      if (functionName === "publishReview") await readPublishedReviews();
    } catch (error) {
      console.error(`Unable to ${functionName}:`, error);
      setStatusMessage(
        functionName === "scheduleReview"
          ? "Only verified critics can schedule a review, and the publication time must be in the future."
          : "Review could not be published."
      );
    } finally {
      setSaving(false);
    }
  };

  const publishNow = () => callReviewFunction("publishReview", { reviewId });

  const scheduleReview = () => {
    const parsedDate = new Date(scheduleAt);
    if (!scheduleAt || !Number.isFinite(parsedDate.getTime())) {
      setStatusMessage("Choose a valid future publication time.");
      return;
    }
    callReviewFunction("scheduleReview", {
      reviewId,
      scheduledAt: parsedDate.toISOString(),
    });
  };

  const deleteReview = async (review: ContentReview) => {
    if (!user || review.uid !== user.uid) return;
    setSaving(true);
    setStatusMessage("");
    try {
      if (review.legacySource) {
        const call = httpsCallable(getFunctions(), "deleteLegacyReview");
        await call(review.legacySource);
      } else {
        await deleteDoc(doc(db, "reviews", review.id));
      }
      await readPublishedReviews();
      setStatusMessage("Review deleted.");
    } catch (error) {
      console.error("Unable to delete review:", error);
      setStatusMessage("Review could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="w-full">
      <h2 className="mb-3 text-xl font-bold text-p-white">Reviews</h2>
      {user ? (
        <form
          className="mb-6 flex flex-col gap-3 rounded bg-review-bg/30 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveDraft();
          }}
        >
          <label className="text-sm text-sh-grey">
            Your review
            <textarea
              className="mt-1 min-h-28 w-full rounded bg-h-grey p-3 text-drop-black"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
            />
          </label>
          <label className="text-sm text-sh-grey">
            Overall rating (half-stars)
            <input
              className="ml-2 w-24 rounded bg-h-grey px-2 py-1 text-drop-black"
              type="number"
              min="0.5"
              max="5"
              step="0.5"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {dimensionFields.map(({ key, label }) => (
              <label className="text-sm text-sh-grey" key={key}>
                {label} (optional, 0–5)
                <input
                  className="ml-2 w-20 rounded bg-h-grey px-2 py-1 text-drop-black"
                  type="number"
                  min="0"
                  max="5"
                  step="1"
                  value={dimensions[key] ?? ""}
                  onChange={(event) =>
                    setDimensions((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded bg-c-grey px-3 py-2 text-sm text-p-white"
              type="submit"
              disabled={saving}
            >
              Save private draft
            </button>
            <button
              className="rounded bg-hov-blue px-3 py-2 text-sm text-p-white"
              type="button"
              disabled={saving}
              onClick={publishNow}
            >
              Publish now
            </button>
            {isVerifiedCritic && (
              <>
                <input
                  aria-label="Scheduled publication time"
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(event) => setScheduleAt(event.target.value)}
                  className="rounded bg-h-grey px-2 py-1 text-drop-black"
                />
                <button
                  className="rounded bg-c-grey px-3 py-2 text-sm text-p-white"
                  type="button"
                  disabled={saving}
                  onClick={scheduleReview}
                >
                  Schedule
                </button>
              </>
            )}
          </div>
          {statusMessage && (
            <p className="text-sm text-sh-grey" role="status">
              {statusMessage}
            </p>
          )}
        </form>
      ) : (
        <p className="mb-4 text-sh-grey">Sign in to write a review.</p>
      )}
      {loading && <p className="text-sh-grey">Loading reviews...</p>}
      {!loading && reviews.length === 0 && (
        <p className="text-sh-grey">No published reviews yet.</p>
      )}
      {reviews.map((item) => (
        <article className="border-b border-b-grey py-3" key={item.id}>
          <div className="flex items-baseline gap-2 text-p-white">
            <span>{item.userName}</span>
            {user?.uid === item.uid && (
              <button
                type="button"
                className="text-xs text-sh-grey underline"
                disabled={saving}
                onClick={() => deleteReview(item)}
              >
                Delete
              </button>
            )}
            {item.rating !== undefined && (
              <span className="text-sm text-sh-grey">{item.rating}/5</span>
            )}
          </div>
          <p className="mt-2 text-sh-grey">{item.review}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-sh-grey">
            {dimensionFields.map(
              ({ key, label }) =>
                item.dimensions?.[key] !== undefined && (
                  <span key={key}>
                    {label}: {item.dimensions[key]}/5
                  </span>
                )
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function legacyTimestamp(timestamp?: string): string {
  if (!timestamp) return new Date(0).toISOString();
  const [day, month, year] = timestamp.split(".");
  if (day && month && year) {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  const parsed = new Date(timestamp);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : new Date(0).toISOString();
}
