import fs from "fs";
import path from "path";
import formidable from "formidable";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDirectory = path.resolve(__dirname, "..", "..", "images");

async function ensureImagesDirectoryExists() {
    await fs.promises.mkdir(imagesDirectory, { recursive: true });
}

export async function processUpload(req) {
    await ensureImagesDirectoryExists();

    return new Promise((resolve, reject) => {
        const form = formidable({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return reject(err);
            }

            try {
                const fileCandidate = files.file || files.image || Object.values(files || {})[0];

                if (!fileCandidate) {
                    return resolve({ fields, image: null });
                }

                const tempFilePath = fileCandidate.filepath || fileCandidate.path;
                const originalName = fileCandidate.originalFilename || fileCandidate.name || "upload";
                const extension = path.extname(originalName);
                const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}${extension}`;
                const destinationPath = path.join(imagesDirectory, uniqueName);

                await fs.promises.copyFile(tempFilePath, destinationPath);

                resolve({
                    fields,
                    image: {
                        filename: uniqueName,
                        path: destinationPath,
                        url: `/images/${uniqueName}`,
                    },
                });
            } catch (copyErr) {
                reject(copyErr);
            }
        });
    });
}
