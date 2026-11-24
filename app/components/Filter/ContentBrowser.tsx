"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import { Footer } from "app/components/Navigation/Footer";
import { Filter } from "./Filter";
import { FilterResults } from "./FilterResults";
import { PopularMovies } from "app/components/Home/PopularMovies";
import filterOptions from "app/films/filtering/arrays";

type ContentType = "movie" | "tv";

export const ContentBrowser = ({
  contentType,
}: {
  contentType: ContentType;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const route = contentType === "movie" ? "/films" : "/tv";
  const title = contentType === "movie" ? "Films" : "TV Shows";

  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filterResults, setFilterResults] = useState<any[] | null>(null);
  const [popularContent, setPopularContent] = useState<any[] | null>(null);

  useEffect(() => {
    const initialFilters: { [key: string]: string } = {};
    for (const [key, value] of searchParams.entries()) {
      initialFilters[key] = value;
    }
    setActiveFilters(initialFilters);
  }, [searchParams]);

  const onSelect = (value: string, filterTitle: string) => {
    const updated = { ...activeFilters };

    if (updated[filterTitle] === value) {
      delete updated[filterTitle];
    } else {
      updated[filterTitle] = value;
    }

    const queryString = new URLSearchParams(updated).toString();
    router.push(queryString ? `${route}?${queryString}` : route);
  };

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";

        if (Object.keys(activeFilters).length === 0) {
          const response = await fetch(
            `https://api.themoviedb.org/3/${contentType}/popular?${new URLSearchParams(
              { api_key: apiKey }
            )}`
          );
          if (!response.ok) {
            throw new Error(`Failed to load popular ${contentType} titles.`);
          }

          const data = await response.json();
          setPopularContent(
            (data.results ?? []).map((item: any) => ({
              ...item,
              media_type: contentType,
            }))
          );
          setFilterResults(null);
          return;
        }

        const params = new URLSearchParams({
          api_key: apiKey,
          language: "en-US",
          "vote_count.gte": "100",
        });
        const ratings = activeFilters.ratings;
        if (ratings === "Highest First") {
          params.set("sort_by", "vote_average.desc");
        }
        if (ratings === "Lowest First") {
          params.set("sort_by", "vote_average.asc");
        }

        if (activeFilters.years) {
          const startYear = parseInt(activeFilters.years.slice(0, -1), 10);
          const endYear = startYear + 9;
          const dateField =
            contentType === "movie" ? "primary_release_date" : "first_air_date";
          params.set(`${dateField}.gte`, `${startYear}-01-01`);
          params.set(`${dateField}.lte`, `${endYear}-12-31`);
        }

        if (activeFilters.genres) {
          const genreResponse = await fetch(
            `https://api.themoviedb.org/3/genre/${contentType}/list?${new URLSearchParams(
              { api_key: apiKey, language: "en-US" }
            )}`
          );
          if (!genreResponse.ok) {
            throw new Error(`Failed to load ${contentType} genres.`);
          }

          const genreData = await genreResponse.json();
          const genreId = genreData.genres.find(
            (genre: any) => genre.name === activeFilters.genres
          )?.id;
          if (genreId) {
            params.set("with_genres", String(genreId));
          }
        }

        const response = await fetch(
          `https://api.themoviedb.org/3/discover/${contentType}?${params}`
        );
        if (!response.ok) {
          throw new Error(`Failed to discover ${contentType} titles.`);
        }

        const data = await response.json();
        const results = (data.results ?? [])
          .filter((item: any) => item.poster_path !== null)
          .map((item: any) => ({ ...item, media_type: contentType }));
        setFilterResults(results);
        setPopularContent(null);
      } catch (error) {
        console.error(`Error fetching ${title.toLowerCase()} results:`, error);
        setFilterResults([]);
        setPopularContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [activeFilters, contentType, title]);

  return (
    <>
      <LayoutNavbar />
      <div className="site-body min-h-[80vh] py-5">
        <div className="px-4 font-['Graphik'] md:mx-auto md:my-0 md:flex md:w-[950px] md:flex-col">
          <div className="md:flex md:flex-row">
            <p className="sans-serif block self-center px-4 text-xs uppercase tracking-normal text-sh-grey md:px-0">
              Browse {title} by:
            </p>
            <div className="grid grid-cols-2 md:flex md:flex-row">
              {filterOptions.map((option) => (
                <Filter
                  key={option.title}
                  title={option.title}
                  values={option.values}
                  currentValues={
                    activeFilters[option.title]
                      ? [activeFilters[option.title]]
                      : []
                  }
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>

          <div className="mb-10 flex items-start justify-between gap-2">
            {Object.keys(activeFilters).length > 0 && (
              <div className="flex flex-col gap-2 text-sh-grey">
                <p className="text-gray-600">Active filters</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(activeFilters).map(([key, value]) => (
                    <span
                      key={key}
                      className="bg-blue-100 text-blue-800 inline-flex items-center rounded-full"
                    >
                      {key.substring(0, 1).toUpperCase() + key.substring(1)} :{" "}
                      {value}
                      <button
                        onClick={() => onSelect(value, key)}
                        className="text-blue-600 hover:text-blue-800 ml-2"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(activeFilters).length > 0 && (
              <div>
                <button
                  onClick={() => router.push(route)}
                  className="hover:text-blue-800 text-sh-grey hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {isLoading && <p className="text-base text-sh-grey">Loading...</p>}
          {!isLoading && popularContent && (
            <PopularMovies
              movies={popularContent}
              limit={20}
              title={`POPULAR ${contentType === "movie" ? "FILMS" : "TV SHOWS"}`}
            />
          )}
          {!isLoading && filterResults && (
            <FilterResults movies={filterResults} contentType={contentType} />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};
