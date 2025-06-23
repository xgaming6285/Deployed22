/**
 * Database Performance Monitoring Script
 * 
 * This script helps monitor MongoDB performance to ensure the application
 * can handle thousands of records efficiently.
 * 
 * Usage: node monitor-performance.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ProxyManagementService = require('../services/proxyManagementService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ftd-copy')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Get database statistics
async function getDatabaseStats(db) {
  try {
    console.log('\n--- Database Statistics ---');
    const stats = await db.db.stats();
    console.log(`Database: ${db.db.databaseName}`);
    console.log(`Size: ${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Storage: ${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Objects: ${stats.objects}`);
    console.log(`Collections: ${stats.collections}`);
    console.log(`Indexes: ${stats.indexes}`);
    console.log(`Index Size: ${(stats.indexSize / (1024 * 1024)).toFixed(2)} MB`);
  } catch (err) {
    console.error('Error getting database stats:', err);
  }
}

// Get collection statistics
async function getCollectionStats(db) {
  try {
    console.log('\n--- Collection Statistics ---');
    const collections = await db.db.listCollections().toArray();
    
    for (const coll of collections) {
      const stats = await db.db.collection(coll.name).stats();
      console.log(`\nCollection: ${coll.name}`);
      console.log(`Count: ${stats.count} documents`);
      console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Storage: ${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Indexes: ${stats.nindexes}`);
      console.log(`Index Size: ${(stats.totalIndexSize / (1024 * 1024)).toFixed(2)} MB`);
    }
  } catch (err) {
    console.error('Error getting collection stats:', err);
  }
}

// Get index information
async function getIndexInfo(db) {
  try {
    console.log('\n--- Index Information ---');
    const collections = await db.db.listCollections().toArray();
    
    for (const coll of collections) {
      const indexes = await db.db.collection(coll.name).indexes();
      console.log(`\nCollection: ${coll.name}`);
      
      indexes.forEach((index, i) => {
        console.log(`  Index ${i + 1}: ${index.name}`);
        console.log(`  Keys: ${JSON.stringify(index.key)}`);
        if (index.unique) console.log('  Unique: true');
        if (index.sparse) console.log('  Sparse: true');
        if (index.weights) console.log(`  Text weights: ${JSON.stringify(index.weights)}`);
      });
    }
  } catch (err) {
    console.error('Error getting index information:', err);
  }
}

// Run sample queries and profile their performance
async function profileQueries(db) {
  try {
    console.log('\n--- Query Profiling ---');
    
    // Enable profiling
    await db.db.command({ profile: 1, slowms: 100 });
    console.log('Profiling enabled for queries slower than 100ms');
    
    // Get Lead model
    const Lead = require('../models/Lead');
    
    // Test queries
    console.log('\nRunning test queries...');
    
    console.time('Query 1: Get all leads with pagination');
    await Lead.find({})
      .limit(100)
      .lean()
      .exec();
    console.timeEnd('Query 1: Get all leads with pagination');
    
    console.time('Query 2: Filter by lead type');
    await Lead.find({ leadType: 'ftd' })
      .limit(100)
      .lean()
      .exec();
    console.timeEnd('Query 2: Filter by lead type');
    
    console.time('Query 3: Find by email');
    await Lead.findOne({ newEmail: /example/i })
      .lean()
      .exec();
    console.timeEnd('Query 3: Find by email');
    
    console.time('Query 4: Complex filter with sorting');
    await Lead.find({ 
      leadType: 'ftd',
      isAssigned: true,
      country: /us|canada/i
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();
    console.timeEnd('Query 4: Complex filter with sorting');
    
    console.time('Query 5: Aggregation pipeline');
    await Lead.aggregate([
      { $match: { isAssigned: true } },
      { $group: { _id: '$leadType', count: { $sum: 1 } } }
    ]);
    console.timeEnd('Query 5: Aggregation pipeline');
    
    // Get profile information
    console.log('\nSlow Queries:');
    const profileInfo = await db.db.collection('system.profile')
      .find({})
      .sort({ millis: -1 })
      .limit(5)
      .toArray();
    
    profileInfo.forEach((doc, i) => {
      console.log(`\nSlow Query ${i + 1}:`);
      console.log(`Operation: ${doc.op}`);
      console.log(`Namespace: ${doc.ns}`);
      console.log(`Query: ${JSON.stringify(doc.query || doc.command)}`);
      console.log(`Execution Time: ${doc.millis} ms`);
      console.log(`Timestamp: ${doc.ts}`);
    });
    
    // Disable profiling
    await db.db.command({ profile: 0 });
    console.log('\nProfiling disabled');
    
  } catch (err) {
    console.error('Error during query profiling:', err);
  }
}

// Provide recommendations based on analysis
function provideRecommendations() {
  console.log('\n--- Recommendations ---');
  console.log('1. Ensure all commonly filtered fields have proper indexes');
  console.log('2. Use compound indexes for fields frequently queried together');
  console.log('3. Consider using covered queries where possible (include only indexed fields)');
  console.log('4. Use projection to limit fields returned from queries');
  console.log('5. Use .lean() for read-only operations to improve performance');
  console.log('6. Implement pagination for all list views');
  console.log('7. Consider implementing data archiving for old records');
  console.log('8. For very large datasets, consider implementing sharding');
  console.log('9. Monitor query performance regularly and optimize slow queries');
  console.log('10. Consider implementing caching for frequently accessed, rarely changing data');
}

async function monitorProxyHealth() {
  console.log('Starting proxy health monitoring...');
  
  try {
    const results = await ProxyManagementService.monitorProxyHealth();
    console.log('Proxy health monitoring results:', results);
    
    // Get proxy statistics
    const stats = await ProxyManagementService.getProxyStats();
    console.log('Current proxy statistics:', stats);
    
  } catch (error) {
    console.error('Error during proxy health monitoring:', error);
  }
}

async function runMonitoring() {
  console.log('=== FTD System Performance & Proxy Health Monitor ===');
  console.log(`Monitoring started at: ${new Date().toISOString()}`);
  
  // Run proxy health monitoring
  await monitorProxyHealth();
  
  // Schedule next run in 5 minutes
  setTimeout(runMonitoring, 5 * 60 * 1000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down monitoring...');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down monitoring...');
  mongoose.connection.close();
  process.exit(0);
});

// Start monitoring
runMonitoring(); 