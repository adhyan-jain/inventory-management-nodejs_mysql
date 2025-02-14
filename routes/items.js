const express = require("express");
const db = require("../models/db"); // Import MySQL connection

const router = express.Router();

// Get all items
router.get("/", async (req, res) => {
  try {
      let { page, limit } = req.query;

      // Convert query params to numbers and set defaults
      page = parseInt(page) || 1;      // Default page = 1
      limit = parseInt(limit) || 5;    // Default limit = 5 items per page

      const offset = (page - 1) * limit; // Calculate offset

      // Fetch items with pagination
      const [items] = await db.execute(
          "SELECT * FROM items LIMIT ? OFFSET ?",
          [limit, offset]
      );

      res.json({
          page,
          limit,
          items
      });

  } catch (err) {
      res.status(500).json({ error: "Server error" });
  }
});


// Get a single item by ID
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM items WHERE id = ?", [req.params.id], (err, results) => {
    if (err) res.status(500).send("Error fetching item");
    else res.json(results[0]);
  });
});

// Add a new item
router.post("/", (req, res) => {
  const { name, quantity } = req.body;
  db.query("INSERT INTO items (name, quantity) VALUES (?, ?)", [name, quantity], (err, result) => {
    if (err) res.status(500).send("Error adding item");
    else res.json({ id: result.insertId, name, quantity });
  });
});

// Delete an item
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM items WHERE id = ?", [req.params.id], (err, result) => {
    if (err) res.status(500).send("Error deleting item");
    else res.json({ message: "Item deleted" });
  });
});

module.exports = router;
