import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 4242;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Credit packages — must match frontend
const CREDIT_PACKAGES = {
  starter:  { name: 'Starter',        price: 999,  credits: 1000, bonus: 0    },
  creator:  { name: 'Creator',        price: 2499, credits: 2500, bonus: 250  },
  pro:      { name: 'Pro Collector',  price: 4999, credits: 5500, bonus: 500  },
  whale:    { name: 'Whale',          price: 9999, credits: 12000, bonus: 2000 },
};

// POST /create-payment-intent
// Creates a Stripe PaymentIntent for a credit package purchase
app.post('/create-payment-intent', async (req, res) => {
  const { packageId } = req.body;

  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid package' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.price,          // in cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        packageId,
        credits: pkg.credits + pkg.bonus,
        packageName: pkg.name,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      packageName: pkg.name,
      totalCredits: pkg.credits + pkg.bonus,
      amountUsd: (pkg.price / 100).toFixed(2),
    });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /publishable-key
// Returns the publishable key to the frontend safely
app.get('/publishable-key', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// POST /webhook
// Handles Stripe webhooks (payment confirmation, etc.)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    console.log(`✅ Payment succeeded: ${pi.id} | ${pi.metadata.credits} credits → ${pi.metadata.packageName}`);
    // TODO: credit user account in database
  }

  res.json({ received: true });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'test' }));

app.listen(PORT, () => {
  console.log(`🚀 AISynthArt backend running on port ${PORT}`);
  console.log(`   Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
});
