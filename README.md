# Solace Frontend

Vue frontend for Voltech's online store, featuring the SolaceAI shopping and customer support assistant and an administration portal.

## Features

- Browse products and view product details.
- Register and sign in as a customer, manage a cart, and place orders through simulated checkout (no actual payment is charged).
- View order history and order details.
- Chat with SolaceAI after signing in.
- Admin dashboard, product management, order management, and support ticket handling.

## Tech stack

Vue 3, TypeScript and JavaScript, Vite, Vue Router, Pinia, Axios, Tailwind CSS 4, and Lucide icons.

## Local development

Requirements:

- Node.js 20.19+ within the 20.x line, or 22.12+ (required by Vite).
- npm.
- A running Solace backend. This repository contains the frontend only; authentication, products, orders, chat, and support tickets depend on the API.

Install dependencies:

```sh
npm ci
```

Create or update `.env.local` in the project root:

```dotenv
VITE_API_URL=http://localhost:8000
```

`VITE_API_URL` is the backend origin, without an `/api` suffix. Requests already include the `/api/...` path. If omitted, it defaults to `http://localhost:8000`. The backend must allow requests from the frontend origin through CORS.

Vite exposes `VITE_` variables to the browser, so do not put secrets in them. Restart the development server after changing environment variables.

Start the app:

```sh
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Customer accounts can be created at `/register`; admin access requires an account provisioned by the backend.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Run `vue-tsc -b`, then build production assets into `dist/`. |
| `npm run preview` | Serve the production build locally for review. Run the build first. |

There are currently no test or lint scripts configured in `package.json`.

## Main routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Product catalog | Public |
| `/products/:id` | Product details | Public |
| `/login`, `/register` | Customer authentication | Customer guests |
| `/cart` | Cart and checkout | Customer sign-in required |
| `/orders`, `/orders/:id` | Order history and details | Customer sign-in required |
| `/admin/login` | Admin authentication | Admin guests |
| `/admin` | Admin dashboard | Admin sign-in required |
| `/admin/products` | Product management | Admin sign-in required |
| `/admin/products/create` | Create a product | Admin sign-in required |
| `/admin/products/:id`, `/admin/products/:id/edit` | View or edit a product | Admin sign-in required |
| `/admin/orders` | Order management | Admin sign-in required |
| `/admin/support-tickets` | Support ticket management | Admin sign-in required |

Customer and admin tokens are stored separately in browser `sessionStorage`. The shared Axios client attaches bearer tokens to the corresponding API requests.

## Project structure

```text
src/
  api/          Shared Axios client and authentication interceptors
  assets/       Images and branding
  components/   Shared UI and the SolaceAI chat widget
  layouts/      Page layouts
  router/       Routes and authentication guards
  stores/       Pinia authentication and cart stores
  views/        Customer, admin, and storefront views
  main.ts       App initialization
  style.css     Global styles
public/         Static assets
```

The active customer and admin routes are defined in `src/router/index.js`.

## Deployment

Set `VITE_API_URL` for the target backend before running `npm run build`; Vite embeds the value at build time. Publish the generated `dist/` directory to a static host.

The app uses Vue Router's HTML5 history mode. Configure the host to serve `index.html` for frontend routes such as `/orders/123` and `/admin/products` so direct navigation and page refreshes work.
