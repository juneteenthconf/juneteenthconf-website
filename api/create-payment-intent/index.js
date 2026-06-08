const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STUDENT_CODE = 'BETHUNE';
const TICKET_CAP = 150;
// End of day June 14 CT = June 15 05:00 UTC
const SALE_ENDS = new Date('2026-06-15T05:00:00Z');

async function getSoldCount() {
  let count = 0;
  let hasMore = true;
  let startingAfter;

  while (hasMore) {
    const params = {
      query: `metadata['event']:'JuneteenthConf 2026' AND status:'succeeded'`,
      limit: 100,
    };
    if (startingAfter) params.page = startingAfter;

    const result = await stripe.paymentIntents.search(params);
    count += result.data.length;
    hasMore = result.has_more;
    if (hasMore && result.data.length > 0) {
      startingAfter = result.next_page;
    }
  }

  return count;
}

module.exports = async function (context, req) {
  if (req.method !== 'POST') {
    context.res = { status: 405, body: 'Method Not Allowed' };
    return;
  }

  const { amount, name, email, tshirtSize, scholarshipTickets, contribution, promoCode } = req.body || {};

  // Determine base price
  const now = new Date();
  const isStudentPromo = promoCode === STUDENT_CODE && typeof email === 'string' && email.toLowerCase().endsWith('.edu');
  const isSaleActive = now < SALE_ENDS;

  let basePrice;
  let priceType;
  if (isStudentPromo) {
    basePrice = 25;
    priceType = 'student';
  } else if (isSaleActive) {
    basePrice = 50;
    priceType = 'sale';
  } else {
    basePrice = 75;
    priceType = 'standard';
  }

  const minAmount = basePrice + (Number(scholarshipTickets || 0) * 75);

  if (!amount || amount < minAmount) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid amount' }),
    };
    return;
  }

  // Check ticket cap
  try {
    const sold = await getSoldCount();
    if (sold >= TICKET_CAP) {
      context.res = {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'SOLD_OUT' }),
      };
      return;
    }
  } catch (err) {
    // If count check fails, log but don't block purchase
    context.log.warn('Ticket count check failed:', err.message);
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
        priceType,
        promoCode: promoCode || '',
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
