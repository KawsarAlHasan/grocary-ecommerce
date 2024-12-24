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
      supper_marcent,
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
      "INSERT INTO products (category_id, name, product_type, unit, long_description, short_description, tax, country, purchase_price, regular_price, selling_price, whole_price, discount_price, supper_marcent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        supper_marcent || 0,
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
    // Extract search, filter, page, and limit criteria from query parameters
    const {
      name,
      tag,
      subcategory,
      category,
      page = 1,
      limit = 50,
    } = req.query;

    // Calculate the offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build the base query
    let productQuery = `
      SELECT 
        p.*,  
        c.category_image, 
        c.category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
    `;

    // Add search and filter conditions dynamically
    if (name) {
      productQuery += ` AND p.name LIKE '%${name}%'`;
    }

    if (category) {
      productQuery += ` AND c.category_name LIKE '%${category}%'`;
    }

    if (subcategory) {
      productQuery += ` AND sc.name LIKE '%${subcategory}%'`;
    }

    if (tag) {
      productQuery += ` AND pt.tag_name LIKE '%${tag}%'`;
    }

    // Add LIMIT and OFFSET for pagination
    productQuery += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    // Execute the query
    const [products] = await db.query(productQuery);

    if (!products.length) {
      return res.status(404).send({
        success: false,
        message: "No products found",
      });
    }

    // Process each product for images, variants, subcategories, and tags
    const productPromises = products.map(async (product) => {
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

      const [variants] = await db.query(
        `SELECT id, variant_name, variant_value FROM product_variants WHERE product_id = ?`,
        [product.id]
      );
      product.variants = variants.map((variant) => ({
        variant_id: variant.id,
        variant_name: variant.variant_name,
        variant_value: variant.variant_value,
      }));

      const [subcategories] = await db.query(
        `SELECT * FROM product_sub_categories WHERE product_id = ?`,
        [product.id]
      );

      const subcategoryPromises = subcategories.map(async (subCategory) => {
        const [subcategoryDetails] = await db.query(
          `SELECT id, image, name
           FROM sub_categories 
           WHERE id = ?`,
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

      product.subcategories = await Promise.all(subcategoryPromises);

      const [tags] = await db.query(
        `SELECT tag_name FROM product_tags WHERE product_id = ?`,
        [product.id]
      );
      product.tags = tags.map((tag) => tag.tag_name);

      return product;
    });

    const allProducts = await Promise.all(productPromises);

    // Fetch the total number of products for pagination purposes
    const [totalProductsResult] = await db.query(`
      SELECT COUNT(*) as totalProducts
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
      ${name ? `AND p.name LIKE '%${name}%'` : ""}
      ${category ? `AND c.category_name LIKE '%${category}%'` : ""}
      ${subcategory ? `AND sc.name LIKE '%${subcategory}%'` : ""}
      ${tag ? `AND pt.tag_name LIKE '%${tag}%'` : ""}
    `);

    const totalProducts = totalProductsResult[0].totalProducts;

    // Send the product data with pagination info
    res.status(200).send({
      success: true,
      message: "Products retrieved successfully",
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      data: allProducts,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the products",
      error: error.message,
    });
  }
};

// get new all products
exports.getNewAllProducts = async (req, res) => {
  try {
    // Extract search, filter, page, and limit criteria from query parameters
    const {
      name,
      tag,
      subcategory,
      category,
      page = 1,
      limit = 50,
    } = req.query;

    // Calculate the offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build the base query
    let productQuery = `
      SELECT 
        p.*,  
        c.category_image, 
        c.category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
    `;

    // Add search and filter conditions dynamically
    if (name) {
      productQuery += ` AND p.name LIKE '%${name}%'`;
    }

    if (category) {
      productQuery += ` AND c.category_name LIKE '%${category}%'`;
    }

    if (subcategory) {
      productQuery += ` AND sc.name LIKE '%${subcategory}%'`;
    }

    if (tag) {
      productQuery += ` AND pt.tag_name LIKE '%${tag}%'`;
    }

    // Add LIMIT and OFFSET for pagination
    productQuery += ` ORDER BY p.id DESC LIMIT ${parseInt(
      limit
    )} OFFSET ${offset}`;

    // Execute the query
    const [products] = await db.query(productQuery);

    if (!products.length) {
      return res.status(404).send({
        success: false,
        message: "No products found",
      });
    }

    // Process each product for images, variants, subcategories, and tags
    const productPromises = products.map(async (product) => {
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

      const [variants] = await db.query(
        `SELECT id, variant_name, variant_value FROM product_variants WHERE product_id = ?`,
        [product.id]
      );
      product.variants = variants.map((variant) => ({
        variant_id: variant.id,
        variant_name: variant.variant_name,
        variant_value: variant.variant_value,
      }));

      const [subcategories] = await db.query(
        `SELECT * FROM product_sub_categories WHERE product_id = ?`,
        [product.id]
      );

      const subcategoryPromises = subcategories.map(async (subCategory) => {
        const [subcategoryDetails] = await db.query(
          `SELECT id, image, name
           FROM sub_categories 
           WHERE id = ?`,
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

      product.subcategories = await Promise.all(subcategoryPromises);

      const [tags] = await db.query(
        `SELECT tag_name FROM product_tags WHERE product_id = ?`,
        [product.id]
      );
      product.tags = tags.map((tag) => tag.tag_name);

      return product;
    });

    const allProducts = await Promise.all(productPromises);

    // Fetch the total number of products for pagination purposes
    const [totalProductsResult] = await db.query(`
      SELECT COUNT(*) as totalProducts
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
      ${name ? `AND p.name LIKE '%${name}%'` : ""}
      ${category ? `AND c.category_name LIKE '%${category}%'` : ""}
      ${subcategory ? `AND sc.name LIKE '%${subcategory}%'` : ""}
      ${tag ? `AND pt.tag_name LIKE '%${tag}%'` : ""}
    `);

    const totalProducts = totalProductsResult[0].totalProducts;

    // Send the product data with pagination info
    res.status(200).send({
      success: true,
      message: "Products retrieved successfully",
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      data: allProducts,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the products",
      error: error.message,
    });
  }
};

// get all products
exports.getAllProductsWithOutPage = async (req, res) => {
  try {
    // Extract search, filter, page, and limit criteria from query parameters
    const {
      name,
      tag,
      subcategory,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    // Calculate the offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build the base query
    let productQuery = `
      SELECT 
        p.*,  
        c.category_image, 
        c.category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
    `;

    // Add search and filter conditions dynamically
    if (name) {
      productQuery += ` AND p.name LIKE '%${name}%'`;
    }

    if (category) {
      productQuery += ` AND c.category_name LIKE '%${category}%'`;
    }

    if (subcategory) {
      productQuery += ` AND sc.name LIKE '%${subcategory}%'`;
    }

    if (tag) {
      productQuery += ` AND pt.tag_name LIKE '%${tag}%'`;
    }

    // Add LIMIT and OFFSET for pagination
    productQuery += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    // Execute the query
    const [products] = await db.query(productQuery);

    if (!products.length) {
      return res.status(404).send({
        success: false,
        message: "No products found",
      });
    }

    // Process each product for images, variants, subcategories, and tags
    const productPromises = products.map(async (product) => {
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

      const [variants] = await db.query(
        `SELECT id, variant_name, variant_value FROM product_variants WHERE product_id = ?`,
        [product.id]
      );
      product.variants = variants.map((variant) => ({
        variant_id: variant.id,
        variant_name: variant.variant_name,
        variant_value: variant.variant_value,
      }));

      const [subcategories] = await db.query(
        `SELECT * FROM product_sub_categories WHERE product_id = ?`,
        [product.id]
      );

      const subcategoryPromises = subcategories.map(async (subCategory) => {
        const [subcategoryDetails] = await db.query(
          `SELECT id, image, name
           FROM sub_categories 
           WHERE id = ?`,
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

      product.subcategories = await Promise.all(subcategoryPromises);

      const [tags] = await db.query(
        `SELECT tag_name FROM product_tags WHERE product_id = ?`,
        [product.id]
      );
      product.tags = tags.map((tag) => tag.tag_name);

      return product;
    });

    const allProducts = await Promise.all(productPromises);

    // Fetch the total number of products for pagination purposes
    const [totalProductsResult] = await db.query(`
      SELECT COUNT(*) as totalProducts
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
      ${name ? `AND p.name LIKE '%${name}%'` : ""}
      ${category ? `AND c.category_name LIKE '%${category}%'` : ""}
      ${subcategory ? `AND sc.name LIKE '%${subcategory}%'` : ""}
      ${tag ? `AND pt.tag_name LIKE '%${tag}%'` : ""}
    `);

    const totalProducts = totalProductsResult[0].totalProducts;

    // Send the product data with pagination info
    res.status(200).send({
      success: true,
      message: "Products retrieved successfully",
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      data: allProducts,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the products",
      error: error.message,
    });
  }
};

// get new all products
exports.getNewAllProductsWithOutPage = async (req, res) => {
  try {
    // Extract search, filter, page, and limit criteria from query parameters
    const {
      name,
      tag,
      subcategory,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    // Calculate the offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build the base query
    let productQuery = `
      SELECT 
        p.*,  
        c.category_image, 
        c.category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
    `;

    // Add search and filter conditions dynamically
    if (name) {
      productQuery += ` AND p.name LIKE '%${name}%'`;
    }

    if (category) {
      productQuery += ` AND c.category_name LIKE '%${category}%'`;
    }

    if (subcategory) {
      productQuery += ` AND sc.name LIKE '%${subcategory}%'`;
    }

    if (tag) {
      productQuery += ` AND pt.tag_name LIKE '%${tag}%'`;
    }

    // Add LIMIT and OFFSET for pagination
    productQuery += ` ORDER BY p.id DESC LIMIT ${parseInt(
      limit
    )} OFFSET ${offset}`;

    // Execute the query
    const [products] = await db.query(productQuery);

    if (!products.length) {
      return res.status(404).send({
        success: false,
        message: "No products found",
      });
    }

    // Process each product for images, variants, subcategories, and tags
    const productPromises = products.map(async (product) => {
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

      const [variants] = await db.query(
        `SELECT id, variant_name, variant_value FROM product_variants WHERE product_id = ?`,
        [product.id]
      );
      product.variants = variants.map((variant) => ({
        variant_id: variant.id,
        variant_name: variant.variant_name,
        variant_value: variant.variant_value,
      }));

      const [subcategories] = await db.query(
        `SELECT * FROM product_sub_categories WHERE product_id = ?`,
        [product.id]
      );

      const subcategoryPromises = subcategories.map(async (subCategory) => {
        const [subcategoryDetails] = await db.query(
          `SELECT id, image, name
           FROM sub_categories 
           WHERE id = ?`,
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

      product.subcategories = await Promise.all(subcategoryPromises);

      const [tags] = await db.query(
        `SELECT tag_name FROM product_tags WHERE product_id = ?`,
        [product.id]
      );
      product.tags = tags.map((tag) => tag.tag_name);

      return product;
    });

    const allProducts = await Promise.all(productPromises);

    // Fetch the total number of products for pagination purposes
    const [totalProductsResult] = await db.query(`
      SELECT COUNT(*) as totalProducts
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sub_categories psc ON p.id = psc.product_id
      LEFT JOIN sub_categories sc ON psc.sub_category_id = sc.id
      LEFT JOIN product_tags pt ON p.id = pt.product_id
      WHERE 1 = 1
      ${name ? `AND p.name LIKE '%${name}%'` : ""}
      ${category ? `AND c.category_name LIKE '%${category}%'` : ""}
      ${subcategory ? `AND sc.name LIKE '%${subcategory}%'` : ""}
      ${tag ? `AND pt.tag_name LIKE '%${tag}%'` : ""}
    `);

    const totalProducts = totalProductsResult[0].totalProducts;

    // Send the product data with pagination info
    res.status(200).send({
      success: true,
      message: "Products retrieved successfully",
      totalProducts: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      data: allProducts,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the products",
      error: error.message,
    });
  }
};

// get random products
exports.getRandomProducts = async (req, res) => {
  try {
    // Query to get all products along with their images, subcategories, variants, and tags
    const productQuery = `
      SELECT 
        p.*,  
        c.category_image, 
        c.category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id ORDER BY RAND() LIMIT 10`;
    const [products] = await db.query(productQuery);

    if (!products.length) {
      return res.status(404).send({
        success: false,
        message: "No products found",
      });
    }

    // Loop through each product and process images, variants, subcategories, and tags in parallel
    const productPromises = products.map(async (product) => {
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
        `SELECT * FROM product_sub_categories WHERE product_id = ?`,
        [product.id]
      );

      // Map through subcategories and fetch detailed subcategory info from sub_categories table
      const subcategoryPromises = subcategories.map(async (subCategory) => {
        const [subcategoryDetails] = await db.query(
          `SELECT id, image, name
           FROM sub_categories 
           WHERE id = ?`,
          [subCategory.sub_category_id]
        );

        // If subcategory details are found, map them
        return subcategoryDetails.length
          ? {
              subCategory_id: subcategoryDetails[0].id,
              subCategory_image: subcategoryDetails[0].image,
              subCategory_name: subcategoryDetails[0].name,
            }
          : null;
      });

      // Resolve all subcategory details in parallel
      product.subcategories = await Promise.all(subcategoryPromises);

      // Fetch tags for the product
      const [tags] = await db.query(
        `SELECT tag_name FROM product_tags WHERE product_id = ?`,
        [product.id]
      );
      product.tags = tags.map((tag) => tag.tag_name);

      return product;
    });

    // Resolve all product data
    const allProducts = await Promise.all(productPromises);

    // Send the product data
    res.status(200).send({
      success: true,
      message: "Random Products retrieved successfully",
      totalProducts: allProducts.length,
      data: allProducts,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching random products",
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

    // Fetch detailed subcategory information for each subcategory
    const subcategoryPromises = subcategories.map(async (subCategory) => {
      const [subcategoryDetails] = await db.query(
        `SELECT id, image, name FROM sub_categories WHERE id = ?`,
        [subCategory.sub_category_id]
      );

      // Map the subcategory details, or return null if not found
      return subcategoryDetails.length
        ? {
            subCategory_id: subcategoryDetails[0].id,
            subCategory_image: subcategoryDetails[0].image,
            subCategory_name: subcategoryDetails[0].name,
          }
        : null;
    });

    // Wait for all subcategory details to be fetched
    const detailedSubcategories = await Promise.all(subcategoryPromises);

    // Filter out any null values (in case some subcategories were not found)
    const filteredSubcategories = detailedSubcategories.filter(Boolean);

    // Fetch tags for the product
    const [tags] = await db.query(
      `SELECT tag_name FROM product_tags WHERE product_id = ?`,
      [id]
    );

    // Assemble the final product object with all details
    const product = {
      ...data[0],
      images,
      variants,
      subcategories: filteredSubcategories,
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
      supper_marcent,
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
        discount_price = ?,
        supper_marcent = ?
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
        supper_marcent || product[0].supper_marcent,
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

// product update
exports.updateProductUCS = async (req, res) => {
  console.log("hello");
  try {
    const productId = req.params.id;
    const { unit, is_stock, country, status } = req.body;

    console.log(status, "status");

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
      `UPDATE products SET unit=?, is_stock=?, country=?, status=? WHERE id = ?`,
      [
        unit || product[0].unit,
        is_stock || product[0].is_stock,
        country || product[0].country,
        status || product[0].status,
        productId,
      ]
    );

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
