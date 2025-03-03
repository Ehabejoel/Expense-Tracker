const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cashReserveRoutes = require('./routes/cashReserveRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const { protectRoute } = require('./middleware/authMiddleware');
const http = require('http');
const JobService = require('./services/jobService');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reserves', cashReserveRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reminders', reminderRoutes);

// Protected route example
app.get('/api/protected', protectRoute, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Basic route
app.get('/', (req, res) => {
  res.send('FinTrack API is running');
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize job service with the server instance
new JobService(server);

// Update server start
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
