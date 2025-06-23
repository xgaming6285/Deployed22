const express = require("express");
const { body } = require("express-validator");
const {
    getClientBrokers,
    getClientBroker,
    createClientBroker,
    updateClientBroker,
    deleteClientBroker,
    assignLeadToBroker,
    unassignLeadFromBroker,
    getBrokerLeads,
    getBrokerStats,
} = require("../controllers/clientBrokers");
const { protect, isAdmin, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/client-brokers
// @desc    Get all client brokers
// @access  Private (Admin, Affiliate Manager)
router.get("/", [protect, authorize("admin", "affiliate_manager")], getClientBrokers);

// @route   GET /api/client-brokers/stats
// @desc    Get client broker statistics
// @access  Private (Admin, Affiliate Manager)
router.get("/stats", [protect, authorize("admin", "affiliate_manager")], getBrokerStats);

// @route   GET /api/client-brokers/:id
// @desc    Get single client broker
// @access  Private (Admin, Affiliate Manager)
router.get("/:id", [protect, authorize("admin", "affiliate_manager")], getClientBroker);

// @route   POST /api/client-brokers
// @desc    Create client broker
// @access  Private (Admin only)
router.post(
    "/",
    [
        protect,
        isAdmin,
        body("name")
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage("Broker name is required and must be less than 100 characters"),
        body("domain")
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage("Domain must be less than 200 characters"),
        body("description")
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage("Description must be less than 500 characters"),
    ],
    createClientBroker
);

// @route   PUT /api/client-brokers/:id
// @desc    Update client broker
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
            .withMessage("Broker name must be less than 100 characters"),
        body("domain")
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage("Domain must be less than 200 characters"),
        body("description")
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage("Description must be less than 500 characters"),
        body("isActive")
            .optional()
            .isBoolean()
            .withMessage("isActive must be a boolean"),
    ],
    updateClientBroker
);

// @route   DELETE /api/client-brokers/:id
// @desc    Delete client broker
// @access  Private (Admin only)
router.delete("/:id", [protect, isAdmin], deleteClientBroker);

// Lead Assignment Routes

// @route   POST /api/client-brokers/:id/assign-lead
// @desc    Assign a lead to client broker
// @access  Private (Admin, Affiliate Manager)
router.post(
    "/:id/assign-lead",
    [
        protect,
        authorize("admin", "affiliate_manager"),
        body("leadId")
            .isMongoId()
            .withMessage("Valid lead ID is required"),
        body("orderId")
            .optional()
            .isMongoId()
            .withMessage("Order ID must be valid"),
        body("intermediaryClientNetwork")
            .optional()
            .isMongoId()
            .withMessage("Client network ID must be valid"),
        body("domain")
            .optional()
            .trim(),
    ],
    assignLeadToBroker
);

// @route   DELETE /api/client-brokers/:id/unassign-lead/:leadId
// @desc    Unassign a lead from client broker
// @access  Private (Admin, Affiliate Manager)
router.delete(
    "/:id/unassign-lead/:leadId",
    [protect, authorize("admin", "affiliate_manager")],
    unassignLeadFromBroker
);

// @route   GET /api/client-brokers/:id/leads
// @desc    Get all leads assigned to a client broker
// @access  Private (Admin, Affiliate Manager)
router.get("/:id/leads", [protect, authorize("admin", "affiliate_manager")], getBrokerLeads);

module.exports = router; 