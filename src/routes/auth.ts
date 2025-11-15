import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getDb } from "../mongo";
import type { User, TokenPayload } from "../types";

import path from "path";

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

const usersCollection = () => getDb().collection<User>("users");

// (Opcional) Endpoint de prueba
router.get("/", (_req, res) => {
    res.json({ message: "Ruta /auth workin" });
});

/**
 * POST /auth/register
 */
router.post("/register", async (req, res) => {
    try {
        const { name, password } = req.body as { name?: string; password?: string };
        if (!name || !password) {
            return res.status(400).json({ error: "Tontin they obligatory" });
        }
        const users = usersCollection();
        const exists = await users.findOne({ name });
        if (exists) {
            return res.status(400).json({ error: "Be original blud" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const result = await users.insertOne({ name, password: hashed });
        res.status(201).json({
            message: "It correct YIPPEEEEE",
            userId: result.insertedId.toString()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "It brokie" });
    }
});

/**
 * POST /auth/login
 */
router.post("/login", async (req, res) => {
    try {
        const { name, password } = req.body as { name?: string; password?: string };

        if (!name || !password) {
            return res.status(400).json({ error: "Tontin they obligatory" });
        }

        const users = usersCollection();
        const user = await users.findOne({ name });

        if (!user) {
            return res.status(401).json({ error: "They wrong dummy" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "They wrong dummy" });
        }

        if (!JWT_SECRET) {
            return res.status(500).json({ error: "JWT_SECRET no definido" });
        }

        const payload: TokenPayload = {
            userId: user._id!.toHexString()
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

        res.json({
            message: "YIPEEEEEEEE",
            token,
            userId: payload.userId,
            name: user.name
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "IT BROKIE" });
    }
});

export default router;
