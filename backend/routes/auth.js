const express = require("express");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");
const { validateUserRegistration, validateUserLogin } = require("../middleware/validation");

const router = express.Router();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", validateUserRegistration, async (req, res) => {
    try {
        const { username, password, name, birthday, adaUsername, adakey } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: { username },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username already taken",
            });
        }

        // Generate unique user ID
        const userId = "U" + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();

        // Default Adafruit IO credentials (nếu không được cung cấp)
        const DEFAULT_ADA_USERNAME = "Tusla";
        const DEFAULT_ADA_KEY = "aio_kciA19Izj8kkk1lIKvZ6Mm0yvDu1";

        // Create new user
        const user = await User.create({
            id: userId,
            username,
            pass: password,
            name,
            birthday,
            // Sử dụng credentials từ request hoặc mặc định
            adaUsername: adaUsername || DEFAULT_ADA_USERNAME,
            adakey: adakey || DEFAULT_ADA_KEY,
        });

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user,
                token,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", validateUserLogin, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({
            where: { username: username.toLowerCase() },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Verify password - temporary direct comparison for unhashed passwords
        let isPasswordValid;
        if (user.pass.startsWith("$2")) {
            // Password is hashed
            isPasswordValid = await user.comparePassword(password);
        } else {
            // Password is not hashed (direct comparison)
            isPasswordValid = user.pass === password;
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        });

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user,
                token,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
router.get("/verify", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }

        res.json({
            success: true,
            message: "Token is valid",
            data: { user },
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

module.exports = router;
