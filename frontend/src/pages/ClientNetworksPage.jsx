import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Alert,
  Collapse,
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

// Validation schemas
const clientNetworkSchema = yup.object({
  name: yup.string().required('Name is required').max(100, 'Name must be less than 100 characters'),
  description: yup.string().max(500, 'Description must be less than 500 characters'),
  assignedAffiliateManagers: yup.array().of(yup.string()),
});

const ClientNetworksPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector(selectUser);

  // State
  const [clientNetworks, setClientNetworks] = useState([]);
  const [affiliateManagers, setAffiliateManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [viewingNetwork, setViewingNetwork] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  
  // Notification
  const [notification, setNotification] = useState({ message: '', severity: 'info' });

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(clientNetworkSchema),
    defaultValues: {
      name: '',
      description: '',
      assignedAffiliateManagers: [],
    },
  });

  // Fetch data
  const fetchClientNetworks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(showActiveOnly && { isActive: 'true' }),
      });

      const response = await api.get(`/client-networks?${params}`);
      setClientNetworks(response.data.data);
      setTotalCount(response.data.pagination.total);
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to fetch client networks',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, showActiveOnly]);

  const fetchAffiliateManagers = useCallback(async () => {
    try {
      const response = await api.get('/users?role=affiliate_manager');
      setAffiliateManagers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch affiliate managers:', error);
    }
  }, []);

  useEffect(() => {
    fetchClientNetworks();
  }, [fetchClientNetworks]);

  useEffect(() => {
    fetchAffiliateManagers();
  }, [fetchAffiliateManagers]);

  // Handlers
  const handleOpenDialog = (network = null) => {
    setEditingNetwork(network);
    if (network) {
      reset({
        name: network.name,
        description: network.description || '',
        assignedAffiliateManagers: network.assignedAffiliateManagers?.map(manager => manager._id) || [],
      });
    } else {
      reset({
        name: '',
        description: '',
        assignedAffiliateManagers: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNetwork(null);
    reset();
  };

  const handleViewNetwork = (network) => {
    setViewingNetwork(network);
    setOpenViewDialog(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingNetwork) {
        await api.put(`/client-networks/${editingNetwork._id}`, data);
        setNotification({ message: 'Client network updated successfully!', severity: 'success' });
      } else {
        await api.post('/client-networks', data);
        setNotification({ message: 'Client network created successfully!', severity: 'success' });
      }
      
      handleCloseDialog();
      fetchClientNetworks();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to save client network',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (networkId) => {
    if (!window.confirm('Are you sure you want to delete this client network?')) {
      return;
    }

    try {
      await api.delete(`/client-networks/${networkId}`);
      setNotification({ message: 'Client network deleted successfully!', severity: 'success' });
      fetchClientNetworks();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to delete client network',
        severity: 'error',
      });
    }
  };

  const handleToggleActive = async (network) => {
    try {
      await api.put(`/client-networks/${network._id}`, {
        isActive: !network.isActive,
      });
      setNotification({
        message: `Client network ${!network.isActive ? 'activated' : 'deactivated'} successfully!`,
        severity: 'success',
      });
      fetchClientNetworks();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to update client network status',
        severity: 'error',
      });
    }
  };

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. Only admins can manage client networks.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>Client Networks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? 'small' : 'medium'}
        >
          Add Network
        </Button>
      </Box>

      {/* Notification */}
      {notification.message && (
        <Collapse in={!!notification.message}>
          <Alert
            severity={notification.severity}
            sx={{ mb: 2 }}
            onClose={() => setNotification({ message: '', severity: 'info' })}
          >
            {notification.message}
          </Alert>
        </Collapse>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            label="Search networks..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                color="primary"
              />
            }
            label="Active only"
          />
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Assigned Managers</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : clientNetworks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No client networks found</TableCell>
              </TableRow>
            ) : (
              clientNetworks.map((network) => (
                <TableRow key={network._id}>
                  <TableCell>
                    <Typography variant="subtitle2">{network.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {network.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {network.assignedAffiliateManagers?.length > 0 ? (
                        network.assignedAffiliateManagers.map((manager) => (
                          <Chip
                            key={manager._id}
                            label={manager.fullName}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No managers assigned
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={network.isActive ? 'Active' : 'Inactive'}
                      color={network.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(network.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewNetwork(network)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(network)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={network.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(network)}
                        color={network.isActive ? 'warning' : 'success'}
                      >
                        <PersonAddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(network._id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingNetwork ? 'Edit Client Network' : 'Create Client Network'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Network Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />

              <Controller
                name="assignedAffiliateManagers"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Assigned Affiliate Managers</InputLabel>
                    <Select
                      {...field}
                      multiple
                      input={<OutlinedInput label="Assigned Affiliate Managers" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((managerId) => {
                            const manager = affiliateManagers.find(m => m._id === managerId);
                            return (
                              <Chip
                                key={managerId}
                                label={manager?.fullName || managerId}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {affiliateManagers.map((manager) => (
                        <MenuItem key={manager._id} value={manager._id}>
                          {manager.fullName} ({manager.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingNetwork ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Client Network Details</DialogTitle>
        <DialogContent>
          {viewingNetwork && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>{viewingNetwork.name}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {viewingNetwork.description || 'No description provided'}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Assigned Affiliate Managers:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                {viewingNetwork.assignedAffiliateManagers?.length > 0 ? (
                  viewingNetwork.assignedAffiliateManagers.map((manager) => (
                    <Chip
                      key={manager._id}
                      label={`${manager.fullName} (${manager.email})`}
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No managers assigned
                  </Typography>
                )}
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Client Brokers:
              </Typography>
              <Box>
                {viewingNetwork.clientBrokers?.length > 0 ? (
                  viewingNetwork.clientBrokers.map((broker, index) => (
                    <Chip
                      key={index}
                      label={broker.domain ? `${broker.name} (${broker.domain})` : broker.name}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      color={broker.isActive ? 'primary' : 'default'}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No brokers configured
                  </Typography>
                )}
              </Box>

              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Status: <Chip label={viewingNetwork.isActive ? 'Active' : 'Inactive'} size="small" />
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Created: {new Date(viewingNetwork.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created by: {viewingNetwork.createdBy?.fullName || 'Unknown'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientNetworksPage;