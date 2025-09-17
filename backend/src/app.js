import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// import routes here
import { addPostRouter } from "./routes/addpost.js";

dotenv.config();

const app = express();

const allowedOrigins = ["https://psevdon1m.github.io", "http://127.0.0.1:8080", "http://localhost:3000", "http://localhost:3001"];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked origin:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

//add routes
app.use(addPostRouter);
export { app };
