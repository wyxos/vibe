// scripts/write-cname.js
import { writeFile } from 'fs/promises';

await writeFile('dist/CNAME', 'masonry.wyxos.com');
console.log('✅ CNAME file written to dist/');
