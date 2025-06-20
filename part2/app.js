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
  req.session.destroy(function() {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// Export the app instead of listening here
module.exports = app;

INSERT INTO Users (username, email, password_hash, role) VALUES


('bobwalker', 'bob@example.com', 'hashed456', 'walker'),

('carol123', 'carol@exmaple.com', 'hashed789', 'owner'),

('johnwalker', 'john@example.com', 'hashed121', 'walker'),

('mary123', 'mary@example.com', 'hashed122', 'owner');