
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import notFound from "./middleware/notFound.middleware.js";
import errorHandler from "./middleware/error.middleware.js";
import articleRoutes from "./routes/article.routes.js";
import userRoutes from "./routes/user.routes.js"

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "News CMS backend is running"
  });
});

// API routes
app.use("/api", apiRoutes);
app.use("/api/journalist", apiRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);


// Handle unknown routes
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

export default app;
