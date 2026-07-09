import express from "express";
import {
    predictText,
    predictFile,
    getSpamHistory,
    deleteSpamHistory
} from "../controllers/spamController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/predict-text", protect, predictText);
router.post("/predict-file", protect, upload.single("file"), predictFile);
router.get("/history", protect, getSpamHistory);
router.delete("/history/:id", protect, deleteSpamHistory);

export default router;
