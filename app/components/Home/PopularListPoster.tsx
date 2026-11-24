import Image from "next/image";
import Link from "next/link";
import React from "react";
import { contentHref, normalizeTmdbContent } from "app/content";

export const PopularListPoster = ({ movie, i }) => {
  const content = normalizeTmdbContent(movie);

  return (
    <div
      className="border-pb-grey/25 relative mr-[-25px] h-auto w-auto rounded border border-solid shadow-[0_0_1px_1px_rgba(20,24,28,1)] shadow-inner"
      style={{ zIndex: 100 - i }}
    >
      <Link href={contentHref(content)}>
        <Image
          width={70}
          height={150}
          className="h-auto w-auto rounded border md:max-w-[70px]"
          src={"https://image.tmdb.org/t/p/w500/" + movie.poster_path}
          alt={content.title}
          loading="lazy"
        />
      </Link>
    </div>
  );
};
