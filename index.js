const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

app.post('/submit', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).send('Missing required fields');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    console.log("🌐 Navigating to WebinarJam...");

    await page.goto('https://event.webinarjam.com/login/8m266cnlc00s52cosv', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for the Turnstile CAPTCHA container to load
    console.log("🧩 Waiting for Turnstile CAPTCHA...");
    await page.waitForSelector('#js-turnstile-captcha', { timeout: 15000 });

    // Wait a few seconds to let Cloudflare auto-solve (if allowed)
    console.log("⏳ Waiting for Turnstile token to auto-resolve...");
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Get the CAPTCHA token from Turnstile
    const token = await page.evaluate(() => {
      return window.turnstile?.getResponse();
    });

    if (!token) {
      throw new Error("❌ CAPTCHA token not found — Cloudflare may be challenging this request.");
    }

    console.log("🔐 CAPTCHA token obtained:", token.slice(0, 10) + "...");

    // Submit the form using JavaScript directly inside the page
    const status = await page.evaluate(async ({ name, email, phone, token }) => {
      const response = await fetch('https://event.webinarjam.com/webinarRegistrations/8m266cnlc00s52cosv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: name,
          email: email,
          phone: phone,
          turnstileToken: token
        })
      });
      return response.status;
    }, { name, email, phone, token });

    await browser.close();

    if (status === 200) {
      console.log(`✅ ${email} registered successfully`);
      res.send('✅ Success');
    } else {
      console.log(`❌ WebinarJam rejected registration. Status: ${status}`);
      res.status(status).send('❌ Submission rejected by WebinarJam');
    }
  } catch (err) {
    await browser.close();
    console.error("❌ Error:", err.message);
    res.status(500).send('❌ Internal Error: ' + err.message);
  }
});

app.get('/', (req, res) => res.send('🟢 WebinarJam bot is running.'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
