import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Routes imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import spamRoutes from "./routes/spamRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Middleware imports
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Standard Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Security Middlewares
app.use(
    cors({
        origin: "*", // allow all origins for development and ease of hosting
        credentials: true
    })
);

app.use(
    helmet({
        contentSecurityPolicy: false // disable CSP for simplicity of loading external scripts/fonts in frontend
    })
);

// Serve Frontend Static Files
app.use(express.static("public"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/spam", spamRoutes);
app.use("/api/admin", adminRoutes);

// If request does not match any API or Static files, fallback to index.html for single page app routing
app.get(/.*/, (req, res, next) => {
    if (req.url.startsWith("/api")) {
        return next();
    }
    res.sendFile("index.html", { root: "./public" });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
