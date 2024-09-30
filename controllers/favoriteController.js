const db = require("../config/db");

// add favorite
exports.addFavorite = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide product_id required fields",
      });
    }

    const [result] = await db.query(
      "INSERT INTO favorite (user_id, product_id) VALUES (?, ?)",
      [user_id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Product add to favorite, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product add to favorite successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "An error occurred while product adding favorite",
      error: error.message,
    });
  }
};

exports.getAllFavoriteProduct = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [data] = await db.query(`SELECT * FROM favorite WHERE user_id = ?`, [
      user_id,
    ]);

    if (!data || data.length == 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found in Favorite Product",
        data: data,
      });
    }

    const [userData] = await db.query(
      `SELECT id, name, email FROM users WHERE id=?`,
      [user_id]
    );

    for (let item of data) {
      const [product] = await db.query(`SELECT * FROM products WHERE id = ?`, [
        item.product_id,
      ]);
      item.product_name = product[0].name;
      item.product_type = product[0].product_type;
      item.product_unit = product[0].unit;
      item.product_tax = product[0].tax;
      item.product_is_stock = product[0].is_stock;
      item.product_purchase_price = product[0].purchase_price;
      item.product_regular_price = product[0].regular_price;
      item.product_selling_price = product[0].selling_price;
      item.product_whole_price = product[0].whole_price;
      item.product_discount_price = product[0].discount_price;
    }

    res.status(200).send({
      success: true,
      message: "Get all Product in Cart",
      userID: userData[0].id,
      userName: userData[0].name,
      userEmail: userData[0].email,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting all product from Favorite",
      error: error.message,
    });
  }
};

// delete All product from Favorite
exports.deleteAllProductFromFavorite = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [data] = await db.query(`SELECT * FROM favorite WHERE user_id=? `, [
      user_id,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found from favorite",
      });
    }
    await db.query(`DELETE FROM favorite WHERE user_id=?`, [user_id]);
    res.status(200).send({
      success: true,
      message: "Delete all product from favorite",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in delete all product from favorite",
      error: error.message,
    });
  }
};

// delete Single product from Favorite
exports.deleteSingleProductFromFavorite = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(`SELECT * FROM favorite WHERE id=? `, [id]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found from favorite",
      });
    }
    await db.query(`DELETE FROM favorite WHERE id=?`, [id]);
    res.status(200).send({
      success: true,
      message: "Delete Single product from favorite",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in delete Single product from favorite",
      error: error.message,
    });
  }
};
