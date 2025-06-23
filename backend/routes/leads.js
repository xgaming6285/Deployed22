const express = require("express");
const { body, query } = require("express-validator");
const {
  protect,
  isAdmin,
  isAgent,
  authorize,
  isLeadManager,
  affiliateManager,
} = require("../middleware/auth");
const {
  getLeads,
  getAssignedLeads,
  getLeadById,
  addComment,
  updateLeadStatus,
  getLeadStats,
  assignLeads,
  unassignLeads,
  updateLead,
  createLead,
  deleteLead,
  importLeads,
  injectLead,
  getLeadsForManager,
  getColdLeads,
  updateLeadType,
  bulkDeleteLeads,
  wakeUpSleepingLeads,
  assignClientBrokerToLead,
  getLeadAssignmentHistory,
  getClientBrokerAnalytics,
} = require("../controllers/leads");

const router = express.Router();

// @route   GET /api/leads
// @desc    Get leads with advanced filtering (Admin and Affiliate Manager)
// @access  Private (Admin, Affiliate Manager, Lead Manager)
router.get(
  "/",
  [
    protect,
    authorize("admin", "affiliate_manager", "lead_manager"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("leadType")
      .optional()
      .isIn(["ftd", "filler", "cold", "live"])
      .withMessage("Lead type must be ftd, filler, cold, or live"),
    query("country")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Country must be at least 2 characters"),
    query("isAssigned")
      .optional()
      .isBoolean()
      .withMessage("isAssigned must be a boolean"),
    query("documentStatus")
      .optional()
      .isIn(["good", "ok", "pending"])
      .withMessage("Document status must be good, ok, or pending"),
    query("status")
      .optional()
      .isIn(["active", "contacted", "converted", "inactive"])
      .withMessage("Status must be active, contacted, converted, or inactive"),
    query("order")
      .optional()
      .isIn(["newest", "oldest", "name_asc", "name_desc"])
      .withMessage("Order must be newest, oldest, name_asc, or name_desc"),
    query("orderId")
      .optional()
      .isMongoId()
      .withMessage("Invalid order ID format"),
    query("assignedToMe")
      .optional()
      .isBoolean()
      .withMessage("assignedToMe must be a boolean"),
  ],
  getLeads
);

// @route   GET /api/leads/assigned
// @desc    Get leads assigned to the logged-in agent
// @access  Private (Agent)
router.get(
  "/assigned",
  [
    protect,
    isAgent,
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("leadType")
      .optional()
      .isIn(["ftd", "filler", "cold", "live"])
      .withMessage("Lead type must be ftd, filler, cold, or live"),
    query("status")
      .optional()
      .isIn(["active", "contacted", "converted", "inactive"])
      .withMessage("Status must be active, contacted, converted, or inactive"),
  ],
  getAssignedLeads
);

// @route   GET /api/leads/stats
// @desc    Get lead statistics
// @access  Private (Admin, Affiliate Manager)
router.get(
  "/stats",
  [protect, authorize("admin", "affiliate_manager")],
  getLeadStats
);

// @route   GET /api/leads/client-broker-analytics
// @desc    Get client broker assignment analytics
// @access  Private (Admin, Affiliate Manager)
router.get(
  "/client-broker-analytics",
  [
    protect,
    authorize("admin", "affiliate_manager"),
    query("orderId")
      .optional()
      .isMongoId()
      .withMessage("Invalid order ID format"),
  ],
  getClientBrokerAnalytics
);

// @route   GET /api/leads/:id
// @desc    Get lead by ID
// @access  Private (Admin or assigned agent)
router.get(
  "/:id",
  [protect, authorize("admin", "affiliate_manager", "agent")],
  getLeadById
);

// @route   PUT /api/leads/:id/comment
// @desc    Add a comment to a specific lead
// @access  Private (All roles)
router.put(
  "/:id/comment",
  [
    protect,
    body("text")
      .trim()
      .notEmpty()
      .isLength({ min: 1, max: 1000 })
      .withMessage(
        "Comment text is required and must be less than 1000 characters"
      ),
  ],
  addComment
);

// @route   PUT /api/leads/:id/status
// @desc    Update lead status
// @access  Private (Admin or assigned agent)
router.put(
  "/:id/status",
  [
    protect,
    authorize("admin", "affiliate_manager", "agent"),
    body("status")
      .isIn(["active", "contacted", "converted", "inactive"])
      .withMessage("Status must be active, contacted, converted, or inactive"),
  ],
  updateLeadStatus
);

// @route   PUT /api/leads/:id/assign-client-broker
// @desc    Assign client broker to individual lead
// @access  Private (Admin, Affiliate Manager)
router.put(
  "/:id/assign-client-broker",
  [
    protect,
    authorize("admin", "affiliate_manager"),
    body("clientBrokerId")
      .isMongoId()
      .withMessage("Valid client broker ID is required"),
    body("client")
      .optional()
      .trim(),
    body("intermediaryClientNetwork")
      .optional()
      .isMongoId()
      .withMessage("Client network ID must be valid"),
    body("domain")
      .optional()
      .trim(),
  ],
  assignClientBrokerToLead
);

// @route   GET /api/leads/:id/assignment-history
// @desc    Get lead assignment history
// @access  Private (Admin, Affiliate Manager)
router.get(
  "/:id/assignment-history",
  [protect, authorize("admin", "affiliate_manager")],
  getLeadAssignmentHistory
);

// @route   POST /api/leads/assign
// @desc    Manually assign leads to agents
// @access  Private (Admin, Manager)
router.post(
  "/assign",
  [
    protect,
    authorize("admin", "affiliate_manager"),
    body("leadIds")
      .isArray({ min: 1 })
      .withMessage("leadIds must be a non-empty array"),
    body("leadIds.*")
      .isMongoId()
      .withMessage("Each leadId must be a valid MongoDB ObjectId"),
    body("agentId")
      .isMongoId()
      .withMessage("agentId must be a valid MongoDB ObjectId"),
  ],
  assignLeads
);

// @route   POST /api/leads/unassign
// @desc    Unassign leads from agents
// @access  Private (Admin, Manager)
router.post(
  "/unassign",
  [
    protect,
    authorize("admin", "affiliate_manager"),
    body("leadIds")
      .isArray({ min: 1 })
      .withMessage("leadIds must be a non-empty array"),
    body("leadIds.*")
      .isMongoId()
      .withMessage("Each leadId must be a valid MongoDB ObjectId"),
  ],
  unassignLeads
);

// @route   POST /api/leads
// @desc    Create a new lead
// @access  Private (Admin, Affiliate Manager, Lead Manager)
router.post(
  "/",
  [
    protect,
    authorize("admin", "affiliate_manager", "lead_manager"),
    body("firstName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters"),
    body("gender")
      .optional()
      .isIn(["male", "female", "not_defined"])
      .withMessage("Gender must be male, female, or not_defined"),
    body("newEmail")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid new email"),
    body("oldEmail")
      .optional()
      .custom((value) => {
        // If value is empty string or null/undefined, accept it
        if (!value || value.trim() === "") {
          return true;
        }
        // Otherwise validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Please provide a valid old email");
        }
        return true;
      }),
    body("newPhone").trim().notEmpty().withMessage("New phone is required"),
    body("oldPhone").optional().trim(),
    body("country")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Country must be at least 2 characters"),
    body("leadType")
      .isIn(["ftd", "filler", "cold", "live"])
      .withMessage("Invalid lead type"),
    body("sin")
      .optional()
      .trim()
      .custom((value, { req }) => {
        if (req.body.leadType === "ftd" && !value) {
          throw new Error("SIN is required for FTD leads");
        }
        return true;
      }),
  ],
  createLead
);

