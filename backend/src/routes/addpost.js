import express from "express";
import fetch from "node-fetch";
import webpush from "web-push";
import { processUpload } from "../services/uploadService.js";
const router = express.Router();
router.post("/api/add-post", async (req, res) => {
    console.log("[Backend]: Request received");

    try {
        const { fields, image } = await processUpload(req);

        const payload = {
            ...fields,
            image: image ? image.url : undefined,
        };

        let result = await fetch(process.env.firebase_url + "/posts.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        console.log("[Backend]: Firebase called");
        if (result.ok) {
            console.log("[Backend]: Result is OK");
            webpush.setVapidDetails("mailto:valentine.oleynik@gmail.com", process.env.vapid_pub_key, process.env.vapid_private_key);
            let subs_result = await fetch(process.env.firebase_url + "/subscriptions.json");
            let subs = await subs_result.json();
            Object.values(subs).forEach((sub) => {
                let pushConfig = {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.keys.auth,
                        p256dh: sub.keys.p256dh,
                    },
                };
                try {
                    webpush.sendNotification(pushConfig, JSON.stringify({ title: "New Post", content: "New Post Added!", openUrl: "/insta-pwa/help" }));
                } catch (error) {
                    console.log("Error sending pushes: ", error);
                }
            });
            res.status(201).send({ message: "Post has been stored", image: image ? image.url : null });
        } else {
            const text = await result.text();
            res.status(500).send({ message: "Failed to store post", details: text });
        }
    } catch (error) {
        console.error("[Backend]: Upload error", error);
        res.status(400).send({ message: "Invalid form upload", error: String(error) });
    }
});

export { router as addPostRouter };
