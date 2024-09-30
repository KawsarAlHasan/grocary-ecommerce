const express = require("express");

const verifyUser = require("../middleware/verifyUser");
const {
  addFavorite,
  getAllFavoriteProduct,
  deleteAllProductFromFavorite,
  deleteSingleProductFromFavorite,
} = require("../controllers/favoriteController");

const router = express.Router();

router.post("/add", verifyUser, addFavorite);
router.get("/all", verifyUser, getAllFavoriteProduct);
router.delete("/delete/bulk", verifyUser, deleteAllProductFromFavorite);
router.delete("/delete/:id", verifyUser, deleteSingleProductFromFavorite);

module.exports = router;
