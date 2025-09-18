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
        const form = formidable({
            multiples: false,
            keepExtensions: true,
            uploadDir: imagesDirectory,
            filename: (name, ext, part, form) => {
                const extension = ext || path.extname(name || "");
                const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}${extension}`;
                return uniqueName;
            },
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return reject(err);
            }

            try {
                let fileCandidate = files.file || files.image || Object.values(files || {})[0];
                if (Array.isArray(fileCandidate)) {
                    fileCandidate = fileCandidate[0];
                }

                if (!fileCandidate) {
                    return resolve({ fields, image: null });
                }

                const storedPath = fileCandidate.filepath || fileCandidate.path;
                const filename = path.basename(storedPath);
                const destinationPath = path.join(imagesDirectory, filename);

                if (!storedPath) {
                    return reject(new TypeError("Upload did not produce a stored file path"));
                }

                resolve({
                    fields,
                    image: {
                        filename,
                        path: destinationPath,
                        url: `https://5acb86c813d9.ngrok-free.app/images/${filename}`,
                    },
                });
            } catch (copyErr) {
                reject(copyErr);
            }
        });
    });
}
