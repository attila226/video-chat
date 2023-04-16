# video-chat

Peer to peer video chat.

Demo: https://video-chat-henna.vercel.app/

[![Watch the video](https://img.youtube.com/vi/Ngg86gpt3kU/hqdefault.jpg)](https://youtu.be/Ngg86gpt3kU)

## Dependencies

This project has a dependency on Firebase Cloud Firestore.

The database requires a single collection called `Calls`

https://firebase.google.com/docs/firestore/quickstart

You'll also need to add a `.env` file, with a `PUBLIC_FIREBASE_CONFIG` setting.

```.env
#public
PUBLIC_FIREBASE_CONFIG = { "apiKey": "", "authDomain": "", "projectId": "", "storageBucket": "", "messagingSenderId": "=", "appId": ""}
```

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

## Browsers support

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Chrome |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
