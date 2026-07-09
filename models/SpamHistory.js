import mongoose from "mongoose";

const spamHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        subject: {
            type: String,
            default: "(No Subject)"
        },
        content: {
            type: String,
            required: [true, "Email content is required"]
        },
        prediction: {
            type: String,
            enum: ["spam", "ham"],
            required: true
        },
        probability: {
            type: Number,
            required: true
        },
        method: {
            type: String,
            enum: ["text", "file"],
            default: "text"
        },
        fileName: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

const SpamHistory = mongoose.model("SpamHistory", spamHistorySchema);

export default SpamHistory;
