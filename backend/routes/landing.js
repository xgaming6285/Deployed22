const express = require("express");
const { body, validationResult } = require("express-validator");
const Lead = require("../models/Lead");

const router = express.Router();

// POST /api/landing - Submit landing page form
router.post(
  "/",
  [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
    body("prefix")
      .trim()
      .notEmpty()
      .withMessage("Country code is required")
      .matches(/^\+\d{1,4}$/)
      .withMessage("Country code must be in format +XX or +XXX"),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .isLength({ min: 7, max: 15 })
      .withMessage("Phone number must be between 7 and 15 digits")
      .matches(/^\d+$/)
      .withMessage("Phone number must contain only digits"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, prefix, phone } = req.body;

      // Check if lead already exists by email
      const existingLead = await Lead.findOne({ newEmail: email.toLowerCase() });
      if (existingLead) {
        return res.status(409).json({
          success: false,
          message: "A lead with this email already exists",
        });
      }

      // Create new lead from landing page
      const newLead = new Lead({
        leadType: "cold", // Default for landing page submissions
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        newEmail: email.toLowerCase(),
        prefix: prefix.trim(),
        newPhone: phone.trim(),
        country: "Unknown", // Could be enhanced to derive from prefix
        source: "Landing Page",
        status: "active",
        priority: "medium",
      });

      const savedLead = await newLead.save();

      res.status(201).json({
        success: true,
        message: "Thank you for your submission! We'll be in touch soon.",
        leadId: savedLead._id,
      });
    } catch (error) {
      console.error("Landing page submission error:", error);

      // Handle duplicate key error (in case of race condition)
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A lead with this email already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
    }
  }
);

// GET /api/landing - Get landing page (for serving the form)
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Landing Page API",
    description: "Submit your information using POST to this endpoint",
    requiredFields: {
      firstName: "string (2-50 characters)",
      lastName: "string (2-50 characters)", 
      email: "valid email address",
      prefix: "country code in format +XX",
      phone: "phone number (7-15 digits)"
    }
  });
});

module.exports = router; 