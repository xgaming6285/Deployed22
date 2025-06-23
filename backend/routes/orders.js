const express = require("express");
const mongoose = require("mongoose");
const { body, query } = require("express-validator");
const {
  protect,
  isManager,
  hasPermission,
  authorize,
} = require("../middleware/auth");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  getOrderStats,
  exportOrderLeads,
  assignClientInfoToOrderLeads,
  startOrderInjection,
  pauseOrderInjection,
  stopOrderInjection,
  skipOrderFTDs,
  assignClientBrokers,
  getLeadsPendingBrokerAssignment,
  skipBrokerAssignment,
  getFTDLeadsForOrder,
  manualFTDInjection,
  startManualFTDInjection,
  completeManualFTDInjection,
  startManualFTDInjectionForLead,
  completeManualFTDInjectionForLead,
  assignFTDSession,
  launchAgentBrowser,
} = require("../controllers/orders");

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order and pull leads
// @access  Private (Admin, Manager with canCreateOrders permission)
router.post(
  "/",
  [
    protect,
    isManager,
    hasPermission("canCreateOrders"),
    body("requests.ftd")
      .optional()
      .isInt({ min: 0 })
      .withMessage("FTD request must be a non-negative integer"),
    body("requests.filler")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Filler request must be a non-negative integer"),
    body("requests.cold")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Cold request must be a non-negative integer"),
    body("requests.live")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Live request must be a non-negative integer"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high"])
      .withMessage("Priority must be low, medium, or high"),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
    body("country")
      .notEmpty()
      .withMessage("Country filter is required")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Country must be at least 2 characters"),
    body("gender")
      .optional({ nullable: true })
      .isIn(["male", "female", "not_defined", null, ""])
      .withMessage("Gender must be male, female, not_defined, or empty"),
    body("selectedClientNetwork")
      .custom((value, { req }) => {
        // For affiliate managers, client network selection is required
        if (req.user && req.user.role === "affiliate_manager") {
          if (!value || value === "") {
            throw new Error("Client network selection is required for affiliate managers");
          }
          if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error("selectedClientNetwork must be a valid MongoDB ObjectId");
          }
        } else {
          // For other roles, it's optional but must be valid if provided
          if (value && value !== "" && !mongoose.Types.ObjectId.isValid(value)) {
            throw new Error("selectedClientNetwork must be a valid MongoDB ObjectId");
          }
        }
        return true;
      }),
    body("injectionSettings")
      .optional()
      .isObject()
      .withMessage("injectionSettings must be an object"),
    body("injectionSettings.enabled")
      .optional()
      .isBoolean()
      .withMessage("injectionSettings.enabled must be a boolean"),
    body("injectionSettings.mode")
      .optional()
      .isIn(["bulk", "scheduled"])
      .withMessage("injectionSettings.mode must be 'bulk' or 'scheduled'"),
    body("injectionSettings.includeTypes")
      .optional()
      .isObject()
      .withMessage("injectionSettings.includeTypes must be an object"),
    body("injectionSettings.includeTypes.filler")
      .optional()
      .isBoolean()
      .withMessage("injectionSettings.includeTypes.filler must be a boolean"),
    body("injectionSettings.includeTypes.cold")
      .optional()
      .isBoolean()
      .withMessage("injectionSettings.includeTypes.cold must be a boolean"),
    body("injectionSettings.includeTypes.live")
      .optional()
      .isBoolean()
      .withMessage("injectionSettings.includeTypes.live must be a boolean"),
    body("injectionSettings.scheduledTime")
      .optional()
      .isObject()
      .withMessage("injectionSettings.scheduledTime must be an object"),
    body("injectionSettings.scheduledTime.startTime")
      .optional()
      .custom((value) => {
        // Accept either ISO8601 format or HH:MM format
        if (typeof value === "string" && value.match(/^\d{2}:\d{2}$/)) {
          return true; // HH:MM format
        }
        if (typeof value === "string" && !isNaN(Date.parse(value))) {
          return true; // ISO8601 format
        }
        throw new Error(
          "injectionSettings.scheduledTime.startTime must be either HH:MM format or ISO8601 date"
        );
      }),
    body("injectionSettings.scheduledTime.endTime")
      .optional()
      .custom((value) => {
        // Accept either ISO8601 format or HH:MM format
        if (typeof value === "string" && value.match(/^\d{2}:\d{2}$/)) {
          return true; // HH:MM format
        }
        if (typeof value === "string" && !isNaN(Date.parse(value))) {
          return true; // ISO8601 format
        }
        throw new Error(
          "injectionSettings.scheduledTime.endTime must be either HH:MM format or ISO8601 date"
        );
      }),
  ],
  createOrder
);

