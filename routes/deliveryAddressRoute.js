const express = require("express");
const {
  createDeliveryAddress,
  getMyDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
} = require("../controllers/deliveryAddressController");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/create", verifyUser, createDeliveryAddress);
router.get("/", verifyUser, getMyDeliveryAddress);
router.put("/update", verifyUser, updateDeliveryAddress);
router.delete("/delete/:id", verifyUser, deleteDeliveryAddress);

module.exports = router;
