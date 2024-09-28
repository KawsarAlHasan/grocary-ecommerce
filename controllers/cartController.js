const db = require("../config/db");

// add cart
exports.addCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide user_id, product_id required fields",
      });
    }

    const [result] = await db.query(
      "INSERT INTO Cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
      [user_id, product_id, quantity || 1]
    );

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Product add to cart, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product add to cart successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "An error occurred while product adding cart",
      error: error.message,
    });
  }
};

// get All Cart Products
exports.getAllCartProducts = async (req, res) => {
  try {
    const [data] = await db.query(`SELECT * FROM Cart`);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get Product in cart",
      totalProducts: data.length,
      data: data,
    });
  } catch (error) {
    // Error handling
    res.status(500).send({
      success: false,
      message: "Error in Get All Product in cart",
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

    const { status } = req.body;
    if (!status) {
      return res.status(404).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No user found",
      });
    }

    await db.query(`UPDATE users SET status=?  WHERE id =?`, [status, userId]);

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
