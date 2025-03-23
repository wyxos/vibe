// scripts/write-cname.js
import { writeFile } from 'fs/promises';

await writeFile('dist/CNAME', 'vue-infinite-masonry.wyxos.com');
console.log('✅ CNAME file written to dist/');
