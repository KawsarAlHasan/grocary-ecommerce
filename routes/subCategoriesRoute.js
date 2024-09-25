const express = require("express");

const uploadImage = require("../middleware/uploaderImage");
const {
  createSubCategory,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoriesController");

const router = express.Router();

router.post("/create", uploadImage.single("image"), createSubCategory);
router.get("/:id", getSingleSubCategory);
router.put("/update/:id", uploadImage.single("image"), updateSubCategory);
router.delete("/delete/:id", deleteSubCategory);

module.exports = router;
