const mongoose = require("mongoose");

const fingerprintSchema = new mongoose.Schema(
  {
    // Device identification
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Device type and basic info
    deviceType: {
      type: String,
      enum: ["windows", "android", "ios", "mac"],
      required: true,
      index: true
    },

    // Browser information
    browser: {
      name: {
        type: String,
        enum: ["chrome", "firefox", "safari", "edge"],
        default: "chrome"
      },
      version: {
        type: String,
        required: true
      }
    },

    // Screen properties
    screen: {
      width: {
        type: Number,
        required: true
      },
      height: {
        type: Number,
        required: true
      },
      availWidth: {
        type: Number,
        required: true
      },
      availHeight: {
        type: Number,
        required: true
      },
      colorDepth: {
        type: Number,
        default: 24
      },
      pixelDepth: {
        type: Number,
        default: 24
      },
      devicePixelRatio: {
        type: Number,
        default: 1
      }
    },

    // Navigator properties
    navigator: {
      userAgent: {
        type: String,
        required: true
      },
      platform: {
        type: String,
        required: true
      },
      language: {
        type: String,
        default: "en-US"
      },
      languages: [{
        type: String
      }],
      vendor: {
        type: String,
        default: ""
      },
      product: {
        type: String,
        default: "Gecko"
      },
      hardwareConcurrency: {
        type: Number,
        default: 4
      },
      deviceMemory: {
        type: Number,
        default: 8
      },
      maxTouchPoints: {
        type: Number,
        default: 0
      }
    },

    // WebGL and Canvas fingerprinting
    webgl: {
      vendor: {
        type: String,
        default: ""
      },
      renderer: {
        type: String,
        default: ""
      },
      version: {
        type: String,
        default: ""
      },
      shadingLanguageVersion: {
        type: String,
        default: ""
      }
    },

    // Canvas fingerprint
    canvasFingerprint: {
      type: String,
      default: ""
    },

    // Audio context fingerprint
    audioFingerprint: {
      type: String,
      default: ""
    },

    // Timezone and locale
    timezone: {
      type: String,
      default: "America/New_York"
    },

    // Plugins (for desktop browsers)
    plugins: [{
      name: String,
      filename: String,
      description: String,
      version: String
    }],

    // Mobile specific properties
    mobile: {
      isMobile: {
        type: Boolean,
        default: false
      },
      isTablet: {
        type: Boolean,
        default: false
      },
      orientation: {
        type: String,
        enum: ["portrait", "landscape"],
        default: "portrait"
      }
    },

    // Additional properties for uniqueness
    additional: {
      cookieEnabled: {
        type: Boolean,
        default: true
      },
      doNotTrack: {
        type: String,
        default: null
      },
      localStorage: {
        type: Boolean,
        default: true
      },
      sessionStorage: {
        type: Boolean,
        default: true
      },
      indexedDB: {
        type: Boolean,
        default: true
      }
    },

    // Usage tracking
    isActive: {
      type: Boolean,
      default: true
    },

    // Associated lead (one-to-one relationship)
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      unique: true,
      sparse: true,
      index: true
    },

    // Creation metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Last used timestamp
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
fingerprintSchema.index({ deviceType: 1, isActive: 1 });
fingerprintSchema.index({ leadId: 1 }, { sparse: true });
fingerprintSchema.index({ createdBy: 1 });
fingerprintSchema.index({ lastUsedAt: -1 });

// Virtual for device description
fingerprintSchema.virtual("deviceDescription").get(function () {
  const screen = `${this.screen.width}x${this.screen.height}`;
  const browser = `${this.browser.name} ${this.browser.version}`;
  return `${this.deviceType} - ${screen} - ${browser}`;
});

// Static method to generate a unique device fingerprint based on device type
fingerprintSchema.statics.generateFingerprint = function (deviceType, createdBy, deviceSpecs = null) {
  const deviceConfigs = {
    windows: {
      screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, devicePixelRatio: 1 },
      navigator: {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Win32",
        hardwareConcurrency: 8,
        deviceMemory: 8,
        maxTouchPoints: 0
      },
      mobile: { isMobile: false, isTablet: false },
      browser: { name: "chrome", version: "120.0.0.0" }
    },
    android: {
      screen: { width: 428, height: 926, availWidth: 428, availHeight: 926, devicePixelRatio: 3 },
      navigator: {
        userAgent: "Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        platform: "Linux armv8l",
        hardwareConcurrency: 8,
        deviceMemory: 8,
        maxTouchPoints: 10
      },
      mobile: { isMobile: true, isTablet: false },
      browser: { name: "chrome", version: "120.0.0.0" }
    },
    ios: {
      screen: { width: 428, height: 926, availWidth: 428, availHeight: 926, devicePixelRatio: 3 },
      navigator: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        hardwareConcurrency: 6,
        deviceMemory: 6,
        maxTouchPoints: 5
      },
      mobile: { isMobile: true, isTablet: false },
      browser: { name: "safari", version: "17.0" }
    },
    mac: {
      screen: { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, devicePixelRatio: 2 },
      navigator: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "MacIntel",
        hardwareConcurrency: 8,
        deviceMemory: 16,
        maxTouchPoints: 0
      },
      mobile: { isMobile: false, isTablet: false },
      browser: { name: "chrome", version: "120.0.0.0" }
    }
  };

  const config = deviceConfigs[deviceType] || deviceConfigs.windows;

  // Generate unique device ID
  const deviceId = `${deviceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Apply device specifications if provided
  let finalConfig = { ...config };

  if (deviceSpecs) {
    // Apply hardware specifications
    if (deviceSpecs.hardware) {
      const hardware = deviceSpecs.hardware;

      // Apply memory specifications
      if (hardware.memory) {
        const memoryMin = hardware.memory.min || 4;
        const memoryMax = hardware.memory.max || 16;
        const preferredMemory = hardware.memory.preferred || [];

        if (preferredMemory.length > 0) {
          finalConfig.navigator.deviceMemory = preferredMemory[Math.floor(Math.random() * preferredMemory.length)];
        } else {
          finalConfig.navigator.deviceMemory = Math.floor(Math.random() * (memoryMax - memoryMin + 1)) + memoryMin;
        }
      }

      // Apply CPU specifications
      if (hardware.cpu && hardware.cpu.cores) {
        const coresMin = hardware.cpu.cores.min || 2;
        const coresMax = hardware.cpu.cores.max || 8;
        finalConfig.navigator.hardwareConcurrency = Math.floor(Math.random() * (coresMax - coresMin + 1)) + coresMin;
      }
    }

    // Apply display specifications
    if (deviceSpecs.display) {
      const display = deviceSpecs.display;

      // Apply resolution specifications
      if (display.resolution) {
        if (display.resolution.width) {
          const widthMin = display.resolution.width.min || 1280;
          const widthMax = display.resolution.width.max || 1920;
          finalConfig.screen.width = Math.floor(Math.random() * (widthMax - widthMin + 1)) + widthMin;
          finalConfig.screen.availWidth = finalConfig.screen.width;
        }

        if (display.resolution.height) {
          const heightMin = display.resolution.height.min || 720;
          const heightMax = display.resolution.height.max || 1080;
          finalConfig.screen.height = Math.floor(Math.random() * (heightMax - heightMin + 1)) + heightMin;
          finalConfig.screen.availHeight = finalConfig.screen.height - 40; // Account for taskbar/status bar
        }
      }

      // Apply pixel ratio specifications
      if (display.pixelRatio) {
        const ratioMin = display.pixelRatio.min || 1;
        const ratioMax = display.pixelRatio.max || 2;
        finalConfig.screen.devicePixelRatio = Math.random() * (ratioMax - ratioMin) + ratioMin;
      }

      // Apply color depth specifications
      if (display.colorDepth && display.colorDepth.length > 0) {
        finalConfig.screen.colorDepth = display.colorDepth[Math.floor(Math.random() * display.colorDepth.length)];
        finalConfig.screen.pixelDepth = finalConfig.screen.colorDepth;
      }
    }

    // Apply browser specifications
    if (deviceSpecs.browser && deviceSpecs.browser.types && deviceSpecs.browser.types.length > 0) {
      const browserType = deviceSpecs.browser.types[Math.floor(Math.random() * deviceSpecs.browser.types.length)];
      finalConfig.browser.name = browserType;

      // Update user agent based on browser type and device
      if (deviceSpecs.browser.versions && deviceSpecs.browser.versions[browserType]) {
        const versionRange = deviceSpecs.browser.versions[browserType];
        // For simplicity, use the max version
        finalConfig.browser.version = versionRange.max || finalConfig.browser.version;
      }

      // Update user agent string based on browser type
      finalConfig.navigator.userAgent = this.generateUserAgent(deviceType, browserType, finalConfig.browser.version, deviceSpecs);
    }

    // Apply operating system specifications
    if (deviceSpecs.operatingSystem && deviceSpecs.operatingSystem[deviceType]) {
      const osSpecs = deviceSpecs.operatingSystem[deviceType];

      if (osSpecs.versions && osSpecs.versions.length > 0) {
        const selectedVersion = osSpecs.versions[Math.floor(Math.random() * osSpecs.versions.length)];
        // Update user agent with selected OS version
        finalConfig.navigator.userAgent = this.updateUserAgentWithOS(finalConfig.navigator.userAgent, deviceType, selectedVersion);
      }

      // Apply manufacturer for Android devices
      if (deviceType === 'android' && osSpecs.manufacturers && osSpecs.manufacturers.length > 0) {
        const manufacturer = osSpecs.manufacturers[Math.floor(Math.random() * osSpecs.manufacturers.length)];
        finalConfig.navigator.userAgent = this.updateUserAgentWithManufacturer(finalConfig.navigator.userAgent, manufacturer);
      }
    }

    // Apply device characteristics
    if (deviceSpecs.characteristics) {
      const chars = deviceSpecs.characteristics;

      // Apply touch support
      if (chars.touchSupport === 'required') {
        finalConfig.navigator.maxTouchPoints = Math.max(1, finalConfig.navigator.maxTouchPoints);
      } else if (chars.touchSupport === 'disabled') {
        finalConfig.navigator.maxTouchPoints = 0;
      }
      // 'optional' keeps the default behavior
    }
  }

  // Add some randomization to make each fingerprint unique (but within spec ranges)
  const variations = {
    screenWidth: [-2, -1, 0, 1, 2],
    screenHeight: [-2, -1, 0, 1, 2],
    hardwareConcurrency: deviceType === 'android' || deviceType === 'ios' ? [0, 1, -1] : [0, 1, -1, 2, -2],
    deviceMemory: [0, 1, -1]
  };

  const randomVariation = (base, variations) => {
    const variation = variations[Math.floor(Math.random() * variations.length)];
    return Math.max(1, base + variation);
  };

  // Apply small random variations if not overridden by specs
  if (!deviceSpecs || !deviceSpecs.display || !deviceSpecs.display.resolution) {
    finalConfig.screen.width = randomVariation(finalConfig.screen.width, variations.screenWidth);
    finalConfig.screen.height = randomVariation(finalConfig.screen.height, variations.screenHeight);
    finalConfig.screen.availWidth = finalConfig.screen.width;
    finalConfig.screen.availHeight = finalConfig.screen.height - 40;
  }

  if (!deviceSpecs || !deviceSpecs.hardware || !deviceSpecs.hardware.cpu) {
    finalConfig.navigator.hardwareConcurrency = randomVariation(finalConfig.navigator.hardwareConcurrency, variations.hardwareConcurrency);
  }

  if (!deviceSpecs || !deviceSpecs.hardware || !deviceSpecs.hardware.memory) {
    finalConfig.navigator.deviceMemory = randomVariation(finalConfig.navigator.deviceMemory, variations.deviceMemory);
  }

  return {
    deviceId,
    deviceType,
    browser: finalConfig.browser,
    screen: {
      width: finalConfig.screen.width,
      height: finalConfig.screen.height,
      availWidth: finalConfig.screen.availWidth,
      availHeight: finalConfig.screen.availHeight,
      colorDepth: finalConfig.screen.colorDepth || 24,
      pixelDepth: finalConfig.screen.pixelDepth || 24,
      devicePixelRatio: finalConfig.screen.devicePixelRatio
    },
    navigator: {
      userAgent: finalConfig.navigator.userAgent,
      platform: finalConfig.navigator.platform,
      language: "en-US",
      languages: ["en-US", "en"],
      vendor: finalConfig.browser.name === "chrome" ? "Google Inc." : "",
      product: "Gecko",
      hardwareConcurrency: finalConfig.navigator.hardwareConcurrency,
      deviceMemory: finalConfig.navigator.deviceMemory,
      maxTouchPoints: finalConfig.navigator.maxTouchPoints
    },
    webgl: {
      vendor: "WebKit",
      renderer: `WebKit WebGL`,
      version: "WebGL 1.0",
      shadingLanguageVersion: "WebGL GLSL ES 1.0"
    },
    canvasFingerprint: Math.random().toString(36).substr(2, 16),
    audioFingerprint: Math.random().toString(36).substr(2, 16),
    timezone: "America/New_York",
    plugins: deviceType === 'windows' || deviceType === 'mac' ? [
      {
        name: "Chrome PDF Plugin",
        filename: "internal-pdf-viewer",
        description: "Portable Document Format",
        version: "1.0"
      }
    ] : [],
    mobile: finalConfig.mobile,
    additional: {
      cookieEnabled: true,
      doNotTrack: null,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true
    },
    createdBy,
    lastUsedAt: new Date()
  };
};

// Static method to create fingerprint for a lead
fingerprintSchema.statics.createForLead = async function(leadId, deviceType, createdBy, deviceSpecs = null) {
  // Validate required parameters
  if (!leadId) {
    throw new Error("leadId is required");
  }
  if (!deviceType) {
    throw new Error("deviceType is required");
  }
  if (!createdBy) {
    throw new Error("createdBy is required");
  }
  
  // Validate deviceType
  const validDeviceTypes = ["windows", "android", "ios", "mac"];
  if (!validDeviceTypes.includes(deviceType)) {
    throw new Error(`Invalid deviceType: ${deviceType}. Must be one of: ${validDeviceTypes.join(", ")}`);
  }
  
  // Check if fingerprint already exists for this lead
  const existing = await this.findOne({ leadId });
  if (existing) {
    throw new Error("Fingerprint already exists for this lead");
  }
  
  const fingerprintData = this.generateFingerprint(deviceType, createdBy, deviceSpecs);
  fingerprintData.leadId = leadId;
  
  return this.create(fingerprintData);
};

// Helper method to generate user agent based on device specs
fingerprintSchema.statics.generateUserAgent = function(deviceType, browserType, browserVersion, deviceSpecs) {
  const baseUserAgents = {
    windows: {
      chrome: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`,
      firefox: `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${browserVersion}) Gecko/20100101 Firefox/${browserVersion}`,
      edge: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Edg/${browserVersion}`
    },
    android: {
      chrome: `Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Mobile Safari/537.36`,
      firefox: `Mozilla/5.0 (Mobile; rv:${browserVersion}) Gecko/${browserVersion} Firefox/${browserVersion}`
    },
    ios: {
      safari: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${browserVersion} Mobile/15E148 Safari/604.1`,
      chrome: `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/${browserVersion} Mobile/15E148 Safari/604.1`
    },
    mac: {
      chrome: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`,
      safari: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${browserVersion} Safari/605.1.15`,
      firefox: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:${browserVersion}) Gecko/20100101 Firefox/${browserVersion}`
    }
  };
  
  return baseUserAgents[deviceType]?.[browserType] || baseUserAgents[deviceType]?.chrome || baseUserAgents.windows.chrome;
};

// Helper method to update user agent with OS version
fingerprintSchema.statics.updateUserAgentWithOS = function(userAgent, deviceType, osVersion) {
  switch (deviceType) {
    case 'windows':
      if (osVersion === 'Windows 11') {
        return userAgent.replace('Windows NT 10.0', 'Windows NT 10.0');
      }
      break;
    case 'android':
      return userAgent.replace('Android 14', `Android ${osVersion}`);
    case 'ios':
      const iosVersionFormatted = osVersion.replace(/\./g, '_');
      return userAgent.replace('17_0', iosVersionFormatted);
    case 'mac':
      return userAgent.replace('10_15_7', '10_15_7'); // Simplified for now
  }
  return userAgent;
};

// Helper method to update user agent with manufacturer
fingerprintSchema.statics.updateUserAgentWithManufacturer = function(userAgent, manufacturer) {
  const deviceModels = {
    'Samsung': 'SM-G998B',
    'Google': 'Pixel 6',
    'Xiaomi': 'Mi 11',
    'OnePlus': 'OnePlus 9',
    'Huawei': 'P50 Pro',
    'LG': 'LG-H870',
    'Sony': 'SO-01M'
  };
  
  const model = deviceModels[manufacturer] || 'SM-G998B';
  return userAgent.replace(/[A-Z]{2}-[A-Z0-9]+/g, model);
};

// Method to update last used timestamp
fingerprintSchema.methods.updateLastUsed = function () {
  this.lastUsedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Fingerprint", fingerprintSchema); 