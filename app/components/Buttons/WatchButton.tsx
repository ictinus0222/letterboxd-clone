/* eslint-disable react-hooks/exhaustive-deps */
import React, { Dispatch } from "react";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import watchIcon from "./watched.png";
import remWatched from "./remWatched.png";
import Image from "next/image";
import { auth, db } from "../../firebase/firebase";
import { createWatchedPopup, PopupAction } from "../../utils";
import { ContentType } from "app/types";

export const WatchButton = ({
  id,
  title,
  isWatched,
  setIsWatched,
  onEvent,
  contentType = "movie",
}: {
  id: string;
  title: string;
  isWatched: boolean;
  setIsWatched: Dispatch<React.SetStateAction<boolean>>;
  onEvent?: () => void;
  contentType?: ContentType;
}) => {
  const onWatched = async () => {
    onEvent && onEvent();

    if (isWatched) {
      await removeFromWatchedDB();
    } else {
      await addToWatchedDB();
    }
  };

  const addToWatchedDB = async () => {
    if (!auth || !auth.currentUser) {
      createWatchedPopup(title, PopupAction.ERROR);
      return;
    }

    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const watched =
      contentType === "movie"
        ? { movieID: id }
        : { contentType, contentID: id };

    await updateDoc(userRef, {
      watched: arrayUnion(watched),
    }).then(() => {
      setIsWatched(true);
      createWatchedPopup(title, PopupAction.WATCHED);
    });
  };

  const removeFromWatchedDB = async () => {
    if (!auth || !auth.currentUser) {
      createWatchedPopup(title, PopupAction.ERROR);
      return;
    }

    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const watched =
      contentType === "movie"
        ? { movieID: id }
        : { contentType, contentID: id };
    await updateDoc(userRef, {
      watched: arrayRemove(watched),
    }).then(() => {
      setIsWatched(false);
      createWatchedPopup(title, PopupAction.REMOVED);
    });
  };

  return (
    <>
      <div onClick={onWatched} className="p-2">
        <Image
          src={isWatched ? remWatched : watchIcon}
          width={20}
          height={20}
          alt={
            isWatched
              ? `Remove ${contentType} from watched icon`
              : `Add ${contentType} to watched icon`
          }
          aria-label={
            isWatched
              ? `Remove ${contentType} from watched list`
              : `Add ${contentType} to watched list`
          }
        />
      </div>
    </>
  );
};
