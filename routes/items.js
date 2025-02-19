const authenticateToken = require("../middleware/auth");
const express = require("express");
const db = require("../models/db.js"); // Import MySQL connection
const router = express.Router();

// Get all items
router.get("/", authenticateToken, async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 5;
    const offset = (page - 1) * limit;

    // Get total items count
    const [[{ totalItems }]] = await db.execute("SELECT COUNT(*) as totalItems FROM items");

    // Fetch items with pagination
    const [items] = await db.execute("SELECT * FROM items LIMIT ? OFFSET ?", [limit, offset]);

    res.json({
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      items
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get a single item by ID
router.get("/:id", authenticateToken, (req, res) => {
  db.query("SELECT * FROM items WHERE id = ?", [req.params.id], (err, results) => {
    if (err) res.status(500).send("Error fetching item");
    else res.json(results[0]);
  });
});

// Create a new item (POST)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, quantity } = req.body;

    if (!name || !quantity) {
      return res.status(400).json({ message: "Name and quantity are required" });
    }

    const query = "INSERT INTO items (name, quantity) VALUES (?, ?)";
    const values = [name, quantity];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Error adding item:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.status(201).json({ id: result.insertId, name, quantity });
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an item
router.delete("/:id", authenticateToken, (req, res) => {
  db.query("DELETE FROM items WHERE id = ?", [req.params.id], (err, result) => {
    if (err) res.status(500).send("Error deleting item");
    else res.json({ message: "Item deleted" });
  });
});

router.put("/:id", authenticateToken, (req, res) => {
  const { name, quantity } = req.body;
  if (!name || !quantity) return res.status(400).json({ message: "Name and quantity required" });

  db.query("UPDATE items SET name = ?, quantity = ? WHERE id = ?", [name, quantity, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Item updated successfully" });
  });
});

module.exports = router;
