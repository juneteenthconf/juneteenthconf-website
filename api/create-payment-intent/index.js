const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function (context, req) {
  if (req.method !== 'POST') {
    context.res = { status: 405, body: 'Method Not Allowed' };
    return;
  }

  const { amount, name, email, tshirtSize, scholarshipTickets, contribution } = req.body || {};

  if (!amount || amount < 75) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid amount' }),
    };
    return;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      receipt_email: email || undefined,
      description: 'Juneteenth Conference 2026 — General Admission',
      metadata: {
        name: name || '',
        email: email || '',
        tshirtSize: tshirtSize || '',
        scholarshipTickets: String(scholarshipTickets || 0),
        contribution: String(contribution || 0),
        event: 'JuneteenthConf 2026',
      },
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
