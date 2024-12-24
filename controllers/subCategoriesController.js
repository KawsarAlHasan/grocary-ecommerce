const db = require("../config/db");

// create Subcategory
exports.createSubCategory = async (req, res) => {
  try {
    const { sn_number, main_cat_id, name, image } = req.body;
    // Check if category_name is provided
    if (!main_cat_id || !name || !image) {
      return res.status(400).send({
        success: false,
        message: "Please provide main_cat_id, name & image field",
      });
    }

    // Insert category into the database
    const [result] = await db.query(
      "INSERT INTO sub_categories (sn_number, main_cat_id, image, name) VALUES (?, ?, ?, ?)",
      [sn_number || 1000, main_cat_id, image, name]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Sub category, please try again",
      });
    }

    // Send success response
    res.status(200).send({
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

// get all sub category
exports.getAllSubCategory = async (req, res) => {
  try {
    const [data] = await db.query(
      "SELECT * FROM sub_categories ORDER BY sn_number ASC"
    );
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No sub Category found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get All sub Category",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All sub Category",
      error: error.message,
    });
  }
};

// get sub category by category id
exports.getSubCategoryByCategoryID = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(
      "SELECT * FROM sub_categories WHERE main_cat_id =?",
      [id]
    );
    if (!data || data.length == 0) {
      return res.status(200).send({
        success: true,
        message: "No sub Category found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get sub Category by category id",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get sub Category by category id",
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

    const { sn_number, name, image } = req.body;

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

    // Set default image from the existing sub-category
    let snNumber = sn_number ? sn_number : existingSubCategory[0]?.sn_number;
    let prename = name ? name : existingSubCategory[0]?.name;
    let images = image ? image : existingSubCategory[0]?.image;

    // Execute the update query
    const [result] = await db.query(
      "UPDATE sub_categories SET sn_number=?, name = ?, image = ? WHERE id = ?",
      [snNumber, prename, images, id]
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
