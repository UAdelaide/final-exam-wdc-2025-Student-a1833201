const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'dog_db',
    password: 'dog123',
    database: 'DogWalkService'
});

module.exports = pool.promise();
