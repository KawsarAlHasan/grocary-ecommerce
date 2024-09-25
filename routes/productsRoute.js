const express = require("express");

const uploadImage = require("../middleware/uploaderImage");
const {
  createProducts,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
  updateProduct,
  updateProductImages,
  createPostCode,
  deletePostCode,
  getAllPostCode,
} = require("../controllers/productsController");

const router = express.Router();

router.post("/create", uploadImage.array("image_url", 10), createProducts);
router.get("/all", getAllProducts);

router.put("/update/:id", updateProduct);
router.put(
  "/update-images/:id",
  uploadImage.array("image_url", 10),
  updateProductImages
);

router.delete("/delete/:id", deleteProduct);

router.get("/post-code", getAllPostCode);
router.post("/post-code", createPostCode);
router.delete("/post-code/:id", deletePostCode);

router.get("/:id", getSingleProduct);

module.exports = router;
