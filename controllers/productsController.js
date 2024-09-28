const db = require("../config/db");

// create Products
exports.createProducts = async (req, res) => {
  try {
    const {
      category_id,
      name,
      product_type,
      unit,
      long_description,
      short_description,
      tax,
      country,
      purchase_price,
      regular_price,
      selling_price,
      whole_price,
      discount_price,
      images,
      variants,
      subcategories,
      tags,
    } = req.body;

    // Check if name is provided
    if (!category_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide category_id is required in body",
      });
    }

    // Insert Product into the database
    const [result] = await db.query(
      "INSERT INTO products (category_id, name, product_type, unit, long_description, short_description, tax, country, purchase_price, regular_price, selling_price, whole_price, discount_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        category_id,
        name || null,
        product_type || null,
        unit || null,
        long_description || null,
        short_description || null,
        tax || null,
        country || null,
        purchase_price || null,
        regular_price || null,
        selling_price || null,
        whole_price || null,
        discount_price || null,
      ]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Product, please try again",
      });
    }

    const productId = result.insertId;

    // Insert images
    if (images && images.length > 0) {
      const imagesQuery =
        "INSERT INTO product_images (product_id, image_url) VALUES ?";
      const imagesValue = images.map((image) => [productId, image]);

      await db.query(imagesQuery, [imagesValue]);
    }

    // Insert subcategories if present
    if (subcategories && subcategories.length > 0) {
      const subCategoryQuery =
        "INSERT INTO product_sub_categories (product_id, sub_category_id) VALUES ?";
      const subCategoryValues = subcategories.map((subCategoryId) => [
        productId,
        subCategoryId,
      ]);

      await db.query(subCategoryQuery, [subCategoryValues]);
    }

    // Insert variants
    if (variants) {
      const variantQuery =
        "INSERT INTO product_variants (product_id, variant_name, variant_value) VALUES ?";
      const variantValue = variants.map((variant) => [
        productId,
        variant.variant_name,
        variant.variant_value,
      ]);

      await db.query(variantQuery, [variantValue]);
    }

    // Insert tags
    if (tags && tags.length > 0) {
      const tagsQuery =
        "INSERT INTO product_tags (product_id, tag_name) VALUES ?";
      const tagsValue = tags.map((tag) => [productId, tag]);
      await db.query(tagsQuery, [tagsValue]);
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "Product inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the Product",
      error: error.message,
    });
  }
};

// get all products
exports.getAllProducts = async (req, res) => {
  try {
    // Query to get all products along with their images, subcategories, variants, and tags
    const productQuery = `
      SELECT 
        p.*,  
        c.category_image, 
        c.category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `;

    const [products] = await db.query(productQuery);

    if (!products.length) {
      return res.status(404).send({
        success: false,
        message: "No products found",
      });
    }

    // Loop through each product to add images, variants, subcategories, and tags
    for (const product of products) {
      // Fetch images for the product
      const [images] = await db.query(
        `SELECT id, image_url FROM product_images WHERE product_id = ?`,
        [product.id]
      );
      product.images = images.length
        ? images.map((image) => ({
            image_id: image.id,
            image_url: image.image_url,
          }))
        : [];

      // Fetch variants for the product
      const [variants] = await db.query(
        `SELECT id, variant_name, variant_value FROM product_variants WHERE product_id = ?`,
        [product.id]
      );
      product.variants = variants.map((variant) => ({
        variant_id: variant.id,
        variant_name: variant.variant_name,
        variant_value: variant.variant_value,
      }));

      // Fetch subcategories for the product
      const [subcategories] = await db.query(
        `SELECT sub_category_id FROM product_sub_categories WHERE product_id = ?`,
        [product.id]
      );
      product.subcategories = subcategories.map(
        (subCategory) => subCategory.sub_category_id
      );

      // Fetch tags for the product
      const [tags] = await db.query(
        `SELECT tag_name FROM product_tags WHERE product_id = ?`,
        [product.id]
      );
      product.tags = tags.map((tag) => tag.tag_name);
    }

    // Send the product data
    res.status(200).send({
      success: true,
      message: "Products retrieved successfully",
      totalProducts: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the products",
      error: error.message,
    });
  }
};

// get single Product
exports.getSingleProduct = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Product ID is required",
      });
    }

    const [data] = await db.query("SELECT * FROM products WHERE id =?", [id]);
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No Product found",
      });
    }

    const [images] = await db.query(
      `SELECT image_url FROM product_images WHERE product_id = ?`,
      [id]
    );

    // Fetch variants for the product
    const [variants] = await db.query(
      `SELECT variant_name, variant_value FROM product_variants WHERE product_id = ?`,
      [id]
    );

    // Fetch subcategories for the product
    const [subcategories] = await db.query(
      `SELECT sub_category_id FROM product_sub_categories WHERE product_id = ?`,
      [id]
    );

    // Fetch tags for the product
    const [tags] = await db.query(
      `SELECT tag_name FROM product_tags WHERE product_id = ?`,
      [id]
    );

    const product = {
      ...data[0],
      images,
      variants,
      subcategories,
      tags,
    };

    res.status(200).send({
      success: true,
      message: "Get Single product",
      data: product,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get single product",
      error: error.message,
    });
  }
};

