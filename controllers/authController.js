const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Doctor = require("../models/Doctor");
// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    contact,
    specialization,
    qualifications,
    experience,
    fees,
  } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please add all required fields" });
  }

  // Validate role if provided
  if (role && !["patient", "doctor", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "patient",
      contact,
    });

    // If registering as doctor, create doctor profile
    if (user.role === "doctor") {
      await Doctor.create({
        user: user._id,
        specialization: specialization || "General Practitioner",
        qualifications: qualifications || ["MD"],
        experience: experience || "0 years",
        fees: fees || 100,
        status: "active",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(user).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    // Return response
    return res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        error: "User already exists",
        message: "A user with this email already exists",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        error: "Validation error",
        messages,
      });
    }

    // Generic error response
    return res.status(500).json({
      error: "Server error",
      message: "Something went wrong during registration",
    });
  }
});

// Helper function for sending welcome email
const sendWelcomeEmail = async (user) => {
  await sendEmail({
    email: user.email,
    subject: "Welcome to Hospital Management System",
    message:
      `Hi ${user.name},\n\nWelcome to our Hospital Management System. ` +
      `Your account has been successfully created as a ${user.role}.` +
      `${user.role === "doctor" ? " Please complete your profile." : ""}\n\n` +
      `Thank you,\nHospital Team`,
  });
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide both email and password");
  }

  try {
    // Check for user email and include password (since it's select: false)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500);
    throw new Error("Something went wrong during login");
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500);
    throw new Error("Something went wrong while fetching user data");
  }
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
