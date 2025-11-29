const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

// Only essential sizes for favicon (reduced to avoid build issues)
const sizes = [16, 32, 48];
const inputSvg = path.join(__dirname, '../public/icon.svg');
const outputIco = path.join(__dirname, '../public/favicon.ico');

async function createFavicon() {
  try {
    console.log('Converting SVG to PNG at multiple sizes...');
    
    // Convert SVG to PNGs at different sizes
    const pngBuffers = await Promise.all(
      sizes.map(async (size) => {
        const buffer = await sharp(inputSvg)
          .resize(size, size)
          .png()
          .toBuffer();
        console.log(`✓ Created ${size}x${size} PNG`);
        return buffer;
      })
    );

    console.log('Bundling PNGs into ICO file...');
    
    // Convert PNGs to ICO
    const icoBuffer = await toIco(pngBuffers);
    
    // Write ICO file
    fs.writeFileSync(outputIco, icoBuffer);
    
    console.log(`✓ Successfully created ${outputIco}`);
    console.log(`  File size: ${(icoBuffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('Error creating favicon:', error);
    process.exit(1);
  }
}

createFavicon();

