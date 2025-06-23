import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Phone as PhoneIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  PersonAdd as PersonAddIcon,
  AssignmentTurnedIn as AssignedIcon,
  AssignmentReturn as UnassignedIcon,
} from '@mui/icons-material';
import { selectUser } from '../store/slices/authSlice';
import api from '../services/api';

// --- Constants ---
const USER_ROLES = {
  ADMIN: 'admin',
  AFFILIATE_MANAGER: 'affiliate_manager',
  AGENT: 'agent',
};

// --- Helper Functions ---

/**
 * Returns a color based on the entity status.
 * @param {string} status - The status string.
 * @returns {string} A MUI color string.
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'active':
    case 'contacted':
    case 'completed':
      return 'success';
    case 'pending':
    case 'new':
      return 'warning';
    case 'cancelled':
    case 'not_interested':
      return 'error';
    default:
      return 'default';
  }
};

// --- Memoized UI Sub-components ---

const WelcomeHeader = React.memo(({ name }) => {
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        {greeting}, {name}!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Welcome to your dashboard. Here's what's happening today.
      </Typography>
    </Paper>
  );
});

const StatCard = React.memo(({ title, value, subtitle, icon, avatarBgColor }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: avatarBgColor, mr: 2, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  </Grid>
));

const RecentActivity = React.memo(({ title, activity, userRole }) => (
  <Card elevation={2}>
    <CardHeader title={title} titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
    <CardContent>
      {activity.length > 0 ? (
        <List sx={{ p: 0 }}>
          {activity.map((item, index) => (
            <ListItem key={item._id} divider={index < activity.length - 1} sx={{ px: 0 }}>
              <ListItemText
                primary={
                  userRole === USER_ROLES.AGENT
                    ? `${item.firstName} ${item.lastName}`
                    : `Order #${item._id.slice(-6)}`
                }
                secondary={
                  userRole === USER_ROLES.AGENT
                    ? `${item.leadType} • ${item.email}`
                    : `FTD: ${item.requests?.ftd || 0}, Filler: ${item.requests?.filler || 0}, Cold: ${item.requests?.cold || 0}, Live: ${item.requests?.live || 0}`
                }
              />
              <Chip
                label={item.status}
                color={getStatusColor(item.status)}
                size="small"
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Box textAlign="center" py={4}>
          <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            No recent activity to display.
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
));

// --- Role-Specific Dashboard Views ---

const AdminDashboard = React.memo(({ data }) => {
  const pendingOrdersCount = React.useMemo(() =>
    data.recentActivity?.filter(order => order.status === 'pending').length || 0,
    [data.recentActivity]
  );

  const leadTypes = React.useMemo(() =>
    data.leadsStats?.leads ? Object.entries(data.leadsStats.leads).filter(([type]) => type !== 'overall') : [],
    [data.leadsStats]
  );

  return (
    <Grid container spacing={3}>
      <StatCard title="Total Users" value={data.usersStats?.total || 0} icon={<PeopleIcon />} avatarBgColor="primary.main" />
      <StatCard
        title="Total Leads"
        value={data.leadsStats?.leads?.overall?.total || 0}
        subtitle={`${data.leadsStats?.leads?.overall?.assigned || 0} assigned`}
        icon={<AssignmentIcon />}
        avatarBgColor="success.main"
      />
      <StatCard title="Active Agents" value={data.usersStats?.activeAgents || 0} icon={<PersonAddIcon />} avatarBgColor="info.main" />
      <StatCard title="Available Leads" value={data.leadsStats?.leads?.overall?.available || 0} icon={<UnassignedIcon />} avatarBgColor="warning.main" />

      <Grid item xs={12}>
        <Card elevation={2}>
          <CardHeader title="Lead Distribution by Type" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
          <CardContent>
            <Grid container spacing={3}>
              {leadTypes.map(([type, stats]) => (
                <Grid item xs={12} sm={6} md={3} key={type}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{stats.total || 0}</Typography>
                    <Typography variant="subtitle1" sx={{ mb: 2, textTransform: 'uppercase', fontWeight: 500 }}>{type} Leads</Typography>
                    <Box display="flex" justifyContent="space-around">
                      <Box textAlign="center">
                        <Typography variant="body2" color="text.secondary">Assigned</Typography>
                        <Typography variant="h6" color="success.main">{stats.assigned || 0}</Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="body2" color="text.secondary">Available</Typography>
                        <Typography variant="h6" color="warning.main">{stats.available || 0}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ height: '100%' }}>
          <CardHeader title="Top Performers Today" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
          <CardContent>
            {data.performance?.length > 0 ? (
              <List sx={{ p: 0 }}>
                {data.performance.slice(0, 5).map((performer, index) => (
                  <ListItem key={performer._id} divider={index < 4} sx={{ px: 0 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'grey.300', color: 'text.primary' }}>{index + 1}</Avatar>
                    <ListItemText primary={<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{performer.fullName}</Typography>} secondary={`${performer.totalCalls} calls • $${performer.totalEarnings}`} />
                    <Chip label={`${performer.successRate}% success`} color="success" size="small" variant="outlined" />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">No performance data available for today.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card elevation={2} sx={{ height: '100%' }}>
          <CardHeader title="System Overview" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
          <CardContent>
            <Stack spacing={2} divider={<Divider />}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center"><AssignedIcon sx={{ mr: 1.5, color: 'success.main' }} /> Assigned Leads</Box>
                <Typography variant="h6" color="success.main">{data.leadsStats?.leads?.overall?.assigned || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center"><UnassignedIcon sx={{ mr: 1.5, color: 'warning.main' }} /> Available Leads</Box>
                <Typography variant="h6" color="warning.main">{data.leadsStats?.leads?.overall?.available || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center"><PendingIcon sx={{ mr: 1.5, color: 'info.main' }} /> Pending Orders</Box>
                <Typography variant="h6" color="info.main">{pendingOrdersCount}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center"><CheckCircleIcon sx={{ mr: 1.5, color: 'primary.main' }} /> Active Agents</Box>
                <Typography variant="h6" color="primary.main">{data.usersStats?.activeAgents || 0}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <RecentActivity title="Recent Orders" activity={data.recentActivity} userRole={USER_ROLES.ADMIN} />
      </Grid>
    </Grid>
  );
});

const AgentDashboard = React.memo(({ data }) => (
  <Grid container spacing={3}>
    <StatCard title="Assigned Leads" value={data.leadsStats?.assigned || 0} icon={<AssignmentIcon />} avatarBgColor="primary.main" />
    <StatCard title="Calls Today" value={data.performance?.totalCalls || 0} icon={<PhoneIcon />} avatarBgColor="success.main" />
    <StatCard title="Earnings Today" value={`$${data.performance?.totalEarnings || 0}`} icon={<MoneyIcon />} avatarBgColor="info.main" />

    <Grid item xs={12}>
      <Card>
        <CardHeader title="Today's Performance" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>Call Success Rate</Typography>
              <Box display="flex" alignItems="center">
                <LinearProgress variant="determinate" value={data.performance?.successRate || 0} sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }} />
                <Typography variant="body2">{data.performance?.successRate || 0}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>Daily Goal Progress</Typography>
              <Box display="flex" alignItems="center">
                <LinearProgress variant="determinate" value={data.performance?.goalProgress || 0} sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }} />
                <Typography variant="body2">{data.performance?.goalProgress || 0}%</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <RecentActivity title="Recent Assigned Leads" activity={data.recentActivity} userRole={USER_ROLES.AGENT} />
    </Grid>
  </Grid>
));

const AffiliateManagerDashboard = React.memo(({ data }) => (
  <Grid container spacing={3}>
    <StatCard title="Assigned Leads" value={data.leadsStats?.assigned || 0} icon={<AssignmentIcon />} avatarBgColor="primary.main" />
    {/* Add more affiliate-specific stat cards here if needed */}
    <Grid item xs={12}>
      <RecentActivity title="Recent Orders" activity={data.recentActivity} userRole={USER_ROLES.AFFILIATE_MANAGER} />
    </Grid>
  </Grid>
));


