"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "app/firebase/firebase";
import { ProfileBio } from "app/components/Profile/ProfileBio";
import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import { ProfileMoviesHighlight } from "app/components/Profile/ProfileMoviesHighlight";
import { ProfileReviews } from "app/components/Profile/ProfileReviews";
import {
  ContentReview,
  User,
  UserFavourite,
  UserReview,
  UserWatched,
} from "app/types";
import { Footer } from "app/components/Navigation/Footer";
import { normalizeUserCollections } from "app/content";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>({} as User);
  const [isAuthor, setIsAuthor] = useState(false);

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [contentReviews, setContentReviews] = useState<ContentReview[]>([]);
  const [favourites, setFavourites] = useState<UserFavourite[]>([]);
  const [watched, setWatched] = useState<UserWatched[]>([]);

  const router = useRouter();

  const initProfilePage = async () => {
    setLoading(true);

    const userSnap = await getDoc(doc(db, "users", id));
    if (userSnap.exists()) {
      const user = userSnap.data() as User;
      const collections = normalizeUserCollections(user);
      setUser({ ...user, ...collections });

      setReviews([...collections.reviews].reverse().slice(0, 6));
      setWatched(collections.watched);
      setFavourites(collections.favourites);
    }

    try {
      const publishedReviews = await getDocs(
        query(
          collection(db, "reviews"),
          where("uid", "==", id),
          where("status", "==", "published")
        )
      );
      setContentReviews(
        publishedReviews.docs.map((review) => review.data() as ContentReview)
      );
    } catch (error) {
      console.error("Unable to load published profile reviews:", error);
      setContentReviews([]);
    }

    setLoading(false);
  };

  const setMovies = async () => {
    const userSnap = await getDoc(doc(db, "users", id));
    if (userSnap.exists()) {
      const user = userSnap.data() as User;

      const collections = normalizeUserCollections(user);
      setWatched(collections.watched);
      setFavourites(collections.favourites);
    }
  };

  const onEvent = () => {
    setMovies();
  };

  useEffect(() => {
    initProfilePage();
  }, [id, router]);

  useEffect(() => {
    setIsAuthor(auth.currentUser?.uid === user.uid);
  }, [auth.currentUser, user]);

  if (loading) return <p>Loading...</p>;
  if (!loading && !user) return <p>Error loading user.</p>;

  return (
    <>
      <LayoutNavbar />
      <div className="site-body min-h-[78vh] py-5">
        <div className="flex flex-col px-4 font-['Graphik'] md:mx-auto md:my-0 md:w-[950px] md:py-8">
          <ProfileBio user={user} isAuthor={isAuthor} />
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div>
              <ProfileMoviesHighlight
                user={user}
                movies={favourites}
                watched={watched}
                favourites={favourites}
                type="favourites"
                onEvent={onEvent}
              />

              <ProfileMoviesHighlight
                user={user}
                movies={watched}
                watched={watched}
                favourites={favourites}
                type="watched"
                onEvent={onEvent}
              />
            </div>

            {user.reviews && (
              <ProfileReviews
                reviews={[...contentReviews, ...reviews]
                  .sort((a, b) => {
                    const dateA =
                      "content" in a
                        ? a.publishedAt ?? a.createdAt
                        : a.timestamp ?? "";
                    const dateB =
                      "content" in b
                        ? b.publishedAt ?? b.createdAt
                        : b.timestamp ?? "";
                    return dateB.localeCompare(dateA);
                  })
                  .slice(0, 6)}
              />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
