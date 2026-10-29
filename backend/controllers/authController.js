const jwt = require("jsonwebtoken");
const User = require("../models/User");

const DEPARTMENTS = ["CSE", "CSE-AI", "IT", "ECE", "EEE", "Mechanical", "Civil"];
const SECTIONS = ["A", "B", "C", "D"];

const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  rollNumber: u.rollNumber,
  phone: u.phone,
  department: u.department,
  section: u.section,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  try {
    const { name, email, password, rollNumber, phone, department, section } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ message: "Department is required" });
    }
    if (!section || !section.trim()) {
      return res.status(400).json({ message: "Section is required" });
    }

    const trimmedDept = department.trim();
    const trimmedSec = section.trim().toUpperCase();

    if (!DEPARTMENTS.includes(trimmedDept)) {
      return res.status(400).json({
        message: `Department must be one of: ${DEPARTMENTS.join(", ")}`,
      });
    }

    if (!SECTIONS.includes(trimmedSec)) {
      return res.status(400).json({
        message: `Section must be one of: ${SECTIONS.join(", ")}`,
      });
    }

    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Invalid email" });
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Role is always "student" here - admins are created with `npm run create-admin`
    const user = await User.create({
      name,
      email,
      password,
      rollNumber,
      phone,
      department: trimmedDept,
      section: trimmedSec,
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Email already registered" });
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    ["name", "phone", "rollNumber", "department", "section"].forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });

    if (req.body.newPassword) {
      if (!req.body.currentPassword || !(await user.matchPassword(req.body.currentPassword))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      user.password = req.body.newPassword;
    }

    await user.save();
    res.json(publicUser(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
