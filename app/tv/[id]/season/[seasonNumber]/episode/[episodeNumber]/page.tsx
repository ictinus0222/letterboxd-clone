"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ContentReviews } from "app/components/Review/ContentReviews";
import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import { Footer } from "app/components/Navigation/Footer";
import { ContentReference } from "app/types";

export default function TvEpisodePage({
  params,
}: {
  params: Promise<{ id: string; seasonNumber: string; episodeNumber: string }>;
}) {
  const { id, seasonNumber, episodeNumber } = use(params);
  const [episode, setEpisode] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEpisode = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}?${new URLSearchParams(
            {
              api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "",
            }
          )}`
        );
        if (!response.ok) throw new Error("Episode not found.");
        setEpisode(await response.json());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load this episode."
        );
      }
    };
    loadEpisode();
  }, [id, seasonNumber, episodeNumber]);

  const content: ContentReference | null = episode
    ? {
        contentType: "episode",
        tmdbId: episode.id,
        seriesId: Number(id),
        seasonNumber: Number(seasonNumber),
        episodeNumber: Number(episodeNumber),
        title: episode.name,
        poster_path: episode.still_path,
      }
    : null;

  return (
    <>
      <LayoutNavbar />
      <main className="site-body min-h-[80vh] px-4 py-8 md:mx-auto md:w-[950px]">
        {!episode && !error && (
          <p className="text-sh-grey">Loading episode...</p>
        )}
        {error && (
          <p role="alert" className="text-sh-grey">
            {error}
          </p>
        )}
        {episode && content && (
          <>
            <Link
              href={`/tv/${id}/season/${seasonNumber}`}
              className="text-sh-grey hover:text-p-white"
            >
              Back to season
            </Link>
            {episode.still_path && (
              <Image
                src={`https://image.tmdb.org/t/p/w780/${episode.still_path}`}
                alt={`${episode.name} still`}
                width={780}
                height={440}
                className="my-4 w-full rounded"
                priority
              />
            )}
            <p className="text-xs uppercase text-sh-grey">
              Episode {episode.episode_number}
            </p>
            <h1 className="my-2 text-3xl font-bold text-p-white">
              {episode.name}
            </h1>
            <p className="mb-8 text-sh-grey">{episode.overview}</p>
            <ContentReviews content={content} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
