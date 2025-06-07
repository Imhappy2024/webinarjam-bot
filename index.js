const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

app.post('/submit', async (req, res) => {
  const { name, email, phone } = req.body;

  console.log("➡️ New request received:", { name, email, phone });

  // Check if required fields are present
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
      waitUntil: 'networkidle2',
    });

    // Wait for form fields
    await page.waitForSelector('input[placeholder="Enter the webinar room"]');
    await page.waitForSelector('input[type="email"]');
    await page.waitForSelector('input[type="tel"]');
    await page.waitForSelector('button');

    console.log("✍️ Typing values...");

    await page.type('input[placeholder="Enter the webinar room"]', name);
    await page.type('input[type="email"]', email);
    await page.type('input[type="tel"]', phone);

    console.log("🖱 Clicking Enter button...");
    await page.click('button');

    // Wait to simulate success
    await page.waitForTimeout(3000);

    await browser.close();
    console.log("✅ Submitted successfully");
    res.send('✅ Success');
  } catch (err) {
    await browser.close();
    console.error("❌ Puppeteer error:", err);
    res.status(500).send('❌ Internal Server Error: ' + err.message);
  }
});

app.get('/', (req, res) => res.send('🟢 WebinarJam bot is running.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
