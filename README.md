# Can't Say No

Digital IOU favor cards with shareable links and QR codes, where recipients have only one option: **Accept**.

Gift a card now without deciding the task up front. When you're ready to cash it in, attach your favor. The recipient sees a single button — "I Accept" — and once the card is confirmed done, it's permanently sealed.

## Features

- **Mint unassigned favor cards** — gift a card before deciding what you want back.
- **Load the favor** — attach a task and optional deadline when you're ready to redeem.
- **Recipient view** — a public page (`/c/:id`) where the recipient accepts with one tap.
- **QR codes** — generate crisp, high-error-correction QR codes for instant sharing.
- **Real-time sync** — Firebase Authentication (Google & Facebook) + Firestore.
- **Card lifecycle** — `unassigned` → `pending_redemption` → `awaiting_confirmation` → `used` (or `revoked`).
- **Reissue & revoke** — reissue a fresh card from a used/revoked one.
- **Recipient simulator** — preview any card from the recipient's perspective.

## Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS 4    |
| UI         | `lucide-react`, `motion`, `canvas-confetti`   |
| Backend    | Express (dev/prod server via `tsx`/`esbuild`) |
| Database   | Firestore                                     |
| Auth       | Firebase Authentication (Google, Facebook)    |
| QR Codes   | `qrcode`, `html-to-image`                     |
| Runtime    | Bun (`bun.lock`)                              |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js + npm)
- A Firebase project (for auth and Firestore)

### Install & Configure

```bash
bun install
```

Copy `.env.example` to `.env` and fill in your Firebase client configuration:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_FIRESTORE_DATABASE_ID=""
```

### Run Locally

```bash
bun run dev
```

This starts the Express + Vite dev server. Open the URL printed in the terminal (default `http://0.0.0.0:3000`).

### Build & Run for Production

```bash
bun run build
bun start
```

## Available Scripts

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `bun run dev`      | Start dev server (Express + Vite HMR)             |
| `bun run build`    | Build client (`vite build`) and server bundle     |
| `bun start`        | Run the production server from `dist/server.cjs`  |
| `bun run lint`     | Type-check with `tsc --noEmit`                    |
| `bun run preview`  | Preview the built client                          |
| `bun run clean`    | Remove `dist` and `server.js`                     |

## Project Structure

```
src/
├── api.ts                    # Data layer (Firestore reads/writes, QR generation)
├── types.ts                  # Card, PublicCard, User, CardStatus types
├── App.tsx                   # Root component + URL routing
├── lib/firebase.ts           # Firebase app/auth/db initialization
├── utils/
│   ├── audio.ts              # Sound effects
│   └── downloadCardPng.ts    # Export card as PNG
└── components/               # UI components & modals
server.ts                     # Express API + Vite middleware
firestore.rules               # Firestore security rules
```

## Card Lifecycle

1. **Mint Unassigned** — generate a QR link for the recipient.
2. **Load the Favor** — attach the task when ready.
3. **Recipient Accepts** — only "I Accept" is offered.
4. **Confirm Done** — the card permanently seals as `used`.

## Deployment

Deploy to Vercel (client-side Firebase Auth + Firestore) by following the steps in [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md), or use the in-app "Vercel Deploy" helper button.

> **Note:** This application is legally non-binding but socially absolute. Use responsibly when calling in significant life favors.