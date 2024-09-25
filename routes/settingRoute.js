const express = require("express");

const uploadImage = require("../middleware/uploaderImage");
const {
  updateAppLogo,
  getAppLogo,
  updatePrivacyTerms,
  getPrivacyTerms,
} = require("../controllers/settingController");

const router = express.Router();

router.put("/app-logo", uploadImage.single("logo"), updateAppLogo);
router.get("/app-logo", getAppLogo);

router.put("/privacy", updatePrivacyTerms);
router.get("/privacy", getPrivacyTerms);

module.exports = router;
