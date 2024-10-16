const express = require("express");

const {
  signUpUser,
  userLogin,
  getMeUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  userStatusUpdate,
  updateUserByID,
} = require("../controllers/usersController");
const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");

const router = express.Router();

router.post("/signup", signUpUser);
router.post("/login", userLogin);
router.get("/me", verifyUser, getMeUser);
router.get("/all", getAllUsers);
router.get("/:id", getSingleUser);
router.put("/update", verifyUser, updateUser);
router.put("/update/:id", updateUserByID);
router.put("/password", verifyUser, updateUserPassword);
router.put("/status/:id", verifyAdmin, userStatusUpdate);
router.delete("/delete/:id", verifyAdmin, deleteUser);

module.exports = router;
