const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('Terminal Engine Online.'));

app.get('/api/analyze/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        const url = `https://www.screener.in/company/${ticker}/consolidated/`;

        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const $ = cheerio.load(data);

        // HELPER FUNCTION: Finds a number based on the label text
        const getVal = (label) => {
            return $(`.top-ratios li:contains("${label}") .number`).first().text().trim() || 
                   $(`span:contains("${label}") + span .number`).text().trim() || "0";
        };

        const price = getVal("Current Price");
        const roce = parseFloat(getVal("ROCE")) || 0;
        const debtToEquity = parseFloat(getVal("Debt to equity")) || 0;
        const salesGrowth = parseFloat(getVal("Sales growth")) || 0;
        const promoterHolding = parseFloat(getVal("Promoter holding")) || 0;

        // FORENSIC LOGIC
        let forensicStatus = "NEUTRAL";
        if (debtToEquity < 0.3 && promoterHolding > 40) forensicStatus = "PASS (Strong)";
        if (debtToEquity > 1.0) forensicStatus = "FAIL (High Debt)";

        // MULTIBAGGER CHECK
        const isMultibagger = (roce > 20 && salesGrowth > 12) ? "HIGH POTENTIAL" : "WATCHLIST";

        res.json({
            ticker,
            currentPrice: price ? `₹${price}` : "N/A",
            metrics: { roce: `${roce}%`, debtToEquity, salesGrowth: `${salesGrowth}%`, promoterHolding: `${promoterHolding}%` },
            analysis: { forensicStatus, isMultibagger },
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        });

    } catch (error) {
        res.status(500).json({ error: "Scrape Failed" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Engine running on ${PORT}`));
