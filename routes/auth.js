const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const db = require("../models/db");

const router = express.Router();

// Configure session middleware
router.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

// Signup Route
router.post("/signup", (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) return res.status(400).json({ message: "Username already exists" });

    // Hash and store password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: "Error hashing password" });

      db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (error) => {
        if (error) return res.status(500).json({ message: "Error registering user" });
        res.json({ message: "User registered successfully!" });
      });
    });
  });
});


// Login Route (Session-Based Authentication)
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(401).json({ message: "Invalid username or password" });

    bcrypt.compare(password, results[0].password, (error, isMatch) => {
      if (error) return res.status(500).json({ message: "Error comparing passwords" });
      if (!isMatch) return res.status(401).json({ message: "Invalid username or password" });

      // Generate JWT token
      const token = jwt.sign({ id: results[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.json({ message: "Login successful", token });
    });
  });
});


// Logout Route
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
