const Item = require("../models/Item");
const User = require("../models/User");
const { removeImageFile } = require("../utils/files");
const { notifyUser } = require("../utils/notify");
const { sendMatchAlertEmail } = require("../utils/email");

const isOwnerOrAdmin = (item, user) =>
  item.reportedBy.toString() === user.id || user.role === "admin";

// Live alert: tell owners of matching opposite-type reports (same category)
const notifyPossibleMatches = async (app, item, reporterId) => {
  const opposite = item.type === "lost" ? "found" : "lost";
  const matches = await Item.find({
    type: opposite,
    category: item.category,
    status: { $in: ["pending", "verified"] },
    reportedBy: { $ne: reporterId },
  })
    .limit(10)
    .populate("reportedBy", "name email");

  const seen = new Set();
  for (const m of matches) {
    if (!m.reportedBy) continue;
    const ownerId = m.reportedBy._id ? m.reportedBy._id.toString() : m.reportedBy.toString();
    if (seen.has(ownerId)) continue;
    seen.add(ownerId);

    await notifyUser(app, ownerId, {
      type: "possible_match",
      message: `A ${item.type} item "${item.title}" (${item.category}) was reported. It may match your report "${m.title}".`,
      item: item._id,
    });

    if (m.reportedBy.email) {
      sendMatchAlertEmail(m.reportedBy, item).catch((e) =>
        console.error("Match email alert failed:", e.message)
      );
    }
  }
};

const createItem = (type) => async (req, res) => {
  try {
    const { title, description, category, location, date, contactInfo } = req.body;

    if (!title || !description || !category || !location || !date || !contactInfo) {
      if (req.file) removeImageFile("/uploads/" + req.file.filename);
      return res.status(400).json({ message: "All fields are required" });
    }

    const item = await Item.create({
      title,
      description,
      category,
      location,
      date,
      contactInfo,
      type,
      reportedBy: req.user.id,
      imageUrl: req.file ? "/uploads/" + req.file.filename : "",
    });

    res.status(201).json(item);

    // Live alerts (after the response, so they never slow down or break the request)
    const io = req.app.get("io");
    if (io) {
      io.emit("newItem", item); // everyone
      io.to("admins").emit("adminNewReport", item); // admins only
    }
    notifyPossibleMatches(req.app, item, req.user.id).catch((e) =>
      console.error("match notify failed:", e.message)
    );
  } catch (err) {
    if (req.file) removeImageFile("/uploads/" + req.file.filename);
    res.status(400).json({ message: err.message });
  }
};

exports.reportLost = createItem("lost");
exports.reportFound = createItem("found");

const listItems = (type) => async (req, res) => {
  try {
    const items = await Item.find({ type, status: { $ne: "removed" } })
      .sort({ createdAt: -1 })
      .populate("reportedBy", "name email");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLostItems = listItems("lost");
exports.getFoundItems = listItems("found");

exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("reportedBy", "name email");
    if (!item || item.status === "removed") {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: "Invalid item id" });
  }
};

exports.getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user.id, status: { $ne: "removed" } }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item || item.status === "removed") {
      if (req.file) removeImageFile("/uploads/" + req.file.filename);
      return res.status(404).json({ message: "Item not found" });
    }
    if (!isOwnerOrAdmin(item, req.user)) {
      if (req.file) removeImageFile("/uploads/" + req.file.filename);
      return res.status(403).json({ message: "Not allowed to edit this report" });
    }

    const editable = ["title", "description", "category", "location", "date", "contactInfo"];
    editable.forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });

    if (req.file) {
      removeImageFile(item.imageUrl);
      item.imageUrl = "/uploads/" + req.file.filename;
    }

    await item.save();
    res.json(item);
  } catch (err) {
    if (req.file) removeImageFile("/uploads/" + req.file.filename);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (!isOwnerOrAdmin(item, req.user)) {
      return res.status(403).json({ message: "Not allowed to delete this report" });
    }
    removeImageFile(item.imageUrl);
    await item.deleteOne();
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid item id" });
  }
};

exports.markRecovered = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item || item.status === "removed") {
      return res.status(404).json({ message: "Item not found" });
    }
    if (!isOwnerOrAdmin(item, req.user)) {
      return res.status(403).json({ message: "Not allowed to update this report" });
    }
    if (item.status === "recovered") {
      return res.status(400).json({ message: "Item is already marked as recovered" });
    }
    item.status = "recovered";
    item.recoveredAt = new Date();
    await item.save();

    const io = req.app.get("io");
    if (io) io.emit("itemRecovered", item);

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: "Invalid item id" });
  }
};
