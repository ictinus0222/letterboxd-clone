export interface UserReview {
  review: string;
  movieID: string;
  timestamp?: string;
}

export type ContentType = "movie" | "tv" | "season" | "episode";

interface ContentMetadata {
  tmdbId: number;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

export type ContentReference =
  | (ContentMetadata & { contentType: "movie" })
  | (ContentMetadata & {
      contentType: "tv";
      seriesId: number;
    })
  | (ContentMetadata & {
      contentType: "season";
      seriesId: number;
      seasonNumber: number;
    })
  | (ContentMetadata & {
      contentType: "episode";
      seriesId: number;
      seasonNumber: number;
      episodeNumber: number;
    });

export interface ReviewDimensions {
  story?: number;
  craft?: number;
  emotionalImpact?: number;
  rewatchability?: number;
}

export type ReviewStatus = "draft" | "scheduled" | "published";

export interface ContentReview {
  id: string;
  uid: string;
  userName: string;
  userURL: string;
  content: ContentReference;
  review: string;
  rating?: number;
  dimensions?: ReviewDimensions;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  publishedAt?: string;
  legacySource?: {
    movieId: string;
    review: Review;
  };
}

export interface UserFavourite {
  movieID: string;
  contentType?: ContentType;
  contentID?: string;
}

export interface UserWatched {
  movieID: string;
  contentType?: ContentType;
  contentID?: string;
}

export interface User {
  uid: string;
  name: string;
  bio: string;
  photoUrl: string;
  favourites: UserFavourite[];
  watched: UserWatched[];
  reviews: UserReview[];
  allowDirectMessages?: boolean;
}

export interface Review {
  movieID: number;
  userName: string;
  uid: string;
  userURL: string;
  review: string;
  timestamp?: string;
  rating?: number;
  dimensions?: ReviewDimensions;
  contentType?: ContentType;
  contentID?: string;
}

export interface Movie {
  id: string;
  title: string;
  backdrop_path: string;
  poster_path: string;
  media_type?: "movie" | "tv";
}

export interface UserCollections {
  favourites: UserFavourite[];
  watched: UserWatched[];
  reviews: UserReview[];
}
