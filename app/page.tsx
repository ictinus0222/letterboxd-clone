"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import { Home } from "./components/Home/Home";
import { HomeSignedOut } from "./components/Home/HomeSignedOut";
import { LayoutNavbar } from "./components/Navigation/LayoutNavbar";
import { Footer } from "./components/Navigation/Footer";

const getRandomPage = () => Math.floor(Math.random() * 500) + 1;

export default function Page() {
  const [user, setUser] = useState<any>();
  const [movies, setMovies] = useState<any>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchPopularMovies = async () => {
    try {
      const moviePage = getRandomPage();
      const tvPage = getRandomPage();
      const [movieResponse, tvResponse] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&page=${moviePage}`
        ),
        fetch(
          `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&page=${tvPage}`
        ),
      ]);
      if (!movieResponse.ok || !tvResponse.ok) {
        throw new Error("Failed to load popular movies and TV.");
      }

      const [movieData, tvData] = await Promise.all([
        movieResponse.json(),
        tvResponse.json(),
      ]);
      setMovies([
        ...movieData.results.map((item: any) => ({ ...item, media_type: "movie" })),
        ...tvData.results.map((item: any) => ({ ...item, media_type: "tv" })),
      ]);
    } catch (error) {
      console.error("error fetching popular titles", error);
      setMovies([]);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });

    fetchPopularMovies();
  }, []);
  return (
    <>
      <LayoutNavbar />
      {isLoggedIn && <Home movies={movies} user={user} />}

      {!isLoggedIn && <HomeSignedOut movies={movies} />}

      <Footer />
    </>
  );
}