// @route   GET /api/orders
// @desc    Get orders with pagination and filtering
// @access  Private (Admin, Manager)
router.get(
  "/",
  [
    protect,
    isManager,
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  getOrders
);

// @route   GET /api/orders/stats
// @desc    Get order statistics
// @access  Private (Admin, Manager)
router.get("/stats", [protect, isManager], getOrderStats);

// @route   GET /api/orders/:id
// @desc    Get a single order by ID
// @access  Private (Admin, Manager)
router.get("/:id", [protect, isManager], getOrderById);

// @route   PUT /api/orders/:id
// @desc    Update an order
// @access  Private (Admin, Manager)
router.put("/:id", [protect, isManager], updateOrder);

// @route   DELETE /api/orders/:id
// @desc    Cancel an order
// @access  Private (Admin, Manager)
router.delete("/:id", [protect, isManager], cancelOrder);

// @route   GET /api/orders/:id/export
// @desc    Export order leads to CSV
// @access  Private (Admin, Manager)
router.get("/:id/export", [protect, isManager], exportOrderLeads);

// @route   PUT /api/orders/:id/assign-client-info
// @desc    Assign client info to all leads in an order
// @access  Private (Admin, Manager)
router.put(
  "/:id/assign-client-info",
  [
    protect,
    isManager,
    body("client").optional().trim(),
    body("clientBroker").optional().trim(),
    body("clientNetwork").optional().trim(),
  ],
  assignClientInfoToOrderLeads
);

// New injection routes
// @route   POST /api/orders/:id/start-injection
// @desc    Start lead injection for an order
// @access  Private (Admin, Affiliate Manager)
router.post("/:id/start-injection", [protect, isManager], startOrderInjection);

// @route   POST /api/orders/:id/pause-injection
// @desc    Pause lead injection for an order
// @access  Private (Admin, Affiliate Manager)
router.post("/:id/pause-injection", [protect, isManager], pauseOrderInjection);

// @route   POST /api/orders/:id/stop-injection
// @desc    Stop lead injection for an order
// @access  Private (Admin, Affiliate Manager)
router.post("/:id/stop-injection", [protect, isManager], stopOrderInjection);

// @route   POST /api/orders/:id/skip-ftds
// @desc    Skip FTDs and mark them for manual filling later
// @access  Private (Admin, Affiliate Manager)
router.post("/:id/skip-ftds", [protect, isManager], skipOrderFTDs);

// @route   POST /api/orders/:id/assign-brokers
// @desc    Assign client brokers to leads in an order
// @access  Private (Admin, Manager)
router.post("/:id/assign-brokers", [protect, isManager], assignClientBrokers);

// @route   GET /api/orders/:id/pending-broker-assignment
// @desc    Get leads pending broker assignment for an order
// @access  Private (Admin, Manager)
router.get(
  "/:id/pending-broker-assignment",
  [protect, isManager],
  getLeadsPendingBrokerAssignment
);

// @route   POST /api/orders/:id/skip-broker-assignment
// @desc    Skip broker assignment for leads in an order
// @access  Private (Admin, Manager)
router.post(
  "/:id/skip-broker-assignment",
  [protect, isManager],
  skipBrokerAssignment
);

// @route   GET /api/orders/:id/ftd-leads
// @desc    Get FTD leads for manual injection
// @access  Private (Admin, Affiliate Manager)
router.get("/:id/ftd-leads", [protect, isManager], getFTDLeadsForOrder);

// @route   POST /api/orders/:id/manual-ftd-injection-start
// @desc    Start manual FTD injection (opens browser for manual filling)
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/:id/manual-ftd-injection-start",
  [protect, isManager],
  startManualFTDInjection
);

// @route   POST /api/orders/:id/manual-ftd-injection-complete
// @desc    Complete manual FTD injection (submit domain after manual filling)
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/:id/manual-ftd-injection-complete",
  [protect, isManager],
  completeManualFTDInjection
);

// @route   POST /api/orders/:id/manual-ftd-injection
// @desc    Manual FTD injection (deprecated - kept for compatibility)
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/:id/manual-ftd-injection",
  [protect, isManager],
  manualFTDInjection
);

// @route   POST /api/orders/:id/leads/:leadId/manual-ftd-injection-start
// @desc    Start manual FTD injection for a specific lead
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/:id/leads/:leadId/manual-ftd-injection-start",
  [protect, isManager],
  startManualFTDInjectionForLead
);

// @route   POST /api/orders/:id/leads/:leadId/manual-ftd-injection-complete
// @desc    Complete manual FTD injection for a specific lead
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/:id/leads/:leadId/manual-ftd-injection-complete",
  [protect, isManager],
  completeManualFTDInjectionForLead
);

