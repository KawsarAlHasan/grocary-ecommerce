const express = require("express");

const {
  createSubCategory,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getAllSubCategory,
  getSubCategoryByCategoryID,
} = require("../controllers/subCategoriesController");
const verifyAdmin = require("../middleware/verifyAdmin");

const router = express.Router();

router.post("/create", createSubCategory);
router.get("/all", getAllSubCategory);
router.get("/all/:id", getSubCategoryByCategoryID);
router.get("/:id", getSingleSubCategory);
router.put("/update/:id", updateSubCategory);
router.delete("/delete/:id", deleteSubCategory);

module.exports = router;
