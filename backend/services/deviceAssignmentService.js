const Lead = require('../models/Lead');
const Fingerprint = require('../models/Fingerprint');

/**
 * Device Assignment Service
 * Handles device type assignment for leads based on order configuration
 */
class DeviceAssignmentService {

  /**
   * Assign devices to leads based on order configuration
   * @param {Array} leads - Array of lead objects
   * @param {Object} deviceConfig - Device configuration from order
   * @param {string} createdBy - User ID who is creating the assignment
   * @returns {Promise<Object>} Assignment results
   */
  static async assignDevicesToLeads(leads, deviceConfig, createdBy) {
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    if (!leads || leads.length === 0) {
      return results;
    }

    try {
      // Filter out FTDs as they are handled manually
      const nonFTDLeads = leads.filter(lead => lead.leadType !== 'ftd');

      if (nonFTDLeads.length === 0) {
        console.log('No non-FTD leads to assign devices to');
        return results;
      }

      console.log(`Assigning devices to ${nonFTDLeads.length} leads using mode: ${deviceConfig.selectionMode}`);

      // Extract device specifications from config
      const deviceSpecs = deviceConfig.deviceSpecs || null;

      switch (deviceConfig.selectionMode) {
        case 'individual':
          return await this.assignIndividualDevices(nonFTDLeads, deviceConfig.individualAssignments, createdBy, deviceSpecs);

        case 'bulk':
          return await this.assignBulkDevice(nonFTDLeads, deviceConfig.bulkDeviceType, createdBy, deviceSpecs);

        case 'ratio':
          return await this.assignRatioBasedDevices(nonFTDLeads, deviceConfig.deviceRatio, createdBy, deviceSpecs);

        case 'random':
        default:
          return await this.assignRandomDevices(nonFTDLeads, deviceConfig.availableDeviceTypes, createdBy, deviceSpecs);
      }

    } catch (error) {
      console.error('Error in device assignment service:', error);
      throw error;
    }
  }

