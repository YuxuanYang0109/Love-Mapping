# Love Mapping

Love Mapping is a WeChat Mini Program for saving and revisiting personal moments on a map. It lets users add records with a location, photo, short note, and mood score, then browse those records either geographically on a map or chronologically in a timeline.

The project uses WeChat Cloud Development for database storage, cloud file uploads, and simple cloud functions.

## Features

- Passphrase-based first-time login with local persistent login state.
- Map view with mood-colored heart markers.
- Record creation page for location text, optional GPS coordinates, photo upload, note text, and mood input.
- Mood picker based on a draggable 2D mood area.
- Timeline view with paginated record loading.
- Marker detail popup with record text, time, location, and uploaded photo preview.
- WeChat Cloud Database collection for user records.
- WeChat Cloud Storage for uploaded record photos.
- Subpackage-based page organization for record creation and timeline browsing.

## Project Structure

```text
lovemapping/
+-- cloudfunctions/
|   +-- login/                  # Returns the current user's openid
|   +-- quickstartFunctions/     # WeChat Cloud quickstart helper functions
+-- miniprogram/
|   +-- app.js                  # App bootstrap, cloud init, login state helpers
|   +-- app.json                # Page routes, subpackages, permissions
|   +-- components/
|   |   +-- seg-toggle/         # MAP / TIME segmented switch
|   +-- images/                 # Avatars, mood marker icons, decorative assets
|   +-- pages/
|   |   +-- index/              # Login page
|   |   +-- map/                # Main map page
|   +-- pkg_record/
|   |   +-- record/             # Add-record page
|   +-- pkg_timeline/
|       +-- timeline/           # Timeline page
+-- project.config.json
+-- README.md
```

## Requirements

- WeChat Developer Tools
- A WeChat Mini Program AppID
- WeChat Cloud Development enabled
- A Cloud Database collection named `record`
- Location permission enabled for `wx.getLocation`

## Getting Started

1. Open this folder in WeChat Developer Tools.
2. Replace the project AppID in `project.config.json` if you are using your own Mini Program account.
3. Replace the cloud environment ID in `miniprogram/app.js` with your own cloud environment ID.
4. Create a Cloud Database collection named `record`.
5. Upload and deploy the cloud functions under `cloudfunctions/` if you need cloud function support.
6. In the WeChat Mini Program admin console, enable the required location API permission for `wx.getLocation`.
7. Compile and preview the Mini Program in WeChat Developer Tools.

## Cloud Database

The main collection is `record`. A saved record may contain these fields:

```js
{
  text: String,
  moodX: Number,
  moodY: Number,
  moodSummary: String,
  lat: Number | null,
  lng: Number | null,
  location: String,
  photoFileId: String,
  createdAt: Number,
  happenedAt: Number
}
```

`photoFileId` stores the Cloud Storage file ID returned after image upload. The map and timeline pages resolve that file ID into a temporary URL when displaying photos.

## Login Flow

The Mini Program uses a lightweight local passphrase gate:

- The login page is the first route in `app.json`.
- After a correct passphrase is entered, the app writes a local storage flag.
- Later launches skip the passphrase page and redirect to the map page.
- Protected pages check the login flag and redirect back to the login page if needed.

The passphrase is configured in `miniprogram/app.js`. For a public repository, avoid committing production secrets or sensitive access phrases.

## Location Permission

This project calls `wx.getLocation` with `type: "gcj02"` so map coordinates can be used directly with the WeChat map component.

`miniprogram/app.json` includes:

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "Used to mark records on the map and revisit location history."
    }
  },
  "requiredPrivateInfos": ["getLocation"]
}
```

For Mini Programs published after July 14, 2022, this interface also needs to be enabled in the WeChat Mini Program admin console under Development > Development Management > Interface Settings.

## Notes Before Publishing to GitHub

- Replace personal AppID and cloud environment values if this repository will be public.
- Check whether image assets in `miniprogram/images/` are suitable for public release.
- Do not commit private passphrases, production credentials, or private cloud environment details.
- The UI text currently contains some legacy mojibake strings in several pages. Clean those strings before preparing a polished public release.
- `quickstartFunctions` still contains WeChat Cloud quickstart sample logic and can be removed if it is not used by the app.

## License

No license has been selected yet. Add a license file before publishing if you want others to know how they may use this project.
