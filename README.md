# Kraken-Boxd

## Project's Scope

- Responsive social discovery and review app for movies and TV
- Combined TMDB search and browsing, watch tracking, half-star ratings, and reviews for movies, series, and episodes
- Google authentication and user data in Firebase Auth and Firestore
- Private review drafts, verified-critic scheduled publishing, and opt-in message requests

## Live Demo

The existing public demo URL is retained until a new deployment hostname is configured:
[Open Kraken-Boxd](https://clonnerboxd.vercel.app/).

## Getting Started

### Installing and running

```
git clone https://github.com/janaiscoding/letterboxd-clone.git
cd letterboxd-clone
npm install
```

### Prerequisites for running your own version

Get an API key from [TMDB](https://developer.themoviedb.org/reference/intro/getting-started)

Create a new project from [Firebase Console](https://console.firebase.google.com/u/0/) and connect it. Firestore rules and Firebase Cloud Functions are configured in this repository; review and test them with the Firebase Emulator Suite before deploying.

Create a `.env` file at the root of the repository with the following values for the [firebase](https://firebase.google.com/docs/web/learn-more#config-object) and API key:

```
NEXT_PUBLIC_API_KEY = "your-firebase-api-key"
NEXT_PUBLIC_APP_ID = "your-firebase-app-id"
NEXT_PUBLIC_MESSAGING_ID = "your-firebase-messaging-id"
NEXT_PUBLIC_AUTH_DOMAIN = "your-firebase-auth-domain-id"
NEXT_PUBLIC_PROJECT_ID = "your-firebase-project-id"
NEXT_PUBLIC_STORAGE_BUCKET = "your-firebase-storage-bucket"
NEXT_PUBLIC_TMDB_API_KEY="your-TMDB-api-key"
```

```
npm run dev
```

## Product Features

- On **Home** and **Films**, browse movies and TV titles together, or filter by media type.
- On **TV series** pages, browse seasons and episodes; rate and review series and individual episodes.
- On **Profile**, see saved titles, watched titles, and recent reviews.
- On **Reviews**, browse published reviews across content types.
- On **Messages**, opt in to message requests and accept requests before chatting.
- Any member can keep private drafts; only verified critics can schedule publication.
- On **Members** you can see all the currently registered users and their info. You can see their profiles as well.
- On **Settings** you can edit your display name and your bio (which will update your profile).
- In the navbar you can **search** for movies and TV to add to your collection.

# Built with

## Technologies

- ReactJs, Javascript, TypeScript, Next.js
- CSS3, TailwindCSS
- HTML5

## Tools Used

- Visual Studio Code
- npm package manager
- Linux Terminal
- Git and Github

## Sources, Materials, Copyright

- API used: [The Movie Database](https://www.themoviedb.org/)
