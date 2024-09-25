const db = require("../config/db");
const path = require("path");
const fs = require("fs");

// update app logo
exports.updateAppLogo = async (req, res) => {
  try {
    const images = req.file;
    // Check if the logo file is provided
    if (!images || !images.path) {
      return res.status(400).send({
        success: false,
        message: "Logo is required",
      });
    }

    const logo = `/public/images/${images.filename}`;

    // Execute the update query
    const [result] = await db.query(
      "UPDATE app_logo SET logo= ? WHERE id = ?",
      [logo, 1]
    );

    // Check if the logo was updated successfully
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Logo not changed. Please try again",
      });
    }

    // Success response
    return res.status(200).send({
      success: true,
      message: "Logo updated successfully",
    });
  } catch (error) {
    console.error("Error updating logo:", error); // Log the actual error
    return res.status(500).send({
      success: false,
      message: "An error occurred while updating the logo",
    });
  }
};

// get app logo
exports.getAppLogo = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM app_logo");
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No Logo found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get App Logo",
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get App Logo",
      error: error.message,
    });
  }
};

// update privacy & terms
exports.updatePrivacyTerms = async (req, res) => {
  try {
    const { privacy, terms, about_us, legal } = req.body;

    // Fetch the current settings from the database
    const [data] = await db.query("SELECT * FROM app_settings WHERE id = ?", [
      1,
    ]);

    // Check if the data exists
    if (!data) {
      return res.status(404).send({
        success: false,
        message: "Settings not found",
      });
    }

    // Use the new values if they exist, otherwise use the old values from the database
    const updatedPrivacy = privacy || data[0].privacy;
    const updatedTerms = terms || data[0].terms;
    const updatedAboutUs = about_us || data[0].about_us;
    const updatedLegal = legal || data[0].legal;

    // Execute the update query
    const [result] = await db.query(
      "UPDATE app_settings SET privacy = ?, terms = ?, about_us = ?, legal = ? WHERE id = ?",
      [updatedPrivacy, updatedTerms, updatedAboutUs, updatedLegal, 1]
    );

    // Check if the settings were updated successfully
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Settings not updated. Please try again",
      });
    }

    // Success response
    return res.status(200).send({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error); // Log the actual error
    return res.status(500).send({
      success: false,
      message: "An error occurred while updating the settings",
    });
  }
};

// get privacy & terms
exports.getPrivacyTerms = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM app_settings WHERE id = ?", [
      1,
    ]);
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "privacy & terms is not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get privacy & terms",
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get privacy & terms",
      error: error.message,
    });
  }
};
