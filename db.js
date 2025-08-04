let mysql = require("mysql2");
require("dotenv").config();

let conn = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root",
    database:"studentpredication"
});

conn.connect((err)=>{
    if (err) {
        console.log("DataBase Is Not Connected");
    }else{
        console.log("DataBase IS Connected");
        
    }
})


module.exports=conn;