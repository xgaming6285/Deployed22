const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const clientBrokerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Client broker name is required"],
            trim: true,
            unique: true,
        },
        domain: {
            type: String,
            trim: true,
            unique: true,
            sparse: true, // Allow multiple documents with null domain
        },
        description: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Many-to-many relationship with leads
        assignedLeads: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Lead",
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Metadata for tracking
        totalLeadsAssigned: {
            type: Number,
            default: 0,
        },
        lastAssignedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for performance
clientBrokerSchema.index({ name: 1 });
clientBrokerSchema.index({ domain: 1 }, { sparse: true });
clientBrokerSchema.index({ isActive: 1 });
clientBrokerSchema.index({ assignedLeads: 1 });
clientBrokerSchema.index({ createdBy: 1 });
clientBrokerSchema.index({ lastAssignedAt: -1 });

// Virtual for active assigned leads count
clientBrokerSchema.virtual("activeLeadsCount").get(function () {
    return this.assignedLeads ? this.assignedLeads.length : 0;
});

// Method to assign a lead to this broker
clientBrokerSchema.methods.assignLead = function (leadId) {
    if (!this.assignedLeads.includes(leadId)) {
        this.assignedLeads.push(leadId);
        this.totalLeadsAssigned += 1;
        this.lastAssignedAt = new Date();
    }
};

// Method to unassign a lead from this broker
clientBrokerSchema.methods.unassignLead = function (leadId) {
    const index = this.assignedLeads.indexOf(leadId);
    if (index > -1) {
        this.assignedLeads.splice(index, 1);
    }
};

// Method to check if a lead is assigned to this broker
clientBrokerSchema.methods.isLeadAssigned = function (leadId) {
    return this.assignedLeads.includes(leadId);
};

// Static method to find available brokers for a lead
clientBrokerSchema.statics.findAvailableBrokers = function (excludeLeadId = null) {
    const query = { isActive: true };

    if (excludeLeadId) {
        query.assignedLeads = { $ne: excludeLeadId };
    }

    return this.find(query).sort({ totalLeadsAssigned: 1, createdAt: 1 });
};

// Static method to get broker statistics
clientBrokerSchema.statics.getBrokerStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: {
                    isActive: "$isActive",
                },
                count: { $sum: 1 },
                totalLeadsAssigned: { $sum: "$totalLeadsAssigned" },
                avgLeadsPerBroker: { $avg: { $size: "$assignedLeads" } },
            },
        },
    ]);
};

// Add pagination plugin
clientBrokerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("ClientBroker", clientBrokerSchema); 