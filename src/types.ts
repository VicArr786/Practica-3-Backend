// types.ts
import type { ObjectId } from "mongodb";
import type { Request } from "express";

export type User = {
    _id?: ObjectId;
    name: string;
    password: string;
};


export type ComicStatus = "read" | "pending";

export type Comic = {
    _id?: ObjectId;
    title: string;
    author: string;
    year: number;
    publisher?: string;
    userId: string;
    status?: ComicStatus;
};

export type TokenPayload = {
    userId: string;
};

export interface AuthRequest extends Request {
    userId?: string;
}
