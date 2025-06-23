import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
  PlayArrow as InjectIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as SkipNextIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import { selectUser } from '../store/slices/authSlice';
import { getSortedCountries } from '../constants/countries';
import LeadDetailCard from '../components/LeadDetailCard';

// --- Best Practice: Define constants and schemas outside the component ---
// This prevents them from being recreated on every render.

// Function to create validation schema based on user role
const createOrderSchema = (userRole) => {
  return yup.object({
    ftd: yup.number().min(0, 'Must be 0 or greater').integer('Must be a whole number').default(0),
    filler: yup.number().min(0, 'Must be 0 or greater').integer('Must be a whole number').default(0),
    cold: yup.number().min(0, 'Must be 0 or greater').integer('Must be a whole number').default(0),
    live: yup.number().min(0, 'Must be 0 or greater').integer('Must be a whole number').default(0),
    priority: yup.string().oneOf(['low', 'medium', 'high']).default('medium'),
    countryFilter: yup.string().required('Country filter is required').min(2, 'Country must be at least 2 characters'),
    genderFilter: yup.string().oneOf(['', 'male', 'female']).default(''),
    notes: yup.string().default(''),
    selectedClientNetwork: userRole === 'affiliate_manager'
      ? yup.string().required('Client network selection is required')
      : yup.string().default(''),
    // Injection settings
    injectionMode: yup.string().oneOf(['bulk', 'scheduled']).default('bulk'),
    injectionStartTime: yup.string().default(''),
    injectionEndTime: yup.string().default(''),
    // Device configuration fields
    deviceSelectionMode: yup.string().oneOf(['individual', 'bulk', 'ratio', 'random']).default('random'),
    bulkDeviceType: yup.string().oneOf(['windows', 'android', 'ios', 'mac']).default('android'),
    deviceRatio: yup.object({
      windows: yup.number().min(0, 'Must be 0 or greater').max(10, 'Must be 10 or less').integer('Must be a whole number').default(0),
      android: yup.number().min(0, 'Must be 0 or greater').max(10, 'Must be 10 or less').integer('Must be a whole number').default(0),
      ios: yup.number().min(0, 'Must be 0 or greater').max(10, 'Must be 10 or less').integer('Must be a whole number').default(0),
      mac: yup.number().min(0, 'Must be 0 or greater').max(10, 'Must be 10 or less').integer('Must be a whole number').default(0),
    }),
    availableDeviceTypes: yup.object({
      windows: yup.boolean().default(true),
      android: yup.boolean().default(true),
      ios: yup.boolean().default(true),
      mac: yup.boolean().default(true),
    }),
    // Device specifications
    deviceSpecs: yup.object({
      // Hardware specifications
      memoryMin: yup.number().min(1, 'Must be at least 1 GB').max(128, 'Must be 128 GB or less').default(4),
      memoryMax: yup.number().min(1, 'Must be at least 1 GB').max(128, 'Must be 128 GB or less').default(16),
      cpuCoresMin: yup.number().min(1, 'Must be at least 1 core').max(32, 'Must be 32 cores or less').default(2),
      cpuCoresMax: yup.number().min(1, 'Must be at least 1 core').max(32, 'Must be 32 cores or less').default(8),
      storageMin: yup.number().min(16, 'Must be at least 16 GB').max(4096, 'Must be 4096 GB or less').default(64),
      storageMax: yup.number().min(16, 'Must be at least 16 GB').max(4096, 'Must be 4096 GB or less').default(512),
      // Display specifications
      screenWidthMin: yup.number().min(800, 'Must be at least 800px').max(7680, 'Must be 7680px or less').default(1280),
      screenWidthMax: yup.number().min(800, 'Must be at least 800px').max(7680, 'Must be 7680px or less').default(1920),
      screenHeightMin: yup.number().min(600, 'Must be at least 600px').max(4320, 'Must be 4320px or less').default(720),
      screenHeightMax: yup.number().min(600, 'Must be at least 600px').max(4320, 'Must be 4320px or less').default(1080),
      pixelRatioMin: yup.number().min(0.5, 'Must be at least 0.5').max(4, 'Must be 4 or less').default(1),
      pixelRatioMax: yup.number().min(0.5, 'Must be at least 0.5').max(4, 'Must be 4 or less').default(2),
      // OS and browser preferences
      windowsVersions: yup.array().of(yup.string()).default([]),
      androidVersions: yup.array().of(yup.string()).default([]),
      iosVersions: yup.array().of(yup.string()).default([]),
      macVersions: yup.array().of(yup.string()).default([]),
      androidManufacturers: yup.array().of(yup.string()).default([]),
      cpuArchitectures: yup.array().of(yup.string()).default([]),
      cpuBrands: yup.array().of(yup.string()).default([]),
      storageTypes: yup.array().of(yup.string()).default([]),
      browserTypes: yup.array().of(yup.string()).default([]),
      colorDepths: yup.array().of(yup.number()).default([]),
      connectionTypes: yup.array().of(yup.string()).default([]),
      // Device characteristics
      touchSupport: yup.string().oneOf(['required', 'optional', 'disabled']).default('optional'),
      cameraSupport: yup.string().oneOf(['required', 'optional', 'disabled']).default('optional'),
      microphoneSupport: yup.string().oneOf(['required', 'optional', 'disabled']).default('optional'),
      locationSupport: yup.string().oneOf(['required', 'optional', 'disabled']).default('optional'),
    }).default({}),
  }).test('at-least-one', 'At least one lead type must be requested', (value) => {
    return (value.ftd || 0) + (value.filler || 0) + (value.cold || 0) + (value.live || 0) > 0;
  }).test('device-ratio', 'At least one device ratio must be greater than 0 for ratio mode', (value) => {
    if (value.deviceSelectionMode === 'ratio') {
      return Object.values(value.deviceRatio || {}).some(ratio => ratio > 0);
    }
    return true;
  }).test('available-devices', 'At least one device type must be selected for random mode', (value) => {
    if (value.deviceSelectionMode === 'random') {
      return Object.values(value.availableDeviceTypes || {}).some(enabled => enabled);
    }
    return true;
  }).test('bulk-device', 'Device type is required for bulk mode', (value) => {
    if (value.deviceSelectionMode === 'bulk') {
      return value.bulkDeviceType && value.bulkDeviceType.trim() !== '';
    }
    return true;
  }).test('memory-range', 'Memory max must be greater than or equal to memory min', (value) => {
    const specs = value.deviceSpecs || {};
    return (specs.memoryMax || 16) >= (specs.memoryMin || 4);
  }).test('cpu-range', 'CPU cores max must be greater than or equal to CPU cores min', (value) => {
    const specs = value.deviceSpecs || {};
    return (specs.cpuCoresMax || 8) >= (specs.cpuCoresMin || 2);
  }).test('storage-range', 'Storage max must be greater than or equal to storage min', (value) => {
    const specs = value.deviceSpecs || {};
    return (specs.storageMax || 512) >= (specs.storageMin || 64);
  }).test('screen-width-range', 'Screen width max must be greater than or equal to screen width min', (value) => {
    const specs = value.deviceSpecs || {};
    return (specs.screenWidthMax || 1920) >= (specs.screenWidthMin || 1280);
  }).test('screen-height-range', 'Screen height max must be greater than or equal to screen height min', (value) => {
    const specs = value.deviceSpecs || {};
    return (specs.screenHeightMax || 1080) >= (specs.screenHeightMin || 720);
  }).test('pixel-ratio-range', 'Pixel ratio max must be greater than or equal to pixel ratio min', (value) => {
    const specs = value.deviceSpecs || {};
    return (specs.pixelRatioMax || 2) >= (specs.pixelRatioMin || 1);
  });
};

