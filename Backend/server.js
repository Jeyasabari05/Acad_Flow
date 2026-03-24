const express = require("express");
const path = require("path");
const passport = require("passport");
const { config, db } = require("./src/config/config.js");
const adminRoutes = require("./src/routes/adminRoutes");
const authRoutes = require("./src/routes/authRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const facultyRoutes = require("./src/routes/facultyRoutes.js");
const materialsRoutes = require("./src/routes/materialsRoutes");
const studentRoutes = require("./src/routes/studentRoutes.js");
const { initializeComplaintTables } = require("./src/models/complaintModel");
const { initializeLessonPlanTables } = require("./src/models/materialModel");
const { initializeCourseTable, seedCoursesIfEmpty } = require("./src/models/courseModel");

const app = express();
const cors = require("cors");

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check route — confirms deployment is live
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server and database are running successfully",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/student", studentRoutes);

// Use PORT from environment (Render sets this automatically)
const PORT = process.env.PORT || config.server.port || 3000;

db.query("SELECT 1")
  .then(async () => {
    console.log("✅ Database connection verified.");

    await initializeComplaintTables();
    console.log("✅ Complaint tables initialized.");

    await initializeLessonPlanTables();
    console.log("✅ Lesson plan tables initialized.");

    await initializeCourseTable();
    console.log("✅ Course table initialized.");

    await seedCoursesIfEmpty();
    console.log("✅ Course seeding done.");

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  });