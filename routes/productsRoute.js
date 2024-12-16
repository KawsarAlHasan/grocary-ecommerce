const express = require("express");

const {
  createProducts,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
  updateProduct,
  createPostCode,
  deletePostCode,
  getAllPostCode,
  getRandomProducts,
  getNewAllProducts,
  getAllProductsWithOutPage,
  getNewAllProductsWithOutPage,
} = require("../controllers/productsController");
const verifyAdmin = require("../middleware/verifyAdmin");

const router = express.Router();

router.post("/create", createProducts);
router.get("/all-with-page", getAllProducts);
router.get("/new-with-page", getNewAllProducts);
router.get("/all", getAllProductsWithOutPage);
router.get("/new", getNewAllProductsWithOutPage);
router.get("/random", getRandomProducts);

router.put("/update/:id", updateProduct);

router.delete("/delete/:id", deleteProduct);

router.get("/post-code", getAllPostCode);
router.post("/post-code", createPostCode);
router.delete("/post-code/:id", deletePostCode);

router.get("/:id", getSingleProduct);

module.exports = router;
