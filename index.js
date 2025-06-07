const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

app.post('/submit', async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) return res.status(400).send('Missing required fields');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await page.goto('https://event.webinarjam.com/login/8m266cnlc00s52cosv', {
      waitUntil: 'networkidle2'
    });

    await page.type('input[placeholder="Enter the webinar room"]', name);
    await page.type('input[type="email"]', email);
    await page.type('input[type="tel"]', phone);

    await page.click('button');
    await page.waitForTimeout(3000); // simulate wait after submit

    await browser.close();
    res.send('✅ Success');
  } catch (err) {
    await browser.close();
    res.status(500).send('❌ Error: ' + err.message);
  }
});

app.get('/', (req, res) => res.send('🟢 WebinarJam bot is running.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
