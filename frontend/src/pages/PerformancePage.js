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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
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
  Tooltip,
  Legend,
  ArcElement
);

const PerformancePage = () => {
  const user = useSelector(selectUser);

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

  // Fetch performance data
  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));
      const startDateStr = startDate.toISOString().split('T')[0];

      // Fetch different data based on user role
      const promises = [];

      if (user?.role === 'admin') {
        // Admin can see all data
        promises.push(
          api.get(`/users/performance/team-stats?date=${today}`),
          api.get(`/users/performance/top?period=${selectedPeriod}&limit=10`),
          api.get('/leads/stats'),
          api.get(`/orders/stats?startDate=${startDateStr}&endDate=${today}`)
        );
      } else if (user?.role === 'agent') {
        // Agent can only see their own performance
        // Ensure user.id is available before making the call
        if (user && user.id) {
          promises.push(
            // FIX: The URL now matches the backend route '/users/agents/:agentId/performance'
            api.get(`/users/agents/${user.id}/performance?startDate=${startDateStr}&endDate=${today}`)
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

      // Generate chart data
      generateChartData();

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data for trends
  const generateChartData = () => {
    // Generate last 7 days for demo
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

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Lead distribution chart data
  const leadDistributionData = leadStats ? {
    labels: ['FTD', 'Filler', 'Cold'],
    datasets: [
      {
        data: [
          leadStats.leads.ftd.total,
          leadStats.leads.filler.total,
          leadStats.leads.cold.total,
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
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
      <Box>
        <Alert severity="error">
          You don't have permission to access performance analytics.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {user?.role === 'agent' ? 'My Performance' : 'Performance Analytics'}
        </Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={selectedPeriod}
            label="Period"
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Admin Dashboard */}
          {user?.role === 'admin' && (
            <>
              {/* Key Metrics Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <PeopleIcon color="primary" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          {teamStats?.totalAgents || 0}
                        </Typography>
                        <Typography color="textSecondary">
                          Active Agents
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <PhoneIcon color="info" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          {teamStats?.totalCalls || 0}
                        </Typography>
                        <Typography color="textSecondary">
                          Total Calls Today
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <MoneyIcon color="success" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          ${teamStats?.totalEarnings || 0}
                        </Typography>
                        <Typography color="textSecondary">
                          Total Earnings
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <TrendingUpIcon color="warning" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          {teamStats?.averageCallQuality || 0}
                        </Typography>
                        <Typography color="textSecondary">
                          Avg Call Quality
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Lead Distribution Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Lead Distribution" />
                  <CardContent>
                    {leadDistributionData ? (
                      <Box sx={{ height: 300 }}>
                        <Doughnut data={leadDistributionData} />
                      </Box>
                    ) : (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Trend Chart */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Performance Trend" />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <Line data={chartData} options={chartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Performers Table */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Top Performers"
                    avatar={<TrophyIcon color="warning" />}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Rank</TableCell>
                            <TableCell>Agent</TableCell>
                            <TableCell>Calls</TableCell>
                            <TableCell>Earnings</TableCell>
                            <TableCell>FTDs</TableCell>
                            <TableCell>Fillers</TableCell>
                            <TableCell>Quality</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topPerformers.map((performer, index) => (
                            <TableRow key={performer._id}>
                              <TableCell>
                                <Chip
                                  label={`#${index + 1}`}
                                  color={index === 0 ? 'warning' : index === 1 ? 'default' : 'primary'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                    {performer.agent?.fourDigitCode || performer.agent?.fullName?.[0]}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {performer.agent?.fullName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {performer.agent?.fourDigitCode}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>{performer.totalCalls}</TableCell>
                              <TableCell>${performer.totalEarnings}</TableCell>
                              <TableCell>{performer.totalFTDs}</TableCell>
                              <TableCell>{performer.totalFillers}</TableCell>
                              <TableCell>
                                <Chip
                                  label={performer.averageCallQuality}
                                  color={performer.averageCallQuality >= 4 ? 'success' :
                                    performer.averageCallQuality >= 3 ? 'warning' : 'error'}
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

              {/* Lead Stats Summary */}
              {leadStats && (
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Lead Statistics" />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center" p={2}>
                            <Typography variant="h5" color="primary">
                              {leadStats.leads.ftd.total}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total FTD Leads
                            </Typography>
                            <Typography variant="caption">
                              {leadStats.leads.ftd.assigned} assigned, {leadStats.leads.ftd.available} available
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center" p={2}>
                            <Typography variant="h5" color="secondary">
                              {leadStats.leads.filler.total}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total Filler Leads
                            </Typography>
                            <Typography variant="caption">
                              {leadStats.leads.filler.assigned} assigned, {leadStats.leads.filler.available} available
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center" p={2}>
                            <Typography variant="h5" color="info.main">
                              {leadStats.leads.cold.total}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total Cold Leads
                            </Typography>
                            <Typography variant="caption">
                              {leadStats.leads.cold.assigned} assigned, {leadStats.leads.cold.available} available
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box textAlign="center" p={2}>
                            <Typography variant="h5" color="text.primary">
                              {leadStats.leads.overall.total}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total Leads
                            </Typography>
                            <Typography variant="caption">
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
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <PhoneIcon color="primary" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          {agentMetrics.totalCalls}
                        </Typography>
                        <Typography color="textSecondary">
                          Total Calls
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <MoneyIcon color="success" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          ${agentMetrics.totalEarnings}
                        </Typography>
                        <Typography color="textSecondary">
                          Total Earnings
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <TrendingUpIcon color="info" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          {agentMetrics.totalFTDs}
                        </Typography>
                        <Typography color="textSecondary">
                          FTD Conversions
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <TrophyIcon color="warning" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="h4">
                          {agentMetrics.averageQuality}
                        </Typography>
                        <Typography color="textSecondary">
                          Avg Quality Score
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Agent Performance Chart */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="My Performance Trend" />
                  <CardContent>
                    <Box sx={{ height: 400 }}>
                      <Line data={chartData} options={chartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Detailed Performance Table */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Daily Performance Records" />
                  <CardContent>
                    <TableContainer>
                      <Table>
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
                          {agentPerformance.map((record) => (
                            <TableRow key={record._id}>
                              <TableCell>
                                {new Date(record.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{record.metrics?.callsMade || 0}</TableCell>
                              <TableCell>${record.metrics?.earnings || 0}</TableCell>
                              <TableCell>{record.metrics?.ftdCount || 0}</TableCell>
                              <TableCell>{record.metrics?.fillerCount || 0}</TableCell>
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
    </Box>
  );
};

export default PerformancePage; 