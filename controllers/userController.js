import SpamHistory from "../models/SpamHistory.js";

/**
 * @desc Get User Dashboard Statistics
 * @route GET /api/users/stats
 * @access Private
 */
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const totalScans = await SpamHistory.countDocuments({ user: userId });
        const spamScans = await SpamHistory.countDocuments({
            user: userId,
            prediction: "spam"
        });
        const hamScans = await SpamHistory.countDocuments({
            user: userId,
            prediction: "ham"
        });

        // Get monthly scan activity for user
        const scanHistory = await SpamHistory.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("subject prediction probability createdAt");

        res.status(200).json({
            success: true,
            stats: {
                totalScans,
                spamScans,
                hamScans,
                spamRate: totalScans > 0 ? ((spamScans / totalScans) * 100).toFixed(1) : 0
            },
            recentActivity: scanHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
