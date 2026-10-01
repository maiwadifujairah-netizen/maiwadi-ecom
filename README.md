# MAI WADI — Water E-Commerce

Three independent apps sharing one API and one MongoDB database:

| App | Folder | Stack | Dev URL |
|---|---|---|---|
| Customer website | `frontend/` | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Axios, Lucide | http://localhost:5173 |
| Admin dashboard | `admin/` | same as frontend | http://localhost:5174 |
| API server | `backend/` | Node 20, Express 5, TypeScript, Mongoose, Cloudinary, Razorpay (optional) | http://localhost:5000 |

```
MAI-WADI/
├── frontend/          customer website
│   ├── public/images/     favicon, hero/truck photos, water-can cutout
│   └── src/  assets/ components/ context/ hooks/ layouts/ pages/ services/ types/ utils/ App.tsx main.tsx
├── admin/             admin dashboard
│   ├── public/images/     favicon
│   └── src/  assets/ components/ context/ hooks/ layouts/ pages/ services/ types/ utils/ App.tsx main.tsx
├── backend/           REST API
│   ├── src/  config/ controllers/ middleware/ models/ routes/ services/ utils/ app.ts server.ts seed.ts
│   ├── static/            seed product image (served at /static)
│   └── uploads/           local-dev image uploads (served at /uploads; production uses Cloudinary)
├── package.json       root scripts (concurrently)
└── render.yaml        Render blueprint for the backend
```

## Quick start

```bash
npm run install:all          # root + backend + frontend + admin

cp backend/.env.example backend/.env      # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
cp frontend/.env.example frontend/.env    # defaults already point to http://localhost:5000/api
cp admin/.env.example admin/.env

npm run seed                 # settings, "Water Cans" category, initial product, admin account
npm run dev                  # backend + frontend + admin together
```

No Atlas database yet? `npm run dev:demo` runs all three apps, with the API on a pre-seeded in-memory MongoDB. The admin login is `admin@maiwadi.local` / `admin12345`, and all data is lost when you stop it.

### Root scripts

| Command | What it does |
|---|---|
| `npm run install:all` | installs dependencies for root and all three apps |
| `npm run dev` | backend + frontend + admin concurrently |
| `npm run dev:backend` / `dev:frontend` / `dev:admin` | one app only |
| `npm run dev:demo` | all three, API on an in-memory database |
| `npm run build` | builds all three apps |
| `npm test` | backend end-to-end API test (in-memory MongoDB) |
| `npm run seed` | seeds the database configured in `backend/.env` (adds missing records only) |
| `npm run check` | read-only preflight: env vars, MongoDB ping + seed data, Cloudinary and Razorpay credentials. Never prints secrets. Run with `NODE_ENV=production` to apply the production rules |

Each app also runs on its own: `cd frontend && npm install && npm run dev` (same for `admin` and `backend`).

## Environment variables

**Secrets live only in `.env` files, which are git-ignored.** The `.env.example` files are committed and must contain placeholders only. In production, set the values in the Render and Vercel dashboards.

