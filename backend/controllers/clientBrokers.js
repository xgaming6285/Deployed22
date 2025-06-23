const { validationResult } = require("express-validator");
const ClientBroker = require("../models/ClientBroker");
const Lead = require("../models/Lead");
const Order = require("../models/Order");

// @desc    Get all client brokers
// @route   GET /api/client-brokers
// @access  Private (Admin, Affiliate Manager)
exports.getClientBrokers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            isActive,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { name: new RegExp(search, "i") },
                { domain: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
            ];
        }

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort,
            populate: [
                { path: "createdBy", select: "fullName email" },
                { path: "assignedLeads", select: "firstName lastName newEmail leadType" },
            ],
        };

        const result = await ClientBroker.paginate(query, options);

        res.status(200).json({
            success: true,
            data: result.docs,
            pagination: {
                page: result.page,
                pages: result.totalPages,
                total: result.totalDocs,
                limit: result.limit,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single client broker
// @route   GET /api/client-brokers/:id
// @access  Private (Admin, Affiliate Manager)
exports.getClientBroker = async (req, res, next) => {
    try {
        const clientBroker = await ClientBroker.findById(req.params.id)
            .populate("createdBy", "fullName email")
            .populate("assignedLeads", "firstName lastName newEmail leadType country");

        if (!clientBroker) {
            return res.status(404).json({
                success: false,
                message: "Client broker not found",
            });
        }

        res.status(200).json({
            success: true,
            data: clientBroker,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create client broker
// @route   POST /api/client-brokers
// @access  Private (Admin only)
exports.createClientBroker = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: errors.array(),
            });
        }

        const { name, domain, description } = req.body;

        const clientBroker = new ClientBroker({
            name,
            domain,
            description,
            createdBy: req.user._id,
        });

        await clientBroker.save();

        // Populate for response
        await clientBroker.populate("createdBy", "fullName email");

        res.status(201).json({
            success: true,
            message: "Client broker created successfully",
            data: clientBroker,
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Client broker ${field} already exists`,
            });
        }
        next(error);
    }
};

// @desc    Update client broker
// @route   PUT /api/client-brokers/:id
// @access  Private (Admin only)
exports.updateClientBroker = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: errors.array(),
            });
        }

        const { name, domain, description, isActive } = req.body;

        const clientBroker = await ClientBroker.findById(req.params.id);
        if (!clientBroker) {
            return res.status(404).json({
                success: false,
                message: "Client broker not found",
            });
        }

        // Update fields
        if (name !== undefined) clientBroker.name = name;
        if (domain !== undefined) clientBroker.domain = domain;
        if (description !== undefined) clientBroker.description = description;
        if (isActive !== undefined) clientBroker.isActive = isActive;

        await clientBroker.save();

        // Populate for response
        await clientBroker.populate("createdBy", "fullName email");

        res.status(200).json({
            success: true,
            message: "Client broker updated successfully",
            data: clientBroker,
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Client broker ${field} already exists`,
            });
        }
        next(error);
    }
};

// @desc    Delete client broker
// @route   DELETE /api/client-brokers/:id
// @access  Private (Admin only)
exports.deleteClientBroker = async (req, res, next) => {
    try {
        const clientBroker = await ClientBroker.findById(req.params.id);
        if (!clientBroker) {
            return res.status(404).json({
                success: false,
                message: "Client broker not found",
            });
        }

        // Check if broker has assigned leads
        if (clientBroker.assignedLeads.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete client broker with assigned leads. Unassign leads first.",
                data: {
                    assignedLeadsCount: clientBroker.assignedLeads.length,
                },
            });
        }

        await ClientBroker.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Client broker deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign lead to client broker
// @route   POST /api/client-brokers/:id/assign-lead
// @access  Private (Admin, Affiliate Manager)
exports.assignLeadToBroker = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: errors.array(),
            });
        }

        const { leadId, orderId, intermediaryClientNetwork, domain } = req.body;
        const brokerId = req.params.id;

        // Find broker and lead
        const [clientBroker, lead] = await Promise.all([
            ClientBroker.findById(brokerId),
            Lead.findById(leadId),
        ]);

        if (!clientBroker) {
            return res.status(404).json({
                success: false,
                message: "Client broker not found",
            });
        }

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!clientBroker.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot assign lead to inactive client broker",
            });
        }

        // Check if lead is already assigned to this broker
        if (lead.isAssignedToClientBroker(brokerId)) {
            return res.status(400).json({
                success: false,
                message: "Lead is already assigned to this client broker",
            });
        }

        // Assign lead to broker
        lead.assignClientBroker(brokerId, req.user._id, orderId, intermediaryClientNetwork, domain);
        clientBroker.assignLead(leadId);

        // Save both documents
        await Promise.all([lead.save(), clientBroker.save()]);

        res.status(200).json({
            success: true,
            message: "Lead assigned to client broker successfully",
            data: {
                clientBroker: clientBroker.name,
                lead: `${lead.firstName} ${lead.lastName}`,
                assignedAt: new Date(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Unassign lead from client broker
// @route   DELETE /api/client-brokers/:id/unassign-lead/:leadId
// @access  Private (Admin, Affiliate Manager)
exports.unassignLeadFromBroker = async (req, res, next) => {
    try {
        const { id: brokerId, leadId } = req.params;

        // Find broker and lead
        const [clientBroker, lead] = await Promise.all([
            ClientBroker.findById(brokerId),
            Lead.findById(leadId),
        ]);

        if (!clientBroker) {
            return res.status(404).json({
                success: false,
                message: "Client broker not found",
            });
        }

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        // Check if lead is assigned to this broker
        if (!lead.isAssignedToClientBroker(brokerId)) {
            return res.status(400).json({
                success: false,
                message: "Lead is not assigned to this client broker",
            });
        }

        // Unassign lead from broker
        lead.unassignClientBroker(brokerId);
        clientBroker.unassignLead(leadId);

        // Save both documents
        await Promise.all([lead.save(), clientBroker.save()]);

        res.status(200).json({
            success: true,
            message: "Lead unassigned from client broker successfully",
            data: {
                clientBroker: clientBroker.name,
                lead: `${lead.firstName} ${lead.lastName}`,
                unassignedAt: new Date(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all leads assigned to a client broker
// @route   GET /api/client-brokers/:id/leads
// @access  Private (Admin, Affiliate Manager)
exports.getBrokerLeads = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            leadType,
            country,
        } = req.query;

        const clientBroker = await ClientBroker.findById(req.params.id);
        if (!clientBroker) {
            return res.status(404).json({
                success: false,
                message: "Client broker not found",
            });
        }

        // Build query for leads
        const query = {
            _id: { $in: clientBroker.assignedLeads },
        };

        if (search) {
            query.$or = [
                { firstName: new RegExp(search, "i") },
                { lastName: new RegExp(search, "i") },
                { newEmail: new RegExp(search, "i") },
                { newPhone: new RegExp(search, "i") },
            ];
        }

        if (leadType) {
            query.leadType = leadType;
        }

        if (country) {
            query.country = country;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: [
                { path: "createdBy", select: "fullName email" },
                { path: "orderId", select: "status createdAt" },
            ],
        };

        const result = await Lead.paginate(query, options);

        res.status(200).json({
            success: true,
            data: result.docs,
            pagination: {
                page: result.page,
                pages: result.totalPages,
                total: result.totalDocs,
                limit: result.limit,
            },
            clientBroker: {
                name: clientBroker.name,
                domain: clientBroker.domain,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get client broker statistics
// @route   GET /api/client-brokers/stats
// @access  Private (Admin, Affiliate Manager)
exports.getBrokerStats = async (req, res, next) => {
    try {
        const stats = await ClientBroker.getBrokerStats();

        // Get additional stats
        const [totalBrokers, activeBrokers, inactiveBrokers] = await Promise.all([
            ClientBroker.countDocuments(),
            ClientBroker.countDocuments({ isActive: true }),
            ClientBroker.countDocuments({ isActive: false }),
        ]);

        // Get top brokers by lead count
        const topBrokers = await ClientBroker.find({ isActive: true })
            .sort({ totalLeadsAssigned: -1 })
            .limit(5)
            .select("name domain totalLeadsAssigned")
            .populate("assignedLeads", "firstName lastName");

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalBrokers,
                    activeBrokers,
                    inactiveBrokers,
                },
                aggregatedStats: stats,
                topBrokers,
            },
        });
    } catch (error) {
        next(error);
    }
}; 