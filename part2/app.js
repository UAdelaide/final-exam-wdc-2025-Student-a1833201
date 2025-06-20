const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));


// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.post('/logout', function(req, res) {
    req.session.destroy(function(err) {

  destroySession(function(err) {
    if (err) {
      console.error('Error destroying session:', err); // Log the error for debugging
      return res.status(500).json({ error: 'Could not log out' });
    }

    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logout successful' });
  });
});

// Export the app instead of listening here
module.exports = app;