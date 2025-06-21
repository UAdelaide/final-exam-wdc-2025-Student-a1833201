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
    await connection.query('DROP DATABSE IF EXISTS DogWalkService');
    await connection.query('CREATE DATABASE DogWalkService');
    await connection.end();

    db = await mysql.createConnection({
      host:'localhost',
      user:'dog_db',
      password:'dog123',
      database:'DogWalkService'
    });
    const sql = await fs.readFile(path.join(part1,'dogwalks.sql'), 'utf8');
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
      (1, 'Gwen', 'Large'),
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

app.get('/api/walkers/summary')