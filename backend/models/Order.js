const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["fulfilled", "partial", "pending", "cancelled"],
      default: "pending",
    },
    requests: {
      ftd: { type: Number, default: 0 },
      filler: { type: Number, default: 0 },
      cold: { type: Number, default: 0 },
      live: { type: Number, default: 0 },
    },
    leads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],

    // Additional tracking fields
    notes: String,
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Country filter used when creating this order
    countryFilter: {
      type: String,
      trim: true,
    },

    // Gender filter used when creating this order
    genderFilter: {
      type: String,
      enum: ["male", "female", "not_defined", null],
      default: null,
    },

    // Selected client network for this order (for reference only)
    selectedClientNetwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientNetwork",
      default: null,
    },

    // Fulfillment tracking
    fulfilled: {
      ftd: { type: Number, default: 0 },
      filler: { type: Number, default: 0 },
      cold: { type: Number, default: 0 },
      live: { type: Number, default: 0 },
    },

    // Injection settings and tracking
    injectionSettings: {
      enabled: { type: Boolean, default: false },
      mode: {
        type: String,
        enum: ["bulk", "scheduled"],
        default: "bulk",
      },
      // For scheduled injection
      scheduledTime: {
        startTime: { type: String }, // e.g., "10:00"
        endTime: { type: String }, // e.g., "12:00"
      },
      // Injection status tracking
      status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "failed", "paused"],
        default: "pending",
      },
      // Track which lead types to inject (FTDs are always manual)
      includeTypes: {
        filler: { type: Boolean, default: true },
        cold: { type: Boolean, default: true },
        live: { type: Boolean, default: true },
      },
      // Device configuration for injection
      deviceConfig: {
        // Device selection mode
        selectionMode: {
          type: String,
          enum: ["individual", "bulk", "ratio", "random"],
          default: "random",
        },
        // For bulk mode - apply same device type to all leads
        bulkDeviceType: {
          type: String,
          enum: ["windows", "android", "ios", "mac", null],
          default: null,
        },
        // For ratio mode - device distribution ratios
        deviceRatio: {
          windows: { type: Number, default: 0, min: 0, max: 10 },
          android: { type: Number, default: 0, min: 0, max: 10 },
          ios: { type: Number, default: 0, min: 0, max: 10 },
          mac: { type: Number, default: 0, min: 0, max: 10 },
        },
        // For individual mode - specific device assignments per lead
        individualAssignments: [
          {
            leadId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Lead",
            },
            deviceType: {
              type: String,
              enum: ["windows", "android", "ios", "mac"],
              required: true,
            },
          },
        ],
        // Default device types for random selection
        availableDeviceTypes: [
          {
            type: String,
            enum: ["windows", "android", "ios", "mac"],
          },
        ],
        
        // Detailed device specifications (shared across devices of same type)
        deviceSpecs: {
          // Operating System specifications
          operatingSystem: {
            // Windows specifications
            windows: {
              versions: [{ 
                type: String, 
                enum: ["Windows 10", "Windows 11", "Windows Server 2019", "Windows Server 2022"] 
              }],
              builds: [String], // e.g., ["19041", "19042", "22000"]
              editions: [{ 
                type: String, 
                enum: ["Home", "Pro", "Enterprise", "Education"] 
              }],
            },
            // Android specifications
            android: {
              versions: [{ 
                type: String, 
                enum: ["10", "11", "12", "13", "14"] 
              }],
              apiLevels: [Number], // e.g., [29, 30, 31, 32, 33]
              manufacturers: [{ 
                type: String, 
                enum: ["Samsung", "Google", "Xiaomi", "OnePlus", "Huawei", "LG", "Sony"] 
              }],
              models: [String], // e.g., ["Galaxy S21", "Pixel 6", "Mi 11"]
            },
            // iOS specifications
            ios: {
              versions: [{ 
                type: String, 
                enum: ["14.0", "15.0", "16.0", "17.0", "18.0"] 
              }],
              devices: [{ 
                type: String, 
                enum: ["iPhone", "iPad"] 
              }],
              models: [String], // e.g., ["iPhone 12", "iPhone 13", "iPad Pro"]
            },
            // macOS specifications
            mac: {
              versions: [{ 
                type: String, 
                enum: ["Big Sur", "Monterey", "Ventura", "Sonoma"] 
              }],
              builds: [String], // e.g., ["11.7", "12.6", "13.5", "14.1"]
              processors: [{ 
                type: String, 
                enum: ["Intel", "Apple Silicon M1", "Apple Silicon M2", "Apple Silicon M3"] 
              }],
            },
          },
          
          // Hardware specifications
          hardware: {
            // Memory specifications (in GB)
            memory: {
              min: { type: Number, default: 4, min: 1, max: 128 },
              max: { type: Number, default: 16, min: 1, max: 128 },
              preferred: [{ type: Number, enum: [4, 8, 16, 32, 64] }],
            },
            // CPU specifications
            cpu: {
              cores: {
                min: { type: Number, default: 2, min: 1, max: 32 },
                max: { type: Number, default: 8, min: 1, max: 32 },
              },
              architectures: [{ 
                type: String, 
                enum: ["x86", "x64", "ARM", "ARM64"] 
              }],
              brands: [{ 
                type: String, 
                enum: ["Intel", "AMD", "Apple", "Qualcomm", "MediaTek"] 
              }],
            },
            // Storage specifications (in GB)
            storage: {
              min: { type: Number, default: 64, min: 16, max: 4096 },
              max: { type: Number, default: 512, min: 16, max: 4096 },
              types: [{ 
                type: String, 
                enum: ["HDD", "SSD", "NVMe", "eMMC"] 
              }],
            },
          },
          
          // Display specifications
          display: {
            // Screen resolution ranges
            resolution: {
              width: {
                min: { type: Number, default: 1280, min: 800, max: 7680 },
                max: { type: Number, default: 1920, min: 800, max: 7680 },
              },
              height: {
                min: { type: Number, default: 720, min: 600, max: 4320 },
                max: { type: Number, default: 1080, min: 600, max: 4320 },
              },
            },
            // Pixel density
            pixelRatio: {
              min: { type: Number, default: 1, min: 0.5, max: 4 },
              max: { type: Number, default: 2, min: 0.5, max: 4 },
            },
            // Color depth
            colorDepth: [{ type: Number, enum: [16, 24, 32] }],
          },
          
          // Browser specifications
          browser: {
            // Preferred browsers
            types: [{ 
              type: String, 
              enum: ["chrome", "firefox", "safari", "edge"] 
            }],
            // Version ranges
            versions: {
              chrome: {
                min: { type: String, default: "100.0" },
                max: { type: String, default: "120.0" },
              },
              firefox: {
                min: { type: String, default: "100.0" },
                max: { type: String, default: "120.0" },
              },
              safari: {
                min: { type: String, default: "15.0" },
                max: { type: String, default: "17.0" },
              },
              edge: {
                min: { type: String, default: "100.0" },
                max: { type: String, default: "120.0" },
              },
            },
          },
          
          // Network and connectivity
          network: {
            connectionTypes: [{ 
              type: String, 
              enum: ["wifi", "cellular", "ethernet", "unknown"] 
            }],
            downlinkSpeeds: [{ 
              type: String, 
              enum: ["slow-2g", "2g", "3g", "4g", "5g", "wifi"] 
            }],
          },
          
          // Timezone and locale preferences
          locale: {
            timezones: [String], // e.g., ["America/New_York", "Europe/London", "Asia/Tokyo"]
            languages: [String], // e.g., ["en-US", "en-GB", "es-ES", "fr-FR"]
            regions: [String], // e.g., ["US", "GB", "CA", "AU"]
          },
          
          // Additional device characteristics
          characteristics: {
            // Touch support
            touchSupport: { 
              type: String, 
              enum: ["required", "optional", "disabled"], 
              default: "optional" 
            },
            // Webcam/camera support
            cameraSupport: { 
              type: String, 
              enum: ["required", "optional", "disabled"], 
              default: "optional" 
            },
            // Microphone support
            microphoneSupport: { 
              type: String, 
              enum: ["required", "optional", "disabled"], 
              default: "optional" 
            },
            // GPS/location support
            locationSupport: { 
              type: String, 
              enum: ["required", "optional", "disabled"], 
              default: "optional" 
            },
          },
        },
        // Proxy configuration for injection
        proxyConfig: {
          // Proxy health monitoring
          healthCheckInterval: {
            type: Number,
            default: 300000,
            min: 60000,
            max: 1800000,
          }, // 1 min to 30 min
        },
      },
    },

    // FTD handling tracking
    ftdHandling: {
      status: {
        type: String,
        enum: ["pending", "skipped", "manual_fill_required", "completed"],
        default: "pending",
      },
      skippedAt: { type: Date },
      completedAt: { type: Date },
      notes: { type: String },
    },

    // Injection progress tracking
    injectionProgress: {
      totalToInject: { type: Number, default: 0 },
      totalInjected: { type: Number, default: 0 },
      successfulInjections: { type: Number, default: 0 },
      failedInjections: { type: Number, default: 0 },
      ftdsPendingManualFill: { type: Number, default: 0 },
      lastInjectionAt: { type: Date },
      completedAt: { type: Date },
      // Track client broker assignment after injection
      brokersAssigned: { type: Number, default: 0 },
      brokerAssignmentPending: { type: Boolean, default: false },
    },

    // Client broker assignment tracking
    clientBrokerAssignment: {
      status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "skipped"],
        default: "pending",
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      assignedAt: { type: Date },
      notes: { type: String },
    },

    // Completion tracking
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
orderSchema.index({ requester: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ priority: 1 });