// product update
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      category_id,
      name,
      product_type,
      unit,
      long_description,
      short_description,
      tax,
      country,
      purchase_price,
      regular_price,
      selling_price,
      whole_price,
      discount_price,
      images,
      variants,
      subcategories,
      tags,
    } = req.body;

    // Check if the product exists
    const [product] = await db.query("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);

    if (product.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Update the product information
    await db.query(
      `UPDATE products SET 
      category_id =?,
        name = ?,
        product_type = ?,
        unit = ?,
        long_description = ?,
        short_description = ?,
        tax = ?,
        country = ?,
        purchase_price = ?,
        regular_price = ?,
        selling_price = ?,
        whole_price = ?,
        discount_price = ?
      WHERE id = ?`,
      [
        category_id || product[0].category_id,
        name || product[0].name,
        product_type || product[0].product_type,
        unit || product[0].unit,
        long_description || product[0].long_description,
        short_description || product[0].short_description,
        tax || product[0].tax,
        country || product[0].country,
        purchase_price || product[0].purchase_price,
        regular_price || product[0].regular_price,
        selling_price || product[0].selling_price,
        whole_price || product[0].whole_price,
        discount_price || product[0].discount_price,
        productId,
      ]
    );

    // Update images
    if (images && images.length > 0) {
      // Delete existing images
      await db.query("DELETE FROM product_images WHERE product_id = ?", [
        productId,
      ]);

      const imagesQuery =
        "INSERT INTO product_images (product_id, image_url) VALUES ?";
      const imagesValue = images.map((image) => [productId, image]);

      await db.query(imagesQuery, [imagesValue]);
    }

    // Update subcategories
    if (subcategories && subcategories.length > 0) {
      // Delete existing subcategories
      await db.query(
        "DELETE FROM product_sub_categories WHERE product_id = ?",
        [productId]
      );

      // Insert new subcategories
      const subCategoryQuery =
        "INSERT INTO product_sub_categories (product_id, sub_category_id) VALUES ?";
      const subCategoryValues = subcategories.map((subCategoryId) => [
        productId,
        subCategoryId,
      ]);
      await db.query(subCategoryQuery, [subCategoryValues]);
    }

    // Update variants
    if (variants && variants.length > 0) {
      // Delete existing variants
      await db.query("DELETE FROM product_variants WHERE product_id = ?", [
        productId,
      ]);

      // Insert new variants
      const variantQuery =
        "INSERT INTO product_variants (product_id, variant_name, variant_value) VALUES ?";
      const variantValues = variants.map((variant) => [
        productId,
        variant.variant_name,
        variant.variant_value,
      ]);
      await db.query(variantQuery, [variantValues]);
    }

    // Update tags
    if (tags && tags.length > 0) {
      // Delete existing tags
      await db.query("DELETE FROM product_tags WHERE product_id = ?", [
        productId,
      ]);

      // Insert new tags
      const tagsQuery =
        "INSERT INTO product_tags (product_id, tag_name) VALUES ?";
      const tagsValues = tags.map((tag) => [productId, tag]);
      await db.query(tagsQuery, [tagsValues]);
    }

    res.status(200).send({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while updating the product",
      error: error.message,
    });
  }
};

// delete product
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Product ID is required",
      });
    }

    // Check if the Product exists in the database
    const [product] = await db.query(`SELECT * FROM products WHERE id = ?`, [
      id,
    ]);

    // If product not found, return 404
    if (product.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Fetch product images before deleting them
    await db.query(
      `SELECT image_url FROM product_images WHERE product_id = ?`,
      [id]
    );

    // Proceed to delete the images from the database
    await db.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);

    // Proceed to delete the variants
    await db.query(`DELETE FROM product_variants WHERE product_id = ?`, [id]);

    // Proceed to delete the Tags
    await db.query(`DELETE FROM product_tags WHERE product_id = ?`, [id]);

    // Proceed to delete the subcategory
    await db.query(`DELETE FROM product_sub_categories WHERE product_id = ?`, [
      id,
    ]);

    // Proceed to delete the Product
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [id]);

    // Check if deletion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to delete Product",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting Product",
      error: error.message,
    });
  }
};

// create post code
exports.createPostCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).send({
        success: false,
        message: "Please provide code field",
      });
    }

    const [result] = await db.query("INSERT INTO post_code (code) VALUES (?)", [
      code,
    ]);

    if (!result.insertId) {
      return res.status(400).send({
        success: false,
        message: "Something went wrong",
      });
    }

    res.status(200).send({
      success: true,
      message: "Post code inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the Post code",
      error: error.message,
    });
  }
};

// get all post code
exports.getAllPostCode = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM post_code");
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No post code found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Post code Get successfully",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while geting the Post code",
      error: error.message,
    });
  }
};

// delete post code
exports.deletePostCode = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Post code ID is required",
      });
    }
    const [data] = await db.query("SELECT * FROM post_code WHERE id =?", [id]);
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No post code found",
      });
    }

    await db.query(`DELETE FROM post_code WHERE id = ?`, [id]);

    res.status(200).send({
      success: true,
      message: "Post code deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error in deleting Post code",
      error: error.message,
    });
  }
};
