const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcImage = path.join(__dirname, '../src/assets/images/app_icon_512_1788206878135.jpg');
const publicIconsDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-180x180.png', size: 180 },
  { name: 'icon-167x167.png', size: 167 },
];

async function generate() {
  console.log('Generating icons from:', srcImage);

  for (const item of sizes) {
    const dest = path.join(publicIconsDir, item.name);
    await sharp(srcImage)
      .resize(item.size, item.size, { fit: 'cover' })
      .png({ quality: 100 })
      .toFile(dest);
    console.log(`Created: ${dest} (${item.size}x${item.size})`);
  }

  // Also root fallbacks for legacy/PWA root paths
  await sharp(srcImage).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(srcImage).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(srcImage).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(srcImage).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(srcImage).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
