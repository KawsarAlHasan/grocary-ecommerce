const db = require("../config/db");
const bcrypt = require("bcrypt");
const { generateUserToken } = require("../config/userToken");

// sign up User
exports.signUpUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      account_email,
      account_phone,
      account_type,
      brand,
      city,
      company,
      contract_comptabilité,
      contract_facturation,
      post_code,
      siret,
      status,
    } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !password || !account_type) {
      return res.status(400).send({
        success: false,
        message:
          "Please provide name, email, password & account_type required fields",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, account_email, account_phone, account_type, brand, city, company, contract_comptabilité, contract_facturation, post_code, siret, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        email,
        hashedPassword,
        account_email || null,
        account_phone || null,
        account_type,
        brand || null,
        city || null,
        company || null,
        contract_comptabilité || null,
        contract_facturation || null,
        post_code || null,
        siret || null,
        status || "Actif",
      ]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert User, please try again",
      });
    }

    // Generate token after successful user creation
    const token = generateUserToken({ id: result.insertId });

    // Send success response with the token
    return res.status(200).json({
      success: true,
      message: "User signed up successfully",
      token,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    return res.status(500).send({
      success: false,
      message: "An error occurred while signing up the user",
      error: error.message,
    });
  }
};

// user login
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        error: "Please provide your credentials",
      });
    }
    const [results] = await db.query(`SELECT * FROM users WHERE email=?`, [
      email,
    ]);
    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Email and Password is not correct",
      });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Email and Password is not correct",
      });
    }
    const token = generateUserToken({ id: user.id });
    const { password: pwd, ...usersWithoutPassword } = user;
    res.status(200).json({
      success: true,
      message: "Successfully logged in",
      data: {
        user: usersWithoutPassword,
        token,
      },
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: "User Login Unseccess",
      error: error.message,
    });
  }
};

// get me User
exports.getMeUser = async (req, res) => {
  try {
    const user = req.decodedUser;
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// get all Users
exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit, name, email, id } = req.query;

    // Default pagination values
    page = parseInt(page) || 1; // Default page is 1
    limit = parseInt(limit) || 20; // Default limit is 20
    const offset = (page - 1) * limit; // Calculate offset for pagination

    // Initialize SQL query and parameters array
    let sqlQuery = "SELECT * FROM users WHERE 1=1"; // 1=1 makes appending conditions easier
    const queryParams = [];

    // Add filters for name, email, and id if provided
    if (name) {
      sqlQuery += " AND name LIKE ?";
      queryParams.push(`%${name}%`); // Using LIKE for partial match
    }

    if (email) {
      sqlQuery += " AND email LIKE ?";
      queryParams.push(`%${email}%`);
    }

    if (id) {
      sqlQuery += " AND id = ?";
      queryParams.push(id);
    }

    // Add pagination to the query
    sqlQuery += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    // Execute the query with filters and pagination
    const [data] = await db.query(sqlQuery, queryParams);

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No users found",
        data: [],
      });
    }

    // Get total count of users for pagination info (with the same filters)
    let countQuery = "SELECT COUNT(*) as count FROM users WHERE 1=1";
    const countParams = [];

    // Add the same filters for total count query
    if (name) {
      countQuery += " AND name LIKE ?";
      countParams.push(`%${name}%`);
    }

    if (email) {
      countQuery += " AND email LIKE ?";
      countParams.push(`%${email}%`);
    }

    if (id) {
      countQuery += " AND id = ?";
      countParams.push(id);
    }

    const [totalUsersCount] = await db.query(countQuery, countParams);
    const totalUsers = totalUsersCount[0].count;

    // Send response with users data and pagination info
    res.status(200).send({
      success: true,
      message: "All Users",
      totalUsers: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      data: data,
    });
  } catch (error) {
    // Error handling
    res.status(500).send({
      success: false,
      message: "Error in Get All Users",
      error: error.message,
    });
  }
};

// get single user by id
exports.getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "User ID is required in params",
      });
    }

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No user found",
      });
    }
    res.status(200).send(data[0]);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting user",
      error: error.message,
    });
  }
};

