const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/analyze/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        const url = `https://www.screener.in/company/${ticker}/`;

        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(data);

        // Core Scraped Data
        const price = $('.price .number').first().text().trim();
        const roce = parseFloat($('li:contains("ROCE") .number').text()) || 0;
        const debtToEquity = parseFloat($('li:contains("Debt to equity") .number').text()) || 0;
        const salesGrowth = parseFloat($('li:contains("Sales growth") .number').last().text()) || 0;

        // Forensic Logic
        const forensicStatus = debtToEquity < 0.5 ? "PASS (Low Debt)" : (debtToEquity > 1 ? "FAIL (High Debt)" : "NEUTRAL");
        
        // Multibagger Logic: ROCE > 20% & Sales Growth > 15%
        const isMultibagger = (roce > 20 && salesGrowth > 15) ? "High Potential" : "Under Observation";

        res.json({
            ticker,
            currentPrice: price,
            metrics: { roce, debtToEquity, salesGrowth },
            analysis: { forensicStatus, isMultibagger },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stock data." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
