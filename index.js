const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const mySqlPool = require("./config/db");
const path = require("path");
const app = express();
dotenv.config();

const globalCorsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(globalCorsOptions));
app.options("*", cors(globalCorsOptions));
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Serve static files
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/admins", require("./routes/adminRoute"));
app.use("/user", require("./routes/usersRoute"));
app.use("/category", require("./routes/categoriesRoute"));
app.use("/subcategory", require("./routes/subCategoriesRoute"));
app.use("/product", require("./routes/productsRoute"));
app.use("/settings", require("./routes/settingRoute"));

const port = process.env.PORT || 8080;

mySqlPool
  .query("SELECT 1")
  .then(() => {
    console.log("MYSQL DB Connected");

    // listen
    app.listen(port, () => {
      console.log(`grocaryecommerce Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/", (req, res) => {
  res.status(200).send("grocaryecommerce server is working");
});

// 404 Not Found middleware
app.use("*", (req, res, next) => {
  res.status(404).json({
    error: "You have hit the wrong route",
  });
});

// admin
// cart
// favorite
// orders
// user_delivery_address

//

// users
// products
// category
// sub_category
// app_logo
// settings
// post_code

// const express = require('express');
// const mysql = require('mysql2');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const app = express();
// app.use(express.json());

// // MySQL connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'password',
//     database: 'your_database'
// });

// db.connect(err => {
//     if (err) throw err;
//     console.log('MySQL Connected...');
// });

// // Register User API
// app.post('/register', (req, res) => {
//     const { first_name, last_name, email, password, role_id } = req.body;
//     const hashedPassword = bcrypt.hashSync(password, 8);
//     db.query('INSERT INTO users (first_name, last_name, email, password, role_id) VALUES (?, ?, ?, ?, ?)',
//         [first_name, last_name, email, hashedPassword, role_id],
//         (err, result) => {
//             if (err) return res.status(500).send(err);
//             res.status(201).send('User created');
//         });
// });

// // Middleware to check role permissions
// const checkPermissions = (requiredPermissions) => {
//     return (req, res, next) => {
//         const userRole = req.user.role_id;

//         db.query('SELECT p.name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?',
//         [userRole], (err, results) => {
//             if (err) return res.status(500).send(err);

//             const userPermissions = results.map(r => r.name);
//             const hasPermission = requiredPermissions.every(rp => userPermissions.includes(rp));

//             if (!hasPermission) return res.status(403).send('Access Denied');
//             next();
//         });
//     };
// };

// // Example protected route
// app.get('/admin/products', checkPermissions(['Create Product', 'Modify Product']), (req, res) => {
//     // Business logic here
//     res.send('Access Granted to Products Management');
// });

// // Listen to port
// app.listen(3000, () => {
//     console.log('Server is running on port 3000');
// });
