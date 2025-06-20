var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async function initializeDatabase() {
  try {
    // Connect to MySQL database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'dog_db',
      password: 'dog123',
      database: 'DogWalkService'
    });

    // Create tables
    await Promise.all([
      db.execute(`CREATE TABLE IF NOT EXISTS Users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('owner', 'walker') NOT NULL
      )`),
      db.execute(`CREATE TABLE IF NOT EXISTS Dogs (
        dog_id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT,
        name VARCHAR(50) NOT NULL,
        size ENUM('small', 'medium', 'large') NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES Users(user_id)
      )`),
      db.execute(`CREATE TABLE IF NOT EXISTS WalkRequests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        dog_id INT,
        requested_time DATETIME NOT NULL,
        duration_minutes INT NOT NULL,
        location VARCHAR(255) NOT NULL,
        status ENUM('open', 'accepted', 'completed', 'cancelled') NOT NULL,
        FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
      )`)
    ]);

    // Insert sample data if tables are empty
    const [users, dogs, requests] = await Promise.all([
      db.execute('SELECT COUNT(*) AS count FROM Users'),
      db.execute('SELECT COUNT(*) AS count FROM Dogs'),
      db.execute('SELECT COUNT(*) AS count FROM WalkRequests')
    ]);

    if (users[0][0].count === 0) {
      await db.execute(`INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('johnwalker', 'john@example.com', 'hashed121', 'walker'),
        ('mary123', 'mary@example.com', 'hashed122', 'owner')`);
    }

    if (dogs[0][0].count === 0) {
      await db.execute(`INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'bobwalker'), 'Gemma', 'large'),
        ((SELECT user_id FROM Users WHERE username = 'johnwalker'), 'Gwen', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'mary123'), 'Dusty', 'medium')`);
    }

    if (requests[0][0].count === 0) {
      await db.execute(`INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Gemma'), '2025-06-12 10:00:00', 20, 'Glenelg', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Gwen'), '2025-07-10 18:00:00', 30, 'Burnside', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Dusty'), '2025-08-17 15:30:00', 30, 'Henley Beach', 'accepted')`);
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error setting up database:', err);
  }
})();

// API Routes
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM Dogs');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM WalkRequests WHERE status = "open"');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open requests' });
  }
});

app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT U.username, COUNT(W.request_id) AS total_walks
      FROM Users U LEFT JOIN WalkRequests W ON U.user_id = W.walker_id
      WHERE U.role = 'walker'
      GROUP BY U.username
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
module.exports = app;
