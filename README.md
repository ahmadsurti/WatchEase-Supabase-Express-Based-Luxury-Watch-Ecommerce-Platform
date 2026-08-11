# WatchEase

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Brevo](https://img.shields.io/badge/Brevo-Transactional%20Email-0092FF?logo=brevo&logoColor=white)](https://www.brevo.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)


A luxury watch e-commerce platform featuring liquid glass UI design, client-side Supabase authentication, real-time database cart & wishlist sync, Row Level Security (RLS), and automated transactional email dispatch powered by Brevo and Vercel Serverless Functions.

---

## Features

| Module | What it does |
|--------|----------------|
| **Home & Hero** | Avant-garde hero, custom SVG liquid glass distortion filters, curated collections, interactive glass buttons |
| **Collections** | Men's and Women's horological collections with style filtering (Classic, Luxury, Wedding) and custom price range controls |
| **Product Detail** | High-res imagery, interactive star review system with edit/delete triggers, purchase-gated reviews, direct cart & gift triggers |
| **Shopping Cart** | Real-time item quantity adjustment, subtotal/tax calculation, morphing watch-dial checkout animation |
| **Gift Orders** | Dedicated gifting flow — custom recipient delivery address, personal note, and optional instant gift teaser email |
| **Profile & Orders** | Tabbed dashboard displaying real order history, saved addresses, wishlist items, and password management |
| **Auth & Security** | Supabase Auth (Sign Up, Log In, Sign Out, Password Reset), strict PostgreSQL Row Level Security (RLS) policies |
| **Transactional Email** | Automated order confirmation & gift teaser emails delivered via Brevo REST API and Vercel Serverless Functions |

---

## Prerequisites

Install these before you start:

1. **Node.js 18+** — [nodejs.org](https://nodejs.org/)
2. **Git** — [git-scm.com/downloads](https://git-scm.com/downloads)
3. **Supabase Account** — [supabase.com](https://supabase.com/)
4. **Brevo Account** — [brevo.com](https://www.brevo.com/)

Check installed versions:

```bash
node --version
npm --version
git --version
```

---

## Setup from scratch

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
cd YOUR_REPOSITORY_NAME
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Supabase Database

1. Open your **Supabase Dashboard** → **SQL Editor**.
2. Create a new query, paste the contents of [`supabase/setup.sql`](file:///c:/Users/ahmad/Downloads/DWNLDS/WATCHEASE_V7_FIXED/WATCHEASE/supabase/setup.sql), and click **Run**.
3. This creates all 8 tables (`profiles`, `cart_items`, `wishlist`, `orders`, `order_items`, `addresses`, `gift_orders`, `reviews`), configures triggers (`handle_new_user`, `set_updated_at`, `reviews_on_update`), and enables Row Level Security (RLS).

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
BREVO_API_KEY=xkeysib-your-actual-brevo-api-key
SENDER_EMAIL=hello.tractionagency@gmail.com
SENDER_NAME=WatchEase
PORT=3000
```

> **Never commit `.env`** — it is listed in `.gitignore`.

### 5. Run the local development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## How to use

1. **Browse Collections**: Explore Men's or Women's watches, filter by style or price range.
2. **Account Creation**: Click **Sign Up** to create an account. Supabase Auth handles registration, and a PostgreSQL trigger automatically initializes your profile.
3. **Add to Cart & Wishlist**: Toggle wishlist hearts on cards or product pages. Add watches to your collection.
4. **Gift Someone**: Choose "Gift Someone" on any product page to send a watch to a friend with a custom note and optional email teaser.
5. **Checkout**: Enter your delivery address in Profile, then click **Proceed to Checkout** in Cart to trigger the morphing watch-dial animation, complete the order, and automatically receive a Brevo confirmation email.

---

## Project structure

```
WATCHEASE/
├── index.html              # Main homepage & hero entry point
├── vercel.json             # Vercel deployment & URL rewrite configuration
├── package.json            # Node project configuration & dependencies
├── .env                    # Local environment variables (git-ignored)
├── api/                    # Vercel Serverless Functions
│   ├── send-order-email.js # Order confirmation email endpoint
│   └── send-gift-teaser.js # Gift teaser email endpoint
├── assets/                 # Brand assets & high-res watch imagery
├── css/                    # Modular stylesheets
│   ├── style.css           # Design tokens & core utilities
│   ├── navbar.css          # Frosted pill-navbar styles
│   ├── dark-mode.css       # Global dark mode variables & overrides
│   └── pages/              # Per-page bespoke CSS modules
├── html/                   # Secondary HTML views (men, women, cart, product, profile, auth, gift, etc.)
├── js/                     # Application logic
│   ├── supabase.js         # Supabase client singleton
│   ├── auth-check.js       # Auth helpers & cart/wishlist badge update triggers
│   ├── navbar-inject.js    # Global navbar HTML injector
│   ├── navbar.js           # Dynamic auth state builder & dark mode controller
│   ├── footer-inject.js    # Global footer HTML injector
│   ├── products.js         # Centralized product catalog data
│   ├── email-service.js    # Shared Brevo REST API fetcher & email HTML templates
│   ├── server.js           # Express development server
│   └── pages/              # Page-specific ES modules (cart, product, profile, auth, etc.)
└── supabase/
    └── setup.sql           # Complete schema, triggers, and RLS policies SQL script
```

---

## Configuration reference

| Variable | Default | Description |
|----------|---------|-------------|
| `BREVO_API_KEY` | — | Brevo v3 Transactional API key |
| `SENDER_EMAIL` | `hello.tractionagency@gmail.com` | Verified Brevo sender email |
| `SENDER_NAME` | `WatchEase` | Sender name on outgoing emails |
| `PORT` | `3000` | Local Express development port |

---

## Deployment (Vercel)

### 1. Push to GitHub

Push your workspace to GitHub.

### 2. Import into Vercel

1. Log into **[vercel.com](https://vercel.com/)** and click **Add New Project**.
2. Select your `WATCHEASE` repository.
3. In **Environment Variables**, add:
   - `BREVO_API_KEY` = `your_brevo_api_key`
   - `SENDER_EMAIL` = `hello.tractionagency@gmail.com`
   - `SENDER_NAME` = `WatchEase`
4. Click **Deploy**.

### 3. Configure Supabase Redirect URL

In **Supabase Dashboard → Auth → URL Configuration → Redirect URLs**, add:

```
https://your-vercel-domain.vercel.app/html/reset-password.html
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `BREVO_API_KEY environment variable is not set` | Ensure `.env` contains `BREVO_API_KEY` locally, or add it to Vercel Environment Variables. |
| `Password reset link opens localhost` | Ensure `Supabase -> Auth -> Redirect URLs` includes your live Vercel domain URL. |
| `Cart items or Wishlist not persisting` | Check Supabase SQL Editor and ensure `setup.sql` ran successfully and RLS policies are active. |
| `Port 3000 in use` | Change `PORT=3001` in your `.env` file. |

---

## What I learned from building this

Building WatchEase taught me how to construct a high-end luxury e-commerce experience using native web technologies and modern serverless infrastructure.

- **Zero-Dependency Email Dispatch**: Replaced heavy SMTP libraries like `nodemailer` with a direct `fetch` to Brevo's REST API (`/v3/smtp/email`), drastically reducing serverless cold-start latency.
- **Architectural Minimalism**: Leveraged PostgreSQL Row Level Security (RLS) to enforce data privacy directly at the database level (`auth.uid() = user_id`), eliminating repetitive double-querying on the client.
- **Unified Component Injection**: Built lightweight JS injectors (`navbar-inject.js`, `footer-inject.js`) to share navbars and footers across static pages without requiring heavy framework hydration.
- **Serverless API Routes**: Separated backend endpoints into standalone Vercel Serverless Functions (`api/*.js`) while maintaining a clean, single-command Express server for offline local development.
- **Dynamic UX Interactivity**: Engineered custom SVG turbulence filters for frosted glass UI elements, animated watch dial checkout transitions, and responsive character eye-tracking on authentication forms.

The biggest takeaway: **Understand the complete system flow before adding code**. Relying on native platform capabilities and database-level security rules leads to a faster, cleaner, and significantly more maintainable codebase.

---

## License

This project is licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for the full text. Attribution details are in [NOTICE](NOTICE).
Licensed under the [Apache License, Version 2.0](LICENSE).
