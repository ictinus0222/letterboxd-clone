import React from "react";
import { PopularMoviePoster } from "./PopularMoviePoster";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mixPopularContent } from "app/content";

export const PopularMovies = ({
  movies,
  limit = 6,
  title = "POPULAR ON LETTERBOXD",
}: {
  movies: any;
  limit?: number;
  title?: string;
}) => {
  const path = usePathname();
  const showMore = path !== "/films" && path !== "/tv";

  return (
    <>
      <div className="section-heading border-b-grey text-sh-grey mb-3 flex justify-between border-b border-solid text-xs">
        <p className="hover:text-hov-blue text-sm hover:cursor-pointer">
          {title}
        </p>{" "}
        {showMore && (
          <Link
            href={"/films"}
            className="hover:text-hov-blue text-[11px] hover:cursor-pointer"
          >
            MORE
          </Link>
        )}
      </div>

      <div className="mb-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {!movies &&
          "No populars available at the moment. Please try again later."}

        {movies &&
          mixPopularContent(
            movies.filter((movie) => !!movie.poster_path),
            limit
          ).map((movie) => (
            <PopularMoviePoster
              key={`${movie.media_type ?? "movie"}-${movie.id}`}
              movie={movie}
              showTypeLabel
            />
          ))}
      </div>
    </>
  );
};
