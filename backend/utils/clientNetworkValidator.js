const Lead = require('../models/Lead');

/**
 * Validates if a lead can be assigned to a client network within a specific order
 * @param {string} leadId - The lead ID
 * @param {string} clientNetwork - The client network name
 * @param {string} orderId - The order ID (optional)
 * @returns {Promise<{canAssign: boolean, reason?: string, existingAssignment?: object}>}
 */
const validateClientNetworkAssignment = async (leadId, clientNetwork, orderId = null) => {
  try {
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return {
        canAssign: false,
        reason: 'Lead not found'
      };
    }

    // If no orderId provided, use the lead's current orderId
    const targetOrderId = orderId || lead.orderId;

    if (!targetOrderId) {
      // Lead is not part of any order, can assign freely
      return { canAssign: true };
    }

    // Check if this lead has already been assigned to this client network within the same order
    const existingAssignment = lead.clientNetworkHistory.find(history => 
      history.clientNetwork === clientNetwork && 
      history.orderId && 
      history.orderId.toString() === targetOrderId.toString()
    );

    if (existingAssignment) {
      return {
        canAssign: false,
        reason: `Lead has already been assigned to client network "${clientNetwork}" within this order`,
        existingAssignment: existingAssignment
      };
    }

    return { canAssign: true };
  } catch (error) {
    throw new Error(`Error validating client network assignment: ${error.message}`);
  }
};

/**
 * Validates if multiple leads can be assigned to a client network within a specific order
 * @param {string[]} leadIds - Array of lead IDs
 * @param {string} clientNetwork - The client network name
 * @param {string} orderId - The order ID
 * @returns {Promise<{canAssignAll: boolean, conflictingLeads: Array, validLeads: Array}>}
 */
const validateBulkClientNetworkAssignment = async (leadIds, clientNetwork, orderId) => {
  try {
    const leads = await Lead.find({ _id: { $in: leadIds } });
    
    const validLeads = [];
    const conflictingLeads = [];

    for (const lead of leads) {
      const validation = await validateClientNetworkAssignment(lead._id, clientNetwork, orderId);
      
      if (validation.canAssign) {
        validLeads.push(lead);
      } else {
        conflictingLeads.push({
          lead: lead,
          reason: validation.reason,
          existingAssignment: validation.existingAssignment
        });
      }
    }

    return {
      canAssignAll: conflictingLeads.length === 0,
      conflictingLeads,
      validLeads
    };
  } catch (error) {
    throw new Error(`Error validating bulk client network assignment: ${error.message}`);
  }
};

/**
 * Gets all client networks a lead has been assigned to
 * @param {string} leadId - The lead ID
 * @returns {Promise<Array>} Array of unique client networks with their assignment counts
 */
const getLeadClientNetworkSummary = async (leadId) => {
  try {
    const lead = await Lead.findById(leadId).populate('clientNetworkHistory.orderId', 'status createdAt');
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Group assignments by client network
    const clientNetworkSummary = {};
    
    lead.clientNetworkHistory.forEach(history => {
      const network = history.clientNetwork;
      if (!clientNetworkSummary[network]) {
        clientNetworkSummary[network] = {
          clientNetwork: network,
          assignmentCount: 0,
          assignments: []
        };
      }
      
      clientNetworkSummary[network].assignmentCount++;
      clientNetworkSummary[network].assignments.push({
        assignedAt: history.assignedAt,
        orderId: history.orderId ? history.orderId._id : null,
        orderStatus: history.orderId ? history.orderId.status : null,
        orderCreatedAt: history.orderId ? history.orderId.createdAt : null
      });
    });

    return Object.values(clientNetworkSummary);
  } catch (error) {
    throw new Error(`Error getting lead client network summary: ${error.message}`);
  }
};

/**
 * Checks if leads in an order have conflicting client network assignments
 * @param {string} orderId - The order ID
 * @returns {Promise<{hasConflicts: boolean, conflicts: Array}>} 
 */
const checkOrderClientNetworkConflicts = async (orderId) => {
  try {
    const leads = await Lead.find({ orderId: orderId });
    const conflicts = [];

    // Group leads by client network within this order
    const networkGroups = {};
    
    leads.forEach(lead => {
      lead.clientNetworkHistory.forEach(history => {
        if (history.orderId && history.orderId.toString() === orderId) {
          const network = history.clientNetwork;
          if (!networkGroups[network]) {
            networkGroups[network] = [];
          }
          networkGroups[network].push({
            leadId: lead._id,
            leadName: `${lead.firstName} ${lead.lastName}`,
            assignedAt: history.assignedAt
          });
        }
      });
    });

    // Check for conflicts (more than one assignment to same network in same order)
    Object.entries(networkGroups).forEach(([network, assignments]) => {
      if (assignments.length > 1) {
        conflicts.push({
          clientNetwork: network,
          conflictingAssignments: assignments
        });
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  } catch (error) {
    throw new Error(`Error checking order client network conflicts: ${error.message}`);
  }
};

module.exports = {
  validateClientNetworkAssignment,
  validateBulkClientNetworkAssignment,
  getLeadClientNetworkSummary,
  checkOrderClientNetworkConflicts
}; 