// @route   PUT /api/leads/:id
// @desc    Update lead information
// @access  Private (Admin, Lead Manager)
router.put("/:id", [protect, authorize("admin", "lead_manager")], updateLead);

// @route   DELETE /api/leads/bulk-delete
// @desc    Delete multiple leads with filtering
// @access  Private (Admin only)
router.delete("/bulk-delete", [
  (req, res, next) => {
    console.log("Bulk delete route hit:", {
      method: req.method,
      path: req.path,
      body: req.body,
      user: req.user ? { id: req.user.id, role: req.user.role } : null
    });
    next();
  },
  protect,
  isAdmin
], bulkDeleteLeads);

// @route   DELETE /api/leads/:id
// @desc    Delete a single lead
// @access  Private (Admin only)
router.delete("/:id", [protect, isAdmin], deleteLead);

// @route   POST /api/leads/import
// @desc    Import leads from CSV file
// @access  Private (Admin, Affiliate Manager, Lead Manager)
router.post(
  "/import",
  [protect, authorize("admin", "affiliate_manager", "lead_manager")],
  importLeads
);

// @route   POST /api/leads/:id/inject
// @desc    Inject a lead into the automation system
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/:id/inject",
  [protect, authorize("admin", "affiliate_manager")],
  injectLead
);

// @route   POST /api/leads/wake-up
// @desc    Wake up sleeping leads
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/wake-up",
  [protect, authorize("admin", "affiliate_manager")],
  wakeUpSleepingLeads
);

module.exports = router;
