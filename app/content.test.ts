import { describe, expect, it } from "vitest";
import {
  contentHref,
  isValidReviewDimension,
  isValidReviewRating,
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
