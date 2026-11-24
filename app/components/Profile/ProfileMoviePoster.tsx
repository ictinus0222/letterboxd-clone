import { useEffect, useState } from "react";
import { Loader } from "../Loader/Loader";
import Link from "next/link";
import Image from "next/image";
import FavouriteButton from "../Buttons/FavoriteButton";
import { WatchButton } from "../Buttons/WatchButton";
import { ContentReference, UserFavourite, UserWatched } from "app/types";
import { contentHref, normalizeTmdbContent } from "app/content";

export const ProfileMoviePoster = ({
  watched,
  favourites,
  movieId,
  contentType = "movie",
  onEvent,
}: {
  watched: UserWatched[];
  favourites: UserFavourite[];
  movieId: string;
  contentType?: "movie" | "tv";
  onEvent: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [content, setContent] = useState<ContentReference | null>(null);

  const [isFavourite, setIsFavourite] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  const setInitialMovieStatuses = () => {
    const isFavorite = favourites.some(
      (saved) =>
        (contentType === "movie" && saved?.movieID === movieId && !saved?.contentType) ||
        (saved?.contentType === contentType && saved?.contentID === movieId)
    );
    setIsFavourite(isFavorite);

    const isWatched = watched.some(
      (saved) =>
        (contentType === "movie" && saved?.movieID === movieId && !saved?.contentType) ||
        (saved?.contentType === contentType && saved?.contentID === movieId)
    );
    setIsWatched(isWatched);
  };

  useEffect(() => {
    setIsLoading(true);

    const movieURL = `https://api.themoviedb.org/3/${contentType}/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`;

    fetch(movieURL)
      .then((res) => res.json())
      .then((data) => {
        setContent(normalizeTmdbContent({ ...data, media_type: contentType }));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err.message);
        setIsLoading(false);
      });

    setInitialMovieStatuses();
  }, [movieId, contentType]);

  if (isLoading) return <Loader />;

  return (
    <div
      className="hover:border-3 hover:border-h-hov-green border-pb-grey/25 relative mb-[2%] rounded border border-solid shadow-[0_0_1px_1px_rgba(20,24,28,1)] shadow-inner hover:cursor-pointer hover:rounded md:ml-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content && <Link href={contentHref(content)}>
        <Image
          className="block max-h-[120px] max-w-[80px]  rounded border md:max-h-[220px] md:max-w-[140px] "
          src={"https://image.tmdb.org/t/p/w500/" + content.poster_path}
          alt={"Title for" + content.title}
          loading="lazy"
          width={300}
          height={300}
        />
      </Link>}
      {isHovered && content && (
        <div
          className="absolute left-[20%] top-[75%] z-10 flex items-center rounded p-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <FavouriteButton
            id={String(content.tmdbId)}
            title={content.title}
            isFavourite={isFavourite}
            setIsFavourite={setIsFavourite}
            onEvent={onEvent}
            contentType={contentType}
          />

          <WatchButton
            id={String(content.tmdbId)}
            title={content.title}
            isWatched={isWatched}
            setIsWatched={setIsWatched}
            onEvent={onEvent}
            contentType={contentType}
          />
        </div>
      )}
    </div>
  );
};
