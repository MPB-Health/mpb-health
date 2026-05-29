#!/usr/bin/env node
/**
 * Build-time image optimization script.
 * Generates WebP variants of all JPG/PNG images in public/assets/.
 * Compresses originals in-place where significant savings are possible.
 *
 * Run: node scripts/optimize-images.mjs
 * Add to build: "prebuild": "node scripts/optimize-images.mjs"
 */
import { readdir, stat, mkdir } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { existsSync } from 'fs';

const ASSETS_DIR = new URL('../public/assets', import.meta.url).pathname;
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 65;
const MAX_WIDTH = 1920;
const RESPONSIVE_WIDTHS = [640, 1024, 1536];

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('⚠️  sharp not installed — skipping image optimization.');
  console.log('   Install with: pnpm add -D sharp');
  process.exit(0);
}

async function getImageFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getImageFiles(fullPath)));
    } else if (SUPPORTED_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const name = basename(filePath, ext);
  const dir = dirname(filePath);
  const webpPath = join(dir, `${name}.webp`);
  const stats = await stat(filePath);
  const originalSize = stats.size;

  // Skip tiny files
  if (originalSize < 10_000) return null;

  // Skip if WebP already exists and is newer
  if (existsSync(webpPath)) {
    const webpStats = await stat(webpPath);
    if (webpStats.mtimeMs >= stats.mtimeMs) return null;
  }

  const image = sharp(filePath);
  const metadata = await image.metadata();

  // Resize if wider than max
  const resizeOpts = metadata.width > MAX_WIDTH ? { width: MAX_WIDTH } : {};

  // Generate WebP
  await image
    .resize(resizeOpts)
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(webpPath);

  const webpStats = await stat(webpPath);
  const savings = ((1 - webpStats.size / originalSize) * 100).toFixed(1);

  // Generate responsive variants for large images (> 200KB)
  if (originalSize > 200_000) {
    for (const width of RESPONSIVE_WIDTHS) {
      if (metadata.width && width < metadata.width) {
        const responsivePath = join(dir, `${name}-${width}w.webp`);
        if (!existsSync(responsivePath)) {
          await sharp(filePath)
            .resize({ width })
            .webp({ quality: WEBP_QUALITY, effort: 4 })
            .toFile(responsivePath);
        }
      }
    }
  }

  return {
    file: basename(filePath),
    originalKB: (originalSize / 1024).toFixed(0),
    webpKB: (webpStats.size / 1024).toFixed(0),
    savings: `${savings}%`,
  };
}

async function main() {
  if (!existsSync(ASSETS_DIR)) {
    console.log('ℹ️  No assets directory found, skipping.');
    return;
  }

  console.log('🖼️  Optimizing images...\n');
  const files = await getImageFiles(ASSETS_DIR);
  console.log(`   Found ${files.length} images to process.\n`);

  const results = [];
  for (const file of files) {
    try {
      const result = await optimizeImage(file);
      if (result) results.push(result);
    } catch (err) {
      console.warn(`   ⚠️  Failed: ${basename(file)} — ${err.message}`);
    }
  }

  if (results.length === 0) {
    console.log('   ✓ All images already optimized.\n');
    return;
  }

  console.log('   Results:');
  console.log('   ' + '-'.repeat(60));
  for (const r of results) {
    console.log(`   ${r.file.padEnd(40)} ${r.originalKB}KB → ${r.webpKB}KB (${r.savings})`);
  }

  const totalOriginal = results.reduce((s, r) => s + parseInt(r.originalKB), 0);
  const totalWebp = results.reduce((s, r) => s + parseInt(r.webpKB), 0);
  console.log('   ' + '-'.repeat(60));
  console.log(`   Total: ${totalOriginal}KB → ${totalWebp}KB (${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}% saved)\n`);
}

main().catch(console.error);
