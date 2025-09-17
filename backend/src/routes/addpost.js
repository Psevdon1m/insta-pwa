import express from "express";
import fetch from "node-fetch";
import webpush from "web-push";
const router = express.Router();
router.post("/api/add-post", async (req, res) => {
    console.log("[Backend]: Request received");

    let result = await fetch(process.env.firebase_url + "/posts.json", {
        method: "POST",
        body: JSON.stringify(req.body),
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
                webpush.sendNotification(pushConfig, JSON.stringify({ title: "New Post", content: "New Post Added!" }));
            } catch (error) {
                console.log("Error sending pushes: ", error);
            }
        });

        res.status(201).send({ message: "Post has been stored" });
    }
});

export { router as addPostRouter };
