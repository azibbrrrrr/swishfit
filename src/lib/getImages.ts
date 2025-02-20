import fs from 'fs';
import path from 'path';

export function getAboutImages() {
  const imagesDir = path.join(process.cwd(), 'public/images/about');
  const imageFiles = fs.readdirSync(imagesDir);
  return imageFiles.map(file => `/images/about/${file}`);
}
