const mongoose = require("mongoose");

const clientNetworkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Client network name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedAffiliateManagers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Client networks now serve as intermediaries only
    // Client brokers are managed separately in the ClientBroker model
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
clientNetworkSchema.index({ name: 1 });
clientNetworkSchema.index({ assignedAffiliateManagers: 1 });
clientNetworkSchema.index({ createdBy: 1 });
clientNetworkSchema.index({ isActive: 1 });

// Virtual for assigned affiliate managers count
clientNetworkSchema.virtual("assignedManagersCount").get(function () {
  return this.assignedAffiliateManagers ? this.assignedAffiliateManagers.length : 0;
});

// Virtual for active client brokers count (now tracked separately)
clientNetworkSchema.virtual("activeBrokersCount").get(function () {
  // This will need to be calculated via aggregation with ClientBroker model
  return 0; // Placeholder - will be populated when needed
});

module.exports = mongoose.model("ClientNetwork", clientNetworkSchema); 