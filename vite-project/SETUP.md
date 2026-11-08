# Marketfind: setup

Needs **Node 20.6+** and a **MongoDB** database (free Atlas cluster, or local).

```bash
npm install
cp .env.example .env     # then fill in MONGODB_URI and PAYSTACK_SECRET_KEY (test key)
npm run seed             # loads categories + starter products into MongoDB
npm run server           # terminal 1: API on :8787
npm run dev              # terminal 2: website on :5173
```

Open the site at `http://localhost:5173` (it must match `CLIENT_ORIGIN` in `.env`).
Run the unit tests (server logic and shared pricing) with `npm run test:server`.

## Secrets: never commit them
`.env` holds your database password and Paystack key. `.gitignore` already excludes
`.env` and `.env.*` (only `.env.example`, which has no real values, is committed).
If a real `.env` was ever committed or pushed:
1. `git rm --cached .env` then commit (stops tracking it).
2. Treat both secrets as leaked and replace them: roll the Paystack secret key in the
   dashboard, and change the MongoDB Atlas database user's password.
3. Put the new values only in your local `.env`.

## Account types: one site for retail, wholesale (B2B) and peer-to-peer

Everyone registers at `/register` and picks how they'll use Marketfind:

| You are | Registration choice | What you get |
| --- | --- | --- |
| Shopper | **Buyer: Individual** | Retail products and pre-loved items. Dashboard: "Picks for you". |
| Company buying supplies | **Buyer: Business** (business name, optional CAC/RC number, industry) | Wholesale deals, suppliers, quotes, business-only listings, business name on invoices. Dashboard: "Business dashboard". |
| Someone clearing out used things | **Seller: Individual** (no business registration) | "My listings": second-hand items with condition, "open to offers", mark sold / relist. |
| Shop selling new products | **Seller: Retail business** | Normal products with stock and "was" prices. |
| Supplier | **Seller: Wholesale / bulk business** | Bulk listings: sold by the bag/carton/etc., minimum order, up to 4 price breaks, lead time, and who may buy (businesses and individuals, or businesses only). |

Sellers are shoppers too. A seller's type is fixed at sign-up (use another account for another type).

**Different uploads.** `/sell/products/new` shows a different form for each seller type, and the
server only accepts the fields that belong to that type. Listings are labelled by type
(`retail`, `bulk`, `secondhand`).

**Bulk pricing.** `price` is the unit price at the minimum order; `priceTiers` give cheaper unit
prices for bigger orders. The price shown, the cart total and the amount charged all come from
one file, `shared/pricing.js`. The server re-prices every order, enforces the minimum order and
rejects business-only items from non-business accounts.

**Recommendations.** A shopper's mode (Retail & pre-loved / Wholesale (B2B) / Both) decides what
their dashboard and home page show: retail picks and pre-loved finds, or bulk deals, suppliers
and "order again". Picks lean towards categories they've saved or bought from. They can switch
mode at any time on their dashboard. Business-only listings are hidden from other accounts.
Extra pages: `/wholesale` and `/preloved`; category and search pages have type tabs.

**Verified badges.** Businesses can give a CAC/RC number at sign-up. We can't check it
automatically, so an admin marks sellers verified after seeing their documents:
`PATCH /api/admin/sellers/<userId>/status` with `{"verified": true}` (this also accepts `status`).

## Sellers, products and chat

**Becoming a seller.** `/sell/register` (or the Sell options at `/register`) creates an account and a store in one step;
signed-in shoppers just add store details. Each seller gets a public page at `/store/<name>`.

**Uploading products.** Sellers use `/sell` (dashboard) > *Add product*: name, price, optional
"was" price, stock, **category**, description and 1-5 pictures. The product is saved in the
`products` collection and goes live immediately:
- it appears on that category's page, on the seller's store page, in search and under
  "New arrivals" on the home page;
- pictures are shrunk in the browser, checked on the server (real JPEG/PNG/WebP only),
  and stored in MongoDB (`images` collection), so nothing is lost when the host redeploys;
- sellers can edit, change stock, hide/show products and see paid orders with delivery details.
The website only ever reads the database; there is no product data left in the frontend.

**Chat.** On any product sold by a seller, shoppers see **Chat with seller**, which opens a
chat box on the product page. The seller reads and replies from `/messages`. Replies appear in
the buyer's chat within a few seconds (the page refreshes itself) **and are emailed to the
buyer**; buyer messages are also emailed to the seller (at most one alert per chat per
5 minutes). Anyone can turn emails off under *Account > Profile*.

**Buyer details.** Name, email and phone (optional) are saved at registration in the
`users` collection, and each chat records who it is between (`conversations`, `messages`).

### Email setup
Chat works without email, but replies are only *printed in the server log* until you add SMTP
settings to `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`).
Any SMTP provider works (Brevo and Mailgun have free tiers; Gmail works with an app password).
Sellers see per message whether the email was sent.

## Security summary
- scrypt-hashed passwords; weak passwords rejected; lock after 5 failed logins.
- `httpOnly` + `SameSite` session cookie (only a hash is stored); rate limits on every route.
- Every input is validated (blocks MongoDB operator injection); `helmet` headers.
- CSRF: SameSite cookies + Origin check + JSON-only writes (multipart only on product upload).
- Uploads: size and count limits, file type read from the bytes (not the filename), served with
  `nosniff` and a locked-down CSP; seller routes check ownership of every product.
- Chat: only the two people in a conversation can read it; strangers get "not found".
- Emails: user text is HTML-escaped, subjects are single-line.
- Prices and stock always come from the database; Paystack amounts and webhook signatures are verified.

## Managing the marketplace
- Make yourself admin: register, then `npm run make-admin -- you@example.com`.
- Suspend a seller (hides all their products): `PATCH /api/admin/sellers/<userId>/status`
  with `{"status": "suspended"}`.
- Admin product API: `POST/PATCH/DELETE /api/admin/products`, `GET /api/admin/orders`.
- Home page rows: `collections` documents with `showOnHome: true`.

## Paystack webhook
Set the webhook URL in the Paystack dashboard to `https://YOUR-API-DOMAIN/api/payments/webhook`.

## Before going live
- Host the API and the site; set `NODE_ENV=production`, `TRUST_PROXY=1`, `CLIENT_ORIGIN`
  (the site's exact URL), `PUBLIC_API_URL` (the API's URL) and the site's `VITE_API_URL`.
  Cookies work best when both share a parent domain (`shop.com` and `api.shop.com`).
- Use your live Paystack secret key on the server only.
- Free Atlas has 512 MB: pictures are about 200-400 KB each. For a large catalogue move
  images to Cloudinary or S3 (only `server/lib/images.js` and `server/routes/images.js` change).
- Not included: email verification, forgot-password, seller payouts (Paystack takes the
  payment; paying sellers out is done separately or with Paystack Split/Subaccounts),
  an admin dashboard page, and real-time sockets (chat refreshes every 5 seconds).
- Starter products have no seller, so they show "Sold by Marketfind" without a chat button.
