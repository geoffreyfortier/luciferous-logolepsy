# Luciferous Logolepsy

Luciferous Logolepsy is a curated glossary of over 9,000 obscure, archaic, and evocative English words, rebuilt as a modern web app and installable mobile application.

It is designed for writers, linguists, word-lovers, and the linguistically curious.

## About the Project

Years ago, there existed a beloved website packed with strange, beautiful, and forgotten English words. It was both a pleasure to explore and an inspiration to reference. Sadly, that original domain expired and is now occupied by unrelated content.

Luciferous Logolepsy is an effort to preserve and revive as much of that content as possible; modernized, searchable, offline-capable, and accessible across devices.

## Features

🔍 Instant search across terms and definitions\
🧠 Filter by word type (noun, verb, adjective, phrase)\
🔤 A-Z browsing\
⭐ Favorites; save and revisit words you love\
🎲 Random term discovery\
🕒 Recently viewed terms\
🌙 Light/Dark mode\
📱 Installable PWA with offline support\
🚫 No ads, no tracking, no accounts

## Offline Use

The app caches its glossary data locally. Once loaded, it continues to work offline.

## Technology Overview (High Level)

- Frontend: Vanilla TypeScript & Vite
- PWA: Service Worker caching via vite-plugin-pwa
- Mobile app: Android Trusted Web Activity (TWA)
- Storage: LocalStorage (favorites & preferences)
- Hosting: Static files

This project intentionally avoids heavy frameworks to remain fast, portable, and future-proof.

## 🌐 Full Web App:

https://arcane.org/ll/

You may optionally install it to your device from your browser menu.

## 📱 Android app:
Available soon via Google Play as a TWA (Trusted Web Activity)

The Android app is a wrapper around the web version using a Trusted Web Activity, providing a full-screen, native-like experience.

## Project Status

✔ Actively maintained\
✔ Stable\
✔ Open to suggestions and improvements

## License & Attribution

This project exists to preserve and make accessible historical content. The original source material predates this implementation and is shared here for educational and archival purposes.

Code is provided as-is.\
No warranties.\
No monetization.
