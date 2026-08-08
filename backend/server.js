const express = require("express");

const puppeteer = require("puppeteer");
const cors = require("cors"); 

const setupDebugRoutes = require("./routes/debugRoutes");
const setupBuilderRoutes = require("./routes/builderRoutes");
const setupOllamaRoutes = require("./routes/ollamaRoutes"); 

const app = express(); 

app.use(cors());
app.use(express.json({ limit: "10mb" })); 

// Initializes the routes by passing the app instance
setupBuilderRoutes(app);
setupDebugRoutes(app);
setupOllamaRoutes(app); 

app.listen(3001, () => {
console.log("Document Export running on port 3001");
});