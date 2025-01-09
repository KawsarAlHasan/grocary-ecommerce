const db = require("../config/db");

// add cart
exports.addCart = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide product_id required fields",
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
    const user_id = req.decodedUser.id;

    const [cartItems] = await db.query(`SELECT * FROM Cart WHERE user_id = ?`, [
      user_id,
    ]);

    if (cartItems.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found in cart",
      });
    }

    const [userData] = await db.query(
      `SELECT name, email FROM users WHERE id=?`,
      [user_id]
    );

    for (let item of cartItems) {
      const [product] = await db.query(`SELECT * FROM products WHERE id = ?`, [
        item.product_id,
      ]);
      // Check if product data exists
      if (product && product.length > 0) {
        item.product_name = product[0].name;
        item.product_type = product[0].product_type;
        item.product_unit = product[0].unit;
        item.product_tax = product[0].tax;
        item.product_is_stock = product[0].is_stock;
        item.product_purchase_price = product[0].purchase_price;
        item.product_regular_price = product[0].regular_price;
        item.product_selling_price = product[0].selling_price;
        item.product_whole_price = product[0].whole_price;
        item.product_supper_marcent = product[0].supper_marcent;

        // Fetch images related to the product from product_images table
        const [images] = await db.query(
          `SELECT image_url FROM product_images WHERE product_id = ?`,
          [item.product_id]
        );

        // Assign the image URLs to the item
        item.product_images = images[0]?.image_url;
      } else {
        // If product data is missing, provide default or skip setting it
        item.product_name = null;
        item.product_type = null;
        item.product_unit = null;
        item.product_tax = null;
        item.product_is_stock = null;
        item.product_purchase_price = null;
        item.product_regular_price = null;
        item.product_selling_price = null;
        item.product_whole_price = null;
        item.product_discount_price = null;
        item.product_supper_marcent = null;
        item.product_images = null; // Default to empty array if no images are found
      }
    }

    res.status(200).send({
      success: true,
      message: "Products retrieved from cart",
      userName: userData[0].name,
      userEmail: userData[0].email,
      totalProducts: cartItems.length,
      data: cartItems,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error retrieving products from cart",
      error: error.message,
    });
  }
};

// delete All product from cart
exports.deleteAllProductFromCart = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [data] = await db.query(`SELECT * FROM Cart WHERE user_id=? `, [
      user_id,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found from cart",
      });
    }
    await db.query(`DELETE FROM Cart WHERE user_id=?`, [user_id]);
    res.status(200).send({
      success: true,
      message: "Delete all product from cart",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in delete all product from cart",
      error: error.message,
    });
  }
};

// delete Single product from cart
exports.deleteSingleProductFromCart = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(`SELECT * FROM Cart WHERE id=? `, [id]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found from cart",
      });
    }
    await db.query(`DELETE FROM Cart WHERE id=?`, [id]);
    res.status(200).send({
      success: true,
      message: "Delete Single product from cart",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in delete Single product from cart",
      error: error.message,
    });
  }
};
