import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'diagrams');

const jobs = [
  { svg: 'platform-business-flow.svg', width: 2800 },
  { svg: 'monorepo-technical-map.svg', width: 3000 },
];

for (const { svg, width } of jobs) {
  const svgPath = path.join(outDir, svg);
  const pngPath = path.join(outDir, svg.replace(/\.svg$/i, '.png'));
  const svgSource = fs.readFileSync(svgPath, 'utf8');
  const resvg = new Resvg(svgSource, {
    fitTo: { mode: 'width', value: width },
  });
  const pngData = resvg.render();
  fs.writeFileSync(pngPath, pngData.asPng());
  console.log('Wrote', path.relative(root, pngPath));
}
