# Firebase setup

The site uses Firebase Authentication and Cloud Firestore. No Supabase data is imported; the schedule in `js/schedule.js` remains as the initial schedule until an admin saves it.

1. Create a Firebase project and register a Web app.
2. The web app configuration has been added to `js/firebase-config.js`. If you change Firebase projects, replace those values with the config from **Project settings → General → Your apps**. This is public client configuration; do not put a service-account key in the site.
3. In **Authentication → Sign-in method**, enable **Email/Password**. This site does not offer public registration.
4. Create a **Cloud Firestore** database in production mode. Open the **Rules** tab and publish the contents of `firestore.rules`.
5. To grant admin permissions, copy the user's UID from **Authentication → Users**. In Firestore, create a document in the `admins` collection whose document ID is that exact UID. The document may contain an empty field such as `enabled: true`. Admin documents cannot be created or changed by the website.
6. Deploy the user-management Cloud Functions from the repository root with `firebase deploy --only functions --project uwdata-94073`. Each operation requires Firebase sign-in and verifies the caller's `admins/{uid}` document. Enable billing for the Firebase project if Firebase requires it for Cloud Functions.
7. Publish the updated `firestore.rules`, then reload the website and sign in as an admin. Use **Manage users** in the login bar to add accounts, change display names, passwords, and admin roles, or delete accounts. Password changes require confirmation. Passwords are managed by Firebase Authentication and are never saved in Firestore. The last administrator cannot be demoted, and an admin cannot demote their own account.
8. In **Forum**, choose **Migrate existing forum data** (or **Resume forum migration** if interrupted) and confirm. The migration copies the existing themes, rooms, and messages into the new room → theme → message hierarchy (`forum_rooms`, `forum_themes`, and `forum_posts`) and leaves the original `themes`, `rooms`, and `forum_messages` collections unchanged as backups.
9. After migration completes, rooms are the top-level forum items and each room contains themes. The schedule can be edited and saved by admins; forum and chat are available to signed-in users.

The visitor counter records authenticated page visits only and does not collect IP addresses. Firestore security rules protect data access; the Firebase web configuration alone is not an authorization mechanism.

If a callable function returns HTTP 403 before its handler runs, open Google Cloud Console → **Cloud Run** → the matching function service → **Permissions** and grant principal `allUsers` the **Cloud Run Invoker** role. Callable endpoints must be reachable by the Firebase web SDK; the function handler still enforces Firebase authentication and admin authorization. This can be needed if an interrupted deployment left a function's Cloud Run permissions incomplete.
