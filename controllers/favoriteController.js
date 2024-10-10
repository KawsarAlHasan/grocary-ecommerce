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

// check favorite product
exports.checkFavorite = async (req, res) => {
  try {
    const product_id = req.params.id;
    const user_id = req.decodedUser.id;

    // Execute the query to check if the product is a favorite
    const [data] = await db.query(
      `SELECT * FROM favorite WHERE user_id = ? AND product_id = ?`,
      [user_id, product_id]
    );

    // If no data is returned, it's not a favorite product
    if (data.length === 0) {
      return res.status(200).send({
        message: "This product is not in your favorite",
        favorite: false,
      });
    }

    // If data exists, it's a favorite product
    return res.status(200).send({
      message: "This product is in your favorite",
      favorite: true,
    });
  } catch (error) {
    // Handle errors appropriately
    return res.status(500).send({
      success: false,
      message: "Error in checking favorite product",
      error: error.message,
    });
  }
};

// get all favorite product
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

    const favoritePromises = data.map(async (item) => {
      const [product] = await db.query(`SELECT * FROM products WHERE id = ?`, [
        item.product_id,
      ]);

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
        item.product_discount_price = product[0].discount_price;

        // Fetch images related to the product
        const [images] = await db.query(
          `SELECT id, image_url FROM product_images WHERE product_id = ?`,
          [item.product_id]
        );
        item.images = images.length
          ? images.map((image) => ({
              image_id: image.id,
              image_url: image.image_url,
            }))
          : [];

        // Fetch variants related to the product
        const [variants] = await db.query(
          `SELECT id, variant_name, variant_value FROM product_variants WHERE product_id = ?`,
          [item.product_id]
        );
        item.variants = variants.map((variant) => ({
          variant_id: variant.id,
          variant_name: variant.variant_name,
          variant_value: variant.variant_value,
        }));

        // Fetch subcategories related to the product
        const [subcategories] = await db.query(
          `SELECT * FROM product_sub_categories WHERE product_id = ?`,
          [item.product_id]
        );

        const subcategoryPromises = subcategories.map(async (subCategory) => {
          const [subcategoryDetails] = await db.query(
            `SELECT id, image, name FROM sub_categories WHERE id = ?`,
            [subCategory.sub_category_id]
          );
          return subcategoryDetails.length
            ? {
                subCategory_id: subcategoryDetails[0].id,
                subCategory_image: subcategoryDetails[0].image,
                subCategory_name: subcategoryDetails[0].name,
              }
            : null;
        });

        item.subcategories = await Promise.all(subcategoryPromises);

        // Fetch tags related to the product
        const [tags] = await db.query(
          `SELECT tag_name FROM product_tags WHERE product_id = ?`,
          [item.product_id]
        );
        item.tags = tags.map((tag) => tag.tag_name);
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
        item.images = [];
        item.variants = [];
        item.subcategories = [];
        item.tags = [];
      }
    });

    await Promise.all(favoritePromises);

    res.status(200).send({
      success: true,
      message: "Get all Favorite Products",
      userID: userData[0].id,
      userName: userData[0].name,
      userEmail: userData[0].email,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting all products from Favorite",
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
    const product_id = req.params.id;
    const user_id = req.decodedUser.id;

    // Execute the query to check if the product is a favorite
    const [data] = await db.query(
      `SELECT * FROM favorite WHERE user_id = ? AND product_id = ?`,
      [user_id, product_id]
    );
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Product found from favorite",
      });
    }
    await db.query(
      `DELETE FROM favorite WHERE user_id = ? AND product_id = ?`,
      [user_id, product_id]
    );
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
