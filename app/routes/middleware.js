const sql = require("../db.js");

function checkApiKey(req, res, next) {
    //get api key from header
    const apiKey = req.headers[`x-api-key`];
    
    const query = `SELECT * FROM current_users WHERE apikey = ?`;
    
    //check if api key is valid/registered
    sql.query(query, [apiKey], (err, rows) => {
        if (err) {
            console.error(`Error checking current users: ${err}`);
            return res.status(500).send(`Internal Server Error`);
        }
        
        // api key is valid, proceed to the next middleware or route handler
        if (rows.length > 0) {
            console.log(`api key is valid`);
            next();
        //test key for testing purposes only
        }else if (apiKey === "123456789") {                         //HARDCODED APIKEY FOR TESTING PURPOSES ONLY
            console.log(`TESTING api key is valid`);                //HARDCODED APIKEY FOR TESTING PURPOSES ONLY
            next();                                                 //HARDCODED APIKEY FOR TESTING PURPOSES ONLY
        } else {
            // api key is invalid, send a 403 Forbidden response
            return res.status(403).send(`Forbidden`);
        }
    });    
}

module.exports = {
    checkApiKey,
    checkPermissions
};