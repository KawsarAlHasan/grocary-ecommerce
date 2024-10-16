const db = require("../config/db");
const express = require("express");
const bcrypt = require("bcrypt");
const sendResetEmail = require("../middleware/forgotEmail");
const router = express.Router();

// Step 1: Request to send reset code
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(404).send({
      success: false,
      message: "Email is required",
    });
  }

  try {
    // Check if email exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No user with this email",
      });
    }

    // Previus reset code delete
    await db.query("DELETE FROM password_resets WHERE email = ?", [email]);

    // Generate a 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpire = new Date(Date.now() + 300000); // 5 minute expiration

    // Insert into password_resets table
    await db.query(
      "INSERT INTO password_resets (email, reset_code, reset_code_expire) VALUES (?, ?, ?)",
      [email, resetCode, codeExpire]
    );

    // Send email with the reset code using the middleware function
    await sendResetEmail(email, resetCode);

    res.status(200).send({
      success: true,
      message: "Reset code sent to email",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Step 2: Verify reset code
router.post("/verify-reset-code", async (req, res) => {
  const { email, resetCode } = req.body;

  if (!email || !resetCode) {
    return res.status(404).send({
      success: false,
      message: "email & resetCode is required",
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND reset_code_expire > NOW()",
      [email, resetCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    res.status(200).json({
      success: true,
      message: "Valid reset code",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Step 3: Verify reset code and allow user to reset password
router.post("/new-password", async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    return res.status(404).send({
      success: false,
      message: "email, resetCode & newPassword is required",
    });
  }

  try {
    // Verify the reset code and check if it is not expired
    const [rows] = await db.query(
      "SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND reset_code_expire > NOW()",
      [email, resetCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the users table
    await db.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    // Delete the used reset request from password_resets table
    await db.query("DELETE FROM password_resets WHERE email = ?", [email]);

    res.status(200).json({
      success: true,
      message: "Password successfully reset",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
