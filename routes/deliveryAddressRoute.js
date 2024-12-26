const express = require("express");
const {
  createDeliveryAddress,
  getMyDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
  createDeliveryAddressForAdmin,
  getMyDeliveryAddressForAdmin,
  getAllDeliveryAddress,
} = require("../controllers/deliveryAddressController");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/create", verifyUser, createDeliveryAddress);
router.get("/", verifyUser, getMyDeliveryAddress);
router.get("/all", getAllDeliveryAddress);
router.put("/update/:id", updateDeliveryAddress);
router.delete("/delete/:id", deleteDeliveryAddress);

// for admin
router.post("/create/:id", createDeliveryAddressForAdmin);
router.get("/:id", getMyDeliveryAddressForAdmin);

module.exports = router;
