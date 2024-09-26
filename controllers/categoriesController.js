const db = require("../config/db");

// create category
exports.createCategory = async (req, res) => {
  try {
    const { category_name, category_image } = req.body;

    // Check if category_name is provided
    if (!category_name || !category_image) {
      return res.status(400).send({
        success: false,
        message: "Please provide category_name & category_image field",
      });
    }

    // Insert category into the database
    const [result] = await db.query(
      "INSERT INTO categories (category_name, category_image) VALUES (?, ?)",
      [category_name, category_image]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert category, please try again",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "Category inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the category",
      error: error.message,
    });
  }
};

// get all category with sub categories
exports.getAllCategoryWithSub = async (req, res) => {
  try {
    // Fetch categories and subcategories using JOIN
    const [categories] = await db.query(`
      SELECT 
        c.id AS category_id, 
        c.category_name, 
        c.category_image, 
        sc.id AS sub_category_id, 
        sc.name AS sub_category_name, 
        sc.image AS sub_category_image 
      FROM categories c
      LEFT JOIN sub_categories sc ON c.id = sc.main_cat_id
      ORDER BY c.id DESC
    `);

    // If no categories found
    if (!categories || categories.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Categories found",
        result: [],
      });
    }

    // Organize the data into categories with subcategories
    const categoryMap = {};
    categories.forEach((row) => {
      const {
        category_id,
        category_name,
        category_image,
        sub_category_id,
        sub_category_name,
        sub_category_image,
      } = row;

      // If the category is not already in the map, add it
      if (!categoryMap[category_id]) {
        categoryMap[category_id] = {
          id: category_id,
          name: category_name,
          image: category_image,
          sub_categories: [],
        };
      }

      // If the row has a subcategory, add it to the category
      if (sub_category_id) {
        categoryMap[category_id].sub_categories.push({
          id: sub_category_id,
          name: sub_category_name,
          image: sub_category_image,
        });
      }
    });

    // Convert the category map to an array
    const result = Object.values(categoryMap);

    // Send success response
    res.status(200).send({
      success: true,
      message: "Categories and Subcategories retrieved successfully",
      totalCategories: result.length,
      data: result,
    });
  } catch (error) {
    // Handle any errors
    res.status(500).send({
      success: false,
      message: "Error in retrieving Categories with Subcategories",
      error: error.message,
    });
  }
};

// get all category
exports.getAllCategory = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM categories  ORDER BY id DESC");
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No Categories found",
        result: data,
      });
    }

    res.status(200).send({
      success: true,
      message: "Get all Categories",
      totalCategories: data.length,
      data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Categories",
      error: error.message,
    });
  }
};

// get single category
exports.getSingleCategory = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Category ID is required",
      });
    }

    const [data] = await db.query("SELECT * FROM categories WHERE id =?", [id]);
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No Category found",
      });
    }

    const [subData] = await db.query(
      "SELECT * FROM sub_categories WHERE main_cat_id =?",
      [id]
    );

    const category = {
      ...data[0], // Spread the main category data
      sub_categories: subData, // Add subcategories as a new property
    };

    res.status(200).send({
      success: true,
      message: "Get Single Category",
      data: category,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get single Category",
      error: error.message,
    });
  }
};

// update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if ID is provided
    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Category ID is required",
      });
    }

    const { category_name, category_image } = req.body;
    // Check if category_name is provided
    if (!category_name) {
      return res.status(400).send({
        success: false,
        message: "Please provide category_name & category_image field",
      });
    }

    const [categoryImage] = await db.query(
      `SELECT category_image FROM categories WHERE id=?`,
      [id]
    );

    let category_images = category_image
      ? category_image
      : categoryImage[0]?.category_image;

    // Execute the update query
    const [result] = await db.query(
      "UPDATE categories SET category_name = ?, category_image = ? WHERE id = ?",
      [category_name, category_images, id]
    );

    // Check if the category was updated successfully
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Category not found or no changes made",
      });
    }

    // Success response
    res.status(200).send({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating Category",
      error: error.message,
    });
  }
};

// delete category
exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Category ID is required",
      });
    }

    // Check if the category exists in the database
    const [category] = await db.query(`SELECT * FROM categories WHERE id = ?`, [
      id,
    ]);

    // If category not found, return 404
    if (category.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    // Proceed to delete the subCategory
    const [subCategory] = await db.query(
      `DELETE FROM sub_categories WHERE main_cat_id = ?`,
      [id]
    );

    // Proceed to delete the category
    const [result] = await db.query(`DELETE FROM categories WHERE id = ?`, [
      id,
    ]);

    // Check if deletion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to delete category",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};
