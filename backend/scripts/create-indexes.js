/**
 * MongoDB Index Creation Script
 * 
 * This script creates all necessary indexes to optimize database performance
 * for applications handling thousands of records.
 * 
 * Run with: node create-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Order = require('../models/Order');
const AgentPerformance = require('../models/AgentPerformance');

// Helper function to create indexes safely
async function createIndexSafely(collection, key, options = {}) {
  try {
    await collection.createIndex(key, options);
    console.log(`  Created index on ${JSON.stringify(key)}`);
    return true;
  } catch (error) {
    if (error.code === 85) {  // IndexOptionsConflict
      console.log(`  An equivalent index already exists for ${JSON.stringify(key)}`);
    } else if (error.code === 86) {  // IndexKeySpecsConflict
      console.log(`  Index key specs conflict for ${JSON.stringify(key)}`);
    } else {
      console.error(`  Error creating index for ${JSON.stringify(key)}:`, error.message);
    }
    return false;
  }
}

async function createIndexes() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const uri = process.env.MONGODB_URI;
    console.log('MongoDB URI:', uri ? 'URI found' : 'URI not found');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
    });
    console.log('Connected successfully to MongoDB');

    // Create Lead indexes individually instead of using createIndexes()
    console.log('\nCreating Lead indexes...');
    
    await createIndexSafely(Lead.collection, { isAssigned: 1, leadType: 1, "documents.status": 1 });
    await createIndexSafely(Lead.collection, { leadType: 1 });
    await createIndexSafely(Lead.collection, { country: 1 });
    await createIndexSafely(Lead.collection, { assignedTo: 1 });
    await createIndexSafely(Lead.collection, { createdAt: -1 });
    await createIndexSafely(Lead.collection, { client: 1 }, { sparse: true });
    await createIndexSafely(Lead.collection, { clientBroker: 1 }, { sparse: true });
    await createIndexSafely(Lead.collection, { clientNetwork: 1 }, { sparse: true });
    await createIndexSafely(Lead.collection, { newEmail: 1 }, { unique: true });
    await createIndexSafely(Lead.collection, { status: 1 });
    await createIndexSafely(Lead.collection, { assignedAt: -1 });
    await createIndexSafely(Lead.collection, { isAssigned: 1, assignedTo: 1 });
    await createIndexSafely(Lead.collection, { firstName: 1, lastName: 1 });
    await createIndexSafely(Lead.collection, { createdBy: 1 });
    await createIndexSafely(Lead.collection, { updatedAt: -1 });
    await createIndexSafely(Lead.collection, { leadType: 1, isAssigned: 1, status: 1 });
    await createIndexSafely(Lead.collection, { assignedTo: 1, status: 1 });
    
    // Text index might already exist, handle this case separately
    try {
      // Try to drop the existing text index if it exists
      const indexInfo = await Lead.collection.indexes();
      const textIndex = indexInfo.find(idx => idx.textIndexVersion);
      
      if (textIndex) {
        console.log(`  Found existing text index: ${textIndex.name}`);
        try {
          await Lead.collection.dropIndex(textIndex.name);
          console.log(`  Dropped existing text index: ${textIndex.name}`);
        } catch (dropError) {
          console.log(`  Could not drop existing text index: ${dropError.message}`);
        }
      }
      
      // Create the optimized text index with weights
      await createIndexSafely(Lead.collection, {
        firstName: "text",
        lastName: "text",
        newEmail: "text",
        newPhone: "text",
        client: "text",
        clientBroker: "text",
        clientNetwork: "text",
      }, {
        weights: {
          firstName: 10,
          lastName: 10,
          newEmail: 5,
          newPhone: 5,
          client: 3,
          clientBroker: 2,
          clientNetwork: 1
        },
        name: "lead_search_index"
      });
    } catch (textIndexError) {
      console.log(`  Text index error: ${textIndexError.message}`);
    }

    // Create User indexes
    console.log('\nCreating User indexes...');
    await createIndexSafely(User.collection, { email: 1 }, { unique: true });
    await createIndexSafely(User.collection, { role: 1 });
    await createIndexSafely(User.collection, { fourDigitCode: 1 }, { sparse: true });
    await createIndexSafely(User.collection, { createdAt: -1 });

    // Create Order indexes
    console.log('\nCreating Order indexes...');
    await createIndexSafely(Order.collection, { status: 1 });
    await createIndexSafely(Order.collection, { priority: 1 });
    await createIndexSafely(Order.collection, { createdAt: -1 });
    await createIndexSafely(Order.collection, { createdBy: 1 });
    await createIndexSafely(Order.collection, { assignedTo: 1 });

    // Create AgentPerformance indexes
    console.log('\nCreating AgentPerformance indexes...');
    await createIndexSafely(AgentPerformance.collection, { agentId: 1 });
    await createIndexSafely(AgentPerformance.collection, { date: -1 });
    await createIndexSafely(AgentPerformance.collection, { 'metrics.leadsAssigned': 1 });
    await createIndexSafely(AgentPerformance.collection, { 'metrics.leadsConverted': 1 });

    console.log('\nIndex creation process completed');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Execute the function
createIndexes(); 