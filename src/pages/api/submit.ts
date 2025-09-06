export const prerender = false;
import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// ✅ Define the rate limiter outside of handler
const rateLimiter = new RateLimiterMemory({
  points: 5,         // Allow 5 requests
  duration: 60 * 60, // Per hour (3600 seconds)
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // 🛡️ Rate limiting
  try {
    await rateLimiter.consume(clientAddress || 'unknown');
  } catch {
    return new Response('🛑 Too many submissions. Try again later.', { status: 429 });
  }

  const headers = request.headers;

  // 🕵️‍♂️ Basic header & bot detection
  const userAgent = headers.get('user-agent') || '';
  const referer = headers.get('referer') || '';
  const origin = headers.get('origin') || '';

  const isSuspiciousUA = /bot|crawl|spider|curl|wget|python/i.test(userAgent);
  const isInvalidOrigin = !origin?.includes('avainasema.org') && !referer?.includes('avainasema.org');

  if (!userAgent || isSuspiciousUA || isInvalidOrigin) {
    return new Response('🛑 Suspicious activity detected', { status: 403 });
  }

  const data = await request.formData();

  // 🐝 Honeypot field
  if (data.get('syyt')) {
    return new Response('🛑 Bot detected (honeypot)', { status: 400 });
  }

  // 📩 Extract form fields
  const fields = {
    nimi: data.get('nimi'),
    syntymaaika: data.get('syntymaaika'),
    katuosoite: data.get('katuosoite'),
    postinumero: data.get('postinumero'),
    postitoimipaikka: data.get('postitoimipaikka'),
    puhelin: data.get('puhelin'),
    email: data.get('email'),
    ilmoittautunut: data.get('unemployed'),
    vastuuvirkailija: data.get('vastuuvirkailija'),
    workTrial: data.getAll('workTrial').join(', '),
    education: data.get('education'),
    seekingInternship: data.get('seekingInternship'),
    kokemus: data.get('kokemus'),
    kerroitsesta: data.get('kerroitsesta'),
    agreeToTerms: data.get('hyvehdot'),
  };

  // 📧 Email transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: import.meta.env.EMAIL_USER,
      pass: import.meta.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: import.meta.env.EMAIL_USER,
    to: import.meta.env.EMAIL_TO,
    subject: 'Uusi työpajahakemus',
    html: `
      <h2>Työpajahakemus</h2>
      <ul>
        ${Object.entries(fields).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
      </ul>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ success: true, message: 'Hakemus lähetetty!' }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Virhe sähköpostin lähettämisessä.' }), {
      status: 500,
    });
  }
};
