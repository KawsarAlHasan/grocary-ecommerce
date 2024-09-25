const db = require("../config/db");

// create Subcategory
exports.createSubCategory = async (req, res) => {
  try {
    const { main_cat_id, name } = req.body;

    // Check if category_name is provided
    if (!main_cat_id || !name) {
      return res.status(400).send({
        success: false,
        message: "Please provide main_cat_id & name field",
      });
    }

    const images = req.file;
    let image = "";
    if (images && images.path) {
      image = `/public/images/${images.filename}`;
    }

    // Insert category into the database
    const [result] = await db.query(
      "INSERT INTO sub_categories (main_cat_id, image, name) VALUES (?, ?, ?)",
      [main_cat_id, image, name]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Sub category, please try again",
      });
    }

    // Send success response
    res.status(201).send({
      success: true,
      message: "Sub Category inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the Sub category",
      error: error.message,
    });
  }
};

// get single sub category
exports.getSingleSubCategory = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Sub Category ID is required",
      });
    }

    const [data] = await db.query("SELECT * FROM sub_categories WHERE id =?", [
      id,
    ]);
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No sub Category found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get Single sub Category",
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get single sub Category",
      error: error.message,
    });
  }
};

// update Sub category
exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is provided
    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Sub Category ID is required",
      });
    }

    // Check if sub-category exists
    const [existingSubCategory] = await db.query(
      "SELECT * FROM sub_categories WHERE id = ?",
      [id]
    );

    if (!existingSubCategory || existingSubCategory.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Sub Category not found",
      });
    }

    const { name } = req.body;

    // Check if name is provided
    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Please provide name field",
      });
    }

    const images = req.file;

    // Set default image from the existing sub-category
    let image = existingSubCategory[0]?.image;

    // If new image is provided, update the image path
    if (images && images.path) {
      image = `/public/images/${images.filename}`;
    }

    // Execute the update query
    const [result] = await db.query(
      "UPDATE sub_categories SET name = ?, image = ? WHERE id = ?",
      [name, image, id]
    );

    // Check if the sub-category was updated successfully
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Sub Category not found or no changes made",
      });
    }

    // Success response
    res.status(200).send({
      success: true,
      message: "Sub Category updated successfully",
    });
  } catch (error) {
    // Handle errors
    res.status(500).send({
      success: false,
      message: "Error updating Sub Category",
      error: error.message,
    });
  }
};

// delete Sub category
exports.deleteSubCategory = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Sub Category ID is required",
      });
    }

    // Check if the sub category exists in the database
    const [subCategory] = await db.query(
      `SELECT * FROM sub_categories WHERE id = ?`,
      [id]
    );

    // If subCategory not found, return 404
    if (subCategory.length === 0) {
      return res.status(404).send({
        success: false,
        message: "subCategory not found",
      });
    }

    // Proceed to delete the subCategory
    const [result] = await db.query(`DELETE FROM sub_categories WHERE id = ?`, [
      id,
    ]);

    // Check if deletion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to delete Sub category",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "Sub Category deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting Sub category",
      error: error.message,
    });
  }
};
