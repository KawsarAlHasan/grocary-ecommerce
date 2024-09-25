const jwt = require("jsonwebtoken");
exports.generateAdminToken = (adminInfo) => {
  const payload = {
    id: adminInfo.id,
  };
  const adminToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "150 days",
  });

  return adminToken;
};
