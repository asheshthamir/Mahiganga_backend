require('dotenv').config(); // Reads the .env file from Render
const express = require('express');
const { Pool } = require('pg'); // PostgreSQL client

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(require('cors')());
app.use(express.json());

// --- API ROUTES ---

// Login User
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Fetch all vehicles
app.get('/api/vehicles', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Fetch a single vehicle by ID
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Vehicle not found.');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST: Add a new vehicle
app.post('/api/vehicles', async (req, res) => {
  const { name, category, price, year, kilometers, fuelType, financeAvailable, images } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicles(name, category, price, year, kilometers, fuelType, financeAvailable, images) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, category, price, year, kilometers, fuelType, financeAvailable, images]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE: Remove a vehicle by ID
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
        return res.status(404).send('Vehicle not found.');
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST: Save sell requests to CSV (This remains the same)
app.post('/api/sell-requests', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const formData = req.body;
    const csvPath = path.join(__dirname, 'sell_requests.csv');
    const headers = 'SellerName,PhoneNumber,Email,Location,VehicleCategory,BrandModel,Year,Kilometers,Condition,ExpectedPrice,Comments\n';
    const row = `"${formData.sellerName}","${formData.sellerPhone}","${formData.sellerEmail}","${formData.sellerLocation}","${formData.sellCategory}","${formData.sellBrand}","${formData.sellYear}","${formData.sellKM}","${formData.sellCondition}","${formData.expectedPrice}","${formData.additionalComments}"\n`;
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, headers);
    }
    fs.appendFileSync(csvPath, row);
    res.status(200).json({ success: true, message: 'Request submitted successfully.' });
});


// Start the server
app.listen(PORT, () => {
  console.log(`MAHIGANGA backend server is running on http://localhost:${PORT}`);
});