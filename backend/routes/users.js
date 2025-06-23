const express = require("express");
const { body, query } = require("express-validator");
const { protect, isAdmin, ownerOrAdmin, isManager } = require("../middleware/auth");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPermissions,
  deleteUser,
  approveUser,
  getUserStats,
  getAgentPerformance,
  updateAgentPerformance,
  getTopPerformers,
  getDailyTeamStats,
  assignAsLeadManager,
  approveLeadManager,
  acceptEula,
} = require("../controllers/users");

const router = express.Router();

// EULA Acceptance Route - MOVED TO TOP
router.put("/accept-eula", protect, acceptEula);

// Basic user routes
router.get("/", [
  protect,
  (req, res, next) => {
    if (req.user.role === 'affiliate_manager') {
      if (req.query.role === 'agent') {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Affiliate managers can only view agent lists'
      });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
], getUsers);

router.get("/stats", [protect, isAdmin], getUserStats);
router.get("/team-stats", [protect, isAdmin], getDailyTeamStats);

// Performance routes
router.get(
  "/top-performers",
  [
    protect,
    isAdmin,
    query("period")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Period must be between 1 and 365 days"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  getTopPerformers
);

// Individual user routes
router.get("/:id", [protect, ownerOrAdmin], getUserById);
router.post(
  "/",
  [
    protect,
    isAdmin,
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please include a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters"),
    body("role")
      .isIn(["admin", "affiliate_manager", "agent", "lead_manager"])
      .withMessage("Role must be admin, affiliate_manager, agent, or lead_manager"),
    body("fourDigitCode")
      .optional()
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage("Four digit code must be exactly 4 digits"),
    body("permissions.canCreateOrders")
      .optional()
      .isBoolean()
      .withMessage("canCreateOrders must be a boolean"),
    body("permissions.canManageLeads")
      .optional()
      .isBoolean()
      .withMessage("canManageLeads must be a boolean"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  createUser
);

// NEW: Route for an admin to approve a user
// @route   PUT /api/users/:id/approve
// @desc    Approve a pending user
// @access  Private (Admin only)
router.put(
  '/:id/approve',
  [
    protect,
    isAdmin,
    body('role', 'A valid role is required for approval').isIn(['admin', 'affiliate_manager', 'agent', 'lead_manager'])
  ],
  approveUser
);

router.put(
  "/:id",
  [
    protect,
    ownerOrAdmin,
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please include a valid email"),
    body("fullName")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters"),
    body("role")
      .optional()
      .isIn(["admin", "affiliate_manager", "agent", "lead_manager"])
      .withMessage("Role must be admin, affiliate_manager, agent, or lead_manager"),
    body("fourDigitCode")
      .optional()
      .isLength({ min: 4, max: 4 })
      .isNumeric()
      .withMessage("Four digit code must be exactly 4 digits"),
    body("permissions.canCreateOrders")
      .optional()
      .isBoolean()
      .withMessage("canCreateOrders must be a boolean"),
    body("permissions.canManageLeads")
      .optional()
      .isBoolean()
      .withMessage("canManageLeads must be a boolean"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  updateUser
);
router.put(
  "/:id/permissions",
  [
    protect,
    isAdmin,
    body("permissions").isObject().withMessage("Permissions must be an object"),
    body("permissions.canCreateOrders")
      .optional()
      .isBoolean()
      .withMessage("canCreateOrders must be a boolean"),
  ],
  updateUserPermissions
);
router.delete("/:id", [protect, isAdmin], deleteUser);

// Agent performance routes
router.get(
  "/:id/performance",
  [
    protect,
    ownerOrAdmin,
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO date"),
  ],
  getAgentPerformance
);

router.put(
  "/:id/performance",
  [
    protect,
    ownerOrAdmin,
    body("date").isISO8601().withMessage("Date must be a valid ISO date"),
    body("callTimeMinutes")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Call time must be a non-negative integer"),
    body("earnings")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Earnings must be a non-negative number"),
    body("penalties")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Penalties must be a non-negative number"),
    body("leadsContacted")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Leads contacted must be a non-negative integer"),
    body("leadsConverted")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Leads converted must be a non-negative integer"),
    body("callsCompleted")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Calls completed must be a non-negative integer"),
  ],
  updateAgentPerformance
);

// Lead Manager routes
router.put(
  '/:id/assign-lead-manager',
  [
    protect,
    isAdmin,
    body('assignAsLeadManager')
      .isBoolean()
      .withMessage('assignAsLeadManager must be a boolean')
  ],
  assignAsLeadManager
);

router.put(
  '/:id/approve-lead-manager',
  [
    protect,
    isAdmin,
    body('approved')
      .isBoolean()
      .withMessage('approved must be a boolean'),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('If provided, reason must be a non-empty string')
  ],
  approveLeadManager
);

module.exports = router;