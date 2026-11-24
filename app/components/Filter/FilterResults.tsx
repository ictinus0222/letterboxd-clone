import Link from "next/link";
import { PopularMoviePoster } from "../Home/PopularMoviePoster";
import { contentHref, normalizeTmdbContent } from "app/content";

export const FilterResults = ({
  movies,
  contentType,
}: {
  movies: any[];
  contentType: "movie" | "tv";
}) => {
  const contents = movies.map((movie) => ({
    movie,
    content: normalizeTmdbContent(movie),
  }));

  return (
    <div className="w-full font-['Graphik'] md:mx-auto md:my-0 md:flex md:flex-row">
      <div className="flex w-full flex-col">
        <div className="section-heading mb-3 flex justify-between border-b border-solid border-b-grey text-xs text-sh-grey">
          <div className="text-base">
            {contentType === "movie" ? "Film results" : "TV show results"}
          </div>
        </div>

        <div>
          {movies.length === 0 && <p className="text-base text-sh-grey">No results found, please try again.</p>}
          {contents.map(({ movie, content }) => (
            <div
              key={`${content.contentType}-${movie.id}`}
              className="my-2 flex flex-col gap-4 border-b border-solid border-b-grey pb-2 md:flex-row"
            >
              <div className="min-w-[150px] max-w-[150px]">
                <PopularMoviePoster movie={movie} compact={false} />
              </div>
              <div className="flex flex-col">
                <Link href={contentHref(content)} className="text-xl font-bold text-p-white">
                  {content.title}
                </Link>
                <div className="flex flex-col gap-2 text-sh-grey">
                  <p className="text-xs uppercase">{content.contentType}</p>
                  {typeof movie.vote_average === "number" && (
                    <p className="text-sm">TMDB rating: {movie.vote_average.toFixed(2)}</p>
                  )}
                  <p className="text-normal">{movie.overview}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
