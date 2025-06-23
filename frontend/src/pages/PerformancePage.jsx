import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { selectUser } from '../store/slices/authSlice';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const cardStyle = {
  height: '100%',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
};

const PerformancePage = () => {
  const theme = useTheme();
  const user = useSelector(selectUser);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Performance data
  const [teamStats, setTeamStats] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [leadStats, setLeadStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [agentPerformance, setAgentPerformance] = useState([]);

  // Date range for charts
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  // New state for performance insights (не се използва в текущия код, но е там)
  const [insights, setInsights] = useState({
    topPerformerTrend: null,
    callQualityTrend: null,
    revenueGrowth: null,
  });

  // Fetch performance data
  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));
      const startDateStr = startDate.toISOString().split('T')[0];

      const promises = [];

      if (user?.role === 'admin') {
        promises.push(
          api.get(`/users/team-stats?date=${today}`),
          api.get(`/users/top-performers?period=${selectedPeriod}&limit=10`),
          api.get('/leads/stats'),
          api.get(`/orders/stats?startDate=${startDateStr}&endDate=${today}`)
        );
      } else if (user?.role === 'agent') {
        if (user && user.id) {
          promises.push(
            api.get(`/users/${user.id}/performance?startDate=${startDateStr}&endDate=${today}`)
          );
        }
      }
      const results = await Promise.all(promises);

      if (user?.role === 'admin') {
        setTeamStats(results[0].data.data);
        setTopPerformers(results[1].data.data);
        setLeadStats(results[2].data.data);
        setOrderStats(results[3].data.data);
      } else if (user?.role === 'agent') {
        setAgentPerformance(results[0].data.data);
      }

      generateChartData();

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data for trends (сега е с демо данни)
  const generateChartData = () => {
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      data.push(Math.floor(Math.random() * 50) + 10); // Demo data
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'Daily Performance',
          data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    });
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod, user]);

  // Enhanced chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: theme.typography.fontFamily,
            size: isSmallScreen ? 10 : 12,
          },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Performance Trend',
        font: {
          family: theme.typography.fontFamily,
          size: isSmallScreen ? 14 : 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.text.primary, 0.1),
        },
        ticks: {
          font: {
            family: theme.typography.fontFamily,
            size: isSmallScreen ? 10 : 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: theme.typography.fontFamily,
            size: isSmallScreen ? 10 : 12,
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  // Lead distribution chart data
  const leadDistributionData = leadStats ? {
    labels: ['FTD', 'Filler', 'Cold', 'Live'],
    datasets: [
      {
        data: [
          leadStats.leads.ftd.total,
          leadStats.leads.filler.total,
          leadStats.leads.cold.total,
          leadStats.leads.live.total,
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#9C27B0',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#9C27B0',
        ],
      },
    ],
  } : null;

  // Performance metrics for agents
  const getPerformanceMetrics = () => {
    if (user?.role === 'agent' && agentPerformance.length > 0) {
      const totalCalls = agentPerformance.reduce((sum, p) => sum + (p.metrics?.callsMade || 0), 0);
      const totalEarnings = agentPerformance.reduce((sum, p) => sum + (p.metrics?.earnings || 0), 0);
      const avgQuality = agentPerformance.reduce((sum, p) => sum + (p.metrics?.averageCallQuality || 0), 0) / agentPerformance.length;

      return {
        totalCalls,
        totalEarnings: totalEarnings.toFixed(2),
        averageQuality: avgQuality.toFixed(1),
        totalFTDs: agentPerformance.reduce((sum, p) => sum + (p.metrics?.ftdCount || 0), 0),
        totalFillers: agentPerformance.reduce((sum, p) => sum + (p.metrics?.fillerCount || 0), 0),
      };
    }
    return null;
  };

  const agentMetrics = getPerformanceMetrics();

  if (user?.role !== 'admin' && user?.role !== 'agent') {
    return (
      <Box sx={{ p: isSmallScreen ? 2 : 3 }}>
        <Alert severity="error">
          You don't have permission to access performance analytics.
        </Alert>
      </Box>
    );
  }

  return (
    <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible"
      sx={{ p: isSmallScreen ? 2 : 3 }}
    >
      <Box
        display="flex"
        flexDirection={isSmallScreen ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isSmallScreen ? 'flex-start' : 'center'}
        mb={3}
      >
        <Typography
          variant={isSmallScreen ? 'h5' : 'h4'}
          component={motion.h4}
          variants={itemVariants}
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: isSmallScreen ? 2 : 0,
          }}
        >
          {user?.role === 'agent' ? 'My Performance' : 'Performance Analytics'}
        </Typography>
        <Stack
          direction={isSmallScreen ? 'column' : 'row'}
          spacing={isSmallScreen ? 1 : 2}
          alignItems={isSmallScreen ? 'stretch' : 'center'}
          sx={{ width: isSmallScreen ? '100%' : 'auto' }}
        >
          <FormControl sx={{ minWidth: isSmallScreen ? '100%' : 150 }} component={motion.div} variants={itemVariants}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchPerformanceData}
              component={motion.button}
              variants={itemVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              sx={{ alignSelf: isSmallScreen ? 'flex-end' : 'center' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          component={motion.div}
          variants={itemVariants}
        >
          {error}
        </Alert>
      )}

      <AnimatePresence>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            my={4}
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={isSmallScreen ? 1 : 3}>
            {/* Admin Dashboard */}
            {user?.role === 'admin' && (
              <>
                {/* Key Metrics Cards */}
                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <PeopleIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            {teamStats?.totalAgents || 0}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                            Active Agents
                          </Typography>
                        </Box>
                      </Box>
                      <Box mt={isSmallScreen ? 1 : 2}>
                        <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                          vs last period
                        </Typography>
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <TrendingUpIcon
                            sx={{
                              color: theme.palette.success.main,
                              fontSize: isSmallScreen ? '0.8rem' : '1rem',
                              mr: 0.5,
                            }}
                          />
                          <Typography
                            variant={isSmallScreen ? 'body2' : 'body1'}
                            color="success.main"
                            fontWeight="bold"
                          >
                            +5%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <PhoneIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            {teamStats?.totalCalls || 0}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                            Total Calls Today
                          </Typography>
                        </Box>
                      </Box>
                      <Box mt={isSmallScreen ? 1 : 2}>
                        <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                          Daily Target
                        </Typography>
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <SpeedIcon
                            sx={{
                              color: theme.palette.warning.main,
                              fontSize: isSmallScreen ? '0.8rem' : '1rem',
                              mr: 0.5,
                            }}
                          />
                          <Typography
                            variant={isSmallScreen ? 'body2' : 'body1'}
                            color="warning.main"
                            fontWeight="bold"
                          >
                            85% Complete
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <MoneyIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            ${teamStats?.totalEarnings || 0}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                            Total Earnings
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <TrendingUpIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            {teamStats?.averageCallQuality || 0}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                            Avg Call Quality
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Lead Distribution Chart and Performance Trend Chart */}
                <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardHeader
                      title={
                        <Typography variant={isSmallScreen ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                          Lead Distribution
                        </Typography>
                      }
                      action={
                        <Tooltip title="View Details">
                          <IconButton size={isSmallScreen ? 'small' : 'medium'}>
                            <AssessmentIcon />
                          </IconButton>
                        </Tooltip>
                      }
                      sx={{ p: isSmallScreen ? 1.5 : 2 }}
                    />
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box sx={{ height: isSmallScreen ? 250 : 300 }}>
                        {leadDistributionData ? (
                          <Doughnut
                            data={leadDistributionData}
                            options={{
                              ...chartOptions,
                              cutout: '70%',
                              plugins: {
                                ...chartOptions.plugins,
                                legend: {
                                  ...chartOptions.plugins.legend,
                                  position: 'bottom',
                                  labels: {
                                    font: {
                                      family: theme.typography.fontFamily,
                                      size: isSmallScreen ? 10 : 12,
                                    },
                                    usePointStyle: true,
                                  },
                                },
                              },
                            }}
                          />
                        ) : (
                          <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardHeader
                      title={
                        <Typography variant={isSmallScreen ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                          Performance Trend
                        </Typography>
                      }
                      action={
                        <Tooltip title="View Analytics">
                          <IconButton size={isSmallScreen ? 'small' : 'medium'}>
                            <TimelineIcon />
                          </IconButton>
                        </Tooltip>
                      }
                      sx={{ p: isSmallScreen ? 1.5 : 2 }}
                    />
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box sx={{ height: isSmallScreen ? 250 : 300 }}>
                        <Line
                          data={chartData}
                          options={{
                            ...chartOptions,
                            elements: {
                              line: {
                                tension: 0.4,
                              },
                              point: {
                                radius: 4,
                                borderWidth: 2,
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Top Performers Table */}
                <Grid item xs={12} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardHeader
                      title={
                        <Box display="flex" alignItems="center">
                          <TrophyIcon sx={{ color: theme.palette.warning.main, mr: 1 }} />
                          <Typography variant={isSmallScreen ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                            Top Performers
                          </Typography>
                        </Box>
                      }
                      sx={{ p: isSmallScreen ? 1.5 : 2 }}
                    />
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <TableContainer component={Paper}>
                        <Table size={isSmallScreen ? 'small' : 'medium'}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Agent</TableCell>
                              <TableCell align="center">Calls</TableCell>
                              <TableCell align="center">Earnings</TableCell>
                              {/* АДАПТИВНО: Скриване на Quality Score на мобилни, ако е твърде препълнено */}
                              <TableCell align="center" sx={{ display: isSmallScreen ? 'none' : 'table-cell' }}>Quality Score</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {topPerformers.map((performer, index) => (
                              <TableRow
                                key={performer._id}
                                component={motion.tr}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                sx={{
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  },
                                }}
                              >
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <Avatar
                                      sx={{
                                        bgcolor: theme.palette.primary.main,
                                        width: isSmallScreen ? 24 : 32,
                                        height: isSmallScreen ? 24 : 32,
                                        mr: isSmallScreen ? 0.5 : 1,
                                      }}
                                    >
                                      {performer.agent.fullName.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant={isSmallScreen ? 'body2' : 'body1'} fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                                        {performer.agent.fullName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: isSmallScreen ? 'none' : 'block' }}>
                                        #{performer.agent.fourDigitCode}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant={isSmallScreen ? 'body2' : 'body1'} fontWeight="medium">
                                    {performer.totalCalls}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant={isSmallScreen ? 'body2' : 'body1'} fontWeight="medium" color="success.main">
                                    ${performer.totalEarnings.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ display: isSmallScreen ? 'none' : 'table-cell' }}>
                                  <Box display="flex" justifyContent="center" alignItems="center">
                                    <Typography
                                      variant={isSmallScreen ? 'body2' : 'body1'}
                                      sx={{
                                        color: performer.averageCallQuality >= 4
                                          ? 'success.main'
                                          : performer.averageCallQuality >= 3
                                            ? 'warning.main'
                                            : 'error.main',
                                      }}
                                    >
                                      {performer.averageCallQuality.toFixed(1)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" ml={0.5}>
                                      /5.0
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={index < 3 ? 'Top Performer' : 'Active'}
                                    color={
                                      index < 3
                                        ? 'success'
                                        : 'primary'
                                    }
                                    size="small"
                                    sx={{
                                      bgcolor: index < 3
                                        ? alpha(theme.palette.success.main, 0.1)
                                        : alpha(theme.palette.primary.main, 0.1),
                                      color: index < 3
                                        ? theme.palette.success.main
                                        : theme.palette.primary.main,
                                      fontWeight: 'medium',
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Lead Stats Summary */}
                {leadStats && (
                  <Grid item xs={12} component={motion.div} variants={itemVariants}>
                    <Card>
                      <CardHeader title="Lead Statistics" />
                      <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                        <Grid container spacing={isSmallScreen ? 1 : 2}>
                          {/* Променено на xs={6} за 2 колони на ред на мобилни */}
                          <Grid item xs={6} sm={6} md={3}>
                            <Box textAlign="center" p={isSmallScreen ? 1 : 2}>
                              <Typography variant={isSmallScreen ? 'h6' : 'h5'} color="primary">
                                {leadStats.leads.ftd.total}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total FTD Leads
                              </Typography>
                              <Typography variant="caption" sx={{ display: isSmallScreen ? 'none' : 'block' }}>
                                {leadStats.leads.ftd.assigned} assigned, {leadStats.leads.ftd.available} available
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={6} md={3}>
                            <Box textAlign="center" p={isSmallScreen ? 1 : 2}>
                              <Typography variant={isSmallScreen ? 'h6' : 'h5'} color="secondary">
                                {leadStats.leads.filler.total}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total Filler Leads
                              </Typography>
                              <Typography variant="caption" sx={{ display: isSmallScreen ? 'none' : 'block' }}>
                                {leadStats.leads.filler.assigned} assigned, {leadStats.leads.filler.available} available
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={6} md={3}>
                            <Box textAlign="center" p={isSmallScreen ? 1 : 2}>
                              <Typography variant={isSmallScreen ? 'h6' : 'h5'} color="info.main">
                                {leadStats.leads.cold.total}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total Cold Leads
                              </Typography>
                              <Typography variant="caption" sx={{ display: isSmallScreen ? 'none' : 'block' }}>
                                {leadStats.leads.cold.assigned} assigned, {leadStats.leads.cold.available} available
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={6} md={3}>
                            <Box textAlign="center" p={isSmallScreen ? 1 : 2}>
                              <Typography variant={isSmallScreen ? 'h6' : 'h5'} color="secondary.main">
                                {leadStats.leads.live.total}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total Live Leads
                              </Typography>
                              <Typography variant="caption" sx={{ display: isSmallScreen ? 'none' : 'block' }}>
                                {leadStats.leads.live.assigned} assigned, {leadStats.leads.live.available} available
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}> {/* Overall Leads ще е на цял ред на мобилни */}
                            <Box textAlign="center" p={isSmallScreen ? 1 : 2}>
                              <Typography variant={isSmallScreen ? 'h6' : 'h5'} color="text.primary">
                                {leadStats.leads.overall.total}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total Leads
                              </Typography>
                              <Typography variant="caption" sx={{ display: isSmallScreen ? 'none' : 'block' }}>
                                {leadStats.leads.overall.assigned} assigned, {leadStats.leads.overall.available} available
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </>
            )}

            {/* Agent Dashboard */}
            {user?.role === 'agent' && agentMetrics && (
              <>
                {/* Agent Metrics Cards */}
                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <PhoneIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            {agentMetrics.totalCalls}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="textSecondary">
                            Total Calls
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <MoneyIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            ${agentMetrics.totalEarnings}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                            Total Earnings
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <TrendingUpIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            {agentMetrics.totalFTDs}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                            FTD Conversions
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                            mr: isSmallScreen ? 1 : 2,
                            width: isSmallScreen ? 40 : 56,
                            height: isSmallScreen ? 40 : 56,
                          }}
                        >
                          <TrendingUpIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant={isSmallScreen ? 'h6' : 'h4'}
                            sx={{
                              fontWeight: 'bold',
                              background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}>
                            {agentMetrics.averageQuality}
                          </Typography>
                          <Typography variant={isSmallScreen ? 'caption' : 'body2'} color="text.secondary">
                            Avg Quality Score
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Agent Performance Chart */}
                <Grid item xs={12} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardHeader
                      title="My Performance Trend"
                      titleTypographyProps={{ variant: isSmallScreen ? 'h6' : 'h5', fontWeight: 'bold' }}
                      sx={{ p: isSmallScreen ? 1.5 : 2 }}
                    />
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <Box sx={{ height: isSmallScreen ? 250 : 400 }}>
                        <Line
                          data={chartData}
                          options={{
                            ...chartOptions,
                            elements: {
                              line: {
                                tension: 0.4,
                              },
                              point: {
                                radius: 4,
                                borderWidth: 2,
                                backgroundColor: theme.palette.background.paper,
                              },
                            },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Detailed Performance Table */}
                <Grid item xs={12} component={motion.div} variants={itemVariants}>
                  <Card sx={cardStyle}>
                    <CardHeader title="Daily Performance Records" />
                    <CardContent sx={{ p: isSmallScreen ? 1.5 : 2 }}>
                      <TableContainer component={Paper}>
                        <Table size={isSmallScreen ? 'small' : 'medium'}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Calls Made</TableCell>
                              <TableCell>Earnings</TableCell>
                              <TableCell>FTDs</TableCell>
                              <TableCell>Fillers</TableCell>
                              <TableCell>Quality Score</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {agentPerformance.map((record, index) => (
                              <TableRow
                                key={record._id}
                                component={motion.tr}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                sx={{
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  },
                                }}
                              >
                                <TableCell>
                                  <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
                                    {new Date(record.date).toLocaleDateString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
                                    {record.metrics?.callsMade || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
                                    ${record.metrics?.earnings || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
                                    {record.metrics?.ftdCount || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant={isSmallScreen ? 'body2' : 'body1'}>
                                    {record.metrics?.fillerCount || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={record.metrics?.averageCallQuality || 0}
                                    color={
                                      (record.metrics?.averageCallQuality || 0) >= 4 ? 'success' :
                                        (record.metrics?.averageCallQuality || 0) >= 3 ? 'warning' : 'error'
                                    }
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
                </Grid>
              </>
            )}
          </Grid>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default PerformancePage;