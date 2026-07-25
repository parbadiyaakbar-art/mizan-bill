const fs = require('fs');
const pngToIco = require('png-to-ico');

async function convert() {
  try {
    const buf = await pngToIco('public/temp_icon.png');
    fs.writeFileSync('public/Mizan_Bill_3D_Icon.ico', buf);
    console.log('Conversion successful!');
  } catch (err) {
    console.error('Error converting icon:', err);
  }
}
convert();
