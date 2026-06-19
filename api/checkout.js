import Stripe from 'stripe';

const PRICES = {
  monthly:  'price_1Tk5WCFO3dTt7Ci7coKaQdxf',
  annual:   'price_1Tk5XEFO3dTt7Ci75JXO5Izy',
  lifetime: 'price_1Tk5XzFO3dTt7Ci77rJKJ1VC',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not set' });

  const { plan = 'monthly' } = req.body || {};
  const priceId = PRICES[plan];
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const base = process.env.CLIENT_URL || 'https://thestreamhub.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // Lifetime is a one-time payment, monthly/annual are subscriptions
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      success_url: `${base}?success=true&plan=${plan}`,
      cancel_url: `${base}?canceled=true`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}