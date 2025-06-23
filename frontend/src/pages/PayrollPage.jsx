import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  selectUser,
  selectAgentPerformanceData,
  selectAuthLoading,
  fetchAgentPerformance
} from '../store/slices/authSlice';
import AgentPerformanceCard from '../components/AgentPerformanceCard';
import {
  BONUS_RATES,
  RATE_PER_SECOND,
  calculateBonuses,
  calculateTotalPayment,
  timeToSeconds
} from '../services/payroll/calculations';

// Mock payment history data - in a real app this would come from your backend
const mockPaymentHistory = [
  {
    id: 1,
    period: '2024-12',
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    totalCalls: 450,
    successfulCalls: 360,
    talkTimeHours: 45.5,
    basePay: 456.84,
    bonuses: {
      firstCallBonus: 120.00,
      secondCallBonus: 67.50,
      thirdCallBonus: 52.50,
      fourthCallBonus: 40.00,
      fifthCallBonus: 80.00,
      verifiedAccBonus: 35.00
    },
    fines: 25.00,
    totalPaid: 826.84,
    status: 'paid',
    paidDate: '2024-12-31'
  },
  {
    id: 2,
    period: '2024-11',
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    totalCalls: 380,
    successfulCalls: 285,
    talkTimeHours: 38.2,
    basePay: 383.52,
    bonuses: {
      firstCallBonus: 100.00,
      secondCallBonus: 52.50,
      thirdCallBonus: 45.00,
      fourthCallBonus: 35.00,
      fifthCallBonus: 70.00,
      verifiedAccBonus: 30.00
    },
    fines: 15.00,
    totalPaid: 701.02,
    status: 'paid',
    paidDate: '2024-11-30'
  }
];

const PayrollPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const agentPerformanceData = useSelector(selectAgentPerformanceData);
  const loading = useSelector(selectAuthLoading);

  const [tabValue, setTabValue] = useState(0);
  const [expanded, setExpanded] = useState('performance');
  const [paymentHistory] = useState(mockPaymentHistory);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch agent performance data on component mount
  useEffect(() => {
    if (user?.role === 'agent' && !agentPerformanceData) {
      dispatch(fetchAgentPerformance());
    }
  }, [dispatch, user, agentPerformanceData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchAgentPerformance()).unwrap();
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate current period stats from external API data
  const calculateCurrentPeriodStats = () => {
    if (!agentPerformanceData || !agentPerformanceData.incomingCalls || !agentPerformanceData.metrics) {
      return null;
    }

    const { incomingCalls, metrics } = agentPerformanceData;
    const talkTimeSeconds = incomingCalls.totalTimeSeconds || 0;
    const talkTimeHours = talkTimeSeconds / 3600;

    // Mock call counts for demonstration - in real app, get from external API if available
    const callCounts = {
      firstCalls: Math.floor((incomingCalls.successful || 0) * 0.3),
      secondCalls: Math.floor((incomingCalls.successful || 0) * 0.25),
      thirdCalls: Math.floor((incomingCalls.successful || 0) * 0.2),
      fourthCalls: Math.floor((incomingCalls.successful || 0) * 0.15),
      fifthCalls: Math.floor((incomingCalls.successful || 0) * 0.1),
      verifiedAccounts: Math.floor((incomingCalls.successful || 0) * 0.15)
    };

    const bonuses = calculateBonuses(
      callCounts.firstCalls,
      callCounts.secondCalls,
      callCounts.thirdCalls,
      callCounts.fourthCalls,
      callCounts.fifthCalls,
      callCounts.verifiedAccounts
    );

    const basePay = metrics.totalPay || 0;
    const fines = 0; // Mock - would come from your system
    const totalPayable = calculateTotalPayment(basePay, bonuses, fines);

    return {
      basePay,
      bonuses,
      fines,
      totalPayable,
      callCounts,
      talkTimeHours,
      totalCalls: incomingCalls.total || 0,
      successfulCalls: incomingCalls.successful || 0,
      successRate: metrics.successRate || 0
    };
  };

  const currentStats = calculateCurrentPeriodStats();

  if (user?.role !== 'agent') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          This page is only available for agents.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Agent Payroll Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View your performance data, earnings, and payment history
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Refresh Data
            </Button>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label="Current Performance"
              icon={<TrendingUpIcon />}
              iconPosition="start"
            />
            <Tab
              label="Payment History"
              icon={<MoneyIcon />}
              iconPosition="start"
            />
            <Tab
              label="Earnings Breakdown"
              icon={<AssessmentIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* External API Performance Data */}
            <AgentPerformanceCard
              performanceData={agentPerformanceData}
              loading={loading || refreshing}
            />

            {/* Current Period Summary */}
            {currentStats ? (
              <Card sx={{ mb: 3 }}>
                <CardHeader
                  title="Current Period Summary"
                  action={
                    <Chip
                      label="Live Data"
                      color="success"
                      variant="outlined"
                    />
                  }
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary.main">
                          ${currentStats.totalPayable.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Earnings
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {currentStats.successRate}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Success Rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {currentStats.talkTimeHours.toFixed(1)}h
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Talk Time
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {currentStats.totalCalls}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Calls
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              !agentPerformanceData && !loading && !refreshing && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Alert severity="info">
                      Performance data is not available yet. This could be because:
                      <ul>
                        <li>Your agent name doesn't match the external system</li>
                        <li>No recent performance data has been recorded</li>
                        <li>The external API is temporarily unavailable</li>
                      </ul>
                      Try refreshing the data or contact your administrator.
                    </Alert>
                  </CardContent>
                </Card>
              )
            )}
          </motion.div>
        )}

        {tabValue === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader title="Payment History" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Total Calls</TableCell>
                        <TableCell align="right">Success Rate</TableCell>
                        <TableCell align="right">Base Pay</TableCell>
                        <TableCell align="right">Bonuses</TableCell>
                        <TableCell align="right">Deductions</TableCell>
                        <TableCell align="right">Total Paid</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.period}</TableCell>
                          <TableCell align="right">{payment.totalCalls}</TableCell>
                          <TableCell align="right">
                            {Math.round((payment.successfulCalls / payment.totalCalls) * 100)}%
                          </TableCell>
                          <TableCell align="right">
                            ${payment.basePay.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ${Object.values(payment.bonuses).reduce((sum, bonus) => sum + bonus, 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ${payment.fines.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="success.main">
                              ${payment.totalPaid.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status}
                              color={payment.status === 'paid' ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {tabValue === 2 && currentStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title="Earnings Breakdown" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>Base Pay (Talk Time)</Typography>
                        <Typography variant="h6" color="primary.main">
                          ${currentStats.basePay.toFixed(2)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Typography variant="subtitle2" color="text.secondary">
                        Bonuses
                      </Typography>
                      {Object.entries(currentStats.bonuses).map(([key, value]) => (
                        <Box key={key} display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Bonus', '')}
                          </Typography>
                          <Typography color="success.main">
                            +${value.toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                      <Divider />
                      {currentStats.fines > 0 && (
                        <>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography color="error.main">Deductions</Typography>
                            <Typography color="error.main">
                              -${currentStats.fines.toFixed(2)}
                            </Typography>
                          </Box>
                          <Divider />
                        </>
                      )}
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Total Estimated</Typography>
                        <Typography variant="h5" color="success.main">
                          ${currentStats.totalPayable.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title="Call Breakdown" />
                  <CardContent>
                    <Stack spacing={2}>
                      {Object.entries(currentStats.callCounts).map(([key, value]) => (
                        <Box key={key} display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Calls', '').replace('Accounts', '')}
                          </Typography>
                          <Typography variant="h6">
                            {value}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}
      </motion.div>
    </Box>
  );
};

export default PayrollPage;