### backend/.env

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB Atlas connection string (the database both apps share) |
| `MONGODB_DB` | no | database name, default `maiwadi`. Without it, an Atlas URI with no `/dbname` would silently use `test` |
| `JWT_SECRET` | yes | ≥ 32 random chars in production: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NODE_ENV` | prod | `production` enables secure cookies and requires Cloudinary |
| `PORT` | no | default `5000` |
| `CLIENT_URL` | no | CORS origins, comma-separated. Default `http://localhost:5173,http://localhost:5174` |
| `COOKIE_SAMESITE` | no | `lax` (default) or `none`. See [Deployment](#deployment) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | for seed | password ≥ 10 chars; the seed creates the admin only if the email doesn't exist |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | prod | without them, dev uploads go to `backend/uploads/` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | no | when unset only Cash on Delivery is offered |
| `SEED_PRODUCT_PRICE`, `SEED_PRODUCT_STOCK` | no | default 0; normally set in Admin → Products |
| `TRUST_PROXY` | no | proxy hops for rate limiting; default 2 in production |

### frontend/.env and admin/.env

| Variable | App | Notes |
|---|---|---|
| `VITE_API_URL` | both | dev only, e.g. `http://localhost:5000/api`. Production builds always use same-origin `/api` (Vercel rewrite) |
| `VITE_SITE_URL` | admin | customer website URL for "View website" links (default `http://localhost:5173`) |

## How the apps share the backend

- **One database.** The admin dashboard has no database of its own; everything goes through the same API.
- **Sessions.** Auth uses an httpOnly JWT cookie. The admin app sends `X-App: admin`, so its session lives in its own cookie (`mw_admin_token`), separate from a customer session (`mw_token`). Without this, the two apps would share a login on `localhost`, where cookies ignore the port.
- **Images.** Stored images have paths like `/uploads/...` (dev uploads) or `/static/...` (seed image). Both apps turn these into full URLs on the API origin with `mediaUrl()` in `src/services/api.ts`. Cloudinary URLs are already absolute.

## Admin setup

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`, then run `npm run seed`.
2. Open the admin dashboard and sign in.
3. **Products:** set the real price and stock for "MAI WADI Water Can". While the price is 0 the product shows "Contact us" and can't be ordered online.
4. **Site settings:** check the contact numbers (pre-filled from the truck: 09 277 8993 / 050 908 7560, WhatsApp 971509087560), and add your email, address, hours, social links and delivery fee.
5. **Banners:** upload promotional banners. Active ones appear on the website homepage automatically.

## Deployment

**Recommended:** deploy the backend to Render, and deploy both the website and the admin to Vercel. Each Vercel app proxies `/api`, `/uploads` and `/static` to Render. Each app then talks to the API on its own origin, so login cookies are first-party and work in every browser, including Safari.

1. **MongoDB Atlas:** create a cluster and a database user, and allow access from Render. Copy the connection string.
2. **Cloudinary:** create an account and copy the cloud name, API key and secret.
3. **Backend on Render:**
   - New → Blueprint uses `render.yaml`. Alternatively, create a Web Service with root `backend`, build command `npm ci --include=dev && npm run build`, and start command `npm start`.
   - Set the env vars above. `CLIENT_URL` = your website and admin URLs.
   - The Atlas database is already seeded from local (`npm run seed`). On a fresh database, run `npm run seed:prod` in the Render shell.
   - `render.yaml` sets `MONGOMS_DISABLE_POSTINSTALL=1` (skips a 77 MB test-only MongoDB download), `NODE_VERSION=20` and `TRUST_PROXY=2`.
   - In Atlas → Network Access, allow Render's outbound IPs (or `0.0.0.0/0`).
   - Check that `/api/health` returns `{"ok":true}`.
4. **Frontend on Vercel:** set the root directory to `frontend`. `frontend/vercel.json` rewrites to `https://maiwadi-ecom.onrender.com` (change it if the Render URL changes).
5. **Admin on Vercel:** set the root directory to `admin`, set `VITE_SITE_URL=https://<your website>` (required, otherwise "View website" points to localhost). `admin/vercel.json` rewrites to `https://maiwadi-ecom.onrender.com`.
6. **Go-live check:** run `NODE_ENV=production npm run check` with the production values. It fails on non-https `CLIENT_URL` and on Razorpay test keys.

Both `vercel.json` files add security headers (nosniff, referrer policy, frame protection) and long-term caching for `/assets`. The admin also sends `X-Robots-Tag: noindex` and refuses to be framed.

Production builds always call `/api` on their own origin; there is no direct-to-Render mode, because the `SameSite=Lax` login cookie would not be sent cross-site.

### Payments
`RAZORPAY_*` keys enable "Pay online". The server creates the Razorpay order and verifies the payment signature before marking an order paid (`backend/src/services/payment.ts`). Razorpay mainly serves Indian-registered merchants, so for a UAE business a local gateway (e.g. Stripe, Telr, Network International) may fit better. Unpaid online orders keep their stock reserved until an admin cancels them.

## API overview

Routes (`backend/src/routes/`) only wire middleware to controller functions (`backend/src/controllers/`). Integrations live in `backend/src/services/`: image storage, payment and inventory.

| Group | Endpoints |
|---|---|
| `/api/auth` | `POST register, login, logout` · `GET me` |
| `/api/products` | `GET /` (search, category, featured, page) · `GET /:slug` · admin: `GET /admin`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/categories` | `GET /` · admin: `POST`, `PUT /:id`, `DELETE /:id` |
| `/api/banners` | `GET /` (active) · admin: `GET /admin`, `POST`, `PUT /:id`, `PATCH /:id/active`, `DELETE /:id` |
| `/api/orders` | `GET /payment-config` · `POST /` · `POST /:id/verify-payment` · `GET /mine` · admin: `GET /`, `GET /:id`, `PATCH /:id` |
| `/api/customers` | admin: `GET /`, `GET /:id`, `PATCH /:id` |
| `/api/contact` | `POST /` · admin: `GET /`, `PATCH /:id`, `DELETE /:id` |
| `/api/settings` | `GET /` · admin: `PUT /` |
| `/api/uploads` | admin: `POST /` (multipart `image`, ≤ 5 MB) |
| `/api/admin/dashboard` | admin: `GET /` |
