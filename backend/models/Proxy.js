const mongoose = require("mongoose");

const proxySchema = new mongoose.Schema(
  {
    // Proxy identification
    proxyId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    
    // Proxy configuration
    config: {
      server: {
        type: String,
        required: true
      },
      username: {
        type: String,
        required: true
      },
      password: {
        type: String,
        required: true
      },
      host: {
        type: String,
        required: true
      },
      port: {
        type: Number,
        required: true
      }
    },
    
    // Proxy details
    country: {
      type: String,
      required: true,
      index: true
    },
    
    countryCode: {
      type: String,
      required: true,
      index: true
    },
    
    // Proxy status
    status: {
      type: String,
      enum: ["active", "failed", "testing"],
      default: "testing",
      index: true
    },
    
    // Usage tracking
    usage: {
      totalConnections: {
        type: Number,
        default: 0
      },
      activeConnections: {
        type: Number,
        default: 0
      },
      maxConcurrentConnections: {
        type: Number,
        default: 5 // Limit concurrent connections per proxy
      },
      lastUsedAt: {
        type: Date,
        default: Date.now
      },
      firstUsedAt: {
        type: Date,
        default: Date.now
      }
    },
    
    // Health monitoring
    health: {
      isHealthy: {
        type: Boolean,
        default: true,
        index: true
      },
      lastHealthCheck: {
        type: Date,
        default: Date.now
      },
      healthCheckInterval: {
        type: Number,
        default: 300000 // 5 minutes in milliseconds
      },
      failedHealthChecks: {
        type: Number,
        default: 0
      },
      maxFailedChecks: {
        type: Number,
        default: 3
      },
      responseTime: {
        type: Number,
        default: 0
      },
      lastError: {
        type: String,
        default: null
      }
    },
    
    // Associated lead using this proxy (one-to-one relationship)
    assignedLead: {
      leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
        sparse: true,
        index: true
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        sparse: true
      },
      assignedAt: {
        type: Date
      },
      status: {
        type: String,
        enum: ["active", "completed", "failed"],
        default: "active"
      },
      completedAt: {
        type: Date
      }
    },
    
    // Creation metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    // Session information from 922proxy
    sessionInfo: {
      sessionId: {
        type: String,
        required: true
      },
      originalUsername: {
        type: String,
        required: true
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
proxySchema.index({ country: 1, status: 1 });
proxySchema.index({ countryCode: 1, status: 1 });
proxySchema.index({ "health.isHealthy": 1, "health.lastHealthCheck": 1 });
proxySchema.index({ "assignedLead.leadId": 1 });
proxySchema.index({ "assignedLead.orderId": 1 });
proxySchema.index({ createdBy: 1 });

// Virtual for proxy description
proxySchema.virtual("description").get(function () {
  return `${this.country} (${this.countryCode}) - ${this.config.host}:${this.config.port}`;
});

// Virtual for availability
proxySchema.virtual("isAvailable").get(function () {
  return this.status === "active" && 
         this.health.isHealthy && 
         !this.assignedLead.leadId; // Proxy is available only if no lead is assigned
});

// Virtual for can accept FTD
proxySchema.virtual("canAcceptFTD").get(function () {
  return this.isAvailable && 
         this.usage.activeConnections < this.usage.maxConcurrentConnections;
});

// Static method to create proxy from 922proxy configuration
proxySchema.statics.createFromConfig = async function(country, countryCode, createdBy) {
  const { generateProxyConfig } = require('../utils/proxyManager');
  
  try {
    const proxyConfig = await generateProxyConfig(country, countryCode);
    
    if (!proxyConfig) {
      throw new Error(`Failed to generate proxy config for ${country}`);
    }
    
    const proxyId = `${countryCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const proxyData = {
      proxyId,
      config: proxyConfig.config,
      country,
      countryCode,
      status: "testing",
      sessionInfo: {
        sessionId: proxyConfig.sessionId,
        originalUsername: proxyConfig.originalUsername
      },
      createdBy
    };
    
    const proxy = await this.create(proxyData);
    
    // Test the proxy immediately after creation
    const isHealthy = await proxy.testConnection();
    if (isHealthy) {
      proxy.status = "active";
      await proxy.save();
    } else {
      proxy.status = "failed";
      await proxy.save();
      throw new Error(`Proxy health check failed for ${country}`);
    }
    
    return proxy;
  } catch (error) {
    console.error(`Error creating proxy for ${country}:`, error);
    throw error;
  }
};

// Method to test proxy connection
proxySchema.methods.testConnection = async function() {
  const axios = require('axios');
  const { HttpsProxyAgent } = require('https-proxy-agent');
  const startTime = Date.now();
  
  try {
    const proxyUrl = `http://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}`;
    
    const response = await axios.get('https://api.ipify.org', {
      httpsAgent: new HttpsProxyAgent(proxyUrl),
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    // Update health status
    this.health.isHealthy = true;
    this.health.lastHealthCheck = new Date();
    this.health.failedHealthChecks = 0;
    this.health.responseTime = responseTime;
    this.health.lastError = null;
    
    console.log(`Proxy health check passed for ${this.country}: ${response.data} (${responseTime}ms)`);
    return true;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Update health status
    this.health.isHealthy = false;
    this.health.lastHealthCheck = new Date();
    this.health.failedHealthChecks += 1;
    this.health.responseTime = responseTime;
    this.health.lastError = error.message;
    
    // Mark as failed if too many failed checks
    if (this.health.failedHealthChecks >= this.health.maxFailedChecks) {
      this.status = "failed";
    }
    
    console.error(`Proxy health check failed for ${this.country}:`, error.message);
    return false;
  }
};

// Method to assign lead to this proxy (one-to-one relationship)
proxySchema.methods.assignLead = function(leadId, orderId, leadType = "non-ftd") {
  // Check if proxy already has a lead assigned
  if (this.assignedLead.leadId) {
    return false; // Proxy already has a lead assigned
  }
  
  // Assign the lead to this proxy
  this.assignedLead = {
    leadId,
    orderId,
    assignedAt: new Date(),
    status: "active"
  };
  
  // Update usage counters
  this.usage.activeConnections = 1;
  this.usage.totalConnections += 1;
  this.usage.lastUsedAt = new Date();
  
  return true;
};

// Method to unassign lead from this proxy
proxySchema.methods.unassignLead = function(leadId, status = "completed") {
  // Check if the lead is assigned to this proxy
  if (!this.assignedLead.leadId || this.assignedLead.leadId.toString() !== leadId.toString()) {
    return false; // Lead not assigned to this proxy
  }
  
  // Complete the assignment
  this.assignedLead.status = status;
  this.assignedLead.completedAt = new Date();
  
  // Update usage counters
  this.usage.activeConnections = 0;
  
  return true;
};

// Static method to find available proxy for country
proxySchema.statics.findAvailableProxy = async function(country, countryCode, leadType = "non-ftd") {
  const query = {
    country,
    status: "active",
    "health.isHealthy": true,
    "assignedLead.leadId": { $exists: false } // Only find proxies with no assigned lead
  };
  
  return this.findOne(query).sort({ createdAt: 1 });
};

// Static method to find or create proxy for country
proxySchema.statics.findOrCreateProxy = async function(country, countryCode, createdBy, leadType = "non-ftd") {
  // Always create a new proxy for one-to-one relationship
  try {
    const proxy = await this.createFromConfig(country, countryCode, createdBy);
    return proxy;
  } catch (error) {
    console.error(`Failed to create proxy for ${country}:`, error);
    throw error;
  }
};

// Static method to cleanup failed proxies
proxySchema.statics.cleanupFailedProxies = async function() {
  const failedProxies = await this.find({
    status: "failed"
  });
  
  for (const proxy of failedProxies) {
    // If proxy has no active connections, it can be safely removed
    if (proxy.usage.activeConnections === 0) {
      await proxy.deleteOne();
      console.log(`Cleaned up failed proxy: ${proxy.description}`);
    }
  }
  
  return failedProxies.length;
};

// Pre-save middleware
proxySchema.pre("save", function(next) {
  // Ensure active connections doesn't go negative
  if (this.usage.activeConnections < 0) {
    this.usage.activeConnections = 0;
  }
  
  next();
});

module.exports = mongoose.model("Proxy", proxySchema); 