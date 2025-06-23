const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Session Management Service
 * Handles browser session storage and retrieval for FTD injection workflow
 */
class SessionManagementService {

    constructor() {
        this.sessionsDir = path.join(__dirname, '../browser_sessions');
        this.ensureSessionsDirectory();
    }

    /**
     * Ensure the sessions directory exists
     */
    async ensureSessionsDirectory() {
        try {
            await fs.mkdir(this.sessionsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating sessions directory:', error);
        }
    }

    /**
     * Generate a unique session ID for a lead
     * @param {string} leadId - Lead ID
     * @param {string} orderId - Order ID
     * @returns {string} Unique session ID
     */
    generateSessionId(leadId, orderId) {
        const timestamp = Date.now();
        const randomBytes = crypto.randomBytes(8).toString('hex');
        return `session_${leadId}_${orderId}_${timestamp}_${randomBytes}`;
    }

    /**
     * Store browser session data after manual FTD injection
     * @param {string} leadId - Lead ID
     * @param {string} orderId - Order ID
     * @param {Object} sessionData - Browser session data
     * @returns {Promise<Object>} Session storage result
     */
    async storeSession(leadId, orderId, sessionData) {
        try {
            const sessionId = this.generateSessionId(leadId, orderId);
            const sessionPath = path.join(this.sessionsDir, `${sessionId}.json`);

            const sessionRecord = {
                sessionId,
                leadId,
                orderId,
                createdAt: new Date(),
                sessionData: {
                    cookies: sessionData.cookies || [],
                    localStorage: sessionData.localStorage || {},
                    sessionStorage: sessionData.sessionStorage || {},
                    userAgent: sessionData.userAgent || null,
                    viewport: sessionData.viewport || null,
                    deviceFingerprint: sessionData.deviceFingerprint || null,
                    finalDomain: sessionData.finalDomain || null,
                },
                status: 'active',
                lastUsed: new Date()
            };

            // Store session data to file
            await fs.writeFile(sessionPath, JSON.stringify(sessionRecord, null, 2));

            // Update lead with session reference
            const Lead = require('../models/Lead');
            await Lead.findByIdAndUpdate(leadId, {
                $set: {
                    'sessionData.sessionId': sessionId,
                    'sessionData.sessionPath': sessionPath,
                    'sessionData.createdAt': new Date(),
                    'sessionData.status': 'active'
                }
            });

            console.log(`Session stored successfully: ${sessionId}`);
            return {
                success: true,
                sessionId,
                sessionPath,
                message: 'Session stored successfully'
            };

        } catch (error) {
            console.error('Error storing session:', error);
            throw new Error(`Failed to store session: ${error.message}`);
        }
    }

    /**
     * Retrieve browser session data for agent use
     * @param {string} leadId - Lead ID
     * @returns {Promise<Object>} Session data
     */
    async retrieveSession(leadId) {
        try {
            const Lead = require('../models/Lead');
            const lead = await Lead.findById(leadId);

            if (!lead || !lead.sessionData || !lead.sessionData.sessionId) {
                throw new Error('No session data found for this lead');
            }

            const sessionPath = lead.sessionData.sessionPath;

            // Check if session file exists
            try {
                await fs.access(sessionPath);
            } catch (error) {
                throw new Error('Session file not found or inaccessible');
            }

            // Read session data
            const sessionFileContent = await fs.readFile(sessionPath, 'utf8');
            const sessionRecord = JSON.parse(sessionFileContent);

            // Update last used timestamp
            sessionRecord.lastUsed = new Date();
            await fs.writeFile(sessionPath, JSON.stringify(sessionRecord, null, 2));

            return {
                success: true,
                sessionData: sessionRecord.sessionData,
                sessionId: sessionRecord.sessionId,
                createdAt: sessionRecord.createdAt,
                lastUsed: sessionRecord.lastUsed
            };

        } catch (error) {
            console.error('Error retrieving session:', error);
            throw new Error(`Failed to retrieve session: ${error.message}`);
        }
    }

    /**
     * Check if a lead has an active session
     * @param {string} leadId - Lead ID
     * @returns {Promise<boolean>} Whether session exists and is active
     */
    async hasActiveSession(leadId) {
        try {
            const Lead = require('../models/Lead');
            const lead = await Lead.findById(leadId);

            if (!lead || !lead.sessionData || !lead.sessionData.sessionId) {
                return false;
            }

            // Check if session file exists
            try {
                await fs.access(lead.sessionData.sessionPath);
                return lead.sessionData.status === 'active';
            } catch (error) {
                return false;
            }

        } catch (error) {
            console.error('Error checking session status:', error);
            return false;
        }
    }

    /**
     * Assign session to an agent
     * @param {string} leadId - Lead ID
     * @param {string} agentId - Agent ID
     * @returns {Promise<Object>} Assignment result
     */
    async assignSessionToAgent(leadId, agentId) {
        try {
            const Lead = require('../models/Lead');

            // Update lead with agent assignment
            const lead = await Lead.findByIdAndUpdate(leadId, {
                $set: {
                    assignedTo: agentId,
                    assignedAt: new Date(),
                    isAssigned: true,
                    'sessionData.assignedAgent': agentId,
                    'sessionData.assignedAt': new Date()
                }
            }, { new: true });

            if (!lead) {
                throw new Error('Lead not found');
            }

            // Update session file with agent assignment
            if (lead.sessionData && lead.sessionData.sessionPath) {
                try {
                    const sessionFileContent = await fs.readFile(lead.sessionData.sessionPath, 'utf8');
                    const sessionRecord = JSON.parse(sessionFileContent);

                    sessionRecord.assignedAgent = agentId;
                    sessionRecord.assignedAt = new Date();

                    await fs.writeFile(lead.sessionData.sessionPath, JSON.stringify(sessionRecord, null, 2));
                } catch (error) {
                    console.warn('Could not update session file with agent assignment:', error);
                }
            }

            return {
                success: true,
                message: 'Session assigned to agent successfully',
                leadId,
                agentId,
                sessionId: lead.sessionData?.sessionId
            };

        } catch (error) {
            console.error('Error assigning session to agent:', error);
            throw new Error(`Failed to assign session to agent: ${error.message}`);
        }
    }

    /**
     * Launch browser with stored session for agent
     * @param {string} leadId - Lead ID
     * @param {string} agentId - Agent ID
     * @returns {Promise<Object>} Browser launch result
     */
    async launchAgentBrowser(leadId, agentId) {
        try {
            // Verify agent assignment
            const Lead = require('../models/Lead');
            const lead = await Lead.findById(leadId);

            if (!lead) {
                throw new Error('Lead not found');
            }

            if (!lead.assignedTo || lead.assignedTo.toString() !== agentId) {
                throw new Error('Lead is not assigned to this agent');
            }

            // Retrieve session data
            const sessionResult = await this.retrieveSession(leadId);

            if (!sessionResult.success) {
                throw new Error('Failed to retrieve session data');
            }

            // Prepare browser launch data for Python script
            const browserLaunchData = {
                leadId,
                agentId,
                sessionData: sessionResult.sessionData,
                leadInfo: {
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.newEmail,
                    phone: lead.newPhone || lead.phone,
                    country: lead.country
                }
            };

            // Spawn the agent browser launcher script
            const { spawn } = require('child_process');
            const path = require('path');

            const scriptPath = path.join(__dirname, '../../agent_browser_launcher.py');
            console.log(`Launching agent browser script: ${scriptPath}`);

            const pythonProcess = spawn('python', [scriptPath, JSON.stringify(browserLaunchData)], {
                stdio: 'pipe',
                cwd: path.dirname(scriptPath),
                env: {
                    ...process.env,
                    NODE_ENV: process.env.NODE_ENV || 'development',
                    RENDER: process.env.RENDER || 'false',
                    VERCEL: process.env.VERCEL || '0',
                    DOCKER: process.env.DOCKER || 'false'
                }
            });

            // Handle script output
            let scriptOutput = '';
            let scriptError = '';

            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString();
                scriptOutput += output;
                console.log(`Agent Browser Output: ${output}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                const error = data.toString();
                scriptError += error;
                console.error(`Agent Browser Error: ${error}`);
            });

            pythonProcess.on('close', (code) => {
                console.log(`Agent browser script exited with code ${code}`);
                if (code !== 0) {
                    console.error(`Agent browser launch failed with code ${code}`);
                    console.error(`Script error: ${scriptError}`);
                }
            });

            // Don't wait for the script to complete - return immediately
            return {
                success: true,
                message: 'Agent browser launched successfully. Browser should open shortly.',
                browserLaunchData,
                instructions: {
                    step1: 'Browser will open with stored session',
                    step2: 'Agent will be redirected to success page if session is valid',
                    step3: 'Agent can navigate to saved sites (e.g., Gmail) without login'
                }
            };

        } catch (error) {
            console.error('Error launching agent browser:', error);
            throw new Error(`Failed to launch agent browser: ${error.message}`);
        }
    }

    /**
     * Clean up old sessions
     * @param {number} maxAgeDays - Maximum age in days
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanupOldSessions(maxAgeDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

            const sessionFiles = await fs.readdir(this.sessionsDir);
            let deletedCount = 0;
            let errorCount = 0;

            for (const file of sessionFiles) {
                if (!file.endsWith('.json')) continue;

                try {
                    const filePath = path.join(this.sessionsDir, file);
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const sessionRecord = JSON.parse(fileContent);

                    if (new Date(sessionRecord.createdAt) < cutoffDate) {
                        await fs.unlink(filePath);
                        deletedCount++;

                        // Update lead to remove session reference
                        const Lead = require('../models/Lead');
                        await Lead.findByIdAndUpdate(sessionRecord.leadId, {
                            $unset: { sessionData: 1 }
                        });
                    }
                } catch (error) {
                    console.error(`Error processing session file ${file}:`, error);
                    errorCount++;
                }
            }

            return {
                success: true,
                message: `Cleanup completed. Deleted ${deletedCount} old sessions.`,
                deletedCount,
                errorCount
            };

        } catch (error) {
            console.error('Error during session cleanup:', error);
            throw new Error(`Session cleanup failed: ${error.message}`);
        }
    }

    /**
     * Get session statistics
     * @returns {Promise<Object>} Session statistics
     */
    async getSessionStats() {
        try {
            const sessionFiles = await fs.readdir(this.sessionsDir);
            const stats = {
                totalSessions: 0,
                activeSessions: 0,
                assignedSessions: 0,
                oldestSession: null,
                newestSession: null
            };

            for (const file of sessionFiles) {
                if (!file.endsWith('.json')) continue;

                try {
                    const filePath = path.join(this.sessionsDir, file);
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const sessionRecord = JSON.parse(fileContent);

                    stats.totalSessions++;

                    if (sessionRecord.status === 'active') {
                        stats.activeSessions++;
                    }

                    if (sessionRecord.assignedAgent) {
                        stats.assignedSessions++;
                    }

                    const createdAt = new Date(sessionRecord.createdAt);
                    if (!stats.oldestSession || createdAt < stats.oldestSession) {
                        stats.oldestSession = createdAt;
                    }
                    if (!stats.newestSession || createdAt > stats.newestSession) {
                        stats.newestSession = createdAt;
                    }

                } catch (error) {
                    console.error(`Error reading session file ${file}:`, error);
                }
            }

            return stats;

        } catch (error) {
            console.error('Error getting session stats:', error);
            throw new Error(`Failed to get session stats: ${error.message}`);
        }
    }
}

module.exports = new SessionManagementService();