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
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/student", studentRoutes);

// Verify DB connection before starting server.
  db.query("SELECT 1")
  .then(async () => {
    await initializeComplaintTables();
    await initializeLessonPlanTables();
    await initializeCourseTable();
    await seedCoursesIfEmpty();
    console.log("Database connection verified.");

    app.listen(config.server.port, () => {
      console.log(`Server running on http://localhost:${config.server.port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("Server and database are running successfully.");
});
