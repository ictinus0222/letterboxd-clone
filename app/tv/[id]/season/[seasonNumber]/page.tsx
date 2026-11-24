"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import { Footer } from "app/components/Navigation/Footer";

export default function TvSeasonPage({
  params,
}: {
  params: Promise<{ id: string; seasonNumber: string }>;
}) {
  const { id, seasonNumber } = use(params);
  const [season, setSeason] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSeason = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?${new URLSearchParams(
            {
              api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "",
            }
          )}`
        );
        if (!response.ok) throw new Error("Season not found.");
        setSeason(await response.json());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load this season."
        );
      }
    };
    loadSeason();
  }, [id, seasonNumber]);

  return (
    <>
      <LayoutNavbar />
      <main className="site-body min-h-[80vh] px-4 py-8 md:mx-auto md:w-[950px]">
        {!season && !error && <p className="text-sh-grey">Loading season...</p>}
        {error && (
          <p role="alert" className="text-sh-grey">
            {error}
          </p>
        )}
        {season && (
          <>
            <Link
              href={`/tv/${id}`}
              className="text-sh-grey hover:text-p-white"
            >
              Back to series
            </Link>
            <h1 className="my-4 text-3xl font-bold text-p-white">
              {season.name}
            </h1>
            <div className="flex flex-col gap-3">
              {(season.episodes ?? []).map((episode: any) => (
                <Link
                  key={episode.id}
                  href={`/tv/${id}/season/${seasonNumber}/episode/${episode.episode_number}`}
                  className="flex gap-4 rounded bg-review-bg/30 p-3"
                >
                  {episode.still_path && (
                    <Image
                      src={`https://image.tmdb.org/t/p/w300/${episode.still_path}`}
                      alt=""
                      width={180}
                      height={102}
                      className="h-fit rounded"
                    />
                  )}
                  <span>
                    <span className="block text-p-white">
                      {episode.episode_number}. {episode.name}
                    </span>
                    <span className="mt-1 block text-sm text-sh-grey">
                      {episode.overview}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
