/*
  Generate notification icons from public/logo.svg with a black background (#000000),
  centered logo, keeping proportions, and optimized PNG output under 50KB.
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const logoSvgPath = path.join(projectRoot, 'public', 'logo.svg');
const outDir = path.join(projectRoot, 'public', 'icons');

const targets = [
  { width: 192, height: 192, filename: 'notification-icon-192x192.png', scale: 0.62 },
  { width: 72, height: 72, filename: 'notification-badge-72x72.png', scale: 0.60 },
];

async function ensureOutDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generateIcon({ width, height, filename, scale }) {
  const svgBuffer = await fs.promises.readFile(logoSvgPath);

  // Render the SVG scaled to fit within the target canvas
  const maxLogoSize = Math.round(Math.min(width, height) * scale);
  const logoPng = await sharp(svgBuffer)
    .resize({ width: maxLogoSize, height: maxLogoSize, fit: 'contain' })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  // Create black background and composite the logo centered
  const outputPath = path.join(outDir, filename);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: logoPng, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);

  const stats = await fs.promises.stat(outputPath);
  console.log(`Generated ${filename} (${stats.size} bytes)`);
}

async function main() {
  try {
    await ensureOutDir(outDir);
    for (const t of targets) {
      await generateIcon(t);
    }
    console.log('✅ Notification icons generated successfully.');
  } catch (err) {
    console.error('❌ Failed to generate notification icons:', err);
    process.exit(1);
  }
}

main();

