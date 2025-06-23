const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Lead = require("../models/Lead");
const Order = require("../models/Order");
const AgentPerformance = require("../models/AgentPerformance");
const connectDB = require("../config/db");

// Create default admin
const createDefaultAdmin = async () => {
  try {
    // Delete existing admin
    await User.deleteMany({ role: "admin" });
    console.log("Deleted existing admin users");

    const admin = await User.create({
      email: "admin@leadmanagement.com",
      password: "admin123",
      fullName: "System Admin",
      role: "admin",
      permissions: {
        canCreateOrders: true,
        canManageLeads: true
      },
      isActive: true,
    });

    console.log("✅ Admin user created successfully");
    return admin;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
};

// Create sample users
const createSampleUsers = async () => {
  try {
    // Delete all existing users
    console.log("Deleting all existing users...");
    await User.deleteMany({});
    console.log("All existing users deleted");

    console.log("Creating sample users...");
    const sampleUsers = [
      {
        email: "manager@leadmanagement.com",
        password: "manager123",
        fullName: "John Manager",
        role: "affiliate_manager",
        permissions: { canCreateOrders: true },
        isActive: true,
      },
      {
        email: "agent1@leadmanagement.com",
        password: "agent123",
        fullName: "Sarah Agent",
        role: "agent",
        fourDigitCode: "1234",
        permissions: { canCreateOrders: false },
        isActive: true,
      },
      {
        email: "agent2@leadmanagement.com",
        password: "agent123",
        fullName: "Mike Agent",
        role: "agent",
        fourDigitCode: "5678",
        permissions: { canCreateOrders: false },
        isActive: true,
      },
    ];

    console.log("Inserting new sample users...");
    const createdUsers = await User.insertMany(sampleUsers);
    console.log("Sample users created:", createdUsers);

    console.log("✅ Sample users created successfully");
    console.log("Manager: manager@leadmanagement.com / manager123");
    console.log("Agent 1: agent1@leadmanagement.com / agent123");
    console.log("Agent 2: agent2@leadmanagement.com / agent123");
  } catch (error) {
    console.error("Error creating sample users:", error);
    throw error;
  }
};

// Create sample leads
const createSampleLeads = async () => {
  try {
    const existingLeads = await Lead.countDocuments();

    // Delete existing leads if any
    if (existingLeads > 0) {
      console.log("Deleting existing leads...");
      await Lead.deleteMany({});
    }

    const sampleLeads = [
      // FTD Leads
      {
        leadType: "ftd",
        firstName: "John",
        lastName: "Doe",
        newEmail: "john.doe@example.com",
        newPhone: "+1234567890",
        country: "USA",
        dob: new Date("1985-05-15"),
        address: {
          street: "123 Main St",
          city: "New York",
          postalCode: "10001",
        },
        client: "CLIENT001",
        clientBroker: "BROKER001",
        clientNetwork: "NETWORK001",
        documents: {
          status: "good",
        },
        source: "Website",
        priority: "high",
        gender: "male",
        isAssigned: false,
        status: "active",
      },
      {
        leadType: "ftd",
        firstName: "Jane",
        lastName: "Smith",
        newEmail: "jane.smith@example.com",
        newPhone: "+1234567891",
        country: "Canada",
        dob: new Date("1990-08-22"),
        address: {
          street: "456 Oak Ave",
          city: "Toronto",
          postalCode: "M5V 3A8",
        },
        client: "CLIENT002",
        clientBroker: "BROKER002",
        clientNetwork: "NETWORK002",
        documents: {
          status: "ok",
        },
        source: "Referral",
        priority: "medium",
        gender: "female",
        isAssigned: false,
        status: "active",
      },
      // Filler Leads
      {
        leadType: "filler",
        firstName: "Bob",
        lastName: "Johnson",
        newEmail: "bob.johnson@example.com",
        newPhone: "+1234567892",
        country: "UK",
        dob: new Date("1988-12-10"),
        address: {
          street: "789 High St",
          city: "London",
          postalCode: "SW1A 1AA",
        },
        source: "Social Media",
        priority: "medium",
        gender: "male",
        isAssigned: false,
        status: "active",
      },
      {
        leadType: "filler",
        firstName: "Alice",
        lastName: "Brown",
        newEmail: "alice.brown@example.com",
        newPhone: "+1234567893",
        country: "Australia",
        dob: new Date("1992-03-18"),
        address: {
          street: "321 George St",
          city: "Sydney",
          postalCode: "2000",
        },
        source: "Email Campaign",
        priority: "low",
        gender: "female",
        isAssigned: false,
        status: "active",
      },
      // Cold Leads
      {
        leadType: "cold",
        firstName: "Charlie",
        lastName: "Davis",
        newEmail: "charlie.davis@example.com",
        newPhone: "+1234567894",
        country: "Germany",
        source: "Cold Outreach",
        priority: "low",
        gender: "male",
        isAssigned: false,
        status: "active",
      },
      {
        leadType: "cold",
        firstName: "Diana",
        lastName: "Wilson",
        newEmail: "diana.wilson@example.com",
        newPhone: "+1234567895",
        country: "France",
        source: "Lead Generation",
        priority: "medium",
        gender: "female",
        isAssigned: false,
        status: "active",
      },
    ];

    await Lead.insertMany(sampleLeads);
    console.log("✅ Sample leads created successfully");
    console.log(
      `Created ${sampleLeads.length} sample leads (2 FTD, 2 Filler, 2 Cold)`
    );
  } catch (error) {
    console.error("Error creating sample leads:", error);
    throw error;
  }
};

// Create sample agent performance data
const createSamplePerformance = async () => {
  try {
    const existingPerformance = await AgentPerformance.countDocuments();

    if (existingPerformance > 0) {
      console.log("Sample performance data already exists. Skipping creation.");
      return;
    }

    const agents = await User.find({ role: "agent" });

    if (agents.length === 0) {
      console.log("No agents found. Skipping performance data creation.");
      return;
    }

    const performanceData = [];

    // Create performance data for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      for (const agent of agents) {
        performanceData.push({
          agent: agent._id,
          date: date,
          callTimeMinutes: Math.floor(Math.random() * 480) + 120, // 120-600 minutes
          earnings: Math.floor(Math.random() * 500) + 100, // $100-600
          penalties: Math.floor(Math.random() * 50), // $0-50
          leadsContacted: Math.floor(Math.random() * 20) + 5, // 5-25 leads
          leadsConverted: Math.floor(Math.random() * 5) + 1, // 1-6 conversions
          callsCompleted: Math.floor(Math.random() * 30) + 10, // 10-40 calls
          breakdown: {
            ftdCalls: Math.floor(Math.random() * 10) + 2,
            fillerCalls: Math.floor(Math.random() * 15) + 5,
            coldCalls: Math.floor(Math.random() * 10) + 3,
            ftdConversions: Math.floor(Math.random() * 2),
            fillerConversions: Math.floor(Math.random() * 3) + 1,
            coldConversions: Math.floor(Math.random() * 2),
          },
          isVerified: i < 5, // Verify data for the last 5 days
        });
      }
    }

    await AgentPerformance.insertMany(performanceData);
    console.log("✅ Sample performance data created successfully");
    console.log(
      `Created ${performanceData.length} performance records for ${agents.length} agents`
    );
  } catch (error) {
    console.error("Error creating sample performance data:", error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    await connectDB();

    // Force recreate all users
    console.log("Force recreating all users...");
    await createSampleUsers();
    await createDefaultAdmin();

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📝 Default Login Credentials:");
    console.log("Admin: admin@leadmanagement.com / admin123");
    console.log("Manager: manager@leadmanagement.com / manager123");
    console.log("Agent 1: agent1@leadmanagement.com / agent123");
    console.log("Agent 2: agent2@leadmanagement.com / agent123");
    console.log("\n⚠️  Please change these passwords after first login!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  }
};

// Run seeding
seedDatabase();

module.exports = { seedDatabase, createDefaultAdmin };
