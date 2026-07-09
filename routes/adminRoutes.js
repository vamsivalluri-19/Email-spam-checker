import express from "express";
import {
    getStats,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getMLStatus,
    triggerMLRetrain
} from "../controllers/adminController.js";
import protect from "../middleware/authMiddleware.js";
import admin from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/stats", protect, admin, getStats);
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/role", protect, admin, updateUserRole);
router.delete("/users/:id", protect, admin, deleteUser);
router.get("/ml-status", protect, admin, getMLStatus);
router.post("/ml-retrain", protect, admin, triggerMLRetrain);

export default router;
