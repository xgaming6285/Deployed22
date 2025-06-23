// TEMPORARY CORS FIX - Replace the corsOptions in server.js with this for immediate debugging
// REMOVE THIS AFTER FIXING THE ENVIRONMENT VARIABLES

const corsOptions = {
  origin: '*', // Allow all origins temporarily
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false, // Must be false when origin is '*'
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Instructions:
// 1. Replace the corsOptions object in your backend/server.js with the above
// 2. Commit and push to trigger Render redeploy
// 3. Test your frontend
// 4. Once working, revert back and set proper CORS_ORIGIN environment variable 