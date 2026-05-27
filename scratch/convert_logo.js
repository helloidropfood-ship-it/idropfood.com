import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/logo.svg');
const pngPath = path.resolve('public/logo.png');

sharp(svgPath)
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('Successfully created logo.png');
  })
  .catch((err) => {
    console.error('Error creating logo.png:', err);
  });
