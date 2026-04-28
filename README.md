# SkillSwap

SkillSwap is a Next.js app for finding people nearby who can teach, practise, and exchange useful skills. The product direction is a warm career-network experience inspired by Handshake: bold editorial copy, bright action colours, rounded pill controls, and clean cards for repeatable surfaces.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase auth and data
- Lucide React icons

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port `3000` is busy, Next will print the alternate local URL.

## Verification

Run a production build:

```bash
npm run build
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

## Design System

The shared design structure lives in `src/app/globals.css`.

Core tokens:

- Background: warm ivory `#fbf7ef`
- Text: deep ink `#101426`
- Primary action: cobalt `#0a66ff`
- Accent colours: lime `#d7ff57`, mint `#c8f6df`, coral `#ff9d7a`, yellow `#ffe68a`
- Cards: 8px radius, soft borders, subtle shadow
- Controls: pill-shaped primary and secondary buttons

Reusable classes:

- `brand-shell`
- `brand-container`
- `brand-nav`
- `brand-card`
- `brand-card-flat`
- `brand-pill`
- `brand-button-primary`
- `brand-button-secondary`
- `brand-input`
- `brand-label`
- `brand-kicker`

Use these primitives for new pages before introducing one-off styling.

## Key Routes

- `/` - public landing page
- `/auth/signup` - account creation
- `/auth/login` - sign in
- `/dashboard` - authenticated home
- `/profile/setup` - profile and skills onboarding

## Product Voice

Keep language direct, optimistic, and practical. Prefer phrases like:

- "Your next skill starts here"
- "Find people ready to swap"
- "Learn, practise, and trade knowledge"
- "Build a profile people can say yes to"

Avoid generic marketplace copy when a more specific learning-network phrase fits.
