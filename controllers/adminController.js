const db = require("../config/db");
const bcrypt = require("bcrypt");
const { generateAdminToken } = require("../config/adminToken");

// sign up Admin
exports.signUpAdmin = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role_id } = req.body;

    // Check if all required fields are provided
    if (!first_name || !last_name || !email || !password || !role_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const [result] = await db.query(
      "INSERT INTO admins (first_name, last_name, email, password, role_id) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, email, hashedPassword, role_id]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert admin, please try again",
      });
    }

    // Generate token after successful admin creation
    const token = generateAdminToken({ id: result.insertId });

    // Send success response with the token
    return res.status(200).json({
      success: true,
      message: "admin signed up successfully",
      token,
    });
  } catch (error) {
    // Handle any errors that occur during the process
    return res.status(500).send({
      success: false,
      message: "An error occurred while signing up the admin",
      error: error.message,
    });
  }
};

// admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        error: "Please provide your credentials",
      });
    }
    const [results] = await db.query(`SELECT * FROM admins WHERE email=?`, [
      email,
    ]);
    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Email and Password is not correct",
      });
    }
    const admin = results[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Email and Password is not correct",
      });
    }
    const token = generateAdminToken({ id: admin.id });
    const { password: pwd, ...adminsWithoutPassword } = admin;
    res.status(200).json({
      success: true,
      message: "Successfully logged in",
      data: {
        admin: adminsWithoutPassword,
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

// get me admin
exports.getMeAdmin = async (req, res) => {
  try {
    const admin = req.decodedAdmin;
    res.status(200).json(admin);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// update admin
exports.updateAdmin = async (req, res) => {
  try {
    const admin = req.decodedAdmin;

    // Extract data from the request body
    const { first_name, last_name } = req.body;

    // Use data from preData if it is not present in req.body
    const updatedUserData = {
      fName: first_name || admin.first_name,
      lName: last_name || admin.last_name,
    };

    // Update the user data in the database
    const [data] = await db.query(
      `UPDATE admins SET first_name=?, last_name=? WHERE id = ?`,
      [updatedUserData.fName, updatedUserData.lName, admin.id]
    );

    if (!data) {
      return res.status(500).send({
        success: false,
        message: "Error in updating Admin",
      });
    }

    res.status(200).send({
      success: true,
      message: "Admin updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in updating Admin",
      error: error.message,
    });
  }
};

// admin password update
exports.updateAdminPassword = async (req, res) => {
  try {
    const admin = req.decodedAdmin;
    const userID = admin.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(404).send({
        success: false,
        message: "Old Password and New Password is requied in body",
      });
    }
    const checkPassword = admin?.password;

    const isMatch = await bcrypt.compare(old_password, checkPassword);

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        error: "Your Old Password is not correct",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const [result] = await db.query(
      `UPDATE admins SET password=? WHERE id =?`,
      [hashedPassword, userID]
    );

    if (!result) {
      return res.status(403).json({
        success: false,
        error: "Something went wrong",
      });
    }

    res.status(200).send({
      success: true,
      message: "Admin password updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in password Update Admin",
      error: error.message,
    });
  }
};

// update admin role_id
exports.adminRoleIdUpdate = async (req, res) => {
  try {
    const adminID = req.params.id;
    if (!adminID) {
      return res.status(404).send({
        success: false,
        message: "Admin role ID is required in params",
      });
    }

    const { role_id } = req.body;
    if (!role_id) {
      return res.status(404).send({
        success: false,
        message: "role_id is requied in body",
      });
    }

    if (role_id == 1) {
      return res.status(403).send({
        success: false,
        message: "Super Admin role cannot be assigned to another admin",
      });
    }

    const [data] = await db.query(`SELECT * FROM admins WHERE id=? `, [
      adminID,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No admins found",
      });
    }

    if (data[0].role_id == 1) {
      return res.status(403).send({
        success: false,
        message: "Supper Admin role Not be changed",
      });
    }

    await db.query(`UPDATE admins SET role_id=?  WHERE id =?`, [
      role_id,
      adminID,
    ]);

    res.status(200).send({
      success: true,
      message: "role updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update role",
      error: error.message,
    });
  }
};

// update admin by id
exports.adminUpdateByAdminId = async (req, res) => {
  try {
    const adminID = req.params.id;

    const { role, first_name, last_name, email } = req.body;

    if (role == 1) {
      return res.status(403).send({
        success: false,
        message: "Super Admin role cannot be assigned to another admin",
      });
    }

    const [data] = await db.query(`SELECT * FROM admins WHERE id=? `, [
      adminID,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No admins found",
      });
    }

    const [allData] = await db.query(
      `SELECT email FROM admins WHERE email =?`,
      [email]
    );

    if (allData.length > 0) {
      if (allData[0].email !== data[0].email) {
        return res.status(404).send({
          success: false,
          message: "Email already exists",
        });
      }
    }

    if (data[0].role_id == 1) {
      return res.status(403).send({
        success: false,
        message: "Supper Admin role Not be changed",
      });
    }

    await db.query(
      `UPDATE admins SET role_id=?, first_name=?, last_name=?, email=?  WHERE id =?`,
      [
        role || data[0].role_id,
        first_name || data[0].first_name,
        last_name || data[0].last_name,
        email || data[0].email,
        adminID,
      ]
    );

    res.status(200).send({
      success: true,
      message: "role updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update role",
      error: error.message,
    });
  }
};

// get all Admin
exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        admins.id, 
        admins.first_name, 
        admins.last_name, 
        admins.email, 
        admins.password, 
        roles.name AS role_name, 
        permissions.section AS permission_section,
        permissions.name AS permission_name
      FROM admins
      LEFT JOIN roles ON admins.role_id = roles.id
      LEFT JOIN role_permissions ON roles.id = role_permissions.role_id
      LEFT JOIN permissions ON role_permissions.permission_id = permissions.id`
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No admins found",
      });
    }

    const groupedAdmins = rows.reduce((acc, row) => {
      const {
        id,
        first_name,
        last_name,
        email,
        role_name,
        password,
        permission_section,
        permission_name,
      } = row;

      if (!acc[id]) {
        acc[id] = {
          id,
          first_name,
          last_name,
          email,
          role_name,
          password,
          permissions: {},
        };
      }

      if (!acc[id].permissions[permission_section]) {
        acc[id].permissions[permission_section] = [];
      }
      acc[id].permissions[permission_section].push(permission_name);

      return acc;
    }, {});

    const result = Object.values(groupedAdmins).map((admin) => ({
      ...admin,
      permissions: Object.keys(admin.permissions).map((section) => ({
        section,
        name: admin.permissions[section],
      })),
    }));

    res.status(200).send({
      success: false,
      message: "Get All Admins",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting admins",
      error: error.message,
    });
  }
};

// get single admin by id
exports.getSingleAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    if (!adminId) {
      return res.status(404).send({
        success: false,
        message: "adminId is required in params",
      });
    }

    const [rows] = await db.query(
      `SELECT 
        admins.id, 
        admins.first_name, 
        admins.last_name, 
        admins.email, 
        admins.password, 
        roles.name AS role_name, 
        permissions.section AS permission_section,
        permissions.name AS permission_name
      FROM admins
      LEFT JOIN roles ON admins.role_id = roles.id
      LEFT JOIN role_permissions ON roles.id = role_permissions.role_id
      LEFT JOIN permissions ON role_permissions.permission_id = permissions.id
      WHERE admins.id = ?`,
      [adminId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No admin found",
      });
    }

    const groupedPermissions = rows.reduce((acc, row) => {
      const { permission_section, permission_name } = row;
      if (!acc[permission_section]) {
        acc[permission_section] = [];
      }
      acc[permission_section].push(permission_name);
      return acc;
    }, {});

    const result = {
      id: rows[0].id,
      first_name: rows[0].first_name,
      last_name: rows[0].last_name,
      email: rows[0].email,
      role_name: rows[0].role_name,
      password: rows[0].password,
      permissions: Object.keys(groupedPermissions).map((section) => ({
        section,
        name: groupedPermissions[section],
      })),
    };

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting admin",
      error: error.message,
    });
  }
};

// delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const adminID = req.params.id;
    if (!adminID) {
      return res.status(404).send({
        success: false,
        message: "adminID is reqiured in params",
      });
    }

    const [data] = await db.query(`SELECT * FROM admins WHERE id=? `, [
      adminID,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Admin found",
      });
    }

    if (data[0].role_id == 1) {
      return res.status(403).send({
        success: false,
        message: "Supper Admin role Not be Deleted",
      });
    }

    await db.query(`DELETE FROM admins WHERE id=?`, [adminID]);
    res.status(200).send({
      success: true,
      message: "Admin Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Admin",
      error: error.message,
    });
  }
};

// get admins role
exports.getAllRole = async (req, res) => {
  try {
    const [data] = await db.query(`SELECT * FROM roles`);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Role found",
      });
    }

    res.status(200).send({
      success: false,
      message: "Get All role",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting role",
      error: error.message,
    });
  }
};

// get admins role with permission
exports.getAllRoleWithPermission = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        roles.id AS role_id, 
        roles.name AS role_name, 
        permissions.section AS permission_section, 
        permissions.name AS permission_name
      FROM roles
      LEFT JOIN role_permissions ON roles.id = role_permissions.role_id
      LEFT JOIN permissions ON role_permissions.permission_id = permissions.id`
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No roles found",
      });
    }

    const groupedRoles = rows.reduce((acc, row) => {
      const { role_id, role_name, permission_section, permission_name } = row;

      if (!acc[role_id]) {
        acc[role_id] = {
          role_id,
          role_name,
          permissions: {},
        };
      }

      if (permission_section && permission_name) {
        if (!acc[role_id].permissions[permission_section]) {
          acc[role_id].permissions[permission_section] = [];
        }
        acc[role_id].permissions[permission_section].push(permission_name);
      }

      return acc;
    }, {});

    // Final result formatting
    const result = Object.values(groupedRoles).map((role) => ({
      ...role,
      permissions: Object.keys(role.permissions).map((section) => ({
        section,
        name: role.permissions[section],
      })),
    }));

    res.status(200).send({
      success: true,
      message: "Get all roles with permissions",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting roles",
      error: error.message,
    });
  }
};
