const express = require("express");

const uploadImage = require("../middleware/uploaderImage");
const {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
  getSingleCategory,
  getAllCategoryWithSub,
} = require("../controllers/categoriesController");

const router = express.Router();

router.post("/create", uploadImage.single("category_image"), createCategory);
router.get("/", getAllCategoryWithSub);
router.get("/all", getAllCategory);
router.get("/:id", getSingleCategory);
router.put("/update/:id", uploadImage.single("category_image"), updateCategory);
router.delete("/delete/:id", deleteCategory);

module.exports = router;