// update user
exports.updateUser = async (req, res) => {
  try {
    const userID = req.decodedUser.id;

    // Extract data from the request body
    const {
      name,
      account_phone,
      brand,
      city,
      company,
      contract_comptabilité,
      contract_facturation,
      post_code,
      siret,
    } = req.body;

    // Fetch the current user data from the database
    const [preData] = await db.query(`SELECT * FROM users WHERE id=?`, [
      userID,
    ]);

    if (!preData) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Use data from preData if it is not present in req.body
    const updatedUserData = {
      name: name || preData[0].name,
      account_phone: account_phone || preData[0].account_phone,
      brand: brand || preData[0].brand,
      city: city || preData[0].city,
      company: company || preData[0].company,
      contract_comptabilité:
        contract_comptabilité || preData[0].contract_comptabilité,
      contract_facturation:
        contract_facturation || preData[0].contract_facturation,
      post_code: post_code || preData[0].post_code,
      siret: siret || preData[0].siret,
    };

    // Update the user data in the database
    const [data] = await db.query(
      `UPDATE users SET name=?, account_phone=?, brand=?, city=?, company=?, contract_comptabilité=?, contract_facturation=?, post_code=?, siret=? WHERE id = ?`,
      [
        updatedUserData.name,
        updatedUserData.account_phone,
        updatedUserData.brand,
        updatedUserData.city,
        updatedUserData.company,
        updatedUserData.contract_comptabilité,
        updatedUserData.contract_facturation,
        updatedUserData.post_code,
        updatedUserData.siret,
        userID,
      ]
    );

    if (!data) {
      return res.status(500).send({
        success: false,
        message: "Error in updating user",
      });
    }

    res.status(200).send({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in updating user",
      error: error.message,
    });
  }
};

// update user by id
exports.updateUserByID = async (req, res) => {
  try {
    const userID = req.params.id;

    // Extract data from the request body
    const {
      name,
      account_phone,
      brand,
      city,
      company,
      contract_comptabilité,
      contract_facturation,
      post_code,
      siret,
    } = req.body;

    // Fetch the current user data from the database
    const [preData] = await db.query(`SELECT * FROM users WHERE id=?`, [
      userID,
    ]);

    if (!preData) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Use data from preData if it is not present in req.body
    const updatedUserData = {
      name: name || preData[0].name,
      account_phone: account_phone || preData[0].account_phone,
      brand: brand || preData[0].brand,
      city: city || preData[0].city,
      company: company || preData[0].company,
      contract_comptabilité:
        contract_comptabilité || preData[0].contract_comptabilité,
      contract_facturation:
        contract_facturation || preData[0].contract_facturation,
      post_code: post_code || preData[0].post_code,
      siret: siret || preData[0].siret,
    };

    // Update the user data in the database
    const [data] = await db.query(
      `UPDATE users SET name=?, account_phone=?, brand=?, city=?, company=?, contract_comptabilité=?, contract_facturation=?, post_code=?, siret=? WHERE id = ?`,
      [
        updatedUserData.name,
        updatedUserData.account_phone,
        updatedUserData.brand,
        updatedUserData.city,
        updatedUserData.company,
        updatedUserData.contract_comptabilité,
        updatedUserData.contract_facturation,
        updatedUserData.post_code,
        updatedUserData.siret,
        userID,
      ]
    );

    if (!data) {
      return res.status(500).send({
        success: false,
        message: "Error in updating user",
      });
    }

    res.status(200).send({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in updating user",
      error: error.message,
    });
  }
};

// user password update
exports.updateUserPassword = async (req, res) => {
  try {
    const userID = req.decodedUser.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(404).send({
        success: false,
        message: "Old Password and New Password is requied in body",
      });
    }
    const checkPassword = req.decodedUser?.password;

    const isMatch = await bcrypt.compare(old_password, checkPassword);

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        error: "Your Old Password is not correct",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const [result] = await db.query(`UPDATE users SET password=? WHERE id =?`, [
      hashedPassword,
      userID,
    ]);

    if (!result) {
      return res.status(403).json({
        success: false,
        error: "Something went wrong",
      });
    }

    res.status(200).send({
      success: true,
      message: "User password updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in password Update User",
      error: error.message,
    });
  }
};

// user status
exports.userStatusUpdate = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "User ID is required in params",
      });
    }

    const { status, account_type } = req.body;

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No user found",
      });
    }

    await db.query(`UPDATE users SET status=?, account_type=?  WHERE id =?`, [
      status || data[0].status,
      account_type || data[0].account_type,
      userId,
    ]);

    res.status(200).send({
      success: true,
      message: "status updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update status ",
      error: error.message,
    });
  }
};

// delete user
exports.deleteUser = async (req, res) => {
  try {
    const userID = req.params.id;
    if (!userID) {
      return res.status(404).send({
        success: false,
        message: "User ID is reqiured in params",
      });
    }
    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userID]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No user found",
      });
    }
    await db.query(`DELETE FROM users WHERE id=?`, [userID]);
    res.status(200).send({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete User",
      error: error.message,
    });
  }
};
