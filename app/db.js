//const mysql = require("mysql");
const mysql = require("mysql2");
const dbConfig = require("./db.config.js");

const connection = mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB
});

connection.connect(error => {
    if (error) {
        console.log("Ruh roh");
        throw error
    };
    console.log("Connection to DB successful!");
});

module.exports = connection;