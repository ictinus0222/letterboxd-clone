import { describe, expect, it } from "vitest";
import {
  contentHref,
  isValidReviewDimension,
  isValidReviewRating,
  mixPopularContent,
  normalizeTmdbContent,
  normalizeUserCollections,
} from "./content";

describe("content helpers", () => {
  it("normalizes missing legacy user arrays to empty lists", () => {
    expect(normalizeUserCollections({})).toEqual({
      favourites: [],
      watched: [],
      reviews: [],
    });
  });

  it("normalizes movie and TV search results and routes them by media type", () => {
    const movie = normalizeTmdbContent({ id: 12, title: "Movie" });
    const series = normalizeTmdbContent({
      id: 34,
      name: "Series",
      media_type: "tv",
    });

    expect(contentHref(movie)).toBe("/movie/12");
    expect(contentHref(series)).toBe("/tv/34");
    expect(series.title).toBe("Series");
  });

  it("mixes movies and TV shows in the homepage selection", () => {
    const movies = [1, 2, 3, 4].map((id) => ({
      id,
      media_type: "movie" as const,
    }));
    const shows = [5, 6, 7, 8].map((id) => ({
      id,
      media_type: "tv" as const,
    }));

    expect(mixPopularContent([...movies, ...shows]).map(({ id }) => id)).toEqual([
      1, 5, 2, 6, 3, 7,
    ]);
  });

  it("fills the selection from the available type when the other is exhausted", () => {
    const movies = [1, 2, 3].map((id) => ({
      id,
      media_type: "movie" as const,
    }));

    expect(mixPopularContent(movies).map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it("routes an episode through its series, season, and episode numbers", () => {
    expect(
      contentHref({
        contentType: "episode",
        tmdbId: 99,
        title: "Pilot",
        seriesId: 34,
        seasonNumber: 1,
        episodeNumber: 1,
      })
    ).toBe("/tv/34/season/1/episode/1");
  });

  it("accepts half-star overall ratings and optional integer dimensions", () => {
    expect(isValidReviewRating(4.5)).toBe(true);
    expect(isValidReviewRating(4.25)).toBe(false);
    expect(isValidReviewRating(5.5)).toBe(false);
    expect(isValidReviewDimension(0)).toBe(true);
    expect(isValidReviewDimension(5)).toBe(true);
    expect(isValidReviewDimension(2.5)).toBe(false);
  });
});
