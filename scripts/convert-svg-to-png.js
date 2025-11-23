import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

function convertSvgToPng() {
    const svgPath = path.resolve('public/logo-light.svg');
    const pngPath = path.resolve('public/logo-temp.png');

    // Read SVG content
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Convert SVG to PNG
    const resvg = new Resvg(svgContent, {
        fitTo: {
            mode: 'width',
            value: 512,
        },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`Converted ${svgPath} to ${pngPath}`);
}

convertSvgToPng();

