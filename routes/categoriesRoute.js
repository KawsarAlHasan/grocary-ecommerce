const express = require("express");

const {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
  getSingleCategory,
  getAllCategoryWithSub,
} = require("../controllers/categoriesController");
const verifyAdmin = require("../middleware/verifyAdmin");

const router = express.Router();

router.post("/create", createCategory);
router.get("/", getAllCategoryWithSub);
router.get("/all", getAllCategory);
router.get("/:id", getSingleCategory);
router.put("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);

module.exports = router;
