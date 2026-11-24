"use client";

import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import React, { Usable, use, useEffect, useState } from "react";
import { FilterResults } from "app/components/Filter/FilterResults";
import { Footer } from "app/components/Navigation/Footer";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ searchTerm?: string }>;
}) {
  const query = use(searchParams);

  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState<any[] | null>();
  const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all");

  const fetchMoviesBySearchTerm = async () => {
    setIsLoading(true);

    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?${new URLSearchParams({
        api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "",
        query: searchTerm,
        include_adult: "false",
      })}`
    );

    if (!res.ok) {
      console.error("error fetching movies with your search term");
      setIsLoading(false);
      return;
    }

    const data = await res.json();

    // skip those that don't have an image
    const validMovieResults = data.results.filter(
      (item: any) =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.poster_path !== null
    );

    setMovies(validMovieResults);

    setIsLoading(false);
  };

  useEffect(() => {
    if (query.searchTerm) {
      setSearchTerm(query.searchTerm);
    } else {
      console.error("query is invalid");
    }
  }, [query]);

  useEffect(() => {
    if (searchTerm) {
      fetchMoviesBySearchTerm();
    }
  }, [searchTerm]);

  const filteredResults =
    movies?.filter(
      (item) => mediaType === "all" || item.media_type === mediaType
    ) ?? null;

  return (
    <>
      <LayoutNavbar />
      <div className="site-body min-h-[80vh] py-5">
        <div className="px-4 font-['Graphik'] md:mx-auto md:my-0 md:flex md:w-[950px] md:flex-col">
          {isLoading && <p className="text-base text-sh-grey">Loading..</p>}

          {movies && (
            <>
              <div
                className="mb-4 flex gap-2"
                aria-label="Filter search results by media type"
              >
                {(["all", "movie", "tv"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={mediaType === type}
                    onClick={() => setMediaType(type)}
                    className={`rounded px-3 py-1 text-sm capitalize ${
                      mediaType === type
                        ? "bg-hov-blue text-p-white"
                        : "bg-c-grey text-sh-grey"
                    }`}
                  >
                    {type === "all" ? "All" : type === "tv" ? "TV" : "Movies"}
                  </button>
                ))}
              </div>
              <FilterResults movies={filteredResults ?? []} />
            </>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
