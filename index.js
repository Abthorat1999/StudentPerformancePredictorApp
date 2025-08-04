//  Import required modules
let express = require("express");
let bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");
let conn = require("./db");

let app = express();

//  Middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Secret Key
let secretKey = "RajKey";

//  Routes

//  Show login page
app.get("/", (req, res) => {
    res.render("Login/Login.ejs", {
        message: ""
    });
});

//  Show registration form
app.get("/Regestion", (req, res) => {
    res.render("Login/Regestion.ejs", {
        message: "",
        oldData: {}
    });
});

//  Handle registration
app.post("/Regestion", async (req, res) => {
    const { FirstName, LastName, Contact, Email, Password, ConfirmPassword } = req.body;
    console.log("Received Registration Data:", req.body);

    // Validate password match
    if (Password !== ConfirmPassword) {
        return res.render("Login/Regestion", {
            message: "Passwords do not match.",
            oldData: req.body
        });
    }

    // Hash the password
    let hashedPassword = await bcrypt.hash(Password, 10);

    // Insert into DB
    conn.query(
        "INSERT INTO user (FirstName, LastName, Contact, Email, Password) VALUES (?, ?, ?, ?, ?)",
        [FirstName, LastName, Contact, Email, hashedPassword],
        (err, result) => {
            if (err) {
                console.error("SQL Error:", err.message);
                return res.render("Login/Regestion", {
                    message: "Failed to register. " + err.message,
                    oldData: req.body
                });
            }

            console.log("Inserted into database:", result);
            return res.render("Login/Login", {
                message: "Registration successful! Please log in."
            });
        }
    );
});

//  Handle login
app.post("/", (req, res) => {
    let { Email, Password } = req.body;


    conn.query("SELECT * FROM user WHERE Email = ?", [Email], async (err, result) => {
        if (err || result.length === 0) {
            // If no user found or any database error, return invalid credentials message
            return res.render("Login/Login", {
                message: "Invalid email or password."
            });
        }

        const user = result[0];

        // Compare password with hashed password in the database
        const isMatch = await bcrypt.compare(Password, user.Password);

        if (!isMatch) {
            // If passwords do not match, show invalid credentials message
            return res.render("Login/Login", {
                message: "Invalid email or password."
            });
        }

        res.render("Dashboard/Home", {
            message: `Login successful, welcome ${user.FirstName}!`
        });
    });
});


// Foget password

app.get("/forgot-password", (req, res) => {
    res.render("Login/ForgotPassword", { message: "" });
});

const nodemailer = require("nodemailer");

// store codes in memory (for quick demo, not for production)
const codeMap = new Map();

app.post("/forgot-password", (req, res) => {
    const { Email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // save code for verification
    codeMap.set(Email, code);

    // send email (setup using Gmail or SMTP)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "rajprajapatimno@gmail.com",
            pass: "valq bppq xksm lwnz", // not your Gmail password
        },
    });

    let mailOptions = {
        from: "rajprajapatimno@gmail.com",
        to: Email,
        subject: "Your Password Reset Code",
        text: `Your verification code is: ${code}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Email Send Error:", error);
            return res.render("Login/ForgotPassword", {
                message: "Failed to send verification code.",
            });
        }
        res.render("Login/VerifyCode", {
            Email,
            message: "Code sent successfully. Check your email.",
        });
    });
});

// Veify code
app.post("/verify-code", async (req, res) => {
    let { Email, Code, NewPassword, ConfirmPassword } = req.body;

    if (NewPassword !== ConfirmPassword) {
        return res.render("Login/VerifyCode", {
            Email,
            message: "Passwords do not match.",
        });
    }

    let savedCode = codeMap.get(Email);
    if (savedCode !== Code) {
        return res.render("Login/VerifyCode", {
            Email,
            message: "Invalid verification code.",
        });
    }

    const hashed = await bcrypt.hash(NewPassword, 10);

    conn.query(
        "UPDATE user SET Password = ? WHERE Email = ?",
        [hashed, Email],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.render("Login/VerifyCode", {
                    Email,
                    message: "Failed to update password.",
                });
            }
            codeMap.delete(Email); 
            res.render("Login/Login", {
                message: "Password reset successfully. Please login.",
            });
        }
    );
});

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "rajprajapatimno@gmail.com",
        pass: "valq bppq xksm lwnz", // use App Password!
    },
});


//  Start server
app.listen(7000, () => {
    console.log("Server Started Successfully on http://localhost:7000");
});
