const express = require('express');
const sql = require("../db.js");
const router = express.Router();

//login route
router.post('/login', (req, res) => {
    //get email and password from request body
    const { email, password } = req.body;
    
    //search for user in database via email
    sql.query(`SELECT * FROM users WHERE Email = ?`, [email], (err, rows) => {
        if (err) { //database error
            console.error("DB error:", err);
            return res.status(500).send({ error: "Database error" });
        }

        if (rows.length === 0) { //user not found
            console.log("User not found");
            return res.status(404).send({ message: "User not found" });
        }

        //user found
        const user = rows[0];
        const role = user.JobTitle === "Manager" ? 1 : 0;

        //check if the password matches the hashed password in the database
        if(password === user.Password) {
            //generate a new API key
            const UserID = user.UserID;
            const apikey = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);

            //insert key into the current_users table, along with userID and role
            sql.query(`INSERT INTO current_users VALUES (?,?,?)`, [apikey, UserID, role], (err, rows) => {
                if(err) { //database error
                    console.log(err);
                    res.status(500).send({ error: 'Error inserting values' });
                } else {
                    //return api key to the client
                    res.status(200).send({ api_key: apikey });
                }
            });
        }else {
            //password does not match, login failed
            res.status(401).send({ message: "Incorrect password" });
        }
    });
});

router.delete('/logout', (req, res) => {
    const api_key = req.headers['x-api-key'];

    //delete the api key from the current_users table
    console.log("Deleting api key: ", api_key);
    sql.query(`DELETE FROM current_users WHERE apikey = ?`, [api_key], (err, rows) => {
        if(err) {
            console.log(err);
            res.status(500).send({ error: 'Error deleting values' });
        } else {
            console.log(rows);
            res.status(200).send({ message: 'Api key successfully deleted' });
        }
    });

});

//export routes
module.exports = router;