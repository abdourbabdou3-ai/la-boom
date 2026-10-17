import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDirectory = path.join(projectRoot, "صور الفيديو الاول");
const outputDirectory = path.join(projectRoot, "dist", "build-your-look-frames");

const sourceFiles = await readdir(sourceDirectory);
const frameFiles = sourceFiles.filter((file) => /\.(jpe?g|png|webp|gif)$/i.test(file));

if (frameFiles.length === 0) {
  throw new Error(`No image frames found in: ${sourceDirectory}`);
}

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  frameFiles.map((file) =>
    cp(
      path.join(sourceDirectory, file),
      path.join(outputDirectory, file),
    ),
  ),
);

console.log(`Copied ${frameFiles.length} frames successfully.`);
