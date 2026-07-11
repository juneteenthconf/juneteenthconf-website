const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { Resend } = require("resend");

initializeApp();
const db = getFirestore();

// HTML email template with branded dark/red/gold themes
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email — Juneteenth Conference</title>
  <style>
    body {
      margin: 0; padding: 0; background-color: #1a1520; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f0ede6;
    }
    table { border-collapse: collapse; }
    .email-wrapper { width: 100%; background-color: #1a1520; padding: 40px 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #231c2d; border: 1px solid rgba(212, 168, 67, 0.15); border-radius: 12px; overflow: hidden; }
    .header-banner { background: linear-gradient(135deg, #2d2438 0%, #1a1520 100%); padding: 32px; text-align: center; border-bottom: 2px solid #c84342; }
    .logo-img { height: 44px; width: auto; }
    .content-body { padding: 40px 32px; }
    .welcome-text { font-size: 16px; line-height: 1.6; color: rgba(240, 237, 230, 0.7); margin-top: 0; }
    .headline { font-size: 24px; font-weight: 700; color: #D4A843; margin-bottom: 24px; letter-spacing: 0.5px; }
    .code-container { text-align: center; margin: 36px 0; padding: 24px; background-color: rgba(212, 168, 67, 0.05); border: 1px dashed rgba(212, 168, 67, 0.3); border-radius: 8px; }
    .verification-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; letter-spacing: 6px; color: #c84342; margin: 0; display: inline-block; }
    .code-hint { font-size: 13px; color: rgba(240, 237, 230, 0.4); margin-top: 12px; margin-bottom: 0; }
    .footer { background-color: #1c1624; padding: 24px 32px; text-align: center; border-top: 1px solid rgba(240, 237, 230, 0.05); }
    .footer-text { font-size: 12px; color: rgba(240, 237, 230, 0.3); line-height: 1.6; margin: 0; }
    .footer-links { margin-top: 16px; }
    .footer-links a { color: #D4A843; text-decoration: none; font-size: 12px; margin: 0 8px; }
    .accent-bar { height: 4px; background: linear-gradient(90deg, #c84342 0%, #D4A843 50%, #55ac64 100%); }
  </style>
</head>
<body>
  <div class="accent-bar"></div>
  <table role="presentation" class="email-wrapper">
    <tr>
      <td>
        <div class="email-container">
          <div class="header-banner">
            <img class="logo-img" src="https://juneteenthconf.com/logo-white.png" alt="Juneteenth Conference Logo" />
          </div>
          <div class="content-body">
            <h1 class="headline">Verify your subscription</h1>
            <p class="welcome-text">Hello {{firstName}},</p>
            <p class="welcome-text">Thank you for joining the Juneteenth Conference community! To complete your subscription and verify your email address, please enter the following 6-digit verification code on the registration page:</p>
            
            <div class="code-container">
              <div class="verification-code">{{code}}</div>
              <p class="code-hint">This code is valid for 15 minutes.</p>
            </div>
            
            <p class="welcome-text">If you did not initiate this request, you can safely ignore this email.</p>
            <p class="welcome-text" style="margin-bottom: 0;">In solidarity,<br/><strong>The JuneteenthConf Team</strong></p>
          </div>
          <div class="footer">
            <p class="footer-text">June 19–20, 2026 • Chicago, IL</p>
            <p class="footer-text" style="margin-top: 4px;">Fiscally sponsored by YPOC Harrisburg (501(c)(3))</p>
            <div class="footer-links">
              <a href="https://juneteenthconf.com">Website</a>
              <a href="https://juneteenthconf.com/privacy">Privacy Policy</a>
              <a href="mailto:info@juneteenthconf.com">Contact Support</a>
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Basic email syntax validation
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * 1. Subscribe endpoint: Generates verification code, saves in Firestore, and sends via Resend.
 */
exports.subscribe = onRequest({ cors: true, secrets: ["RESEND_API_KEY"] }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, firstName, lastName } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = typeof firstName === 'string' ? firstName.trim() : "";
    const cleanLastName = typeof lastName === 'string' ? lastName.trim() : "";

    // Generate a secure 6-digit numeric verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Expiry in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save/Overwrite pending subscription in Firestore
    await db.collection("pending_subscriptions").doc(cleanEmail).set({
      email: cleanEmail,
      code: verificationCode,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      verified: false
    });

    // Check Resend configuration
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        const emailHtml = EMAIL_TEMPLATE
          .replace("{{firstName}}", cleanFirstName || "there")
          .replace("{{code}}", verificationCode);

        const email = {
          from: "JuneteenthConf <info@juneteenthconf.com>",
          to: cleanEmail,
          subject: `${verificationCode} is your JuneteenthConf subscription verification code`,
          html: emailHtml
        }


        const { data, error } = await resend.emails.send(email);

        if (error) {
          console.error("[RESEND ERROR] Failed to send email via Resend:", error);
          return res.status(500).json({ error: "Failed to dispatch verification email." });
        }

        console.log(`Result from resend: ${data}`);

        console.log(`[RESEND] Sent subscription code successfully to ${cleanEmail}`);
      } catch (emailErr) {
        console.error("[RESEND ERROR] Failed to send email via Resend:", emailErr.message);
        return res.status(500).json({ error: "Failed to dispatch verification email." });
      }
    } else {
      // Graceful fallback for local development & emulators
      console.log("\n==================================================");
      console.log(`[DEV FALLBACK] No RESEND_API_KEY configured.`);
      console.log(`Email: ${cleanEmail}`);
      console.log(`First Name: ${cleanFirstName}`);
      console.log(`Last Name: ${cleanLastName}`);
      console.log(`Verification Code: ${verificationCode}`);
      console.log("==================================================\n");
    }

    return res.status(200).json({ success: true, message: "Verification code dispatched." });

  } catch (error) {
    console.error("[SUBSCRIBE ERROR] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error during subscription initiation." });
  }
});

/**
 * 2. Verify endpoint: Checks code and forwards registration payload to Mailchimp.
 */
exports.verify = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, code } = req.body || {};

    if (!isValidEmail(email) || !code || typeof code !== 'string') {
      return res.status(400).json({ error: "Valid email and verification code are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Query pending subscription in Firestore
    const docRef = db.collection("pending_subscriptions").doc(cleanEmail);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "No pending subscription found for this email address." });
    }

    const data = docSnap.data();

    // Verify code
    if (data.code !== cleanCode) {
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    // Verify expiration
    const expiryDate = data.expiresAt.toDate();
    if (Date.now() > expiryDate.getTime()) {
      return res.status(410).json({ error: "This verification code has expired. Please request a new one." });
    }

    // Check if already verified
    if (data.verified) {
      return res.status(400).json({ error: "This email address is already verified and subscribed." });
    }

    // Double opt-in succeeded!
    console.log(`[VERIFY SUCCESS] ${cleanEmail} has successfully verified their email!`);

    // Submit payload to Mailchimp's public form subscription handler
    try {
      const formParams = new URLSearchParams({
        EMAIL: cleanEmail,
        FNAME: data.firstName || '',
        LNAME: data.lastName || '',
        b_07ef187a16bc5cd4f2375c824_4d06862da4: '', // Honeypot remains empty
        subscribe: "Subscribe"
      });

      console.log(`[MAILCHIMP] Forwarding payload to Mailchimp form handler...`);

      const mcResponse = await fetch("https://juneteenthconf.us10.list-manage.com/subscribe/post?u=07ef187a16bc5cd4f2375c824&id=4d06862da4", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: formParams.toString()
      });

      console.log(`[MAILCHIMP RESPONSE] Status: ${mcResponse.status}`);
    } catch (mcErr) {
      // Log Mailchimp failures but don't crash our success response (verified on our end)
      console.error("[MAILCHIMP FORWARD ERROR] Failed to push to Mailchimp:", mcErr.message);
    }

    // Mark as verified in Firestore
    await docRef.update({
      verified: true
    });

    return res.status(200).json({ success: true, message: "Subscription verified and added successfully!" });

  } catch (error) {
    console.error("[VERIFY ERROR] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error during email verification." });
  }
});
