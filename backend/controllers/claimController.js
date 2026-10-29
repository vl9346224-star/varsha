const Claim = require("../models/Claim");
const Item = require("../models/Item");
const User = require("../models/User");
const { notifyUser } = require("../utils/notify");
const { sendClaimAlertEmail, sendClaimDecisionEmail } = require("../utils/email");

// Submit an ownership claim for an item
exports.createClaim = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { proofDescription, uniqueIdentifiers } = req.body;

    if (!proofDescription || !uniqueIdentifiers) {
      return res.status(400).json({ message: "Proof description and unique identifiers are required" });
    }

    const item = await Item.findById(itemId).populate("reportedBy", "name email");
    if (!item || item.status === "removed") {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.reportedBy._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot claim an item you reported yourself" });
    }

    if (item.status === "recovered") {
      return res.status(400).json({ message: "This item has already been marked as recovered" });
    }

    // Check if claimant already filed a pending claim
    const existing = await Claim.findOne({
      item: itemId,
      claimant: req.user.id,
      status: "pending",
    });
    if (existing) {
      return res.status(400).json({ message: "You already have a pending claim for this item" });
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user.id,
      proofDescription,
      uniqueIdentifiers,
    });

    // In-app notification to item reporter
    const ownerId = item.reportedBy._id.toString();
    await notifyUser(req.app, ownerId, {
      type: "info",
      message: `${req.user.name} submitted an ownership claim for your report "${item.title}".`,
      item: item._id,
    });

    // Email notification to item reporter
    const claimantUser = await User.findById(req.user.id);
    if (claimantUser && item.reportedBy.email) {
      sendClaimAlertEmail(item.reportedBy, claimantUser, item, claim).catch((err) =>
        console.error("Claim email failed:", err.message)
      );
    }

    // Broadcast live alert to reporter's socket room
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${ownerId}`).emit("newClaim", { itemId: item._id, claimId: claim._id });
    }

    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get claims for a specific item (only for the reporter or admin)
exports.getItemClaims = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.reportedBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view claims for this item" });
    }

    const claims = await Claim.find({ item: itemId })
      .sort({ createdAt: -1 })
      .populate("claimant", "name email rollNumber phone");

    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all claims filed by the current logged in student
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "item",
        select: "title category type location imageUrl status",
      });

    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve or reject a claim
exports.updateClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, ownerRemarks } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const claim = await Claim.findById(claimId).populate("item");
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    const item = await Item.findById(claim.item._id);
    if (!item) return res.status(404).json({ message: "Associated item not found" });

    if (item.reportedBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this claim" });
    }

    claim.status = status;
    claim.ownerRemarks = ownerRemarks || "";
    claim.verifiedAt = new Date();
    await claim.save();

    // If claim is approved, mark item as recovered
    if (status === "approved") {
      item.status = "recovered";
      item.recoveredAt = new Date();
      await item.save();

      const io = req.app.get("io");
      if (io) io.emit("itemRecovered", item);
    }

    // In-app notification to claimant
    const claimantId = claim.claimant.toString();
    await notifyUser(req.app, claimantId, {
      type: "status_changed",
      message: `Your claim on "${item.title}" was ${status.toUpperCase()} by the reporter.`,
      item: item._id,
    });

    // Email notification to claimant
    const claimantUser = await User.findById(claimantId);
    if (claimantUser) {
      sendClaimDecisionEmail(claimantUser, item, status === "approved", ownerRemarks).catch((err) =>
        console.error("Decision email error:", err.message)
      );
    }

    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
