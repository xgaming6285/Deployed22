import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    useTheme,
    alpha,
    Divider,
    Avatar,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    TextField,
    Tooltip,
    IconButton,
    LinearProgress,
    Chip,
    ToggleButtonGroup,
    ToggleButton,
    TablePagination,
    TableSortLabel
} from '@mui/material';
import {
    Timer as TimerIcon,
    CallReceived as IncomingIcon,
    Error as ErrorIcon,
    AccessTime as TotalTimeIcon,
    AttachMoney as MoneyIcon,
    CheckCircle as SuccessIcon,
    EmojiEvents as BonusIcon,
    History as HistoryIcon,
    ExpandMore as ExpandMoreIcon,
    TrendingUp as ForecastIcon,
    FilterList as FilterIcon,
    SortByAlpha as SortIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Info as InfoIcon,
    ArrowUpward as GrowthIcon
} from '@mui/icons-material';
import { selectUser } from '../store/slices/authSlice';
import { BONUS_RATES, RATE_PER_SECOND, calculateBonuses, calculateTotalPayment } from '../services/payroll/calculations';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';

import { fetchAgentMetrics, fetchAllAgentsMetrics } from '../services/agents';


const ReferencePage = () => {
    const theme = useTheme();
    const user = useSelector(selectUser);
    const navigate = useNavigate();

    // Helper function to safely format numbers
    const safeToFixed = (value, decimals = 2) => {
        const num = Number(value);
        return isNaN(num) ? '0.00' : num.toFixed(decimals);
    };
    const [metrics, setMetrics] = useState(null);
    const [agentData, setAgentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [agents, setAgents] = useState([]);

    // New state variables for payments enhancements
    const [paymentPeriodFilter, setPaymentPeriodFilter] = useState('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [paymentSortField, setPaymentSortField] = useState('period');
    const [paymentSortDirection, setPaymentSortDirection] = useState('desc');
    const [paymentTablePage, setPaymentTablePage] = useState(0);
    const [paymentTableRowsPerPage, setPaymentTableRowsPerPage] = useState(10);
    const [showForecast, setShowForecast] = useState(false);

    // Mock payment history data - in a real app this would come from your backend
    const [paymentHistory] = useState([
        {
            id: 1,
            period: '2024-12',
            startDate: '2024-12-01',
            endDate: '2024-12-31',
            totalCalls: 450,
            successfulCalls: 360,
            successRate: 80.0,
            talkTimeHours: 45.5,
            basePay: 456.84,
            bonuses: 395.00,
            fines: 25.00,
            totalPaid: 826.84,
            status: 'Paid',
            paidDate: '2024-12-31',
            growthRate: 15.2
        },
        {
            id: 2,
            period: '2024-11',
            startDate: '2024-11-01',
            endDate: '2024-11-30',
            totalCalls: 380,
            successfulCalls: 285,
            successRate: 75.0,
            talkTimeHours: 38.2,
            basePay: 383.52,
            bonuses: 332.50,
            fines: 15.00,
            totalPaid: 701.02,
            status: 'Paid',
            paidDate: '2024-11-30',
            growthRate: 12.8
        },
        {
            id: 3,
            period: '2024-10',
            startDate: '2024-10-01',
            endDate: '2024-10-31',
            totalCalls: 320,
            successfulCalls: 240,
            successRate: 75.0,
            talkTimeHours: 32.1,
            basePay: 322.08,
            bonuses: 280.00,
            fines: 10.00,
            totalPaid: 592.08,
            status: 'Paid',
            paidDate: '2024-10-31',
            growthRate: 8.5
        }
    ]);

    // Add logging to see user object
    useEffect(() => {
        console.log('Current user:', user);
    }, [user]);

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };


    // New handlers for payment enhancements
    const handlePaymentPeriodFilterChange = (event) => {
        setPaymentPeriodFilter(event.target.value);
    };

    const handlePaymentStatusFilterChange = (event) => {
        setPaymentStatusFilter(event.target.value);
    };

    const handlePaymentSort = (field) => {
        if (paymentSortField === field) {
            setPaymentSortDirection(paymentSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPaymentSortField(field);
            setPaymentSortDirection('asc');

        }
    };

    const handlePaymentTablePageChange = (event, newPage) => {
        setPaymentTablePage(newPage);
    };

    const handlePaymentTableRowsPerPageChange = (event) => {
        setPaymentTableRowsPerPage(parseInt(event.target.value, 10));
        setPaymentTablePage(0);
    };

    const toggleForecast = () => {
        setShowForecast(!showForecast);
    };

    // Filter and sort payment history
    const filteredPayments = paymentHistory
        .filter(payment => {
            if (paymentPeriodFilter === 'all') return true;
            return payment.period.includes(paymentPeriodFilter);
        })
        .filter(payment => {
            if (paymentStatusFilter === 'all') return true;
            return payment.status === paymentStatusFilter;
        })
        .sort((a, b) => {
            if (paymentSortDirection === 'asc') {
                return a[paymentSortField] > b[paymentSortField] ? 1 : -1;
            } else {
                return a[paymentSortField] < b[paymentSortField] ? 1 : -1;
            }
        });

    const paginatedPayments = filteredPayments.slice(
        paymentTablePage * paymentTableRowsPerPage,
        paymentTablePage * paymentTableRowsPerPage + paymentTableRowsPerPage
    );

    // Payment forecast calculation
    const calculateForecast = () => {
        if (paymentHistory.length < 2) return null;

        const lastTwoMonths = paymentHistory.slice(0, 2);
        const avgGrowthRate = lastTwoMonths.reduce((acc, curr) => acc + curr.growthRate, 0) / lastTwoMonths.length;
        const lastMonthTotal = lastTwoMonths[0].totalPaid;

        return {
            estimatedTotal: lastMonthTotal * (1 + avgGrowthRate / 100),
            growthRate: avgGrowthRate,
            basedOn: lastTwoMonths.map(month => month.period).join(', ')
        };
    };

    const paymentForecast = calculateForecast();

    // Chart data preparation
    const preparePaymentBreakdownData = () => {
        // Assuming we're using the current agent's stats
        const currentMonthData = [
            { name: 'Base Pay', value: currentAgentData?.stats?.totalTalkPay || 0 },
            { name: 'Bonuses', value: totalBonuses },
            { name: 'Fines', value: currentAgentData?.stats?.fines || 0 }
        ];
        return currentMonthData;
    };

    const preparePaymentHistoryData = () => {
        return paymentHistory.map(payment => ({
            name: payment.period,
            total: payment.totalPaid,
            basePay: payment.basePay,
            bonuses: payment.bonuses,
            fines: payment.fines
        })).reverse();
    };

    useEffect(() => {
        // Redirect non-agent/non-admin users
        if (user && user.role !== 'agent' && user.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (user?.role === 'admin') {
                    // Fetch all agents data for admin
                    const agentsData = await fetchAllAgentsMetrics();
                    setAgents(agentsData);
                    if (agentsData.length > 0) {
                        setSelectedAgent(agentsData[0]);
                        setMetrics(agentsData[0].metrics);
                    }
                } else if (user?.role === 'agent') {
                    // Fetch current agent's data using their name
                    const fetchedAgentData = await fetchAgentMetrics(user.name);
                    setAgentData(fetchedAgentData);
                    setMetrics(fetchedAgentData.metrics);
                }
            } catch (err) {
                console.error('Error fetching metrics:', err);
                setError('Failed to load metrics data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate]);

    const handleAgentChange = async (event) => {
        try {
            setLoading(true);
            setError(null);

            const agentName = event.target.value;
            const selectedAgentData = agents.find(agent => agent.fullName === agentName);

            if (selectedAgentData) {
                setSelectedAgent(selectedAgentData);
                setMetrics(selectedAgentData.metrics);
            } else {
                const newAgentData = await fetchAgentMetrics(agentName);
                setSelectedAgent(newAgentData);
                setMetrics(newAgentData.metrics);
            }
        } catch (err) {
            console.error('Error changing agent:', err);
            setError('Failed to load agent data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // If user is not an agent or admin, show access denied
    if (user && user.role !== 'agent' && user.role !== 'admin') {
        return (
            <Box p={3}>
                <Alert severity="error">
                    Access Denied. This page is only available for agents and administrators.
                </Alert>
            </Box>
        );
    }

    // Get the current agent data based on role
    const currentAgentData = user.role === 'admin' ? selectedAgent : agentData;

    // Calculate success rate using real data
    const successRate = currentAgentData?.stats && currentAgentData.stats.incoming > 0 ?
        (currentAgentData.stats.successful / currentAgentData.stats.incoming) * 100 : 0;

    // Calculate bonuses using real data
    const bonuses = currentAgentData?.stats ? calculateBonuses(
        currentAgentData.stats.callCounts.firstCalls,
        currentAgentData.stats.callCounts.secondCalls,
        currentAgentData.stats.callCounts.thirdCalls,
        currentAgentData.stats.callCounts.fourthCalls,
        currentAgentData.stats.callCounts.fifthCalls,
        currentAgentData.stats.callCounts.verifiedAccounts
    ) : {
        firstCallBonus: 0,
        secondCallBonus: 0,
        thirdCallBonus: 0,
        fourthCallBonus: 0,
        fifthCallBonus: 0,
        verifiedAccBonus: 0
    };

    const totalBonuses = Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0);
    const totalPayableAmount = currentAgentData?.stats ?
        calculateTotalPayment(currentAgentData.stats.totalTalkPay, bonuses, currentAgentData.stats.fines) : 0;

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card
            elevation={2}
            sx={{
                height: '100%',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                },
            }}
        >
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <Box
                        sx={{
                            backgroundColor: alpha(theme.palette[color].main, 0.1),
                            borderRadius: '50%',
                            p: 1,
                            mr: 2,
                        }}
                    >
                        {icon}
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            {title}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    // Show loading state
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    // Show error state
    if (error) {
        return (
            <Box m={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }



    return (
        <Box p={3}>
            {/* Admin Agent Selector */}
            {user.role === 'admin' && (
                <Box mb={4}>
                    <FormControl fullWidth>
                        <InputLabel id="agent-select-label">Select Agent</InputLabel>
                        <Select
                            labelId="agent-select-label"
                            id="agent-select"
                            value={selectedAgent?.fullName || ''}
                            label="Select Agent"
                            onChange={handleAgentChange}
                            sx={{
                                backgroundColor: 'white',
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                },
                            }}
                        >
                            {agents.map((agent) => (
                                <MenuItem key={agent.fullName} value={agent.fullName}>
                                    {agent.fullName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            {/* Agent Info Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 4,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 2,
                    p: 2
                }}
            >
                <Avatar
                    sx={{
                        width: 64,
                        height: 64,
                        bgcolor: theme.palette.primary.main,
                        mr: 2
                    }}
                >
                    {currentAgentData?.fullName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 500 }}>
                        {currentAgentData?.fullName}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Agent Performance Metrics
                    </Typography>
                </Box>
            </Box>

            {/* Performance Metrics */}
            <Typography variant="h6" sx={{ mb: 2 }}>Performance Overview</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Incoming Calls"
                        value={currentAgentData?.metrics?.incoming || 0}
                        icon={<IncomingIcon color="primary" />}
                        color="primary"
                        subtitle="Total incoming requests"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Unsuccessful Calls"
                        value={currentAgentData?.metrics?.unsuccessful || 0}
                        icon={<ErrorIcon color="error" />}
                        color="error"
                        subtitle="Failed requests"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Average Time"
                        value={currentAgentData?.metrics?.averageTime ? `${(currentAgentData.metrics.averageTime / 60).toFixed(1)} min` : '0 min'}
                        icon={<TimerIcon color="info" />}
                        color="info"
                        subtitle="Average processing time"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Time"
                        value={currentAgentData?.metrics?.totalTime ? `${(currentAgentData.metrics.totalTime / 3600).toFixed(1)} hrs` : '0 hrs'}
                        icon={<TotalTimeIcon color="success" />}
                        color="success"
                        subtitle="Total processing time"
                    />
                </Grid>
            </Grid>

            {/* Enhanced Payment Information Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Payment Information</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<ForecastIcon />}
                        size="small"
                        onClick={toggleForecast}
                        sx={{ mr: 1 }}
                    >
                        {showForecast ? 'Hide Forecast' : 'Show Forecast'}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        size="small"
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Success Rate"
                        value={`${successRate.toFixed(1)}%`}
                        icon={<SuccessIcon color="success" />}
                        color="success"
                        subtitle={`${currentAgentData?.stats?.successful} / ${currentAgentData?.stats?.incoming} calls`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Total Bonuses"
                        value={`$${totalBonuses.toFixed(2)}`}
                        icon={<BonusIcon color="primary" />}
                        color="primary"
                        subtitle={`${currentAgentData?.stats?.callCounts ? Object.values(currentAgentData.stats.callCounts).reduce((a, b) => a + b, 0) : 0} qualified calls`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <StatCard
                        title="Total Payable"
                        value={`$${totalPayableAmount.toFixed(2)}`}
                        icon={<MoneyIcon color="info" />}
                        color="info"
                        subtitle={currentAgentData?.stats?.fines > 0 ? `Fines: -$${safeToFixed(currentAgentData.stats.fines)}` : 'No fines'}
                    />
                </Grid>
            </Grid>

            {/* Payment Breakdown Visualization */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={5}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Payment Breakdown</Typography>
                        <Box height={240} display="flex" justifyContent="center" alignItems="center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={preparePaymentBreakdownData()}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        <Cell key="base-pay" fill={theme.palette.primary.main} />
                                        <Cell key="bonuses" fill={theme.palette.success.main} />
                                        <Cell key="fines" fill={theme.palette.error.main} />
                                    </Pie>
                                    <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                        <Box mt={2}>
                            <Grid container spacing={1}>
                                <Grid item xs={4}>
                                    <Box display="flex" alignItems="center">
                                        <Box width={12} height={12} bgcolor={theme.palette.primary.main} mr={1} borderRadius={1} />
                                        <Typography variant="body2">Base Pay: ${safeToFixed(currentAgentData?.stats?.totalTalkPay)}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box display="flex" alignItems="center">
                                        <Box width={12} height={12} bgcolor={theme.palette.success.main} mr={1} borderRadius={1} />
                                        <Typography variant="body2">Bonuses: ${totalBonuses.toFixed(2)}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box display="flex" alignItems="center">
                                        <Box width={12} height={12} bgcolor={theme.palette.error.main} mr={1} borderRadius={1} />
                                        <Typography variant="body2">Fines: ${safeToFixed(currentAgentData?.stats?.fines)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    {!showForecast ? (
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Bonus Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.success.main }}>
                                        Call Bonuses
                                    </Typography>
                                    <Box pl={2}>
                                        <Typography variant="body2">1st Calls ({currentAgentData?.stats?.callCounts?.firstCalls || 0}): ${safeToFixed(bonuses.firstCallBonus)}</Typography>
                                        <Typography variant="body2">2nd Calls ({currentAgentData?.stats?.callCounts?.secondCalls || 0}): ${safeToFixed(bonuses.secondCallBonus)}</Typography>
                                        <Typography variant="body2">3rd Calls ({currentAgentData?.stats?.callCounts?.thirdCalls || 0}): ${safeToFixed(bonuses.thirdCallBonus)}</Typography>
                                        <Typography variant="body2">4th Calls ({currentAgentData?.stats?.callCounts?.fourthCalls || 0}): ${safeToFixed(bonuses.fourthCallBonus)}</Typography>
                                        <Typography variant="body2">5th Calls ({currentAgentData?.stats?.callCounts?.fifthCalls || 0}): ${safeToFixed(bonuses.fifthCallBonus)}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.info.main }}>
                                        Additional Bonuses
                                    </Typography>
                                    <Box pl={2}>
                                        <Typography variant="body2">
                                            Verified Accounts ({currentAgentData?.stats?.callCounts?.verifiedAccounts || 0}): ${safeToFixed(bonuses.verifiedAccBonus)}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.error.main }}>
                                        Deductions
                                    </Typography>
                                    <Box pl={2}>
                                        <Typography variant="body2">Fines: -${safeToFixed(currentAgentData?.stats?.fines)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            <Box mt={2} pt={2} borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`}>
                                <Typography variant="subtitle2">Bonus Rate Information:</Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={6} sm={4}>
                                        <Typography variant="caption">1st Call: ${BONUS_RATES.firstCall.toFixed(2)}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <Typography variant="caption">2nd Call: ${BONUS_RATES.secondCall.toFixed(2)}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <Typography variant="caption">3rd Call: ${BONUS_RATES.thirdCall.toFixed(2)}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <Typography variant="caption">4th Call: ${BONUS_RATES.fourthCall.toFixed(2)}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <Typography variant="caption">5th Call: ${BONUS_RATES.fifthCall.toFixed(2)}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <Typography variant="caption">Verified Account: ${BONUS_RATES.verifiedAcc.toFixed(2)}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Payment Forecast</Typography>
                                <Tooltip title="Based on your last two months' performance">
                                    <IconButton size="small">
                                        <InfoIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            {paymentForecast ? (
                                <>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            mb: 2
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Next Month's Estimated Earnings:
                                            </Typography>
                                            <Typography variant="h4" color="primary" fontWeight="bold">
                                                ${paymentForecast.estimatedTotal.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Based on: {paymentForecast.basedOn}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                                color: theme.palette.success.main,
                                                p: 1,
                                                borderRadius: 1
                                            }}
                                        >
                                            <GrowthIcon sx={{ mr: 0.5 }} fontSize="small" />
                                            <Typography variant="subtitle2">
                                                {paymentForecast.growthRate > 0 ? '+' : ''}{paymentForecast.growthRate.toFixed(1)}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="subtitle2" gutterBottom>Performance Factors:</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Call Success Rate</Typography>
                                            <Box display="flex" alignItems="center">
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={successRate}
                                                    sx={{
                                                        flexGrow: 1,
                                                        mr: 1,
                                                        height: 8,
                                                        borderRadius: 1,
                                                        bgcolor: alpha(theme.palette.success.main, 0.2),
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: theme.palette.success.main
                                                        }
                                                    }}
                                                />
                                                <Typography variant="body2">{successRate.toFixed(1)}%</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Bonus Conversion</Typography>
                                            <Box display="flex" alignItems="center">
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(totalBonuses / (Number(currentAgentData?.stats?.totalTalkPay) || 1)) * 100}
                                                    sx={{
                                                        flexGrow: 1,
                                                        mr: 1,
                                                        height: 8,
                                                        borderRadius: 1,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: theme.palette.primary.main
                                                        }
                                                    }}
                                                />
                                                <Typography variant="body2">{safeToFixed((totalBonuses / (Number(currentAgentData?.stats?.totalTalkPay) || 1)) * 100, 1)}%</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    <Box mt={2}>
                                        <Typography variant="subtitle2" gutterBottom>Suggestions to Increase Earnings:</Typography>
                                        <Box component="ul" pl={2} mt={0} mb={0}>
                                            <Typography component="li" variant="body2">Focus on completing 5th calls (highest bonus rate: ${BONUS_RATES.fifthCall.toFixed(2)})</Typography>
                                            <Typography component="li" variant="body2">Increase verified accounts ratio (bonus: ${BONUS_RATES.verifiedAcc.toFixed(2)} each)</Typography>
                                            <Typography component="li" variant="body2">Maintain high success rate to avoid fines</Typography>
                                        </Box>
                                    </Box>
                                </>
                            ) : (
                                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                    <Typography color="textSecondary">Insufficient data for forecast</Typography>
                                </Box>
                            )}
                        </Paper>
                    )}
                </Grid>
            </Grid>

            {/* Payment History Trends */}
            <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                <Typography variant="h6" gutterBottom>Payment History Trends</Typography>
                <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={preparePaymentHistoryData()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Bar name="Base Pay" dataKey="basePay" fill={theme.palette.primary.main} />
                            <Bar name="Bonuses" dataKey="bonuses" fill={theme.palette.success.main} />
                            <Bar name="Fines" dataKey="fines" fill={theme.palette.error.main} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* Enhanced Payment History Section */}
            <Box sx={{ mt: 4 }}>
                <Accordion
                    expanded={expanded === 'paymentHistory'}
                    onChange={handleAccordionChange('paymentHistory')}
                    sx={{
                        '&:before': {
                            display: 'none',
                        },
                        boxShadow: theme.shadows[2],
                        '&:hover': {
                            boxShadow: theme.shadows[4],
                        },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                        }}
                    >
                        <Box display="flex" alignItems="center">
                            <HistoryIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography variant="h6">Payment History</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2 }}>
                        {/* Filters */}
                        <Box mb={2} display="flex" alignItems="center" flexWrap="wrap" gap={2}>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                                <InputLabel id="period-filter-label">Period</InputLabel>
                                <Select
                                    labelId="period-filter-label"
                                    id="period-filter"
                                    value={paymentPeriodFilter}
                                    onChange={handlePaymentPeriodFilterChange}
                                    label="Period"
                                >
                                    <MenuItem value="all">All Periods</MenuItem>
                                    <MenuItem value="2024">2024</MenuItem>
                                    <MenuItem value="March">March</MenuItem>
                                    <MenuItem value="February">February</MenuItem>
                                    <MenuItem value="January">January</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                                <InputLabel id="status-filter-label">Status</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    id="status-filter"
                                    value={paymentStatusFilter}
                                    onChange={handlePaymentStatusFilterChange}
                                    label="Status"
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="Paid">Paid</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                </Select>
                            </FormControl>

                            <Box flexGrow={1} />

                            <IconButton size="small">
                                <PrintIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {/* Table with sort and pagination */}
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                                        <TableCell>
                                            <TableSortLabel
                                                active={paymentSortField === 'period'}
                                                direction={paymentSortField === 'period' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('period')}
                                            >
                                                Period
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="right">
                                            <TableSortLabel
                                                active={paymentSortField === 'totalCalls'}
                                                direction={paymentSortField === 'totalCalls' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('totalCalls')}
                                            >
                                                Total Calls
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="right">
                                            <TableSortLabel
                                                active={paymentSortField === 'successRate'}
                                                direction={paymentSortField === 'successRate' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('successRate')}
                                            >
                                                Success Rate
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="right">
                                            <TableSortLabel
                                                active={paymentSortField === 'bonuses'}
                                                direction={paymentSortField === 'bonuses' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('bonuses')}
                                            >
                                                Bonuses
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="right">Fines</TableCell>
                                        <TableCell align="right">
                                            <TableSortLabel
                                                active={paymentSortField === 'totalPaid'}
                                                direction={paymentSortField === 'totalPaid' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('totalPaid')}
                                            >
                                                Total Paid
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={paymentSortField === 'status'}
                                                direction={paymentSortField === 'status' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('status')}
                                            >
                                                Status
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={paymentSortField === 'paidDate'}
                                                direction={paymentSortField === 'paidDate' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('paidDate')}
                                            >
                                                Paid Date
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="right">
                                            <TableSortLabel
                                                active={paymentSortField === 'growthRate'}
                                                direction={paymentSortField === 'growthRate' ? paymentSortDirection : 'asc'}
                                                onClick={() => handlePaymentSort('growthRate')}
                                            >
                                                Growth
                                            </TableSortLabel>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedPayments.map((payment) => (
                                        <TableRow
                                            key={payment.id}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                                }
                                            }}
                                        >
                                            <TableCell>{payment.period}</TableCell>
                                            <TableCell align="right">{payment.totalCalls}</TableCell>
                                            <TableCell align="right">{payment.successRate}</TableCell>
                                            <TableCell align="right" sx={{ color: theme.palette.success.main }}>
                                                ${payment.bonuses.toFixed(2)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: theme.palette.error.main }}>
                                                ${payment.fines.toFixed(2)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                ${payment.totalPaid.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={payment.status}
                                                    size="small"
                                                    color={payment.status === 'Paid' ? 'success' : 'warning'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{payment.paidDate}</TableCell>
                                            <TableCell align="right">
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-end',
                                                        color: payment.growthRate > 0 ? theme.palette.success.main : 'inherit'
                                                    }}
                                                >
                                                    {payment.growthRate > 0 && <GrowthIcon fontSize="small" sx={{ mr: 0.5 }} />}
                                                    {payment.growthRate > 0 ? '+' : ''}{payment.growthRate}%
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedPayments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                                <Typography color="textSecondary">No payment records found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={filteredPayments.length}
                            page={paymentTablePage}
                            onPageChange={handlePaymentTablePageChange}
                            rowsPerPage={paymentTableRowsPerPage}
                            onRowsPerPageChange={handlePaymentTableRowsPerPageChange}
                            rowsPerPageOptions={[5, 10, 25]}
                            sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}
                        />
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    );
};

export default ReferencePage; 