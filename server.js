const express = require("express");
const itemRoutes = require("./routes/items"); 
const authRoutes = require("./routes/auth"); // Import auth routes

const app = express();
app.use(express.json()); // Enable JSON parsing

app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes); // Use authentication routes

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
