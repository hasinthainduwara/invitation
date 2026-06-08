const fs = require('fs');
const path = require('path');

const fbxPath = path.join(__dirname, '..', 'invitation', 'assets', 'Dragon 2.5_fbx.fbx');

try {
    const data = fs.readFileSync(fbxPath);
    console.log("File loaded, size:", data.length, "bytes");

    // Scan the binary buffer for any ascii string sequences that match common animation names
    const content = data.toString('utf8');
    
    // Scan for all sequences of printable ASCII characters of length 3-30
    const matches = content.match(/[a-zA-Z0-9_\-\s]{3,35}/g) || [];
    
    // Filter out strings that contain animation keywords
    const keywords = ['idle', 'fly', 'flight', 'roar', 'attack', 'scream', 'dracarys', 'shout', 'run', 'walk', 'take', 'hover', 'glide', 'wing', 'breath', 'fire'];
    const candidates = new Set();
    
    for (const match of matches) {
        const lower = match.toLowerCase().trim();
        if (lower.length >= 3 && keywords.some(k => lower.includes(k))) {
            candidates.add(match.trim());
        }
    }
    
    console.log("Animation name candidates found by scanning ascii sequences:");
    console.log(Array.from(candidates));

    // Also look for "AnimStack" structures in binary
    console.log("\nSearching for AnimStack records in binary...");
    let offset = 0;
    while ((offset = data.indexOf(Buffer.from('AnimStack'), offset)) !== -1) {
        console.log(`Found 'AnimStack' keyword at byte offset: ${offset}`);
        
        // Let's print out the surrounding 100 bytes as ASCII to see if the name is near it
        const start = Math.max(0, offset - 50);
        const end = Math.min(data.length, offset + 150);
        const chunk = data.slice(start, end);
        
        // Replace non-printable characters with spaces
        let ascii = '';
        for (let i = 0; i < chunk.length; i++) {
            const char = chunk[i];
            if (char >= 32 && char <= 126) {
                ascii += String.fromCharCode(char);
            } else {
                ascii += '.';
            }
        }
        console.log(`Context: ${ascii}`);
        offset += 9;
    }

} catch (err) {
    console.error("Error reading file:", err);
}