// Helper functions for status/priority colors
const getStatusColor = (status) => {
  const colors = {
    fulfilled: 'success',
    pending: 'warning',
    cancelled: 'error',
    partial: 'info',
  };
  return colors[status] || 'default';
};

const getPriorityColor = (priority) => {
  const colors = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  };
  return colors[priority] || 'default';
};

// --- Optimization: Custom hook for debouncing input ---
// This prevents rapid API calls while the user is typing in filters.
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


// --- Suggestion: This component is large. Consider splitting it into smaller components: ---
// - OrderFilters.jsx
// - OrderTable.jsx
// - OrderTableRow.jsx (to handle row logic and expansion)
// - CreateOrderDialog.jsx
// - ViewOrderDialog.jsx

const OrdersPage = () => {
  const user = useSelector(selectUser);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', severity: 'info' });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);


  // Injection states
  const [injectionStatus, setInjectionStatus] = useState({});
  const [isInjecting, setIsInjecting] = useState({});

  // Client networks state
  const [clientNetworks, setClientNetworks] = useState([]);
  const [loadingClientNetworks, setLoadingClientNetworks] = useState(false);

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
  });
  const debouncedFilters = useDebounce(filters, 500); // Debounce filter state
  const [showFilters, setShowFilters] = useState(false);

  // --- Bug Fix: Use an object to store data for each expanded row individually ---
  const [expandedRowData, setExpandedRowData] = useState({});

  // State for individual lead expansion within orders
  const [expandedLeads, setExpandedLeads] = useState({});



  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createOrderSchema(user?.role)),
    defaultValues: {
      ftd: 0,
      filler: 0,
      cold: 0,
      live: 0,
      priority: 'medium',
      countryFilter: '',
      genderFilter: '',
      notes: '',
      selectedClientNetwork: '',
      injectionMode: 'bulk',
      injectionStartTime: '',
      injectionEndTime: '',
      deviceSelectionMode: 'random',
      bulkDeviceType: 'android',
      deviceRatio: {
        windows: 0,
        android: 0,
        ios: 0,
        mac: 0,
      },
      availableDeviceTypes: {
        windows: true,
        android: true,
        ios: true,
        mac: true,
      },
      deviceSpecs: {
        memoryMin: 4,
        memoryMax: 16,
        cpuCoresMin: 2,
        cpuCoresMax: 8,
        storageMin: 64,
        storageMax: 512,
        screenWidthMin: 1280,
        screenWidthMax: 1920,
        screenHeightMin: 720,
        screenHeightMax: 1080,
        pixelRatioMin: 1,
        pixelRatioMax: 2,
        windowsVersions: [],
        androidVersions: [],
        iosVersions: [],
        macVersions: [],
        androidManufacturers: [],
        cpuArchitectures: [],
        cpuBrands: [],
        storageTypes: [],
        browserTypes: [],
        colorDepths: [],
        connectionTypes: [],
        touchSupport: 'optional',
        cameraSupport: 'optional',
        microphoneSupport: 'optional',
        locationSupport: 'optional',
      },
    },
  });

  // Manual FTD injection state
  const [manualFTDDialog, setManualFTDDialog] = useState({
    open: false,
    order: null,
    lead: null,
    step: 'confirm'
  });
  const [manualFTDDomain, setManualFTDDomain] = useState('');
  const [processingLeads, setProcessingLeads] = useState({});

  // --- Optimization: `useCallback` to memoize functions ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setNotification({ message: '', severity: 'info' });
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
      });

      // Append non-empty filter values from the debounced state
      Object.entries(debouncedFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await api.get(`/orders?${params}`);
      setOrders(response.data.data);
      setTotalOrders(response.data.pagination.total);
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || 'Failed to fetch orders',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedFilters]);

  // Effect for fetching orders when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Effect for auto-clearing notifications
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', severity: 'info' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.message]);

  // Fetch client networks for affiliate managers
  const fetchClientNetworks = useCallback(async () => {
    if (user?.role !== 'affiliate_manager') return;

    setLoadingClientNetworks(true);
    try {
      const response = await api.get('/client-networks/my-networks');
      setClientNetworks(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch client networks:', err);
      setNotification({
        message: 'Failed to load client networks',
        severity: 'warning',
      });
    } finally {
      setLoadingClientNetworks(false);
    }
  }, [user?.role]);

  const onSubmitOrder = useCallback(async (data) => {
    try {
      // Transform availableDeviceTypes from object to array
      const availableDeviceTypesArray = Object.entries(data.availableDeviceTypes || {})
        .filter(([_, enabled]) => enabled)
        .map(([deviceType, _]) => deviceType);

      // Prepare device specifications
      const deviceSpecs = data.deviceSpecs || {};
      const deviceSpecsFormatted = {
        operatingSystem: {
          windows: {
            versions: deviceSpecs.windowsVersions || [],
            builds: [],
            editions: [],
          },
          android: {
            versions: deviceSpecs.androidVersions || [],
            apiLevels: [],
            manufacturers: deviceSpecs.androidManufacturers || [],
            models: [],
          },
          ios: {
            versions: deviceSpecs.iosVersions || [],
            devices: [],
            models: [],
          },
          mac: {
            versions: deviceSpecs.macVersions || [],
            builds: [],
            processors: [],
          },
        },
        hardware: {
          memory: {
            min: deviceSpecs.memoryMin || 4,
            max: deviceSpecs.memoryMax || 16,
            preferred: [],
          },
          cpu: {
            cores: {
              min: deviceSpecs.cpuCoresMin || 2,
              max: deviceSpecs.cpuCoresMax || 8,
            },
            architectures: deviceSpecs.cpuArchitectures || [],
            brands: deviceSpecs.cpuBrands || [],
          },
          storage: {
            min: deviceSpecs.storageMin || 64,
            max: deviceSpecs.storageMax || 512,
            types: deviceSpecs.storageTypes || [],
          },
        },
        display: {
          resolution: {
            width: {
              min: deviceSpecs.screenWidthMin || 1280,
              max: deviceSpecs.screenWidthMax || 1920,
            },
            height: {
              min: deviceSpecs.screenHeightMin || 720,
              max: deviceSpecs.screenHeightMax || 1080,
            },
          },
          pixelRatio: {
            min: deviceSpecs.pixelRatioMin || 1,
            max: deviceSpecs.pixelRatioMax || 2,
          },
          colorDepth: deviceSpecs.colorDepths || [],
        },
        browser: {
          types: deviceSpecs.browserTypes || [],
          versions: {
            chrome: { min: "100.0", max: "120.0" },
            firefox: { min: "100.0", max: "120.0" },
            safari: { min: "15.0", max: "17.0" },
            edge: { min: "100.0", max: "120.0" },
          },
        },
        network: {
          connectionTypes: deviceSpecs.connectionTypes || [],
          downlinkSpeeds: [],
        },
        locale: {
          timezones: [],
          languages: [],
          regions: [],
        },
        characteristics: {
          touchSupport: deviceSpecs.touchSupport || 'optional',
          cameraSupport: deviceSpecs.cameraSupport || 'optional',
          microphoneSupport: deviceSpecs.microphoneSupport || 'optional',
          locationSupport: deviceSpecs.locationSupport || 'optional',
        },
      };

      const orderData = {
        requests: {
          ftd: data.ftd || 0,
          filler: data.filler || 0,
          cold: data.cold || 0,
          live: data.live || 0,
        },
        priority: data.priority,
        country: data.countryFilter,
        gender: data.genderFilter,
        notes: data.notes,
        selectedClientNetwork: data.selectedClientNetwork,
        // Injection settings - automatically inject all non-FTD lead types
        injectionMode: data.injectionMode,
        injectionStartTime: data.injectionStartTime,
        injectionEndTime: data.injectionEndTime,
        injectFiller: data.filler > 0, // Auto-inject if filler leads requested
        injectCold: data.cold > 0,     // Auto-inject if cold leads requested
        injectLive: data.live > 0,     // Auto-inject if live leads requested
        injectionSettings: {
          // Device configuration
          deviceConfig: {
            selectionMode: data.deviceSelectionMode,
            bulkDeviceType: data.bulkDeviceType,
            deviceRatio: data.deviceRatio,
            availableDeviceTypes: availableDeviceTypesArray,
            deviceSpecs: deviceSpecsFormatted,
          }
        }
      };

      await api.post('/orders', orderData);
      setNotification({ message: 'Order created successfully!', severity: 'success' });
      setCreateDialogOpen(false);
      reset();
      fetchOrders(); // Refresh the list
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || 'Failed to create order',
        severity: 'error',
      });
    }
  }, [reset, fetchOrders]);

  const handleViewOrder = useCallback(async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data.data);
      setViewDialogOpen(true);
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || 'Failed to fetch order details',
        severity: 'error',
      });
    }
  }, []);

  const toggleLeadExpansion = useCallback((leadId) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  }, []);

  const expandAllLeads = useCallback((leads) => {
    const expandedState = {};
    leads.forEach(lead => {
      expandedState[lead._id] = true;
    });
    setExpandedLeads(prev => ({ ...prev, ...expandedState }));
  }, []);

  const collapseAllLeads = useCallback((leads) => {
    const collapsedState = {};
    leads.forEach(lead => {
      collapsedState[lead._id] = false;
    });
    setExpandedLeads(prev => ({ ...prev, ...collapsedState }));
  }, []);

  const handleExportLeads = useCallback(async (orderId) => {
    try {
      setNotification({ message: 'Preparing CSV export...', severity: 'info' });

      const response = await api.get(`/orders/${orderId}/export`, {
        responseType: 'blob', // Important for file downloads
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response header or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `order_${orderId}_leads_${new Date().toISOString().split('T')[0]}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setNotification({ message: 'CSV export completed successfully!', severity: 'success' });
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || 'Failed to export leads',
        severity: 'error',
      });
    }
  }, []);

  const toggleRowExpansion = useCallback(async (orderId) => {
    const isCurrentlyExpanded = !!expandedRowData[orderId];
    if (isCurrentlyExpanded) {
      // Collapse the row by removing its data
      const newExpandedData = { ...expandedRowData };
      delete newExpandedData[orderId];
      setExpandedRowData(newExpandedData);
    } else {
      // Expand the row: fetch its details and store them
      try {
        const response = await api.get(`/orders/${orderId}`);
        setExpandedRowData(prev => ({ ...prev, [orderId]: response.data.data }));
      } catch (err) {
        setNotification({
          message: 'Could not load order details for expansion.',
          severity: 'error'
        });
      }
    }
  }, [expandedRowData]);

  // Pagination handlers
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Filter handlers
  const handleFilterChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ status: '', priority: '', startDate: '', endDate: '' });
    setPage(0);
  }, []);

  // Mass client assignment functionality has been removed
  // Use individual lead assignment instead: PUT /api/leads/:id/assign-client-network

  // Mass assignment dialog handlers removed

  // Handle opening create dialog and fetching exclusion options
  const handleOpenCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
    fetchClientNetworks();
  }, [fetchClientNetworks]);

  // Injection handlers
  const handleStartInjection = useCallback(async (orderId) => {
    setIsInjecting(prev => ({ ...prev, [orderId]: true }));
    setInjectionStatus(prev => ({ ...prev, [orderId]: { success: null, message: "Starting injection..." } }));

    try {
      const response = await api.post(`/orders/${orderId}/start-injection`);
      setInjectionStatus(prev => ({ ...prev, [orderId]: { success: true, message: "Injection started successfully!" } }));
      fetchOrders(); // Refresh to show updated injection status
    } catch (err) {
      setInjectionStatus(prev => ({ ...prev, [orderId]: { success: false, message: err.response?.data?.message || "Failed to start injection" } }));
    } finally {
      setIsInjecting(prev => ({ ...prev, [orderId]: false }));
      // Clear message after 5 seconds
      setTimeout(() => {
        setInjectionStatus(prev => ({ ...prev, [orderId]: { success: null, message: "" } }));
      }, 5000);
    }
  }, [fetchOrders]);

  const handlePauseInjection = useCallback(async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/pause-injection`);
      setNotification({ message: 'Injection paused successfully!', severity: 'success' });
      fetchOrders();
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Failed to pause injection', severity: 'error' });
    }
  }, [fetchOrders]);

  const handleStopInjection = useCallback(async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/stop-injection`);
      setNotification({ message: 'Injection stopped successfully!', severity: 'success' });
      fetchOrders();
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Failed to stop injection', severity: 'error' });
    }
  }, [fetchOrders]);

  // Manual FTD injection handlers
  const handleOpenManualFTDInjection = useCallback((order, lead) => {
    // Check if this lead has already been processed
    const networkHistory = lead.clientNetworkHistory?.find(
      (history) => history.orderId?.toString() === order._id.toString()
    );

    if (networkHistory && networkHistory.injectionStatus === "completed") {
      setNotification({
        message: 'This FTD lead has already been processed',
        severity: 'warning'
      });
      return;
    }

    setManualFTDDialog({
      open: true,
      order: order,
      lead: lead,
      step: 'confirm'
    });
    setManualFTDDomain('');
  }, []);

  const handleCloseManualFTDDialog = useCallback(() => {
    // Prevent closing if we're in domain_input step and domain is required
    if (manualFTDDialog.step === 'domain_input' && !manualFTDDomain.trim()) {
      setNotification({
        message: 'Please enter the broker domain before closing. This field is mandatory.',
        severity: 'warning'
      });
      return;
    }

    setManualFTDDialog({
      open: false,
      order: null,
      lead: null,
      step: 'confirm'
    });
    setManualFTDDomain('');
  }, [manualFTDDialog.step, manualFTDDomain]);

  const handleStartManualFTDInjection = useCallback(async () => {
    const { order, lead } = manualFTDDialog;
    if (!order || !lead) return;

    setManualFTDDialog(prev => ({ ...prev, step: 'processing' }));
    setProcessingLeads(prev => ({ ...prev, [lead._id]: true }));
    setNotification({
      message: `Starting manual FTD injection for ${lead.firstName} ${lead.lastName}...`,
      severity: 'info'
    });

    try {
      // Call the backend to start manual FTD injection for specific lead
      const response = await api.post(`/orders/${order._id}/leads/${lead._id}/manual-ftd-injection-start`);

      if (response.data.success) {
        setManualFTDDialog(prev => ({ ...prev, step: 'domain_input' }));
        setNotification({
          message: 'Browser opened for manual form filling. Please fill the form manually and close the browser when done.',
          severity: 'info'
        });
      } else {
        throw new Error(response.data.message || 'Failed to start manual injection');
      }
    } catch (error) {
      console.error('Manual FTD injection start failed:', error);
      setNotification({
        message: error.response?.data?.message || 'Failed to start manual FTD injection',
        severity: 'error'
      });
      setManualFTDDialog(prev => ({ ...prev, step: 'confirm' }));
    } finally {
      setProcessingLeads(prev => ({ ...prev, [lead._id]: false }));
    }
  }, [manualFTDDialog.order, manualFTDDialog.lead]);

  const handleSubmitManualFTDDomain = useCallback(async () => {
    const { order, lead } = manualFTDDialog;
    if (!order || !lead || !manualFTDDomain.trim()) return;

    try {
      // Submit the manually entered domain to complete the FTD injection for specific lead
      await api.post(`/orders/${order._id}/leads/${lead._id}/manual-ftd-injection-complete`, {
        domain: manualFTDDomain.trim()
      });

      setNotification({
        message: `Manual FTD injection completed successfully for ${lead.firstName} ${lead.lastName}!`,
        severity: 'success'
      });

      handleCloseManualFTDDialog();
      fetchOrders(); // Refresh orders to show updated status
    } catch (error) {
      console.error('Manual FTD injection completion failed:', error);

      let errorMessage = 'Failed to complete manual FTD injection';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setNotification({
        message: errorMessage,
        severity: 'error'
      });
    }
  }, [manualFTDDialog.order, manualFTDDialog.lead, manualFTDDomain, handleCloseManualFTDDialog, fetchOrders]);



  // Readability: Helper component for rendering lead counts
  const renderLeadCounts = (label, requested, fulfilled) => (
    <Typography variant="body2">
      {label}: {requested || 0} requested, {fulfilled || 0} fulfilled
    </Typography>
  );

  return (
    <Box sx={{ p: isSmallScreen ? 2 : 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexDirection={isSmallScreen ? 'column' : 'row'}
        sx={{ mb: 3, alignItems: isSmallScreen ? 'flex-start' : 'center' }}
      >
        <Typography variant={isSmallScreen ? 'h5' : 'h4'} gutterBottom sx={{ mb: isSmallScreen ? 2 : 0 }}>
          Orders
        </Typography>
        {(user?.role === 'admin' || user?.role === 'affiliate_manager') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            size={isSmallScreen ? 'small' : 'medium'}
            sx={{ width: isSmallScreen ? '100%' : 'auto' }}
          >
            Create Order
          </Button>
        )}
      </Box>

      {/* Unified Notification Alert */}
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

      {/* Individual Injection Status Alerts */}
      {Object.entries(injectionStatus).map(([orderId, status]) => (
        status.message && (
          <Collapse key={orderId} in={!!status.message}>
            <Alert
              severity={status.success === true ? "success" : (status.success === false ? "error" : "info")}
              sx={{ mb: 1 }}
              onClose={() => setInjectionStatus(prev => ({ ...prev, [orderId]: { success: null, message: "" } }))}
            >
              <strong>Order {orderId.slice(-8)}:</strong> {status.message}
            </Alert>
          </Collapse>
        )
      ))}

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: isSmallScreen ? 1.5 : 2, '&:last-child': { pb: isSmallScreen ? 1.5 : 2 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showFilters}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={handleFilterChange('status')}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="fulfilled">Fulfilled</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select value={filters.priority} label="Priority" onChange={handleFilterChange('priority')}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth label="Start Date" type="date" value={filters.startDate} onChange={handleFilterChange('startDate')} InputLabelProps={{ shrink: true }} size="small" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth label="End Date" type="date" value={filters.endDate} onChange={handleFilterChange('endDate')} InputLabelProps={{ shrink: true }} size="small" />
              </Grid>
              <Grid item xs={12}>
                <Button onClick={clearFilters} variant="outlined" size="small">Clear Filters</Button>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table size={isSmallScreen ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Requester</TableCell>
                <TableCell>Requests (F/Fi/C/L)</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Fulfilled (F/Fi/C/L)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Injection</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Priority</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No orders found</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const isExpanded = !!expandedRowData[order._id];
                  const expandedDetails = expandedRowData[order._id];

                  return (
                    <React.Fragment key={order._id}>
                      <TableRow hover>
                        <TableCell>{order._id.slice(-8)}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{order.requester?.fullName}</TableCell>
                        <TableCell>{`${order.requests?.ftd || 0}/${order.requests?.filler || 0}/${order.requests?.cold || 0}/${order.requests?.live || 0}`}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{`${order.fulfilled?.ftd || 0}/${order.fulfilled?.filler || 0}/${order.fulfilled?.cold || 0}/${order.fulfilled?.live || 0}`}</TableCell>
                        <TableCell><Chip label={order.status} color={getStatusColor(order.status)} size="small" /></TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Chip
                            label={order.injectionSettings?.status || 'pending'}
                            color={
                              order.injectionSettings?.status === 'completed' ? 'success' :
                                order.injectionSettings?.status === 'in_progress' ? 'warning' :
                                  order.injectionSettings?.status === 'failed' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><Chip label={order.priority} color={getPriorityColor(order.priority)} size="small" /></TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleViewOrder(order._id)} title="View Order"><ViewIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleExportLeads(order._id)} title="Export Leads as CSV"><DownloadIcon fontSize="small" /></IconButton>

                          {/* Injection Controls - only for admin/affiliate managers */}
                          {(user?.role === 'admin' || user?.role === 'affiliate_manager') && (
                            <>
                              {order.injectionSettings.status === 'pending' && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartInjection(order._id)}
                                  title="Start Injection"
                                  disabled={isInjecting[order._id]}
                                  color="primary"
                                >
                                  {isInjecting[order._id] ? <CircularProgress size={16} /> : <InjectIcon fontSize="small" />}
                                </IconButton>
                              )}

                              {order.injectionSettings.status === 'in_progress' && (
                                <>
                                  <IconButton size="small" onClick={() => handlePauseInjection(order._id)} title="Pause Injection" color="warning">
                                    <PauseIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleStopInjection(order._id)} title="Stop Injection" color="error">
                                    <StopIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}

                              {/* Individual FTD injection buttons are now shown per lead in the expanded view */}
                            </>
                          )}

                          <IconButton size="small" onClick={() => toggleRowExpansion(order._id)} title={isExpanded ? "Collapse" : "Expand"}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Row with details */}
                      <TableRow>
                        <TableCell sx={{ p: 0, borderBottom: 'none' }} colSpan={9}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                              <Typography variant="h6" gutterBottom>Order Details</Typography>
                              {expandedDetails ? (
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2"><strong>Notes:</strong> {expandedDetails.notes || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Country Filter:</strong> {expandedDetails.countryFilter || 'Any'}</Typography>
                                    <Typography variant="body2"><strong>Gender Filter:</strong> {expandedDetails.genderFilter || 'Any'}</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2"><strong>Assigned Leads:</strong> {expandedDetails.leads?.length || 0}</Typography>
                                    {/* Information hidden on small screens now visible here */}
                                    <Box sx={{ display: { sm: 'none' } }}>
                                      <Typography variant="body2"><strong>Priority:</strong> {expandedDetails.priority}</Typography>
                                      <Typography variant="body2"><strong>Created:</strong> {new Date(expandedDetails.createdAt).toLocaleString()}</Typography>
                                      <Typography variant="body2"><strong>Fulfilled:</strong> {`${expandedDetails.fulfilled?.ftd || 0}/${expandedDetails.fulfilled?.filler || 0}/${expandedDetails.fulfilled?.cold || 0}/${expandedDetails.fulfilled?.live || 0}`}</Typography>
                                    </Box>
                                  </Grid>
                                  {expandedDetails.leads && expandedDetails.leads.length > 0 && (
                                    <Grid item xs={12}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2">Assigned Leads</Typography>
                                        <Button
                                          size="small"
                                          startIcon={<DownloadIcon />}
                                          onClick={() => handleExportLeads(order._id)}
                                          variant="outlined"
                                          sx={{ mr: 1 }}
                                        >
                                          Export CSV
                                        </Button>
                                        <Button
                                          size="small"
                                          onClick={() => expandAllLeads(expandedDetails.leads)}
                                          variant="outlined"
                                          sx={{ mr: 1 }}
                                        >
                                          Expand All
                                        </Button>
                                        <Button
                                          size="small"
                                          onClick={() => collapseAllLeads(expandedDetails.leads)}
                                          variant="outlined"
                                        >
                                          Collapse All
                                        </Button>
                                      </Box>
                                      <TableContainer component={Paper} elevation={2}>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Type</TableCell>
                                              <TableCell>Name</TableCell>
                                              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Country</TableCell>
                                              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                                              <TableCell>Actions</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {expandedDetails.leads.map((lead) => (
                                              <React.Fragment key={lead._id}>
                                                <TableRow>
                                                  <TableCell><Chip label={lead.leadType?.toUpperCase()} size="small" /></TableCell>
                                                  <TableCell>{lead.firstName} {lead.lastName}</TableCell>
                                                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{lead.country}</TableCell>
                                                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{lead.newEmail}</TableCell>
                                                  <TableCell>
                                                    <IconButton
                                                      size="small"
                                                      onClick={() => toggleLeadExpansion(lead._id)}
                                                      aria-label={expandedLeads[lead._id] ? 'collapse' : 'expand'}
                                                    >
                                                      {expandedLeads[lead._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                    </IconButton>

                                                    {/* Individual Manual FTD Injection Button */}
                                                    {lead.leadType === 'ftd' && (user?.role === 'admin' || user?.role === 'affiliate_manager') && (() => {
                                                      // Check if this lead has been processed
                                                      const networkHistory = lead.clientNetworkHistory?.find(
                                                        (history) => history.orderId?.toString() === order._id.toString()
                                                      );
                                                      const isCompleted = networkHistory && networkHistory.injectionStatus === "completed";
                                                      const isProcessing = processingLeads[lead._id];

                                                      // Only show button if not completed
                                                      if (!isCompleted) {
                                                        return (
                                                          <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenManualFTDInjection(order, lead)}
                                                            title={`Manual FTD Injection for ${lead.firstName} ${lead.lastName}`}
                                                            color="primary"
                                                            disabled={isProcessing}
                                                          >
                                                            {isProcessing ? <CircularProgress size={16} /> : <SendIcon fontSize="small" />}
                                                          </IconButton>
                                                        );
                                                      }

                                                      // Show completed status
                                                      return (
                                                        <Chip
                                                          label="Injected"
                                                          size="small"
                                                          color="success"
                                                          variant="outlined"
                                                        />
                                                      );
                                                    })()}
                                                  </TableCell>
                                                </TableRow>
                                                {expandedLeads[lead._id] && (
                                                  <TableRow>
                                                    <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
                                                      <Collapse in={expandedLeads[lead._id]} timeout="auto" unmountOnExit>
                                                        <Box sx={{ p: 2 }}>
                                                          <LeadDetailCard lead={lead} />
                                                        </Box>
                                                      </Collapse>
                                                    </TableCell>
                                                  </TableRow>
                                                )}
                                              </React.Fragment>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    </Grid>
                                  )}
                                </Grid>
                              ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                  <CircularProgress />
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalOrders}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Order</DialogTitle>
        <form onSubmit={handleSubmit(onSubmitOrder)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><Controller name="ftd" control={control} render={({ field }) => <TextField {...field} fullWidth label="FTD" type="number" error={!!errors.ftd} helperText={errors.ftd?.message} inputProps={{ min: 0 }} size="small" />} /></Grid>
              <Grid item xs={6} sm={3}><Controller name="filler" control={control} render={({ field }) => <TextField {...field} fullWidth label="Filler" type="number" error={!!errors.filler} helperText={errors.filler?.message} inputProps={{ min: 0 }} size="small" />} /></Grid>
              <Grid item xs={6} sm={3}><Controller name="cold" control={control} render={({ field }) => <TextField {...field} fullWidth label="Cold" type="number" error={!!errors.cold} helperText={errors.cold?.message} inputProps={{ min: 0 }} size="small" />} /></Grid>
              <Grid item xs={6} sm={3}><Controller name="live" control={control} render={({ field }) => <TextField {...field} fullWidth label="Live" type="number" error={!!errors.live} helperText={errors.live?.message} inputProps={{ min: 0 }} size="small" />} /></Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="priority" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.priority}>
                    <InputLabel>Priority</InputLabel>
                    <Select {...field} label="Priority"><MenuItem value="low">Low</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="high">High</MenuItem></Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="gender" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.gender}>
                    <InputLabel>Gender (Optional)</InputLabel>
                    <Select {...field} label="Gender (Optional)"><MenuItem value="">All</MenuItem><MenuItem value="male">Male</MenuItem><MenuItem value="female">Female</MenuItem><MenuItem value="not_defined">Not Defined</MenuItem></Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="countryFilter" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.countryFilter}>
                    <InputLabel>Country Filter *</InputLabel>
                    <Select
                      {...field}
                      label="Country Filter *"
                      value={field.value || ''}
                    >
                      {getSortedCountries().map((country) => (
                        <MenuItem key={country.code} value={country.name}>
                          {country.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.countryFilter?.message && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.countryFilter.message}
                      </Typography>
                    )}
                  </FormControl>
                )} />
              </Grid>

              {/* Client Network Selection - Only show for affiliate managers */}
              {user?.role === 'affiliate_manager' && (
                <Grid item xs={12}>
                  <Controller
                    name="selectedClientNetwork"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small" error={!!errors.selectedClientNetwork}>
                        <InputLabel>Client Network *</InputLabel>
                        <Select
                          {...field}
                          label="Client Network *"
                          value={field.value || ''}
                          disabled={loadingClientNetworks}
                        >
                          {clientNetworks.map((network) => (
                            <MenuItem key={network._id} value={network._id}>
                              {network.name}
                              {network.description && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  {network.description}
                                </Typography>
                              )}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.selectedClientNetwork?.message && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {errors.selectedClientNetwork.message}
                          </Typography>
                        )}
                        {!errors.selectedClientNetwork?.message && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                            {loadingClientNetworks
                              ? 'Loading client networks...'
                              : `${clientNetworks.length} client network(s) available`
                            }
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Controller name="notes" control={control} render={({ field }) => <TextField {...field} fullWidth label="Notes" multiline rows={3} error={!!errors.notes} helperText={errors.notes?.message} size="small" />} />
              </Grid>

              {/* Injection Settings Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Lead Injection Settings
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  All non-FTD leads (Filler, Cold, Live) will be automatically injected. FTD leads require manual injection.
                </Typography>
              </Grid>

              {/* Injection mode selection */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="injectionMode"
                  control={control}
                  render={({ field: modeField }) => (
                    <FormControl fullWidth size="small" error={!!errors.injectionMode}>
                      <InputLabel>Injection Mode</InputLabel>
                      <Select {...modeField} label="Injection Mode">
                        <MenuItem value="bulk">Auto Inject (Bulk)</MenuItem>
                        <MenuItem value="scheduled">Auto Inject (Scheduled)</MenuItem>
                      </Select>
                      {errors.injectionMode && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {errors.injectionMode.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Scheduled time inputs - only show for scheduled mode */}
              <Controller
                name="injectionMode"
                control={control}
                render={({ field: modeField }) => (
                  modeField.value === 'scheduled' && (
                    <>
                      <Grid item xs={12} sm={3}>
                        <Controller
                          name="injectionStartTime"
                          control={control}
                          render={({ field: timeField }) => (
                            <TextField
                              {...timeField}
                              fullWidth
                              label="Start Time"
                              type="time"
                              InputLabelProps={{ shrink: true }}
                              size="small"
                              error={!!errors.injectionStartTime}
                              helperText={errors.injectionStartTime?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Controller
                          name="injectionEndTime"
                          control={control}
                          render={({ field: timeField }) => (
                            <TextField
                              {...timeField}
                              fullWidth
                              label="End Time"
                              type="time"
                              InputLabelProps={{ shrink: true }}
                              size="small"
                              error={!!errors.injectionEndTime}
                              helperText={errors.injectionEndTime?.message}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )
                )}
              />

              {/* Device Configuration Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Device Configuration
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Configure device types for lead injection. Each lead gets a unique fingerprint for the assigned device type.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSelectionMode"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Device Selection Mode</InputLabel>
                      <Select {...field} label="Device Selection Mode">
                        <MenuItem value="random">Random Assignment</MenuItem>
                        <MenuItem value="bulk">Bulk Assignment (Same Device)</MenuItem>
                        <MenuItem value="ratio">Ratio-based Distribution</MenuItem>
                        <MenuItem value="individual">Individual Assignment</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Bulk Device Type Selection */}
              <Controller
                name="deviceSelectionMode"
                control={control}
                render={({ field }) => (
                  field.value === 'bulk' && (
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="bulkDeviceType"
                        control={control}
                        render={({ field: deviceField }) => (
                          <FormControl fullWidth size="small">
                            <InputLabel>Device Type</InputLabel>
                            <Select {...deviceField} label="Device Type">
                              <MenuItem value="windows">Windows Desktop</MenuItem>
                              <MenuItem value="android">Android Mobile</MenuItem>
                              <MenuItem value="ios">iPhone/iPad</MenuItem>
                              <MenuItem value="mac">Mac Desktop</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  )
                )}
              />

              {/* Ratio-based Device Distribution */}
              <Controller
                name="deviceSelectionMode"
                control={control}
                render={({ field }) => (
                  field.value === 'ratio' && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                          Device Distribution Ratios (0-10 scale):
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2.4}>
                        <Controller
                          name="deviceRatio.windows"
                          control={control}
                          render={({ field: ratioField }) => (
                            <TextField
                              {...ratioField}
                              fullWidth
                              label="Windows"
                              type="number"
                              inputProps={{ min: 0, max: 10, step: 1 }}
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2.4}>
                        <Controller
                          name="deviceRatio.android"
                          control={control}
                          render={({ field: ratioField }) => (
                            <TextField
                              {...ratioField}
                              fullWidth
                              label="Android"
                              type="number"
                              inputProps={{ min: 0, max: 10, step: 1 }}
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2.4}>
                        <Controller
                          name="deviceRatio.ios"
                          control={control}
                          render={({ field: ratioField }) => (
                            <TextField
                              {...ratioField}
                              fullWidth
                              label="iOS"
                              type="number"
                              inputProps={{ min: 0, max: 10, step: 1 }}
                              size="small"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2.4}>
                        <Controller
                          name="deviceRatio.mac"
                          control={control}
                          render={({ field: ratioField }) => (
                            <TextField
                              {...ratioField}
                              fullWidth
                              label="Mac"
                              type="number"
                              inputProps={{ min: 0, max: 10, step: 1 }}
                              size="small"
                            />
                          )}
                        />
                      </Grid>

                    </>
                  )
                )}
              />

              {/* Random Device Types Selection */}
              <Controller
                name="deviceSelectionMode"
                control={control}
                render={({ field }) => (
                  field.value === 'random' && (
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                        Available Device Types for Random Selection:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Controller
                          name="availableDeviceTypes.windows"
                          control={control}
                          render={({ field: deviceField }) => (
                            <FormControlLabel
                              control={<Checkbox {...deviceField} checked={deviceField.value} />}
                              label="Windows"
                            />
                          )}
                        />
                        <Controller
                          name="availableDeviceTypes.android"
                          control={control}
                          render={({ field: deviceField }) => (
                            <FormControlLabel
                              control={<Checkbox {...deviceField} checked={deviceField.value} />}
                              label="Android"
                            />
                          )}
                        />
                        <Controller
                          name="availableDeviceTypes.ios"
                          control={control}
                          render={({ field: deviceField }) => (
                            <FormControlLabel
                              control={<Checkbox {...deviceField} checked={deviceField.value} />}
                              label="iOS"
                            />
                          )}
                        />
                        <Controller
                          name="availableDeviceTypes.mac"
                          control={control}
                          render={({ field: deviceField }) => (
                            <FormControlLabel
                              control={<Checkbox {...deviceField} checked={deviceField.value} />}
                              label="Mac"
                            />
                          )}
                        />

                      </Box>
                    </Grid>
                  )
                )}
              />

              {/* Device Specifications Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, mt: 3, fontWeight: 'bold' }}>
                  Device Specifications (Optional)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Configure detailed device specifications to create more realistic fingerprints. These settings apply to all devices of the selected types.
                </Typography>
              </Grid>

              {/* Hardware Specifications */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', color: 'primary.main' }}>
                  Hardware Specifications
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.memoryMin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Memory Min (GB)"
                      type="number"
                      inputProps={{ min: 1, max: 128, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.memoryMin}
                      helperText={errors.deviceSpecs?.memoryMin?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.memoryMax"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Memory Max (GB)"
                      type="number"
                      inputProps={{ min: 1, max: 128, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.memoryMax}
                      helperText={errors.deviceSpecs?.memoryMax?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.cpuCoresMin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CPU Cores Min"
                      type="number"
                      inputProps={{ min: 1, max: 32, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.cpuCoresMin}
                      helperText={errors.deviceSpecs?.cpuCoresMin?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.cpuCoresMax"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CPU Cores Max"
                      type="number"
                      inputProps={{ min: 1, max: 32, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.cpuCoresMax}
                      helperText={errors.deviceSpecs?.cpuCoresMax?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.storageMin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Storage Min (GB)"
                      type="number"
                      inputProps={{ min: 16, max: 4096, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.storageMin}
                      helperText={errors.deviceSpecs?.storageMin?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.storageMax"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Storage Max (GB)"
                      type="number"
                      inputProps={{ min: 16, max: 4096, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.storageMax}
                      helperText={errors.deviceSpecs?.storageMax?.message}
                    />
                  )}
                />
              </Grid>

              {/* Display Specifications */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, mt: 2, fontWeight: 'medium', color: 'primary.main' }}>
                  Display Specifications
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.screenWidthMin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Screen Width Min (px)"
                      type="number"
                      inputProps={{ min: 800, max: 7680, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.screenWidthMin}
                      helperText={errors.deviceSpecs?.screenWidthMin?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.screenWidthMax"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Screen Width Max (px)"
                      type="number"
                      inputProps={{ min: 800, max: 7680, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.screenWidthMax}
                      helperText={errors.deviceSpecs?.screenWidthMax?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.screenHeightMin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Screen Height Min (px)"
                      type="number"
                      inputProps={{ min: 600, max: 4320, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.screenHeightMin}
                      helperText={errors.deviceSpecs?.screenHeightMin?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.screenHeightMax"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Screen Height Max (px)"
                      type="number"
                      inputProps={{ min: 600, max: 4320, step: 1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.screenHeightMax}
                      helperText={errors.deviceSpecs?.screenHeightMax?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.pixelRatioMin"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Pixel Ratio Min"
                      type="number"
                      inputProps={{ min: 0.5, max: 4, step: 0.1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.pixelRatioMin}
                      helperText={errors.deviceSpecs?.pixelRatioMin?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.pixelRatioMax"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Pixel Ratio Max"
                      type="number"
                      inputProps={{ min: 0.5, max: 4, step: 0.1 }}
                      size="small"
                      error={!!errors.deviceSpecs?.pixelRatioMax}
                      helperText={errors.deviceSpecs?.pixelRatioMax?.message}
                    />
                  )}
                />
              </Grid>

              {/* Operating System Specifications */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, mt: 2, fontWeight: 'medium', color: 'primary.main' }}>
                  Operating System Preferences
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.windowsVersions"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Windows Versions</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Windows Versions"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="Windows 10">Windows 10</MenuItem>
                        <MenuItem value="Windows 11">Windows 11</MenuItem>
                        <MenuItem value="Windows Server 2019">Windows Server 2019</MenuItem>
                        <MenuItem value="Windows Server 2022">Windows Server 2022</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.androidVersions"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Android Versions</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Android Versions"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="10">Android 10</MenuItem>
                        <MenuItem value="11">Android 11</MenuItem>
                        <MenuItem value="12">Android 12</MenuItem>
                        <MenuItem value="13">Android 13</MenuItem>
                        <MenuItem value="14">Android 14</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.iosVersions"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>iOS Versions</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="iOS Versions"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="14.0">iOS 14.0</MenuItem>
                        <MenuItem value="15.0">iOS 15.0</MenuItem>
                        <MenuItem value="16.0">iOS 16.0</MenuItem>
                        <MenuItem value="17.0">iOS 17.0</MenuItem>
                        <MenuItem value="18.0">iOS 18.0</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.macVersions"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>macOS Versions</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="macOS Versions"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="Big Sur">Big Sur</MenuItem>
                        <MenuItem value="Monterey">Monterey</MenuItem>
                        <MenuItem value="Ventura">Ventura</MenuItem>
                        <MenuItem value="Sonoma">Sonoma</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Hardware Preferences */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, mt: 2, fontWeight: 'medium', color: 'primary.main' }}>
                  Hardware Preferences
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.androidManufacturers"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Android Manufacturers</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Android Manufacturers"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="Samsung">Samsung</MenuItem>
                        <MenuItem value="Google">Google</MenuItem>
                        <MenuItem value="Xiaomi">Xiaomi</MenuItem>
                        <MenuItem value="OnePlus">OnePlus</MenuItem>
                        <MenuItem value="Huawei">Huawei</MenuItem>
                        <MenuItem value="LG">LG</MenuItem>
                        <MenuItem value="Sony">Sony</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.cpuArchitectures"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>CPU Architectures</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="CPU Architectures"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="x86">x86</MenuItem>
                        <MenuItem value="x64">x64</MenuItem>
                        <MenuItem value="ARM">ARM</MenuItem>
                        <MenuItem value="ARM64">ARM64</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.cpuBrands"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>CPU Brands</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="CPU Brands"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="Intel">Intel</MenuItem>
                        <MenuItem value="AMD">AMD</MenuItem>
                        <MenuItem value="Apple">Apple</MenuItem>
                        <MenuItem value="Qualcomm">Qualcomm</MenuItem>
                        <MenuItem value="MediaTek">MediaTek</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.storageTypes"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Storage Types</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Storage Types"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="HDD">HDD</MenuItem>
                        <MenuItem value="SSD">SSD</MenuItem>
                        <MenuItem value="NVMe">NVMe</MenuItem>
                        <MenuItem value="eMMC">eMMC</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Browser and Network Preferences */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, mt: 2, fontWeight: 'medium', color: 'primary.main' }}>
                  Browser and Network Preferences
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.browserTypes"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Browser Types</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Browser Types"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="chrome">Chrome</MenuItem>
                        <MenuItem value="firefox">Firefox</MenuItem>
                        <MenuItem value="safari">Safari</MenuItem>
                        <MenuItem value="edge">Edge</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="deviceSpecs.connectionTypes"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Connection Types</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Connection Types"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="wifi">WiFi</MenuItem>
                        <MenuItem value="cellular">Cellular</MenuItem>
                        <MenuItem value="ethernet">Ethernet</MenuItem>
                        <MenuItem value="unknown">Unknown</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Device Characteristics */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, mt: 2, fontWeight: 'medium', color: 'primary.main' }}>
                  Device Characteristics
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.touchSupport"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Touch Support</InputLabel>
                      <Select {...field} label="Touch Support">
                        <MenuItem value="required">Required</MenuItem>
                        <MenuItem value="optional">Optional</MenuItem>
                        <MenuItem value="disabled">Disabled</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.cameraSupport"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Camera Support</InputLabel>
                      <Select {...field} label="Camera Support">
                        <MenuItem value="required">Required</MenuItem>
                        <MenuItem value="optional">Optional</MenuItem>
                        <MenuItem value="disabled">Disabled</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.microphoneSupport"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Microphone Support</InputLabel>
                      <Select {...field} label="Microphone Support">
                        <MenuItem value="required">Required</MenuItem>
                        <MenuItem value="optional">Optional</MenuItem>
                        <MenuItem value="disabled">Disabled</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Controller
                  name="deviceSpecs.locationSupport"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Location Support</InputLabel>
                      <Select {...field} label="Location Support">
                        <MenuItem value="required">Required</MenuItem>
                        <MenuItem value="optional">Optional</MenuItem>
                        <MenuItem value="disabled">Disabled</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
            {errors[''] && <Alert severity="error" sx={{ mt: 2 }}>{errors['']?.message}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Create Order'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><Typography variant="subtitle2">Order ID</Typography><Typography variant="body2">{selectedOrder._id}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography variant="subtitle2">Requester</Typography><Typography variant="body2">{selectedOrder.requester?.fullName} ({selectedOrder.requester?.email})</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography variant="subtitle2">Status</Typography><Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" /></Grid>
              <Grid item xs={12} sm={6}><Typography variant="subtitle2">Priority</Typography><Chip label={selectedOrder.priority} color={getPriorityColor(selectedOrder.priority)} size="small" /></Grid>
              <Grid item xs={12}><Typography variant="subtitle2">Requests vs Fulfilled</Typography>
                {renderLeadCounts('FTD', selectedOrder.requests?.ftd, selectedOrder.fulfilled?.ftd)}
                {renderLeadCounts('Filler', selectedOrder.requests?.filler, selectedOrder.fulfilled?.filler)}
                {renderLeadCounts('Cold', selectedOrder.requests?.cold, selectedOrder.fulfilled?.cold)}
                {renderLeadCounts('Live', selectedOrder.requests?.live, selectedOrder.fulfilled?.live)}
              </Grid>
              <Grid item xs={12} sm={6}><Typography variant="subtitle2">Country Filter</Typography><Typography variant="body2">{selectedOrder.countryFilter || 'Any'}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography variant="subtitle2">Gender Filter</Typography><Typography variant="body2">{selectedOrder.genderFilter || 'Any'}</Typography></Grid>

              <Grid item xs={12}><Typography variant="subtitle2">Notes</Typography><Typography variant="body2">{selectedOrder.notes || 'N/A'}</Typography></Grid>
              <Grid item xs={12}><Typography variant="subtitle2">Created</Typography><Typography variant="body2">{new Date(selectedOrder.createdAt).toLocaleString()}</Typography></Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Assigned Leads ({selectedOrder.leads?.length || 0})</Typography>
                  {selectedOrder.leads?.length > 0 && (
                    <Box>
                      <Button
                        size="small"
                        onClick={() => expandAllLeads(selectedOrder.leads)}
                        variant="outlined"
                        sx={{ mr: 1 }}
                      >
                        Expand All
                      </Button>
                      <Button
                        size="small"
                        onClick={() => collapseAllLeads(selectedOrder.leads)}
                        variant="outlined"
                      >
                        Collapse All
                      </Button>
                    </Box>
                  )}
                </Box>
                {selectedOrder.leads?.length > 0 ? (
                  <TableContainer component={Paper}><Table size="small">
                    <TableHead><TableRow>
                      <TableCell>Type</TableCell><TableCell>Name</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Country</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {selectedOrder.leads.map((lead) => (
                        <React.Fragment key={lead._id}>
                          <TableRow>
                            <TableCell><Chip label={lead.leadType.toUpperCase()} size="small" /></TableCell>
                            <TableCell>{lead.firstName} {lead.lastName}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{lead.country}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{lead.newEmail}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => toggleLeadExpansion(lead._id)}
                                aria-label={expandedLeads[lead._id] ? 'collapse' : 'expand'}
                              >
                                {expandedLeads[lead._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>

                              {/* Individual Manual FTD Injection Button */}
                              {lead.leadType === 'ftd' && (user?.role === 'admin' || user?.role === 'affiliate_manager') && (() => {
                                // Check if this lead has been processed
                                const networkHistory = lead.clientNetworkHistory?.find(
                                  (history) => history.orderId?.toString() === selectedOrder._id.toString()
                                );
                                const isCompleted = networkHistory && networkHistory.injectionStatus === "completed";
                                const isProcessing = processingLeads[lead._id];

                                // Only show button if not completed
                                if (!isCompleted) {
                                  return (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenManualFTDInjection(selectedOrder, lead)}
                                      title={`Manual FTD Injection for ${lead.firstName} ${lead.lastName}`}
                                      color="primary"
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? <CircularProgress size={16} /> : <SendIcon fontSize="small" />}
                                    </IconButton>
                                  );
                                }

                                // Show completed status
                                return (
                                  <Chip
                                    label="Injected"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                          {expandedLeads[lead._id] && (
                            <TableRow>
                              <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
                                <Collapse in={expandedLeads[lead._id]} timeout="auto" unmountOnExit>
                                  <Box sx={{ p: 2 }}>
                                    <LeadDetailCard lead={lead} />
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table></TableContainer>
                ) : <Typography variant="body2">No leads assigned</Typography>}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            onClick={() => handleExportLeads(selectedOrder._id)}
            startIcon={<DownloadIcon />}
            variant="contained"
            color="primary"
          >
            Export Leads CSV
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual FTD Injection Dialog */}
      <Dialog
        open={manualFTDDialog.open}
        onClose={handleCloseManualFTDDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={manualFTDDialog.step === 'processing' || manualFTDDialog.step === 'domain_input'}
        // Disable backdrop click when domain input is required
        onBackdropClick={manualFTDDialog.step === 'domain_input' ? undefined : handleCloseManualFTDDialog}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SendIcon color="primary" />
            <Typography variant="h6">Manual FTD Injection</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Order #{manualFTDDialog.order?._id?.slice(-8)}
            {manualFTDDialog.lead && (
              <> - {manualFTDDialog.lead.firstName} {manualFTDDialog.lead.lastName}</>
            )}
          </Typography>
        </DialogTitle>

        <DialogContent>
          {manualFTDDialog.step === 'confirm' && manualFTDDialog.lead && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                This will open a browser window with the landing form for <strong>{manualFTDDialog.lead.firstName} {manualFTDDialog.lead.lastName}</strong>. The form will be automatically filled with the FTD lead information. You will need to:
              </Typography>
              <Box component="ol" sx={{ pl: 2, mb: 2 }}>
                <li>Review the auto-filled form with the following FTD lead information:</li>
                <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                  <li>Name: {manualFTDDialog.lead.firstName} {manualFTDDialog.lead.lastName}</li>
                  <li>Email: {manualFTDDialog.lead.newEmail}</li>
                  <li>Phone: {manualFTDDialog.lead.newPhone}</li>
                  <li>Country: {manualFTDDialog.lead.country}</li>
                </Box>
                <li>Make any necessary corrections to the auto-filled data</li>
                <li>Click the submit button to submit the form</li>
                <li>Wait for any redirects to complete</li>
                <li>Copy the final domain/URL from the browser address bar</li>
                <li>Close the browser window</li>
                <li>Enter the copied domain in the next step</li>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                The form will be automatically filled with the FTD lead data. Review the information, submit the form, and make sure to copy the final domain before closing the browser!
              </Alert>
            </>
          )}

          {manualFTDDialog.step === 'processing' && (
            <Box display="flex" flexDirection="column" alignItems="center" py={3}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1" align="center">
                Browser is opening... The form will be auto-filled with FTD data. Please review, submit, and close the browser when done.
              </Typography>
            </Box>
          )}

          {manualFTDDialog.step === 'domain_input' && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Please enter the final domain/URL that you copied from the browser:
              </Typography>
              <TextField
                fullWidth
                label="Final Domain/URL *"
                placeholder="e.g., https://example.com or example.com"
                value={manualFTDDomain}
                onChange={(e) => setManualFTDDomain(e.target.value)}
                sx={{ mb: 2 }}
                autoFocus
                required
                error={!manualFTDDomain.trim()}
                helperText={!manualFTDDomain.trim() ? "This field is mandatory" : "Enter the final domain where the form redirected to (not the original form URL)"}
              />
              <Alert severity="warning" sx={{ mb: 2 }}>
                Make sure this is the final domain after all redirects, not the original form URL.
              </Alert>
              <Alert severity="error">
                <strong>Important:</strong> This dialog cannot be closed until you enter the broker domain. This field is mandatory for completing the FTD injection.
              </Alert>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {manualFTDDialog.step === 'confirm' && (
            <>
              <Button onClick={handleCloseManualFTDDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleStartManualFTDInjection}
                variant="contained"
                startIcon={<SendIcon />}
              >
                Start Manual Injection
              </Button>
            </>
          )}

          {manualFTDDialog.step === 'domain_input' && (
            <Button
              onClick={handleSubmitManualFTDDomain}
              variant="contained"
              disabled={!manualFTDDomain.trim()}
              startIcon={<SendIcon />}
              fullWidth
            >
              Complete Injection
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersPage;