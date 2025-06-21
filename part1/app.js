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
async function insertInitialData(){
  const users = await db.execute('SELECT COUNT(*) AS count FROM Users');
  if(users[0][0].count===0){
    await db.execute(`
      INSERT INTO Users (username)`)
  }
  }