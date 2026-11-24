import React from "react";
import { MovieReviewExtended } from "../Review/MovieReviewExtended";
import { UserReview } from "app/types";
import { ContentReview } from "app/types";
import { ContentReviewCard } from "../Review/ContentReviewCard";

export const ProfileReviews = ({
  reviews,
}: {
  reviews: (UserReview | ContentReview)[];
}) => {
  return (
    <div>
      <div className="section-heading text-sh-grey border-b-grey mx-2 mb-2 flex justify-between border-b border-solid text-xs">
        <p>REVIEWS</p>
      </div>
      <div className="mb-10 flex flex-col justify-between gap-2">
        {reviews.length === 0 ? (
          <p className=" text-sh-grey mx-2 pt-2 text-base">
            This user hasn&apos;t reviewed any movies or series yet.
          </p>
        ) : (
          reviews.map((review, i) =>
            "content" in review ? (
              <ContentReviewCard key={review.id} review={review} />
            ) : (
              <MovieReviewExtended key={`${review.movieID}-${i}`} review={review} />
            )
          )
        )}
      </div>
    </div>
  );
};
