# AISynthArt Backend

Stripe payment server for AISynthArt marketplace.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   PORT=4242
   FRONTEND_URL=https://www.aisynthart.com
   ```

3. Run locally:
   ```
   node server.js
   ```

## Deploy to Render

1. Push this folder to GitHub
2. Go to render.com → New Web Service
3. Connect your GitHub repo
4. Set:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add environment variables in Render dashboard
6. Deploy!

## Endpoints

- `POST /create-payment-intent` — Create Stripe payment for credit package
- `GET /publishable-key` — Get Stripe publishable key
- `POST /webhook` — Stripe webhook handler
- `GET /health` — Health check
