const express = require('express');
const sql = require("../db.js");
const router = express.Router();

//return current users data
router.get('/whoami', (req, res) => {
    const apikey = req.headers[`x-api-key`];

    sql.query(`SELECT * FROM current_users WHERE apikey = ?`, [apikey], (err, rows) => {
        if(err){
            console.log(err);
            res.status(500).send({error: 'Error fetching user data'});
        }
        if(rows.length === 0){
            if(apikey === "123456789") {    //HARDCODED APIKEY FOR TESTING PURPOSES ONLY
                console.log(`TESTING api key is valid`);
                return res.status(200).send({UserID: 1, Name: "Test User", isManager: 1, Email: "test@make-it-all.co.uk"})
            }                               //HARDCODED APIKEY FOR TESTING PURPOSES ONLY
            res.status(404).send({error: 'User not found'});
        }
        if(rows.length > 0){
            const user = rows[0];
            const UserID = user.UserID;
            const role = user.isManager;

            sql.query(`SELECT * FROM users WHERE UserID = ?`, [UserID], (err, rows) => {
                if(err){
                    console.log(err);
                    res.status(500).send({error: 'Error fetching user data'});
                }else{
                    const userData = rows[0];
                    res.status(200).send({UserID: UserID, Name: userData.Name, isManager: role, Email: userData.Email});
                }
            });
        }
        
    });

});

router.get('/users',(req, res) => {
    sql.query(`SELECT * FROM users`, (err, rows) => {
        if(err){
            console.log(err);
            res.status(500).send({error: 'Error fetching user data'});
        }else{
            res.status(200).send(rows);
        }
    });
});

router.get('/users/:userId',(req, res) => {
    const userId = req.params.userId;

    sql.query(`SELECT * FROM users WHERE UserID = ${userId}`, (err, rows) => {
        if(err){
            console.log(err);
            res.status(500).send({error: 'Error fetching user data'});
        }else{
            res.status(200).send(rows);
        }
    });
});

module.exports = router;