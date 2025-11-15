// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectMongoDB } from "./mongo";
import rutasAuth from "./routes/auth";
import rutasComics from "./routes/comics";
import path from "path";

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});

const app = express();
const PORT = process.env.PORT ?? 3000;


app.use(cors());
app.use(express.json());


app.use("/auth", rutasAuth);
app.use("/comics", rutasComics);


app.get("/", (_req, res) => {
    res.json({ message: "Welcome budda to the COMICS API" });
});


app.use((_req, res) => {
    res.status(404).json({ error: "Ruta not found" });
});


const start = async () => {
    try {
        await connectMongoDB();
        app.listen(PORT, () => {
            console.log(`COMIC API listening http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Brokie:", error);
    }
};

start();
