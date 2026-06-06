/**
 * Standalone QR Code Generator Script
 * 
 * Usage: node generate_qr.js <URL>
 * Example: node generate_qr.js https://prathabhithirtha.vercel.app/invitation/
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Get URL from command line arguments
const url = process.argv[2];

if (!url) {
    console.error("\x1b[31mError: Please provide a URL.\x1b[0m");
    console.log("\nUsage:\n  node generate_qr.js <your-url>\n");
    console.log("Example:\n  node generate_qr.js https://prathabhithirtha.vercel.app/invitation/\n");
    process.exit(1);
}

const size = "400x400"; // High resolution size
const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&margin=10&data=${encodeURIComponent(url)}`;
const outputPath = path.join(__dirname, 'qr_code.png');

console.log(`Generating QR Code for: \x1b[36m${url}\x1b[0m`);
console.log("Requesting QR Code image...");

https.get(apiUrl, (res) => {
    if (res.statusCode !== 200) {
        console.error(`\x1b[31mError: Failed to request QR Code (Status Code: ${res.statusCode})\x1b[0m`);
        return;
    }

    const fileStream = fs.createWriteStream(outputPath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close();
        console.log(`\n\x1b[32m✔ Success! QR Code image successfully generated.\x1b[0m`);
        console.log(`Saved to: \x1b[35m${outputPath}\x1b[0m\n`);
    });
}).on('error', (err) => {
    console.error("\x1b[31mError connecting to the QR Code service:\x1b[0m", err.message);
});
