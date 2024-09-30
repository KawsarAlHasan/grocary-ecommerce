const express = require("express");
const {
  createDeliveryAddress,
  getMyDeliveryAddress,
} = require("../controllers/deliveryAddressController");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/create", verifyUser, createDeliveryAddress);
router.get("/", verifyUser, getMyDeliveryAddress);
// router.get("/all", getAllCategory);
// router.get("/:id", getSingleCategory);
// router.put("/update/:id", updateCategory);
// router.delete("/delete/:id", deleteCategory);

module.exports = router;
