const db = require("../config/db");

// create delivery address
exports.createDeliveryAddress = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const { phone, contact, address, address_type, city, post_code, message } =
      req.body;

    // Check if category_name is provided
    if (!address || !phone) {
      return res.status(400).send({
        success: false,
        message: "Please provide phone & address field",
      });
    }

    // Insert category into the database
    const [result] = await db.query(
      "INSERT INTO user_delivery_address (user_id, phone, contact, address, address_type, city, post_code,message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        phone,
        contact || "",
        address,
        address_type || "",
        city || "",
        post_code || "",
        message || "",
      ]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert delivery address, please try again",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "delivery address inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the delivery address",
      error: error.message,
    });
  }
};

// get my delivery address
exports.getMyDeliveryAddress = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [data] = await db.query(
      "SELECT * FROM user_delivery_address WHERE user_id =?",
      [user_id]
    );
    if (!data || data.length == 0) {
      return res.status(400).send({
        success: true,
        message: "No Data found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get my delivery address",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get my delivery address",
      error: error.message,
    });
  }
};

// update delivery address
exports.updateDeliveryAddress = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(
      "SELECT * FROM user_delivery_address WHERE id = ?",
      [id]
    );

    if (!data || data.length == 0) {
      return res.status(400).send({
        success: true,
        message: "No Data Found",
      });
    }

    const { phone, contact, address, address_type, city, post_code, message } =
      req.body;

    // Execute the update query
    const [result] = await db.query(
      "UPDATE user_delivery_address SET phone=?, contact=?, address=?, address_type=?, city=?, post_code=?, message=? WHERE id = ?",
      [
        phone || data[0].phone,
        contact || data[0].contact,
        address || data[0].address,
        address_type || data[0].address_type,
        city || data[0].city,
        post_code || data[0].post_code,
        message || data[0].message,
        id,
      ]
    );

    // Check if the Delivery address was updated successfully
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Delivery address not found or no changes made",
      });
    }

    // Success response
    res.status(200).send({
      success: true,
      message: "Delivery address updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating Delivery address",
      error: error.message,
    });
  }
};

// delete delivery address
exports.deleteDeliveryAddress = async (req, res) => {
  try {
    const deliveryId = req.params.id;

    const [data] = await db.query(
      "SELECT * FROM user_delivery_address WHERE id = ?",
      [deliveryId]
    );

    if (!data || data.length == 0) {
      return res.status(400).send({
        success: true,
        message: "No Data Found",
      });
    }

    await db.query("DELETE FROM user_delivery_address WHERE id=?", [
      deliveryId,
    ]);

    // Success response
    res.status(200).send({
      success: true,
      message: "Delivery address delete successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting Delivery address",
      error: error.message,
    });
  }
};

// for admin
// create delivery address
exports.createDeliveryAddressForAdmin = async (req, res) => {
  try {
    const user_id = req.params.id;

    const { phone, contact, address, address_type, city, post_code, message } =
      req.body;

    // Check if category_name is provided
    if (!address || !phone) {
      return res.status(400).send({
        success: false,
        message: "Please provide phone & address field",
      });
    }

    // Insert category into the database
    const [result] = await db.query(
      "INSERT INTO user_delivery_address (user_id, phone, contact, address, address_type, city, post_code,message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        phone,
        contact || "",
        address,
        address_type || "",
        city || "",
        post_code || "",
        message || "",
      ]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert delivery address, please try again",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "delivery address inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the delivery address",
      error: error.message,
    });
  }
};

// get delivery address
exports.getMyDeliveryAddressForAdmin = async (req, res) => {
  try {
    const user_id = req.params.id;

    const [data] = await db.query(
      "SELECT * FROM user_delivery_address WHERE user_id =?",
      [user_id]
    );
    if (!data || data.length == 0) {
      return res.status(400).send({
        success: true,
        message: "No Data found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get my delivery address",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get my delivery address",
      error: error.message,
    });
  }
};
