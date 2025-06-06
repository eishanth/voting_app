const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

// Import database connection
const connectDB = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth");
const pollRoutes = require("./routes/polls");

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cross-Origin-Opener-Policy",
    ],
    exposedHeaders: ["Cross-Origin-Opener-Policy"],
  })
);

// Add security headers to support postMessage in OAuth flow
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Handle preflight requests
app.options(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cross-Origin-Opener-Policy",
    ],
    exposedHeaders: ["Cross-Origin-Opener-Policy"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Make io accessible to routes
app.set("io", io);

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinPoll", (pollId) => {
    socket.join(pollId);
    console.log(`Socket ${socket.id} joined poll room: ${pollId}`);
  });

  socket.on("leavePoll", (pollId) => {
    socket.leave(pollId);
    console.log(`Socket ${socket.id} left poll room: ${pollId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Voting App API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
