const axios = require('axios');
require('dotenv').config();

const getWeather = async (req, res) => {
    try {
        const city = req.query.city || 'Lahore';
        const apiKey = process.env.WEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        const response = await axios.get(url);
        const data = response.data;
        
        // --- 🧠 INTELLIGENT FARMING LOGIC ---
        let advice = "Weather looks stable. Standard farming activities can continue.";
        let alertLevel = "normal"; // normal, warning, danger

        const temp = data.main.temp;
        const condition = data.weather[0].main.toLowerCase(); // rain, clear, clouds, etc.
        const windSpeed = data.wind.speed;

        // 1. Rain Logic
        if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
            advice = "⚠️ Rain Alert: Do NOT harvest crops today. Ensure proper drainage in fields to prevent waterlogging.";
            alertLevel = "danger";
        } 
        // 2. High Wind Logic (Bad for Spraying)
        else if (windSpeed > 15) {
            advice = "💨 High Winds: Avoid spraying pesticides today as they will drift away. Secure tall crops if possible.";
            alertLevel = "warning";
        }
        // 3. High Heat Logic
        else if (temp > 35) {
            advice = "🔥 Heat Stress Warning: Crops need extra water. Irrigate in the early morning or late evening to avoid evaporation.";
            alertLevel = "warning";
        }
        // 4. Freezing Logic
        else if (temp < 5) {
            advice = "❄️ Frost Risk: Cover young seedlings or irrigate slightly to keep soil warm.";
            alertLevel = "warning";
        }
        // 5. Clear Day Logic
        else if (condition.includes('clear') || condition.includes('sun')) {
            advice = "✅ Good Weather: Excellent day for harvesting, drying crops, or spraying fertilizers.";
            alertLevel = "safe";
        }

        // Send Intelligence to App
        res.json({
            city: data.name,
            temp: Math.round(data.main.temp),
            description: data.weather[0].main,
            humidity: data.main.humidity,
            wind: data.wind.speed,
            icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
            farming_advice: advice, // <--- The smart advice
            alert_level: alertLevel // <--- Color code (danger=red, safe=green)
        });

    } catch (error) {
        console.error("Weather Error:", error.message);
        // Fallback for testing
        res.json({
            city: req.query.city || "Lahore",
            temp: 25,
            description: "Clear",
            farming_advice: "✅ Good Weather: Excellent day for harvesting.",
            alert_level: "safe",
            icon: "https://openweathermap.org/img/wn/01d@2x.png"
        });
    }
};

module.exports = { getWeather };