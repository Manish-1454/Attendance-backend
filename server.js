const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const http = require('http');

const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

// ✅ Create HTTP server from Express app
const server = http.createServer(app);



// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/attendance', require('./routes/attendance'));

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// ✅ Start HTTP + WebSocket server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
