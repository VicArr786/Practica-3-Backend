
import dotenv from "dotenv";
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest, TokenPayload } from "../types";

import path from "path";

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.warn("JWT_SECRET no definido");
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as TokenPayload;
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: "Token brokie" });
    }
};
