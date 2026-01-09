const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');

const TARGET_URL = 'http://www.amis.pk/daily%20market%20changes.aspx';

// 1. Helper: Get Farmer-Friendly Icons
const getCropImage = (cropName) => {
    const name = cropName.toLowerCase();
    
    // 🟢 Vegetables
    if (name.includes('potato') || name.includes('aloo')) return 'https://cdn-icons-png.flaticon.com/512/1135/1135543.png'; // Potato
    if (name.includes('onion')) return 'https://cdn-icons-png.flaticon.com/512/765/765544.png'; // Onion
    if (name.includes('tomato')) return 'https://cdn-icons-png.flaticon.com/512/1202/1202125.png'; // Tomato
    if (name.includes('garlic')) return 'https://cdn-icons-png.flaticon.com/512/5029/5029236.png'; // Garlic
    if (name.includes('ginger')) return 'https://cdn-icons-png.flaticon.com/512/6003/6003986.png'; // Ginger
    if (name.includes('chilli') || name.includes('mirch')) return 'https://cdn-icons-png.flaticon.com/512/2909/2909848.png'; // Chilli
    if (name.includes('lemon')) return 'https://cdn-icons-png.flaticon.com/512/6866/6866540.png'; // Lemon
    if (name.includes('cucumber')) return 'https://cdn-icons-png.flaticon.com/512/2347/2347069.png'; // Cucumber
    if (name.includes('cabbage')) return 'https://cdn-icons-png.flaticon.com/512/765/765618.png'; // Cabbage
    if (name.includes('cauliflower')) return 'https://cdn-icons-png.flaticon.com/512/2346/2346966.png'; // Cauliflower
    if (name.includes('brinjal') || name.includes('eggplant')) return 'https://cdn-icons-png.flaticon.com/512/765/765580.png'; // Brinjal
    if (name.includes('bitter gourd') || name.includes('karela')) return 'https://cdn-icons-png.flaticon.com/512/5345/5345917.png'; // Bitter Gourd
    if (name.includes('peas')) return 'https://cdn-icons-png.flaticon.com/512/1135/1135574.png'; // Peas

    // 🍎 Fruits
    if (name.includes('apple')) return 'https://cdn-icons-png.flaticon.com/512/415/415682.png'; // Apple
    if (name.includes('banana')) return 'https://cdn-icons-png.flaticon.com/512/2909/2909761.png'; // Banana
    if (name.includes('mango')) return 'https://cdn-icons-png.flaticon.com/512/2909/2909841.png'; // Mango
    if (name.includes('orange') || name.includes('kinnow')) return 'https://cdn-icons-png.flaticon.com/512/135/135620.png'; // Orange
    if (name.includes('grapes')) return 'https://cdn-icons-png.flaticon.com/512/765/765547.png'; // Grapes
    if (name.includes('pomegranate') || name.includes('anar')) return 'https://cdn-icons-png.flaticon.com/512/2909/2909794.png'; // Pomegranate
    if (name.includes('guava')) return 'https://cdn-icons-png.flaticon.com/512/6866/6866524.png'; // Guava

    // 🌾 Grains & Commodities (Corrected)
    if (name.includes('rice')) return 'https://cdn-icons-png.flaticon.com/512/3798/3798482.png'; // ✅ Rice Sack (Not Ice Cream)
    if (name.includes('wheat')) return 'https://cdn-icons-png.flaticon.com/512/600/600507.png'; // ✅ Golden Wheat Stalks
    if (name.includes('sugar')) return 'https://cdn-icons-png.flaticon.com/512/10840/10840789.png'; // ✅ Sugar Sack
    if (name.includes('maize') || name.includes('corn')) return 'https://cdn-icons-png.flaticon.com/512/3225/3225579.png'; // Corn Cob
    if (name.includes('cotton')) return 'https://cdn-icons-png.flaticon.com/512/5052/5052373.png'; // Cotton Plant

    // Default Fallback
    return 'https://cdn-icons-png.flaticon.com/512/740/740935.png';
};

// 2. Helper: Get Category
const getCategory = (cropName) => {
    const name = cropName.toLowerCase();
    
    if (name.includes('apple') || name.includes('banana') || name.includes('mango') || 
        name.includes('orange') || name.includes('grapes') || name.includes('guava') || 
        name.includes('pomegranate') || name.includes('kinnow') || name.includes('fruit')) {
        return 'Fruits';
    }
    
    if (name.includes('wheat') || name.includes('rice') || name.includes('maize') || 
        name.includes('corn') || name.includes('sugar') || name.includes('grain') || name.includes('cotton')) {
        return 'Grains';
    }
    return 'Vegetables';
};

const scrapeMandiRates = async () => {
    let client;
    try {
        console.log("⏳ Fetching Daily Market Changes...");
        const { data } = await axios.get(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(data);
        const table = $('table').filter((i, el) => $(el).text().includes("CityName") || $(el).text().includes("CropName")).first();
        const rows = table.find('tr');

        if (rows.length < 5) throw new Error("Website returned empty table.");
        const collectedRows = [];

        rows.each((index, element) => {
            if (index === 0) return; 
            const tds = $(element).find('td');
            if (tds.length >= 3) {
                let city = $(tds[0]).text().trim();
                const cropName = $(tds[1]).text().trim();
                const priceStr = $(tds[2]).text().trim();

                if (city.toLowerCase().includes('total') || !isNaN(city)) return;
                city = city.replace(/[^a-zA-Z\s]/g, ''); 
                let minPrice = 0, maxPrice = 0;
                if (priceStr && !isNaN(parseFloat(priceStr.replace(/,/g, '')))) {
                    minPrice = parseFloat(priceStr.replace(/,/g, ''));
                    maxPrice = minPrice; 
                }

                if (city.length > 2 && cropName && minPrice > 0) {
                    let trend = 'STABLE';
                    const changeVal = parseFloat($(tds[4]).text().trim());
                    if (changeVal > 0) trend = 'UP';
                    if (changeVal < 0) trend = 'DOWN';

                    const imageUrl = getCropImage(cropName);
                    const category = getCategory(cropName);

                    collectedRows.push({ city, cropName, minPrice, maxPrice, trend, imageUrl, category });
                }
            }
        });

        if (collectedRows.length === 0) return;

        client = await db.pool.connect(); 
        await client.query('BEGIN');
        await client.query('DELETE FROM mandi_rates');

        const values = [];
        const valuePlaceholders = [];
        let paramIndex = 1;

        collectedRows.forEach(row => {
            values.push(row.cropName, row.city, row.minPrice, row.maxPrice, row.trend, row.imageUrl, row.category);
            valuePlaceholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6})`);
            paramIndex += 7;
        });

        const query = `
            INSERT INTO mandi_rates (crop_name, city, min_price, max_price, trend, image_url, category)
            VALUES ${valuePlaceholders.join(', ')}
        `;

        await client.query(query, values);
        await client.query('COMMIT');
        console.log(`✅ Success! Updated ${collectedRows.length} rates with Correct Icons & Categories.`);

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error("❌ Scraper Error:", error.message);
    } finally {
        if (client) client.release();
    }
};

module.exports = scrapeMandiRates;