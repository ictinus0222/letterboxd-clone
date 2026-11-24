import Link from "next/link";
import React from "react";

export const UpgradeToPro = () => {
  return (
    <Link
      href="/films"
      className="bg-navigation-bg text-p-white mb-8 block rounded border border-[#345] p-5 text-center hover:border-hov-blue"
    >
      <span className="block text-lg font-bold">Find your next favorite</span>
      <span className="text-sh-grey mt-1 block text-sm">
        Browse movies and series together on Letterboxd.
      </span>
    </Link>
  );
};
