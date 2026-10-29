require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Socket.IO (live alerts). Controllers reach it with req.app.get("io")
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);
require("./sockets/socket")(io);

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.json({ message: "Lost & Found API running" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/claims", require("./routes/claimRoutes"));

// Unknown /api route
app.use("/api", (req, res) => res.status(404).json({ message: "Route not found" }));

// Error handler (multer errors, etc.)
app.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server };
