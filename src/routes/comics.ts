// src/routes/comics.ts
import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../mongo";
import { verifyToken } from "../middleware/verifyToken";
import type { AuthRequest, Comic, ComicStatus } from "../types";



const router = Router();

const comicsCollection = () => getDb().collection<Comic>("comics");

/**
 * GET /comics
 */
router.get("/", verifyToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.userId!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const title = req.query.title as string | undefined;
        const status = req.query.status as ComicStatus | undefined;

        const filter: Record<string, unknown> = { userId };

        if (title) {
            filter.title = { $regex: title, $options: "i" };
        }

        if (status === "read" || status === "pending") {
            filter.status = status;
        }

        const comicsCol = comicsCollection();

        const total = await comicsCol.countDocuments(filter);
        const comics = await comicsCol
            .find(filter)
            .sort({ year: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        res.json({
            data: comics,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error when readin" });
    }
});

/**
 * POST /comics
 */
router.post("/", verifyToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.userId!;
        const { title, author, year, publisher, status } = req.body as {
            title?: string;
            author?: string;
            year?: number;
            publisher?: string;
            status?: ComicStatus;
        };

        if (!title || !author || typeof year !== "number") {
            return res.status(400).json({
                error: "title, author y year son necesarios blud"
            });
        }

        if (status && status !== "read" && status !== "pending") {
            return res.status(400).json({ error: "status debe ser 'read' o 'pending'" });
        }

        const newComic: Comic = {
            title,
            author,
            year,
            publisher,
            status: status ?? "pending",
            userId
        };

        const comicsCol = comicsCollection();
        const result = await comicsCol.insertOne(newComic);

        res.status(201).json({
            message: "Cómic creado correctamente",
            comicId: result.insertedId.toString()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear el cómic" });
    }
});

/**
 * PUT /comics/:id
 */
router.put("/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID de cómic inválido" });
        }

        const { title, author, year, publisher, status } = req.body as {
            title?: string;
            author?: string;
            year?: number;
            publisher?: string;
            status?: ComicStatus;
        };

        const update: Record<string, unknown> = {};

        if (title !== undefined) update.title = title;
        if (author !== undefined) update.author = author;
        if (year !== undefined) update.year = year;
        if (publisher !== undefined) update.publisher = publisher;
        if (status !== undefined) {
            if (status !== "read" && status !== "pending") {
                return res.status(400).json({ error: "status debe ser 'read' o 'pending'" });
            }
            update.status = status;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ error: "No se han enviado campos para actualizar" });
        }

        const comicsCol = comicsCollection();

        const result = await comicsCol.findOneAndUpdate(
            { _id: new ObjectId(id), userId },
            { $set: update },
            { returnDocument: "after" }
        );

        if (!result.value) {
            return res.status(404).json({ error: "Cómic no encontrado o no pertenece al usuario" });
        }

        res.json({
            message: "Cómic actualizado correctamente",
            comic: result.value
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar el cómic" });
    }
});

/**
 * DELETE /comics/:id
 */
router.delete("/:id", verifyToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID de cómic inválido" });
        }

        const comicsCol = comicsCollection();

        const result = await comicsCol.deleteOne({
            _id: new ObjectId(id),
            userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Cómic no encontrado o no pertenece al usuario" });
        }

        res.json({ message: "Cómic eliminado correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al eliminar el cómic" });
    }
});

/**
 * GET /comics/public
 */
router.get("/public", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const comicsCol = comicsCollection();

        const pipeline = [
            { $group: { _id: "$title", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ];

        const results = await comicsCol.aggregate(pipeline).toArray();

        const populares = results.map((r) => ({
            title: r._id as string,
            count: r.count as number
        }));

        res.json({ data: populares });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener los cómics públicos" });
    }
});

export default router;
