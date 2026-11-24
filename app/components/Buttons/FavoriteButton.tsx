import React, { Dispatch, SetStateAction } from "react";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import favIcon from "./fav.png";
import removeFavIcon from "./remFav.png";
import Image from "next/image";
import { auth, db } from "../../firebase/firebase";
import { createFavouritePopup, PopupAction } from "../../utils";
import { ContentType } from "app/types";

export const FavouriteButton = ({
  id,
  title,
  isFavourite,
  setIsFavourite,
  onEvent,
  contentType = "movie",
}: {
  id: string;
  title: string;
  isFavourite: boolean;
  setIsFavourite: Dispatch<SetStateAction<boolean>>;
  onEvent?: () => void;
  contentType?: ContentType;
}) => {
  const onFavourite = async () => {
    onEvent && onEvent();

    if (isFavourite) {
      return await removeFromFavsDB();
    } else {
      return await addToFavsDB();
    }
  };

  const addToFavsDB = async () => {
    if (!auth || !auth.currentUser) {
      createFavouritePopup(title, PopupAction.ERROR);
      return;
    }

    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const favourite =
      contentType === "movie"
        ? { movieID: id }
        : { contentType, contentID: id };

    await updateDoc(userRef, {
      favourites: arrayUnion(favourite),
    }).then(() => {
      setIsFavourite(true);
      createFavouritePopup(title, PopupAction.FAVOURITE);
    });
  };
  const removeFromFavsDB = async () => {
    if (!auth || !auth.currentUser) {
      createFavouritePopup(title, PopupAction.ERROR);
      return;
    }

    const userId = auth.currentUser.uid;
    const userRef = doc(db, "users", userId);
    const favourite =
      contentType === "movie"
        ? { movieID: id }
        : { contentType, contentID: id };
    await updateDoc(userRef, {
      favourites: arrayRemove(favourite),
    }).then(() => {
      setIsFavourite(false);
      createFavouritePopup(title, PopupAction.REMOVED);
    });
  };

  return (
    <>
      <div className="p-2" onClick={onFavourite}>
        <Image
          src={isFavourite ? removeFavIcon : favIcon}
          width={20}
          height={20}
          alt={
            isFavourite
              ? `Remove ${contentType} from favorites icon`
              : `Add ${contentType} to favorites icon`
          }
          aria-label={
            isFavourite
              ? `Remove ${contentType} from favorites list`
              : `Add ${contentType} to favorites list`
          }
        />
      </div>
    </>
  );
};

export default FavouriteButton;
