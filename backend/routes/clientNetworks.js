const express = require("express");
const { body } = require("express-validator");
const {
  getClientNetworks,
  getClientNetwork,
  createClientNetwork,
  updateClientNetwork,
  deleteClientNetwork,
  getMyClientNetworks,
} = require("../controllers/clientNetworks");
const { protect, isAdmin, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/client-networks
// @desc    Get all client networks (Admin sees all, Affiliate Manager sees assigned)
// @access  Private (Admin, Affiliate Manager)
router.get("/", [protect, authorize("admin", "affiliate_manager")], getClientNetworks);

// @route   GET /api/client-networks/my-networks
// @desc    Get client networks assigned to current affiliate manager
// @access  Private (Affiliate Manager only)
router.get("/my-networks", [protect, authorize("affiliate_manager")], getMyClientNetworks);

// @route   GET /api/client-networks/:id
// @desc    Get single client network
// @access  Private (Admin, Affiliate Manager - if assigned)
router.get("/:id", [protect, authorize("admin", "affiliate_manager")], getClientNetwork);

// @route   POST /api/client-networks
// @desc    Create client network
// @access  Private (Admin only)
router.post(
  "/",
  [
    protect,
    isAdmin,
    body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name is required and must be less than 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("assignedAffiliateManagers")
      .optional()
      .isArray()
      .withMessage("Assigned affiliate managers must be an array"),
    body("assignedAffiliateManagers.*")
      .optional()
      .isMongoId()
      .withMessage("Each affiliate manager ID must be a valid MongoDB ObjectId"),
  ],
  createClientNetwork
);

// @route   PUT /api/client-networks/:id
// @desc    Update client network
// @access  Private (Admin only)
router.put(
  "/:id",
  [
    protect,
    isAdmin,
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be less than 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("assignedAffiliateManagers")
      .optional()
      .isArray()
      .withMessage("Assigned affiliate managers must be an array"),
    body("assignedAffiliateManagers.*")
      .optional()
      .isMongoId()
      .withMessage("Each affiliate manager ID must be a valid MongoDB ObjectId"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  updateClientNetwork
);

// @route   DELETE /api/client-networks/:id
// @desc    Delete client network
// @access  Private (Admin only)
router.delete("/:id", [protect, isAdmin], deleteClientNetwork);

// Note: Client broker management has been moved to /api/client-brokers routes
// Client networks now serve as intermediaries only

module.exports = router; 