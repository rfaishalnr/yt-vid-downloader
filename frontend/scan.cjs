const fs = require('fs');
const jsQR = require('jsqr');
const PNG = require('pngjs').PNG;

function scan() {
  const buffer = fs.readFileSync('src/assets/qris.png');
  const png = PNG.sync.read(buffer);
  
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  
  if (code) {
    console.log("QR Code Content:", code.data);
  } else {
    console.log("Failed to scan QR code");
  }
}

scan();