  /**
   * Assign individual devices based on specific assignments
   */
  static async assignIndividualDevices(leads, individualAssignments, createdBy, deviceSpecs) {
    const results = { successful: [], failed: [], skipped: [] };

    for (const lead of leads) {
      try {
        // Find specific assignment for this lead
        const assignment = individualAssignments.find(
          assign => assign.leadId.toString() === lead._id.toString()
        );

        if (!assignment) {
          // No specific assignment, use random device
          const deviceType = this.getRandomDeviceType();
          await this.assignDeviceToLead(lead, deviceType, createdBy, deviceSpecs);
          results.successful.push({
            leadId: lead._id,
            deviceType,
            method: 'random_fallback'
          });
        } else {
          await this.assignDeviceToLead(lead, assignment.deviceType, createdBy, deviceSpecs);
          results.successful.push({
            leadId: lead._id,
            deviceType: assignment.deviceType,
            method: 'individual'
          });
        }

      } catch (error) {
        console.error(`Failed to assign device to lead ${lead._id}:`, error);
        results.failed.push({
          leadId: lead._id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Assign the same device type to all leads
   */
  static async assignBulkDevice(leads, bulkDeviceType, createdBy, deviceSpecs) {
    const results = { successful: [], failed: [], skipped: [] };

    if (!bulkDeviceType) {
      throw new Error('Bulk device type not specified');
    }

    for (const lead of leads) {
      try {
        await this.assignDeviceToLead(lead, bulkDeviceType, createdBy, deviceSpecs);
        results.successful.push({
          leadId: lead._id,
          deviceType: bulkDeviceType,
          method: 'bulk'
        });

      } catch (error) {
        console.error(`Failed to assign bulk device to lead ${lead._id}:`, error);
        results.failed.push({
          leadId: lead._id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Assign devices based on ratio configuration
   */
  static async assignRatioBasedDevices(leads, deviceRatio, createdBy, deviceSpecs) {
    const results = { successful: [], failed: [], skipped: [] };

    // Calculate device distribution based on ratios
    const deviceDistribution = this.calculateDeviceDistribution(leads.length, deviceRatio);

    console.log('Device distribution:', deviceDistribution);

    let leadIndex = 0;

    for (const [deviceType, count] of Object.entries(deviceDistribution)) {
      for (let i = 0; i < count && leadIndex < leads.length; i++) {
        const lead = leads[leadIndex];

        try {
          await this.assignDeviceToLead(lead, deviceType, createdBy, deviceSpecs);
          results.successful.push({
            leadId: lead._id,
            deviceType,
            method: 'ratio'
          });

        } catch (error) {
          console.error(`Failed to assign ratio device to lead ${lead._id}:`, error);
          results.failed.push({
            leadId: lead._id,
            error: error.message
          });
        }

        leadIndex++;
      }
    }

    return results;
  }

  /**
   * Assign random devices from available types
   */
  static async assignRandomDevices(leads, availableDeviceTypes, createdBy, deviceSpecs) {
    const results = { successful: [], failed: [], skipped: [] };

    // Use default device types if none specified
    const deviceTypes = availableDeviceTypes && availableDeviceTypes.length > 0
      ? availableDeviceTypes
      : ['windows', 'android', 'ios', 'mac'];

    for (const lead of leads) {
      try {
        const randomDeviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
        await this.assignDeviceToLead(lead, randomDeviceType, createdBy, deviceSpecs);
        results.successful.push({
          leadId: lead._id,
          deviceType: randomDeviceType,
          method: 'random'
        });

      } catch (error) {
        console.error(`Failed to assign random device to lead ${lead._id}:`, error);
        results.failed.push({
          leadId: lead._id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Assign a specific device type to a lead
   */
  static async assignDeviceToLead(lead, deviceType, createdBy, deviceSpecs) {
    try {
      // Check if lead already has a device assigned
      if (lead.fingerprint) {
        console.log(`Lead ${lead._id} already has device ${lead.deviceType}, skipping`);
        return;
      }

      // Assign fingerprint to lead with device specifications
      const fingerprint = await lead.assignFingerprint(deviceType, createdBy, deviceSpecs);
      await lead.save();

      console.log(`Assigned ${deviceType} device to lead ${lead._id} (fingerprint: ${fingerprint.deviceId})`);

      return fingerprint;

    } catch (error) {
      console.error(`Error assigning device to lead ${lead._id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate device distribution based on ratios
   */
  static calculateDeviceDistribution(totalLeads, deviceRatio) {
    const distribution = {};

    // Get total ratio points
    const totalRatio = Object.values(deviceRatio).reduce((sum, ratio) => sum + ratio, 0);

    if (totalRatio === 0) {
      // If no ratios specified, distribute evenly among all device types
      const deviceTypes = Object.keys(deviceRatio);
      const perDevice = Math.floor(totalLeads / deviceTypes.length);
      const remainder = totalLeads % deviceTypes.length;

      deviceTypes.forEach((deviceType, index) => {
        distribution[deviceType] = index < remainder ? perDevice + 1 : perDevice;
      });

      return distribution;
    }

    // Calculate distribution based on ratios
    let assignedLeads = 0;
    const deviceTypes = Object.keys(deviceRatio);

    for (let i = 0; i < deviceTypes.length; i++) {
      const deviceType = deviceTypes[i];
      const ratio = deviceRatio[deviceType];

      if (ratio === 0) {
        distribution[deviceType] = 0;
        continue;
      }

      if (i === deviceTypes.length - 1) {
        // Last device type gets remaining leads
        distribution[deviceType] = totalLeads - assignedLeads;
      } else {
        // Calculate proportional assignment
        const count = Math.round((ratio / totalRatio) * totalLeads);
        distribution[deviceType] = count;
        assignedLeads += count;
      }
    }

    return distribution;
  }

  /**
   * Get a random device type from default options
   */
  static getRandomDeviceType() {
    const deviceTypes = ['windows', 'android', 'ios', 'mac'];
    return deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
  }

  /**
   * Update device assignment for a specific lead
   */
  static async updateLeadDevice(leadId, newDeviceType, createdBy, deviceSpecs = null) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      // Update device type with device specifications
      const fingerprint = await lead.updateDeviceType(newDeviceType, createdBy, deviceSpecs);
      await lead.save();

      console.log(`Updated lead ${leadId} device to ${newDeviceType}`);

      return {
        lead,
        fingerprint
      };

    } catch (error) {
      console.error(`Error updating device for lead ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Get device assignment statistics for an order
   */
  static async getDeviceStats(orderLeads) {
    const stats = {
      total: orderLeads.length,
      assigned: 0,
      unassigned: 0,
      byDeviceType: {
        windows: 0,
        android: 0,
        ios: 0,
        mac: 0
      }
    };

    for (const lead of orderLeads) {
      if (lead.deviceType) {
        stats.assigned++;
        stats.byDeviceType[lead.deviceType]++;
      } else {
        stats.unassigned++;
      }
    }

    return stats;
  }

  /**
   * Validate device configuration
   */
  static validateDeviceConfig(deviceConfig) {
    if (!deviceConfig) {
      return { valid: false, error: 'Device configuration is required' };
    }

    const { selectionMode } = deviceConfig;

    switch (selectionMode) {
      case 'bulk':
        if (!deviceConfig.bulkDeviceType) {
          return { valid: false, error: 'Bulk device type is required for bulk mode' };
        }
        break;

      case 'ratio':
        const ratios = deviceConfig.deviceRatio;
        if (!ratios || Object.values(ratios).every(ratio => ratio === 0)) {
          return { valid: false, error: 'At least one device ratio must be greater than 0' };
        }
        break;

      case 'individual':
        if (!deviceConfig.individualAssignments || deviceConfig.individualAssignments.length === 0) {
          console.warn('No individual assignments specified, will fall back to random assignment');
        }
        break;

      case 'random':
        // Random mode is always valid
        break;

      default:
        return { valid: false, error: `Invalid selection mode: ${selectionMode}` };
    }

    return { valid: true };
  }
}

module.exports = DeviceAssignmentService; 