// Virtual for total requested leads
orderSchema.virtual("totalRequested").get(function () {
  return (
    this.requests.ftd +
    this.requests.filler +
    this.requests.cold +
    this.requests.live
  );
});

// Virtual for total fulfilled leads
orderSchema.virtual("totalFulfilled").get(function () {
  return (
    this.fulfilled.ftd +
    this.fulfilled.filler +
    this.fulfilled.cold +
    this.fulfilled.live
  );
});

// Virtual for completion percentage
orderSchema.virtual("completionPercentage").get(function () {
  const total = this.totalRequested;
  if (total === 0) return 0;
  return Math.round((this.totalFulfilled / total) * 100);
});

// Pre-save middleware
orderSchema.pre("save", function (next) {
  // Set completion date when status changes to fulfilled
  if (this.isModified("status")) {
    if (this.status === "fulfilled" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === "cancelled" && !this.cancelledAt) {
      this.cancelledAt = new Date();
    }
  }

  next();
});

// Static methods
orderSchema.statics.getOrderStats = function (userId = null) {
  const matchStage = userId
    ? { requester: new mongoose.Types.ObjectId(userId) }
    : {};

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRequested: {
          $sum: {
            $add: [
              "$requests.ftd",
              "$requests.filler",
              "$requests.cold",
              "$requests.live",
            ],
          },
        },
        totalFulfilled: {
          $sum: {
            $add: [
              "$fulfilled.ftd",
              "$fulfilled.filler",
              "$fulfilled.cold",
              "$fulfilled.live",
            ],
          },
        },
      },
    },
  ]);
};

orderSchema.statics.getRecentOrders = function (userId = null, limit = 10) {
  const matchStage = userId
    ? { requester: new mongoose.Types.ObjectId(userId) }
    : {};

  return this.find(matchStage)
    .populate("requester", "fullName email role")
    .populate("leads", "leadType firstName lastName country")
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model("Order", orderSchema);
