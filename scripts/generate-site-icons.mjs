import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = fileURLToPath(new URL("../src/assets/brand/pardofelis.png", import.meta.url));
const output = new URL("../public/", import.meta.url);
const sizes = [16, 32, 48];
const icons = await Promise.all(
  sizes.map(size => sharp(source).resize(size, size).png().toBuffer()),
);

// ICO stores a directory of size-specific images followed by their PNG payloads.
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [index, size] of sizes.entries()) {
  const entry = 6 + index * 16;
  directory[entry] = directory[entry + 1] = size;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(icons[index].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += icons[index].length;
}

await writeFile(new URL("favicon.ico", output), Buffer.concat([directory, ...icons]));
await writeFile(new URL("favicon-32.png", output), icons[1]);

// Home-screen icons need an opaque background and space for the rounded mask.
await sharp(source)
  .resize(152, 152)
  .extend({ top: 14, bottom: 14, left: 14, right: 14, background: "#f7f5f2" })
  .flatten({ background: "#f7f5f2" })
  .png()
  .toFile(fileURLToPath(new URL("apple-touch-icon.png", output)));

console.log("Generated favicon.ico (16/32/48), favicon-32.png and apple-touch-icon.png (180).");
