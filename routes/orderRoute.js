const express = require("express");
const {
  createOrder,
  orderStatus,
  getOrderById,
  getAllOrders,
  updateOrderProductPrice,
  getAllUserOrder,
  createOrderForAdmin,
  getAllUserOrderForAdmin,
  getAllArrayOrders,
  getOrders,
  updateOrderOnePage,
} = require("../controllers/orderController");
const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const router = express.Router();

router.post("/create", verifyUser, createOrder);
router.post("/create/:id", createOrderForAdmin);
router.get("/my", verifyUser, getAllUserOrder);
router.get("/array", getAllArrayOrders);
router.get("/user/:id", getAllUserOrderForAdmin);
router.put("/status/update/:id", verifyAdmin, orderStatus);
router.get("/all", verifyAdmin, getAllOrders);
router.get("/getOrders", getOrders);
router.get("/:id", getOrderById);
router.put("/update-price/:id", verifyAdmin, updateOrderProductPrice);
router.put("/update/:id", verifyAdmin, updateOrderOnePage);

module.exports = router;
