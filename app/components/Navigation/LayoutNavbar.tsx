"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "app/firebase/firebase";
import Navbar from "./Navbar";
import placeholder from "@/assets/sappling.jpg";

export const LayoutNavbar = ({ newUserName }: { newUserName?: string }) => {
  const [user, setUser] = useState<any>();

  //this handles the login/logout styles and displays in the navbar
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTransparentNav, setIsTransparentNav] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setIsTransparentNav(true);
      }
    });
  }, []);

  useEffect(() => {}, [newUserName]);
  return (
    <Navbar
      userName={newUserName || user?.displayName}
      profilePic={user?.photoURL || placeholder}
      isLoggedIn={isLoggedIn}
      isTransparentNav={isTransparentNav}
    />
  );
};
