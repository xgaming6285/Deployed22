// Load environment variables first
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fileUpload = require("express-fileupload");

// Import routes
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const leadRoutes = require("./routes/leads");
const userRoutes = require("./routes/users");
const landingRoutes = require("./routes/landing");
const agentRoutes = require("./routes/agents");
const clientNetworkRoutes = require("./routes/clientNetworks");
const clientBrokerRoutes = require("./routes/clientBrokers");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Set trust proxy to fix express-rate-limit issue behind a proxy
// For Render and other cloud platforms, always trust the first proxy
app.set("trust proxy", 1);

// Database connection
mongoose.connect(
  process.env.MONGODB_URI ||
  "mongodb+srv://dani034406:Daniel6285@cluster0.g0vqepz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 60000,
    family: 4,
    maxPoolSize: 50,
    minPoolSize: 10,
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: 30000,
    compressors: "zlib",
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Security middleware
app.use(helmet());

// Rate limiting - Temporarily disabled for debugging
// const limiter = rateLimit({
//   windowMs: process.env.NODE_ENV === 'production'
//     ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000 // 15 minutes in production
//     : 1 * 60 * 1000, // 1 minute in development
//   max: process.env.NODE_ENV === 'production'
//     ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // 100 requests per window in production
//     : 1000, // 1000 requests per window in development
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api/', limiter);

// CORS configuration - Simplified and more permissive for Vercel
const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS request from origin:", origin);
    console.log("CORS_ORIGIN env var:", process.env.CORS_ORIGIN);

    // Always allow Vercel domains
    if (
      !origin ||
      origin.includes(".vercel.app") ||
      origin.includes("ftd-omega.vercel.app")
    ) {
      console.log("CORS: Allowing Vercel domain or no origin");
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      console.log("CORS: Allowing localhost");
      return callback(null, true);
    }

    // Check environment variable
    const allowedOrigins = (process.env.CORS_ORIGIN || "")
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o);
    if (allowedOrigins.includes(origin)) {
      console.log("CORS: Allowing origin from env variable");
      return callback(null, true);
    }

    console.log("CORS: Blocking origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.method === "DELETE") {
    // Ensure the raw body is parsed for DELETE requests
    express.json({ limit: "10mb" })(req, res, next);
  } else {
    next();
  }
});

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    useTempFiles: false, // Store files in memory instead of temp files
    abortOnLimit: true, // Return 413 when file is too large
    responseOnLimit: "File size limit has been reached",
    debug: true, // Enable debug mode
  })
);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/landing", landingRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/client-networks", clientNetworkRoutes);
app.use("/api/client-brokers", clientBrokerRoutes);

// Import health check route
const healthRoutes = require("./routes/health");

// Health check endpoint
app.use("/api/health", healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close();
  });
});

module.exports = app;
