// src/mongo.ts
import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});

let client: MongoClient;
let dB: Db;

const dbName = process.env.DB_NAME ?? "comicvaultdb";

export const connectMongoDB = async (): Promise<void> => {
    try {
        const { USER_MONGO, USER_PASSWORD, MONGO_CLUSTER, MONGO_APP_NAME } = process.env;

        if (!USER_MONGO || !USER_PASSWORD || !MONGO_CLUSTER || !MONGO_APP_NAME) {
            console.error("Missing variables", {
                USER_MONGO,
                MONGO_CLUSTER,
                MONGO_APP_NAME
            });
            throw new Error("Config not complete");
        }

        const mongoUrl = `mongodb+srv://${USER_MONGO}:${USER_PASSWORD}@${MONGO_CLUSTER}.mongodb.net/?appName=${MONGO_APP_NAME}`;

        client = new MongoClient(mongoUrl);
        await client.connect();
        dB = client.db(dbName);
        console.log("Connected blud " + dbName);
    } catch (error) {
        console.log("Error mongo: ", error);
    }
};

export const getDb = (): Db => dB;
