import User from "../models/User.js";
import SpamHistory from "../models/SpamHistory.js";
import axios from "axios";

/**
 * @desc Get Admin Dashboard Stats
 * @route GET /api/admin/stats
 * @access Private/Admin
 */
export const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalScans = await SpamHistory.countDocuments();
        
        const spamCount = await SpamHistory.countDocuments({ prediction: "spam" });
        const hamCount = await SpamHistory.countDocuments({ prediction: "ham" });
        
        const spamRate = totalScans > 0 ? ((spamCount / totalScans) * 100).toFixed(1) : 0;

        // Daily activity for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyActivity = await SpamHistory.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    spam: { $sum: { $cond: [{ $eq: ["$prediction", "spam"] }, 1, 0] } },
                    ham: { $sum: { $cond: [{ $eq: ["$prediction", "ham"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalScans,
                spamCount,
                hamCount,
                spamRate
            },
            dailyActivity
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc Get All Users
 * @route GET /api/admin/users
 * @access Private/Admin
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc Update User Role
 * @route PUT /api/admin/users/:id/role
 * @access Private/Admin
 */
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!role || !["user", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Valid role (user or admin) is required"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent self-demotion
        if (user._id.toString() === req.user._id.toString() && role === "user") {
            return res.status(400).json({
                success: false,
                message: "You cannot demote yourself from Admin"
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc Delete User
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent self-deletion
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own admin account"
            });
        }

        // Clean up user's spam scan history
        await SpamHistory.deleteMany({ user: user._id });
        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: "User and their scan history deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc Get ML Model Status
 * @route GET /api/admin/ml-status
 * @access Private/Admin
 */
export const getMLStatus = async (req, res) => {
    try {
        const mlServerUrl = process.env.ML_SERVER || "http://localhost:8000";
        const response = await axios.get(`${mlServerUrl}/status`, { timeout: 2000 });
        
        res.status(200).json({
            success: true,
            status: "online",
            modelInfo: response.data
        });
    } catch (error) {
        res.status(200).json({
            success: true,
            status: "offline",
            message: "Python ML Service is currently offline or unreachable."
        });
    }
};

/**
 * @desc Trigger ML Model Retraining
 * @route POST /api/admin/ml-retrain
 * @access Private/Admin
 */
export const triggerMLRetrain = async (req, res) => {
    try {
        const mlServerUrl = process.env.ML_SERVER || "http://localhost:8000";
        const response = await axios.post(`${mlServerUrl}/train`, {}, { timeout: 10000 });
        
        res.status(200).json({
            success: true,
            message: "Retraining request submitted successfully",
            results: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to contact Python ML Service for retraining."
        });
    }
};
