import axios from "axios";
import fs from "fs";
import csvParser from "readline"; // using readline for file streaming/parsing
import SpamHistory from "../models/SpamHistory.js";

// Helper for heuristic-based fallback prediction (in case Python ML service is offline)
const fallbackPredict = (text) => {
    const spamKeywords = [
        "free", "winner", "win", "lottery", "crypto", "bitcoin", "investment",
        "cash", "money", "claim", "urgent", "action required", "bank account",
        "verify your account", "password reset", "unsecured loan", "mortgage",
        "cheap", "pills", "viagra", "millions", "inheritance", "guaranteed",
        "click here", "subscribe", "limited time", "exclusive deal", "earn",
        "make money", "work from home", "refinance", "rates", "weight loss"
    ];

    const lowerText = text.toLowerCase();
    let matchCount = 0;

    spamKeywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            matchCount += matches.length;
        }
    });

    // Heuristic score
    const spamProbability = Math.min(0.2 + (matchCount * 0.15), 0.95);
    const prediction = spamProbability >= 0.5 ? "spam" : "ham";

    return {
        prediction,
        probability: spamProbability,
        isFallback: true
    };
};

/**
 * @desc Predict Email Spam from Text
 * @route POST /api/spam/predict-text
 * @access Private
 */
export const predictText = async (req, res) => {
    try {
        const { subject, content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Email content is required"
            });
        }

        let predictionResult;

        try {
            // Request to Python ML service
            const mlServerUrl = process.env.ML_SERVER || "http://localhost:8000";
            const response = await axios.post(`${mlServerUrl}/predict`, {
                text: content
            }, { timeout: 3000 }); // 3 second timeout

            predictionResult = {
                prediction: response.data.prediction,
                probability: response.data.probability,
                isFallback: false
            };
        } catch (mlError) {
            console.warn("Python ML server is offline, using regex fallback:", mlError.message);
            predictionResult = fallbackPredict(content);
        }

        // Save to DB history
        const historyEntry = await SpamHistory.create({
            user: req.user._id,
            subject: subject || "(No Subject)",
            content,
            prediction: predictionResult.prediction,
            probability: predictionResult.probability,
            method: "text"
        });

        res.status(200).json({
            success: true,
            data: {
                id: historyEntry._id,
                subject: historyEntry.subject,
                content: historyEntry.content,
                prediction: historyEntry.prediction,
                probability: historyEntry.probability,
                method: historyEntry.method,
                isFallback: predictionResult.isFallback,
                createdAt: historyEntry.createdAt
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
 * @desc Predict Email Spam from Uploaded File (Bulk predictions)
 * @route POST /api/spam/predict-file
 * @access Private
 */
export const predictFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a .csv or .txt file"
            });
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
        const fileContent = fs.readFileSync(filePath, "utf-8");

        let emailsToPredict = [];

        if (fileExtension === "txt") {
            // split by double newlines or single newlines if no double
            const rawBlocks = fileContent.split(/\r?\n\r?\n/);
            rawBlocks.forEach((block, idx) => {
                const cleanBlock = block.trim();
                if (cleanBlock) {
                    emailsToPredict.push({
                        subject: `Uploaded Text Item #${idx + 1}`,
                        content: cleanBlock
                    });
                }
            });
        } else if (fileExtension === "csv") {
            // Simple CSV parser
            const lines = fileContent.split(/\r?\n/);
            if (lines.length > 0) {
                // Parse headers
                const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
                
                // Identify body and subject column indices
                let bodyIdx = headers.findIndex(h => h.includes("content") || h.includes("body") || h.includes("text") || h.includes("mail") || h.includes("message"));
                let subjectIdx = headers.findIndex(h => h.includes("subject") || h.includes("title") || h.includes("topic"));

                if (bodyIdx === -1) {
                    // Fallback to first column as body if headers don't match
                    bodyIdx = 0;
                }

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Simple split that handles quotes loosely
                    const columns = [];
                    let currentVal = "";
                    let inQuotes = false;
                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === "," && !inQuotes) {
                            columns.push(currentVal.trim().replace(/^["']|["']$/g, ""));
                            currentVal = "";
                        } else {
                            currentVal += char;
                        }
                    }
                    columns.push(currentVal.trim().replace(/^["']|["']$/g, ""));

                    const bodyText = columns[bodyIdx];
                    if (bodyText) {
                        const subText = subjectIdx !== -1 && columns[subjectIdx] ? columns[subjectIdx] : `CSV Item #${i}`;
                        emailsToPredict.push({
                            subject: subText,
                            content: bodyText
                        });
                    }
                }
            }
        }

        // Clean up uploaded file from local filesystem
        fs.unlinkSync(filePath);

        if (emailsToPredict.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No email data found in the uploaded file"
            });
        }

        const mlServerUrl = process.env.ML_SERVER || "http://localhost:8000";
        const predictions = [];
        const dbEntries = [];

        // Loop and predict each email
        for (const item of emailsToPredict) {
            let predictionResult;
            try {
                const response = await axios.post(`${mlServerUrl}/predict`, {
                    text: item.content
                }, { timeout: 1500 });

                predictionResult = {
                    prediction: response.data.prediction,
                    probability: response.data.probability,
                    isFallback: false
                };
            } catch (err) {
                predictionResult = fallbackPredict(item.content);
            }

            predictions.push({
                subject: item.subject,
                content: item.content,
                prediction: predictionResult.prediction,
                probability: predictionResult.probability,
                isFallback: predictionResult.isFallback
            });

            dbEntries.push({
                user: req.user._id,
                subject: item.subject,
                content: item.content,
                prediction: predictionResult.prediction,
                probability: predictionResult.probability,
                method: "file",
                fileName: req.file.originalname
            });
        }

        // Bulk insert predictions to MongoDB
        const insertedHistory = await SpamHistory.insertMany(dbEntries);

        res.status(200).json({
            success: true,
            totalScanned: predictions.length,
            spamCount: predictions.filter(p => p.prediction === "spam").length,
            hamCount: predictions.filter(p => p.prediction === "ham").length,
            results: insertedHistory
        });

    } catch (error) {
        // Ensure file is deleted if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc Get Logged-in User's Spam Check History
 * @route GET /api/spam/history
 * @access Private
 */
export const getSpamHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { search, prediction, page = 1, limit = 10 } = req.query;

        // Build query
        const query = { user: userId };

        if (prediction === "spam" || prediction === "ham") {
            query.prediction = prediction;
        }

        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;

        const history = await SpamHistory.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const totalEntries = await SpamHistory.countDocuments(query);

        res.status(200).json({
            success: true,
            count: history.length,
            totalPages: Math.ceil(totalEntries / limit),
            currentPage: parseInt(page),
            totalEntries,
            history
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc Delete a history log
 * @route DELETE /api/spam/history/:id
 * @access Private
 */
export const deleteSpamHistory = async (req, res) => {
    try {
        const logId = req.params.id;
        const userId = req.user._id;

        const log = await SpamHistory.findOne({ _id: logId, user: userId });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: "Log entry not found or unauthorized"
            });
        }

        await log.deleteOne();

        res.status(200).json({
            success: true,
            message: "Scan history entry deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
