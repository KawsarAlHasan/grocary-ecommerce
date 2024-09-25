const express = require("express");
const { signUpAdmin, getMeAdmin } = require("../controllers/adminController");
const verifyAdmin = require("../middleware/verifyAdmin");
const router = express.Router();

router.post("/signup", signUpAdmin);
router.get("/me", verifyAdmin, getMeAdmin);

module.exports = router;
