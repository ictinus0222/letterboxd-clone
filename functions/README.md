# Clonnerboxd Cloud Functions

The callable functions create trusted review publication transitions and manage verified-critic custom claims. Only an administrator with the Firebase Auth `admin: true` custom claim can call `setCriticVerification`. Establish that initial administrator claim through a trusted Firebase Admin operator process; do not make an admin-grant function callable by ordinary users or commit service-account credentials.

Install dependencies and build with `npm install` and `npm run build` from this directory. Validate callable and scheduled behavior with the Firebase Emulator Suite before any deployment. The repository changes configure local functions and rules only; they do not deploy or modify a Firebase project.

After an administrator grants or revokes critic status, the member must refresh their Firebase ID token (for example, by signing in again) before the scheduling control appears. The callable and scheduled publisher recheck the authoritative Admin SDK custom claim.
