const authenticateToken = require("../middleware/auth");
const express = require("express");
const db = require("../models/db"); // Import MySQL connection
const router = express.Router();

// Get all items
router.get("/", (req, res) => {
  let { page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 5;
  const offset = (page - 1) * limit;

  db.query("SELECT COUNT(*) AS totalItems FROM items", (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: "Server error", details: err.message });
    }

    const totalItems = countResult[0].totalItems; // Extract total count

    db.query("SELECT * FROM items LIMIT ? OFFSET ?", [limit, offset], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Server error", details: err.message });
      }

      res.json({ page, limit, totalItems, items: results });
    });
  });
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

    // Find the smallest missing ID
    const idQuery = `
      SELECT MIN(t1.id + 1) AS nextAvailableID
      FROM items t1
      LEFT JOIN items t2 ON t1.id + 1 = t2.id
      WHERE t2.id IS NULL
    `;

    db.query(idQuery, (err, result) => {
      if (err) {
        console.error("Error finding next available ID:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const nextId = result[0].nextAvailableID || 1; // Default to 1 if no rows exist

      // Insert the new item using the smallest available ID
      const insertQuery = "INSERT INTO items (id, name, quantity) VALUES (?, ?, ?)";
      const values = [nextId, name, quantity];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error("Error adding item:", err);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(201).json({ id: nextId, name, quantity });
      });
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
