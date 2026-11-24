import {
  ContentReference,
  UserCollections,
  UserFavourite,
  UserReview,
  UserWatched,
} from "./types";

type TmdbContent = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: "movie" | "tv";
};

export function normalizeUserCollections(
  data?: Partial<UserCollections> | null
): UserCollections {
  return {
    favourites: Array.isArray(data?.favourites)
      ? (data.favourites as UserFavourite[])
      : [],
    watched: Array.isArray(data?.watched)
      ? (data.watched as UserWatched[])
      : [],
    reviews: Array.isArray(data?.reviews) ? (data.reviews as UserReview[]) : [],
  };
}

export function normalizeTmdbContent(
  item: TmdbContent,
  fallbackType: "movie" | "tv" = "movie"
): ContentReference {
  const contentType: "movie" | "tv" =
    item.media_type === "tv" || item.media_type === "movie"
      ? item.media_type
      : fallbackType;

  const metadata = {
    tmdbId: item.id,
    title: item.title ?? item.name ?? "Untitled",
    poster_path: item.poster_path ?? null,
    backdrop_path: item.backdrop_path ?? null,
  };
  return contentType === "tv"
    ? { ...metadata, contentType, seriesId: item.id }
    : { ...metadata, contentType };
}

export function contentHref(content: ContentReference): string {
  if (content.contentType === "movie") {
    return `/movie/${content.tmdbId}`;
  }

  if (content.contentType === "tv") {
    return `/tv/${content.tmdbId}`;
  }

  if (content.contentType === "season") {
    return `/tv/${content.seriesId}/season/${content.seasonNumber}`;
  }

  return `/tv/${content.seriesId}/season/${content.seasonNumber}/episode/${content.episodeNumber}`;
}

export function isValidReviewRating(rating: number): boolean {
  return (
    Number.isFinite(rating) &&
    rating >= 0.5 &&
    rating <= 5 &&
    (rating * 2) % 1 === 0
  );
}

export function isValidReviewDimension(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 5;
}
