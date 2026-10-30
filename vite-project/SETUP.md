# Marketfind – setup after the routing / payment update

```bash
npm install            # adds react-router-dom and @paystack/inline-js
cp .env.example .env   # then paste your Paystack TEST secret key (sk_test_...)
npm run server         # terminal 1: payment server on :8787
npm run dev            # terminal 2: the site (proxies /api to the server)
```

Test cards for Paystack test mode: https://paystack.com/docs/payments/test-payments/

## Routes
| URL | Page |
| --- | --- |
| `/` | Home |
| `/category/:slug` | Category (e.g. `/category/womens-clothing`) |
| `/product/:productId` | Product detail |
| `/search?q=...` | Search results |
| `/cart` | Cart |
| `/checkout` | Delivery details + Paystack payment |
| `/order-confirmation` | Receipt after successful payment |
| `/signin` | Sign in |
| anything else | 404 |

## Where things live
- `src/catalog.js` – every product, plus `DELIVERY_FEE`. The server imports this
  too, so prices can't be changed from the browser.
- `src/homeData.js` – the data that used to sit at the top of `home.jsx`.
- `src/CartProvider.jsx` / `src/useCart.js` – cart state (saved in localStorage).
- `server/index.js` – creates Paystack transactions and verifies payments.

## Before going live
- Orders are stored in memory in `server/index.js`; use a database.
- Add a Paystack webhook so orders are confirmed even if the customer closes the tab.
- Host the server somewhere, set `VITE_API_URL` for the site and `CLIENT_ORIGIN` for the server.
- Use your live `sk_live_...` key only on the server, never in the frontend.
- Hero products (watch, headphones, carry pack) got placeholder prices in `homeData.js`.
