import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Required to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'src', 'pages.json');

const totalPages = 100;
const itemsPerPage = 40;

const generateRandomItem = (indexOffset, page, index) => {
    const width = Math.floor(Math.random() * 300) + 200;
    const height = Math.floor(Math.random() * 300) + 200;

    return {
        id: uuidv4(),
        width,
        height,
        page: page + 1,
        index,
        src: `https://picsum.photos/id/${indexOffset}/${width}/${height}`,
    };
};

const pages = [];

for (let page = 0; page < totalPages; page++) {
    const pageItems = Array.from({ length: itemsPerPage }, (_, index) =>
        generateRandomItem(page * itemsPerPage + index, page, index)
    );

    pages.push({
        page: page + 1,
        items: pageItems,
    });
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(pages, null, 2));

console.log(`✅ Generated ${totalPages} pages (${itemsPerPage} items each) at ${outputPath}`);
