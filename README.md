# video-chat

Peer to peer video chat.

## Dependencies

This project has a dependency on Firebase Cloud Firestore.

https://console.firebase.google.com/

You'll also need to add a `.env` file, with a `PUBLIC_FIREBASE_CONFIG` setting.

```.env
#public
PUBLIC_FIREBASE_CONFIG = { "apiKey": "", "authDomain": "", "projectId": "", "storageBucket": "", "messagingSenderId": "=", "appId": ""}
```

The database requires a single collection called `Calls`

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
