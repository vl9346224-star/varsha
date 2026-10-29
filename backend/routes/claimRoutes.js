const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/claimController");

router.use(protect);

router.post("/:itemId", c.createClaim);
router.get("/item/:itemId", c.getItemClaims);
router.get("/my", c.getMyClaims);
router.patch("/:claimId/status", c.updateClaimStatus);

module.exports = router;
