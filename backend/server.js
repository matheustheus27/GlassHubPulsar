const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const setupDebugRoutes = require("./routes/debugRoutes");
const setupBuilderRoutes = require("./routes/builderRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.listen(3001, () => {
  console.log("CV Export running on port 3001");
});

// Setup routes
setupBuilderRoutes(app);
setupDebugRoutes(app);
