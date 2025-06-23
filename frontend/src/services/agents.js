import api from './api';

// Function to fetch agent metrics
export const fetchAgentMetrics = async (agentName) => {
    try {
        console.log('Fetching metrics for agent:', agentName);
        const response = await api.get(`/mongodb/agents/${encodeURIComponent(agentName)}`);
        console.log('Agent metrics response:', response.data);

        if (response.data.success && response.data.data.length > 0) {
            // Get the most recent data for the agent
            const latestData = response.data.data[0];
            return transformMetricsData(latestData);
        }
        throw new Error('No data found for agent');
    } catch (error) {
        console.error('Error fetching agent metrics:', error);
        throw error;
    }
};

// Function to fetch all agents metrics (for admin)
export const fetchAllAgentsMetrics = async () => {
    try {
        console.log('Fetching all agents metrics');
        // First get all agents
        const agentsResponse = await api.get('/mongodb/agents');
        console.log('All agents response:', agentsResponse.data);

        if (!agentsResponse.data.success) {
            throw new Error('Failed to fetch agents list');
        }

        // Then get performance data for all agents
        const performanceResponse = await api.get('/mongodb/agents/performance');
        console.log('Performance response:', performanceResponse.data);

        if (!performanceResponse.data.success) {
            throw new Error('Failed to fetch agents performance');
        }

        // Combine the data
        const agentsData = performanceResponse.data.agents.map(agent => transformMetricsData(agent));
        return agentsData;
    } catch (error) {
        console.error('Error fetching all agents metrics:', error);
        throw error;
    }
};

// Transform the incoming data to match our frontend structure
const transformMetricsData = (data) => {
    // Extract incoming calls data
    const incomingCalls = data.incoming_calls || {};

    // Handle MongoDB ObjectId by using its string representation or a fallback
    const getId = (data) => {
        if (data._id) {
            // If _id is an object with toString method (ObjectId)
            return typeof data._id === 'object' && data._id.toString ?
                data._id.toString() :
                data._id;
        }
        return data.agent_number || String(Date.now()); // Fallback to agent_number or timestamp
    };

    return {
        id: getId(data),
        fullName: data.agent_name,
        metrics: {
            incoming: parseInt(incomingCalls.total) || 0,
            unsuccessful: parseInt(incomingCalls.unsuccessful) || 0,
            successful: parseInt(incomingCalls.successful) || 0,
            averageTime: convertTimeStringToSeconds(incomingCalls.avg_time),
            totalTime: convertTimeStringToSeconds(incomingCalls.total_time),
            minTime: incomingCalls.min_time,
            maxTime: incomingCalls.max_time,
            avgWaitTime: incomingCalls.avg_wait,
            lastUpdated: data.last_updated || data.extracted_at
        },
        stats: {
            id: getId(data),
            name: data.agent_name,
            incoming: parseInt(incomingCalls.total) || 0,
            failed: parseInt(incomingCalls.unsuccessful) || 0,
            successful: parseInt(incomingCalls.successful) || 0,
            totalTalkTime: incomingCalls.total_time || "00:00:00",
            totalTalkTimeSeconds: convertTimeStringToSeconds(incomingCalls.total_time),
            ratePerSecond: 0.0027800, // This should match your RATE_PER_SECOND constant
            totalTalkPay: calculateTotalPay(convertTimeStringToSeconds(incomingCalls.total_time)),
            callCounts: {
                firstCalls: data.call_counts?.firstCalls || Math.floor((parseInt(incomingCalls.successful) || 0) * 0.3),
                secondCalls: data.call_counts?.secondCalls || Math.floor((parseInt(incomingCalls.successful) || 0) * 0.25),
                thirdCalls: data.call_counts?.thirdCalls || Math.floor((parseInt(incomingCalls.successful) || 0) * 0.2),
                fourthCalls: data.call_counts?.fourthCalls || Math.floor((parseInt(incomingCalls.successful) || 0) * 0.15),
                fifthCalls: data.call_counts?.fifthCalls || Math.floor((parseInt(incomingCalls.successful) || 0) * 0.1),
                verifiedAccounts: data.call_counts?.verifiedAccounts || Math.floor((parseInt(incomingCalls.successful) || 0) * 0.15)
            },
            fines: data.fines || 0
        }
    };
};

// Helper function to convert time string (HH:MM:SS) to seconds
const convertTimeStringToSeconds = (timeString) => {
    if (!timeString) return 0;

    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
};

// Helper function to calculate total pay based on talk time
const calculateTotalPay = (totalSeconds) => {
    const ratePerSecond = 0.0027800; // This should match your RATE_PER_SECOND constant
    return (totalSeconds * ratePerSecond).toFixed(2);
}; 