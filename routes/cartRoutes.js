const express = require("express");

const verifyUser = require("../middleware/verifyUser");
const {
  addCart,
  getAllCartProducts,
  deleteAllProductFromCart,
  deleteSingleProductFromCart,
} = require("../controllers/cartController");

const router = express.Router();

router.post("/addproduct", verifyUser, addCart);
router.get("/all", verifyUser, getAllCartProducts);
router.delete("/delete/bulk", verifyUser, deleteAllProductFromCart);
router.delete("/delete/:id", verifyUser, deleteSingleProductFromCart);

module.exports = router;
