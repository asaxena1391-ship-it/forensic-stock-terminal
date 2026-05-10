const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Terminal Engine Online. Use /api/analyze/TICKER');
});

app.get('/api/analyze/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        const url = `https://www.screener.in/company/${ticker}/`;

        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);

        // IMPROVED SELECTORS
        const price = $('.top-ratios li:contains("Current Price") .number').text().trim();
        const roce = parseFloat($('.top-ratios li:contains("ROCE") .number').text()) || 0;
        const debtToEquity = parseFloat($('.top-ratios li:contains("Debt to equity") .number').text()) || 0;
        const salesGrowth = parseFloat($('.top-ratios li:contains("Sales growth") .number').text()) || 0;
        const promoterHolding = parseFloat($('.top-ratios li:contains("Promoter holding") .number').text()) || 0;

        // ADVANCED FORENSIC LOGIC
        let forensicStatus = "NEUTRAL";
        if (debtToEquity < 0.3 && promoterHolding > 50) forensicStatus = "PASS (Strong Balance Sheet)";
        if (debtToEquity > 1.2) forensicStatus = "FAIL (High Leverage)";

        // MULTIBAGGER CHECK (ROCE > 20% & Growth > 15%)
        const isMultibagger = (roce > 20 && salesGrowth > 15) ? "HIGH POTENTIAL" : "STABLE/WATCH";

        res.json({
            ticker,
            currentPrice: `₹${price}`,
            metrics: { 
                roce: `${roce}%`, 
                debtToEquity, 
                salesGrowth: `${salesGrowth}%`,
                promoterHolding: `${promoterHolding}%`
            },
            analysis: { forensicStatus, isMultibagger },
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live` ));
