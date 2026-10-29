const mongoose = require("mongoose");
require("./User");
require("./Item");

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    proofDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    uniqueIdentifiers: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    ownerRemarks: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
