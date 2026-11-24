import { getAuth } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();

type DraftTransition =
  | { status: "published"; publishedAt: string; updatedAt: string }
  | { status: "scheduled"; scheduledAt: string; updatedAt: string };

function requireUid(uid: unknown): string {
  if (typeof uid !== "string" || !uid) {
    throw new HttpsError("invalid-argument", "A review ID is required.");
  }
  return uid;
}

async function transitionDraft(
  reviewId: string,
  uid: string,
  changes: DraftTransition
) {
  const reference = db.collection("reviews").doc(reviewId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new HttpsError("not-found", "Review draft not found.");
    }
    const review = snapshot.data();
    if (review?.uid !== uid || review.status !== "draft") {
      throw new HttpsError(
        "permission-denied",
        "Only the author can publish a draft."
      );
    }
    transaction.update(reference, changes);
  });
}

export const publishReview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to publish a review.");
  }
  const reviewId = requireUid(request.data?.reviewId);
  const now = new Date().toISOString();
  await transitionDraft(reviewId, request.auth.uid, {
    status: "published",
    publishedAt: now,
    updatedAt: now,
  });
  return { published: true };
});

export const scheduleReview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to schedule a review.");
  }
  const author = await getAuth().getUser(request.auth.uid);
  if (author.customClaims?.verifiedCritic !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only verified critics can schedule reviews."
    );
  }
  const reviewId = requireUid(request.data?.reviewId);
  const scheduledAt = request.data?.scheduledAt;
  if (
    typeof scheduledAt !== "string" ||
    !Number.isFinite(Date.parse(scheduledAt))
  ) {
    throw new HttpsError(
      "invalid-argument",
      "A valid scheduled publication time is required."
    );
  }
  if (Date.parse(scheduledAt) <= Date.now()) {
    throw new HttpsError(
      "invalid-argument",
      "Scheduled publication must be in the future."
    );
  }
  const now = new Date().toISOString();
  await transitionDraft(reviewId, request.auth.uid, {
    status: "scheduled",
    scheduledAt: new Date(scheduledAt).toISOString(),
    updatedAt: now,
  });
  return { scheduled: true };
});

export const setCriticVerification = onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only an administrator can verify critics."
    );
  }
  const uid = requireUid(request.data?.uid);
  const verified = request.data?.verified;
  if (typeof verified !== "boolean") {
    throw new HttpsError(
      "invalid-argument",
      "The verified value must be boolean."
    );
  }
  const auth = getAuth();
  const target = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...target.customClaims,
    verifiedCritic: verified,
  });
  return { uid, verified };
});

export const deleteLegacyReview = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to delete a review.");
  }
  const movieId = requireUid(request.data?.movieId);
  const legacyReview = request.data?.review;
  if (
    !legacyReview ||
    typeof legacyReview !== "object" ||
    legacyReview.uid !== request.auth.uid ||
    String(legacyReview.movieID) !== movieId
  ) {
    throw new HttpsError(
      "permission-denied",
      "Only the review author can delete this review."
    );
  }

  const movieReference = db.collection("movies").doc(movieId);
  const userReference = db.collection("users").doc(request.auth.uid);
  const [movie, user] = await Promise.all([
    movieReference.get(),
    userReference.get(),
  ]);
  if (!movie.exists) {
    throw new HttpsError("not-found", "Legacy movie review not found.");
  }

  const batch = db.batch();
  batch.update(movieReference, {
    reviews: FieldValue.arrayRemove(legacyReview),
  });
  if (user.exists) {
    batch.update(userReference, {
      reviews: FieldValue.arrayRemove({
        movieID: legacyReview.movieID,
        review: legacyReview.review,
        timestamp: legacyReview.timestamp,
      }),
    });
  }
  await batch.commit();
  return { deleted: true };
});

export const publishDueReviews = onSchedule("every 1 minutes", async () => {
  const now = new Date().toISOString();
  const dueReviews = await db
    .collection("reviews")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", now)
    .limit(100)
    .get();

  for (const candidate of dueReviews.docs) {
    const authorId = candidate.data().uid;
    const author = await getAuth().getUser(authorId);
    const verified = author.customClaims?.verifiedCritic === true;

    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(candidate.ref);
      if (
        !current.exists ||
        current.data()?.status !== "scheduled" ||
        current.data()?.scheduledAt > now
      ) {
        return;
      }
      if (!verified) {
        transaction.update(candidate.ref, {
          status: "draft",
          scheduledAt: FieldValue.delete(),
          updatedAt: now,
        });
        return;
      }
      transaction.update(candidate.ref, {
        status: "published",
        publishedAt: now,
        updatedAt: now,
      });
    });
  }
});
