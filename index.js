const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

app.post('/submit', async (req, res) => {
  const { name, email, phone } = req.body;

  console.log("➡️ New request received:", { name, email, phone });

  if (!name || !email || !phone) {
    console.log("❌ Missing fields");
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

    // Wait for form elements to load
    await page.waitForSelector('input[placeholder="First name..."]');
    await page.waitForSelector('input[placeholder="Email..."]');
    await page.waitForSelector('input[placeholder="Enter phone number..."]');
    await page.waitForSelector('#register_btn');

    console.log("✍️ Typing into fields...");
    await page.type('input[placeholder="First name..."]', name);
    await page.type('input[placeholder="Email..."]', email);
    await page.type('input[placeholder="Enter phone number..."]', phone);

    console.log("🖱 Clicking the register button...");
    await page.click('#register_btn');

    // Replaced page.waitForTimeout with safe version
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
    console.log("✅ Form submitted successfully");
    res.send('✅ Success');
  } catch (err) {
    await browser.close();
    console.error("❌ Puppeteer error:", err.message);
    res.status(500).send('❌ Internal Server Error: ' + err.message);
  }
});

app.get('/', (req, res) => res.send('🟢 WebinarJam bot is running.'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