// --- Main Dashboard Component ---

const DashboardPage = () => {
  const user = useSelector(selectUser);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [dashboardData, setDashboardData] = React.useState(null);

  const fetchDashboardData = React.useCallback(async () => {
    // Ensure user object and role are loaded before making calls.
    if (!user || !user.id || !user.role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const promises = [];
      const { role, id } = user;

      // Backend should always authorize these requests against the user's session/token.
      // This front-end logic is for UI purposes only.
      if (role === USER_ROLES.ADMIN) {
        promises.push(
          api.get('/leads/stats'),
          api.get('/users/stats'),
          api.get('/orders?limit=5'),
          api.get('/users/top-performers')
        );
      } else if (role === USER_ROLES.AFFILIATE_MANAGER) {
        promises.push(
          api.get('/orders?limit=10'),
          api.get('/leads?isAssigned=true'),
          api.get('/orders/stats')
        );
      } else if (role === USER_ROLES.AGENT) {
        promises.push(
          api.get('/leads/assigned'),
          api.get(`/users/${id}/performance`)
        );
      }

      const responses = await Promise.allSettled(promises);

      const firstRejected = responses.find(res => res.status === 'rejected');
      if (firstRejected) {
        throw new Error(firstRejected.reason.response?.data?.message || 'Failed to fetch some dashboard data');
      }

      const extractedData = responses.map(res => res.value?.data?.data);
      const data = {};

      if (role === USER_ROLES.ADMIN) {
        data.leadsStats = extractedData[0];
        data.usersStats = extractedData[1];
        data.recentActivity = extractedData[2] || [];
        data.performance = extractedData[3];
      } else if (role === USER_ROLES.AFFILIATE_MANAGER) {
        data.recentActivity = extractedData[0] || [];
        data.leadsStats = { assigned: extractedData[1]?.length || 0 };
        data.ordersStats = extractedData[2];
      } else if (role === USER_ROLES.AGENT) {
        const assignedLeads = extractedData[0] || [];
        data.leadsStats = { assigned: assignedLeads.length };
        data.recentActivity = assignedLeads.slice(0, 5);
        data.performance = extractedData[1];
      }

      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  const renderDashboardByRole = () => {
    if (!dashboardData) return null;

        switch (user.role) {
      case USER_ROLES.ADMIN:
        return <AdminDashboard data={dashboardData} />;
      case USER_ROLES.AGENT:
        return <AgentDashboard data={dashboardData} />;
      case USER_ROLES.AFFILIATE_MANAGER:
        return <AffiliateManagerDashboard data={dashboardData} />;
      default:
        return <Alert severity="warning">No dashboard view available for your role.</Alert>;
    }
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', p: 3 }}>
      <WelcomeHeader name={user?.fullName || user?.email} />
      {renderDashboardByRole()}
    </Box>
  );
};

export default DashboardPage;