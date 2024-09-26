const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const db = require("../config/db");
dotenv.config();

module.exports = async (req, res, next) => {
  try {
    const token = req.headers?.authorization?.split(" ")?.[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "You are not logged in",
      });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const adminID = decoded.id;

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
        [adminID]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).send({
          success: false,
          message: "Admin not found. Please Login Again",
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

      req.decodedAdmin = result;
      next();
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Invalid Token",
      error: error.message,
    });
  }
};
