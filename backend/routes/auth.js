const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user exists (case insensitive)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Create user
    console.log("Creating user with email:", email.toLowerCase());
    console.log("Password length:", password.length);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      authProvider: "local",
      isVerified: true, // For simplicity, auto-verify
    });

    await user.save();
    console.log("User created successfully with ID:", user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Check if user exists (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("Login attempt for email:", email.toLowerCase());
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user has a password (for local auth)
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account was created with Google. Please use Google Sign-In.",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        theme: req.user.theme,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/auth/theme
// @desc    Update user theme
// @access  Private
router.put("/theme", auth, async (req, res) => {
  try {
    const { theme } = req.body;

    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({ message: "Invalid theme" });
    }

    await User.findByIdAndUpdate(req.user._id, { theme });

    res.json({ message: "Theme updated successfully", theme });
  } catch (error) {
    console.error("Theme update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/verify-password
// @desc    Verify current user's password
// @access  Private
router.post("/verify-password", auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password)
      return res
        .status(400)
        .json({ success: false, message: "Password required" });
    const user = await User.findById(req.user._id);
    if (!user || !user.password)
      return res
        .status(400)
        .json({ success: false, message: "No password set" });
    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   GET /api/auth/debug
// @desc    Debug route to check users (remove in production)
// @access  Public
router.get("/debug", async (req, res) => {
  try {
    const users = await User.find({}).select(
      "name email authProvider createdAt"
    );
    res.json({
      message: "Debug info",
      userCount: users.length,
      users: users.map((user) => ({
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ message: "Debug error" });
  }
});

// @route   POST /api/auth/create-test-user
// @desc    Create a test user with known credentials (remove in production)
// @access  Public
router.post("/create-test-user", async (req, res) => {
  try {
    // Delete existing test user if exists
    await User.deleteOne({ email: "test@example.com" });

    // Create new test user
    const testUser = new User({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      authProvider: "local",
      isVerified: true,
    });

    await testUser.save();

    res.json({
      message: "Test user created successfully",
      credentials: {
        email: "test@example.com",
        password: "password123",
      },
    });
  } catch (error) {
    console.error("Create test user error:", error);
    res.status(500).json({ message: "Error creating test user" });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post("/google", async (req, res) => {
  try {
    const { credential, name, email, picture } = req.body;

    console.log("Google auth attempt:", {
      email,
      name,
      hasCredential: !!credential,
    });

    let userData = { name, email, picture };

    // If we have a credential, verify it with Google
    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        userData = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        };

        console.log("Google token verified successfully for:", userData.email);
      } catch (error) {
        console.error("Google token verification failed:", error);
        return res.status(400).json({ message: "Invalid Google token" });
      }
    } else if (!name || !email) {
      // If no credential and no user info, return error
      return res
        .status(400)
        .json({ message: "Google credential or user info is required" });
    }

    // Check if user exists
    let user = await User.findOne({ email: userData.email.toLowerCase() });

    if (user) {
      // User exists, update Google info if needed
      if (!user.googleId) {
        user.googleId = userData.email;
        user.authProvider = "google";
        user.avatar = userData.picture || user.avatar;
        await user.save();
      }
      console.log("Existing Google user logged in:", user.email);
    } else {
      // Create new user
      user = new User({
        name: userData.name,
        email: userData.email.toLowerCase(),
        avatar: userData.picture || "",
        googleId: userData.email,
        authProvider: "google",
        isVerified: true,
      });
      await user.save();
      console.log("New Google user created:", user.email);
    }

    // Generate token
    const jwtToken = generateToken(user._id);

    res.json({
      message: "Google authentication successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res
      .status(500)
      .json({ message: "Server error during Google authentication" });
  }
});

module.exports = router;
