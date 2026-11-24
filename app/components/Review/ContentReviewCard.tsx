import Link from "next/link";
import { ContentReview } from "app/types";
import { contentHref } from "app/content";

export function ContentReviewCard({ review }: { review: ContentReview }) {
  return (
    <article className="my-2 rounded-md border border-solid border-sh-grey/10 bg-review-bg/30 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link
          href={`/profile/${review.uid}`}
          className="font-bold text-p-white hover:text-hov-blue"
        >
          {review.userName}
        </Link>
        <Link
          href={contentHref(review.content)}
          className="text-sm text-sh-grey hover:text-hov-blue"
        >
          {review.content.title} · {review.content.contentType}
        </Link>
      </div>
      {review.rating !== undefined && (
        <p className="mt-1 text-xs text-sh-grey">Overall: {review.rating}/5</p>
      )}
      <p className="mt-2 whitespace-pre-wrap text-sh-grey">{review.review}</p>
      {review.dimensions && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-sh-grey">
          {Object.entries(review.dimensions).map(([dimension, score]) => (
            <span key={dimension}>
              {dimension}: {score}/5
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
