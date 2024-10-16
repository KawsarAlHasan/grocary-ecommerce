const nodemailer = require("nodemailer");
require("dotenv").config(); // Make sure to have .env properly configured

// Hostinger SMTP credentials
let transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADD,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send the reset email
const sendResetEmail = async (email, resetCode) => {
  // Email content
  const mailOptions = {
    from: process.env.EMAIL_ADD, // Make sure this matches your "user" in the auth above
    to: email, // Recipient's email address
    subject: "Password Reset Code",
    html: `<p>Your password reset code is <strong>${resetCode}</strong>. The code will expire in 5 minute.</p>`,
  };

  try {
    // Send email and return the result
    const emailResult = await transporter.sendMail(mailOptions);
    return emailResult;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = sendResetEmail;
