// File: src/debug-test.js
console.log("🔍 STARTING DEBUG TEST...");

try {
    const mandiRoutes = require('./routes/mandiRoutes');
    console.log("✅ Require Successful.");
    console.log("Type of export:", typeof mandiRoutes);
    console.log("Export contents:", mandiRoutes);

    if (typeof mandiRoutes === 'function') {
        console.log("🎉 SUCCESS: It is a Router function! The code is fine.");
    } else {
        console.log("❌ FAILURE: It is an Object (likely empty). The module.exports line is missing or not running.");
    }
} catch (error) {
    console.log("❌ CRITICAL ERROR:", error.message);
}