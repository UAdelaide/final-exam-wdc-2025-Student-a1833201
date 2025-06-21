var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
const { fstat } = require('fs');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () =>{
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

    await insert
  }
}


// Route to return books as JSON
app.get('/', async (req, res) => {
  try {
    const [books] = await db.execute('SELECT * FROM books');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;