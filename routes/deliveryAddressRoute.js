const express = require("express");
const {
  createDeliveryAddress,
  getMyDeliveryAddress,
  updateDeliveryAddress,
} = require("../controllers/deliveryAddressController");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/create", verifyUser, createDeliveryAddress);
router.get("/", verifyUser, getMyDeliveryAddress);
router.put("/update", verifyUser, updateDeliveryAddress);

module.exports = router;
