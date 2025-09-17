import express from "express";
import fetch from "node-fetch";
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
        res.status(201).send({ message: "Post has been stored" });
    }
});

export { router as addPostRouter };
