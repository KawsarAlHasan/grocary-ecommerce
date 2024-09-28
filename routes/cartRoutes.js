const express = require("express");

const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");
const {
  addCart,
  getAllCartProducts,
} = require("../controllers/cartController");

const router = express.Router();

router.post("/addproduct", addCart);
router.get("/all", getAllCartProducts);
// router.post("/login", userLogin);
// router.get("/me", verifyUser, getMeUser);
// router.get("/all", getAllUsers);
// router.get("/:id", getSingleUser);
// router.put("/update", verifyUser, updateUser);
// router.put("/password", verifyUser, updateUserPassword);
// router.put("/status/:id", verifyAdmin, userStatusUpdate);
// router.delete("/delete/:id", verifyAdmin, deleteUser);

module.exports = router;
