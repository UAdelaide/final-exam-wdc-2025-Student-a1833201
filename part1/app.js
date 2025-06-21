var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
const fs = require('fs').promises;

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

async function initaliseDatabase() {
  try {
    const connection = await mysql.createConnection({
      host:'localhost',
      user:'dog_db',
      password:'dog123'
    });
    await connection.query('DROP DATABASE IF EXISTS DogWalkService');
    await connection.query('CREATE DATABASE DogWalkService');
    await connection.end();

    db = await mysql.createConnection({
      host:'localhost',
      user:'dog_db',
      password:'dog123',
      database:'DogWalkService'
    });
    const sql = await fs.readFile(path.join(_dirname,'dogwalks.sql'), 'utf8');
    await db.query(sql);

    await insertInitialData();
  } catch (err){
    console.error('Error with database',err);
  }
}
async function insertInitialData() {
  const users = await db.execute('SELECT COUNT(*) AS count FROM Users');
  if (users[0][0].count === 0) {
    await db.execute(`
      INSERT INTO Users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hashed_password123', 'owner'),
      ('bobwalker', 'bob@example.com', 'hashed_password456', 'walker'),
      ('carol123', 'carol@example.com', 'hashed_password789', 'owner')
    `);
  }

    const dogs = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
  if (dogs[0][0].count === 0) {
    await db.execute(`
      INSERT INTO Dogs (owner_id, name, size) VALUES
      (1, 'Gwen', 'large'),
      (2, 'Bella', 'small')
    `);
  }

  const requests = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
  if (requests[0][0].count === 0) {
    await db.execute(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
      (1, '12:30', 30, 'Burnside', 'open')
    `);
  }
}

app.get('/api/dogs', async (req,res) => {
  try{
    const [dogs] = await db.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(dogs);
  } catch(err){
    console.error('Error fetching dog',err);
    res.status(500).json({error: 'failed to get dog'});
  }
});

app.get('/api/walkrequests/open', async (req,res) => {
  try {
    const [requests] = await db.execute(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(requests);
  } catch (err) {
    console.error('Error fetching walk requests:', err);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [walkers] = await db.execute(`
      SELECT w.username AS walker_username, COUNT(wa.request_id) AS total_ratings, AVG(w.average_rating) AS average_rating, SUM(w.completed_walks) AS completed_walks
      FROM Walkers w
      LEFT JOIN WalkApplications wa ON w.walker_id = wa.walker_id
      GROUP BY w.walker_id
    `);
    res.json(walkers);
  } catch (err) {
    console.error('Error fetching walkers summary:', err);
    res.status(500).json({ error: 'Failed to fetch walkers summary' });
  }
});

app.listen(8080, async () => {
  console.log('Server is running on http://localhost:8080');
  await initaliseDatabase();
});
// Serve static files from the public directory
module.exports = app;