// @route   POST /api/orders/:id/assign-ftd-session
// @desc    Assign FTD with session to agent
// @access  Private (Admin, Affiliate Manager)
router.post(
  "/:id/assign-ftd-session",
  [protect, isManager],
  assignFTDSession
);

// @route   POST /api/orders/:id/launch-agent-browser
// @desc    Launch browser with session for agent
// @access  Private (Agent)
router.post(
  "/:id/launch-agent-browser",
  [protect],
  launchAgentBrowser
);

// @desc    Assign devices to order leads
// @route   POST /api/v1/orders/:id/assign-devices
// @access  Private/Admin
router.post(
  "/:id/assign-devices",
  protect,
  authorize("admin", "affiliate_manager"),
  async (req, res) => {
    try {
      const { deviceConfig } = req.body;
      const orderId = req.params.id;

      const Order = require("../models/Order");
      const Lead = require("../models/Lead");
      const DeviceAssignmentService = require("../services/deviceAssignmentService");

      // Validate device configuration
      const validation =
        DeviceAssignmentService.validateDeviceConfig(deviceConfig);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      // Get order and its leads
      const order = await Order.findById(orderId).populate("leads");
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Assign devices to leads
      const results = await DeviceAssignmentService.assignDevicesToLeads(
        order.leads,
        deviceConfig,
        req.user.id
      );

      // Update order with device configuration
      order.injectionSettings.deviceConfig = deviceConfig;
      await order.save();

      res.status(200).json({
        success: true,
        message: "Device assignment completed",
        data: {
          results,
          order: order,
        },
      });
    } catch (error) {
      console.error("Error assigning devices to order:", error);
      res.status(500).json({
        success: false,
        message: "Server error during device assignment",
        error: error.message,
      });
    }
  }
);

// @desc    Get device assignment statistics for order
// @route   GET /api/v1/orders/:id/device-stats
// @access  Private/Admin
router.get(
  "/:id/device-stats",
  protect,
  authorize("admin", "affiliate_manager"),
  async (req, res) => {
    try {
      const orderId = req.params.id;

      const Order = require("../models/Order");
      const DeviceAssignmentService = require("../services/deviceAssignmentService");

      // Get order and its leads
      const order = await Order.findById(orderId).populate("leads");
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Get device statistics
      const stats = await DeviceAssignmentService.getDeviceStats(order.leads);

      res.status(200).json({
        success: true,
        data: {
          stats,
          deviceConfig: order.injectionSettings?.deviceConfig || null,
        },
      });
    } catch (error) {
      console.error("Error getting device stats:", error);
      res.status(500).json({
        success: false,
        message: "Server error getting device statistics",
        error: error.message,
      });
    }
  }
);

// @desc    Monitor proxy health
// @route   POST /api/v1/orders/monitor-proxies
// @access  Private/Admin
router.post(
  "/monitor-proxies",
  protect,
  authorize("admin", "affiliate_manager"),
  async (req, res) => {
    try {
      const ProxyManagementService = require("../services/proxyManagementService");

      console.log("Starting proxy health monitoring...");
      const results = await ProxyManagementService.monitorProxyHealth();

      res.status(200).json({
        success: true,
        message: "Proxy health monitoring completed",
        data: results,
      });
    } catch (error) {
      console.error("Error monitoring proxy health:", error);
      res.status(500).json({
        success: false,
        message: "Server error during proxy monitoring",
        error: error.message,
      });
    }
  }
);

// @desc    Get proxy statistics
// @route   GET /api/v1/orders/proxy-stats
// @access  Private/Admin
router.get(
  "/proxy-stats",
  protect,
  authorize("admin", "affiliate_manager"),
  async (req, res) => {
    try {
      const ProxyManagementService = require("../services/proxyManagementService");

      const stats = await ProxyManagementService.getProxyStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting proxy stats:", error);
      res.status(500).json({
        success: false,
        message: "Server error getting proxy statistics",
        error: error.message,
      });
    }
  }
);

// @desc    Update lead device type
// @route   PUT /api/v1/orders/leads/:leadId/device
// @access  Private/Admin
router.put(
  "/leads/:leadId/device",
  protect,
  authorize("admin", "affiliate_manager"),
  async (req, res) => {
    try {
      const { deviceType } = req.body;
      const leadId = req.params.leadId;

      if (
        !deviceType ||
        !["windows", "android", "ios", "mac"].includes(deviceType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid device type is required",
        });
      }

      const DeviceAssignmentService = require("../services/deviceAssignmentService");

      const result = await DeviceAssignmentService.updateLeadDevice(
        leadId,
        deviceType,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: `Updated lead device to ${deviceType}`,
        data: result,
      });
    } catch (error) {
      console.error("Error updating lead device:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating lead device",
        error: error.message,
      });
    }
  }
);

module.exports = router;
