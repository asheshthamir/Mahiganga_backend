const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); 
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());
// --- LOGIN ROUTE ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.username === username && u.password === password);

  if (user) {
    // In a real app, we'd use a secure token (JWT). For simplicity, we'll send a success message.
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});
const dbPath = path.join(__dirname, 'db.json');
// --- NEW ENDPOINT for Sell Requests (Saves to CSV) ---
app.post('/api/sell-requests', (req, res) => {
  const formData = req.body;
  const csvPath = path.join(__dirname, 'sell_requests.csv');

  // Define the order of columns for the CSV file
  const headers = 'SellerName,PhoneNumber,Email,Location,VehicleCategory,BrandModel,Year,Kilometers,Condition,ExpectedPrice,Comments\n';
  const row = `"${formData.sellerName}","${formData.sellerPhone}","${formData.sellerEmail}","${formData.sellerLocation}","${formData.sellCategory}","${formData.sellBrand}","${formData.sellYear}","${formData.sellKM}","${formData.sellCondition}","${formData.expectedPrice}","${formData.additionalComments}"\n`;

  // If the file doesn't exist, create it and add the headers
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, headers);
  }

  // Append the new form data as a new row
  fs.appendFileSync(csvPath, row);

  res.status(200).json({ success: true, message: 'Request submitted successfully.' });
});

// --- Helper Functions to Read/Write to the DB ---
const readDb = () => {
  const dbRaw = fs.readFileSync(dbPath);
  return JSON.parse(dbRaw);
};

const writeDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// --- API ROUTES ---

// GET: Fetch all vehicles
app.get('/api/vehicles', (_req, res) => {
  const db = readDb();
  res.json(db.vehicles);
});

// GET: Fetch a single vehicle by ID
app.get('/api/vehicles/:id', (req, res) => {
  const db = readDb();
  const vehicle = db.vehicles.find(v => v.id === parseInt(req.params.id));
  if (!vehicle) {
    return res.status(404).send('Vehicle not found.');
  }
  res.json(vehicle);
});

// POST: Add a new vehicle
app.post('/api/vehicles', (req, res) => {
  const db = readDb();
  const newVehicle = req.body;
  
  // Assign a new unique ID
  newVehicle.id = db.vehicles.length > 0 ? Math.max(...db.vehicles.map(v => v.id)) + 1 : 1;
  
  db.vehicles.push(newVehicle);
  writeDb(db);
  
  res.status(201).json(newVehicle);
});

// PUT: Update an existing vehicle by ID
app.put('/api/vehicles/:id', (req, res) => {
    const db = readDb();
    const vehicleIndex = db.vehicles.findIndex(v => v.id === parseInt(req.params.id));

    if (vehicleIndex === -1) {
        return res.status(404).send('Vehicle not found.');
    }

    const updatedVehicle = { ...db.vehicles[vehicleIndex], ...req.body };
    db.vehicles[vehicleIndex] = updatedVehicle;
    writeDb(db);

    res.json(updatedVehicle);
});

// DELETE: Remove a vehicle by ID
app.delete('/api/vehicles/:id', (req, res) => {
    const db = readDb();
    const vehicleIndex = db.vehicles.findIndex(v => v.id === parseInt(req.params.id));

    if (vehicleIndex === -1) {
        return res.status(404).send('Vehicle not found.');
    }

    db.vehicles.splice(vehicleIndex, 1);
    writeDb(db);
    
    res.status(204).send(); // No content to send back
});


// Start the server
app.listen(PORT, () => {
  console.log(`MAHIGANGA backend server is running on http://localhost:${PORT}`);
});