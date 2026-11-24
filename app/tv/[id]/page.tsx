"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ContentReviews } from "app/components/Review/ContentReviews";
import { LayoutNavbar } from "app/components/Navigation/LayoutNavbar";
import { Footer } from "app/components/Navigation/Footer";
import { ContentReference } from "app/types";

export default function TvSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [series, setSeries] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${id}?${new URLSearchParams({
            api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "",
            append_to_response: "credits",
          })}`
        );
        if (!response.ok) throw new Error("TV series not found.");
        setSeries(await response.json());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load this TV series."
        );
      }
    };
    loadSeries();
  }, [id]);

  const content: ContentReference | null = series
    ? {
        contentType: "tv",
        tmdbId: series.id,
        seriesId: series.id,
        title: series.name,
        poster_path: series.poster_path,
        backdrop_path: series.backdrop_path,
      }
    : null;

  return (
    <>
      <LayoutNavbar />
      <main className="site-body min-h-[80vh] px-4 py-8 md:mx-auto md:w-[950px]">
        {!series && !error && (
          <p className="text-sh-grey">Loading TV series...</p>
        )}
        {error && (
          <p role="alert" className="text-sh-grey">
            {error}
          </p>
        )}
        {series && content && (
          <>
            <section className="flex flex-col gap-6 md:flex-row">
              {series.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w500/${series.poster_path}`}
                  alt={`${series.name} poster`}
                  width={280}
                  height={420}
                  className="h-fit w-40 rounded md:w-56"
                  priority
                />
              )}
              <div>
                <p className="mb-2 text-xs uppercase text-sh-grey">TV series</p>
                <h1 className="text-4xl font-bold text-p-white">
                  {series.name}
                </h1>
                <p className="my-3 text-sh-grey">{series.overview}</p>
                <p className="text-sh-grey">
                  {series.first_air_date?.slice(0, 4)} ·{" "}
                  {series.number_of_seasons} seasons
                </p>
              </div>
            </section>
            <section className="my-8">
              <h2 className="mb-3 text-xl font-bold text-p-white">
                Seasons and episodes
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {(series.seasons ?? [])
                  .filter((season: any) => season.season_number > 0)
                  .map((season: any) => (
                    <Link
                      key={season.id}
                      href={`/tv/${id}/season/${season.season_number}`}
                      className="flex gap-3 rounded bg-review-bg/30 p-3"
                    >
                      {season.poster_path && (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185/${season.poster_path}`}
                          alt=""
                          width={64}
                          height={96}
                          className="rounded"
                        />
                      )}
                      <span className="text-p-white">
                        {season.name}
                        <span className="block text-sm text-sh-grey">
                          {season.episode_count} episodes
                        </span>
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
            <ContentReviews content={content} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
