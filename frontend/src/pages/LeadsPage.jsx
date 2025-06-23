import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// MUI Components
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
  Checkbox,
  Stack,
  Avatar,
  Divider,
  FormControlLabel,
  Switch,
  Link,
  Tooltip,
  DialogContentText,
} from "@mui/material";

// MUI Icons
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Comment as CommentIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterIcon,
  Description as DescriptionIcon,
  FileUpload as ImportIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Contacts as ContactsIcon,
  Info as InfoIcon,
  AssignmentInd as AssignmentIndIcon,
  Share as ShareIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Telegram as TelegramIcon,
  WhatsApp as WhatsAppIcon,
  Launch as LaunchIcon,
  Computer as ComputerIcon,
  Login as LoginIcon,
} from "@mui/icons-material";

// Project Components & Services
import AddLeadForm from "../components/AddLeadForm";
import DocumentPreview from "../components/DocumentPreview";
import api from "../services/api";
import { selectUser } from "../store/slices/authSlice";
import { getSortedCountries } from "../constants/countries";
import ImportLeadsDialog from "../components/ImportLeadsDialog";
import EditLeadForm from "../components/EditLeadForm";

// --- Glassmorphism Styles ---
const glassMorphismStyles = {
  bgcolor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: 2,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(15px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
  '& .MuiButton-root': {
    bgcolor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    '&:hover': {
      bgcolor: 'rgba(255, 255, 255, 0.15)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    },
  },
  '& .MuiInputBase-root': {
    bgcolor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    '&:hover': {
      bgcolor: 'rgba(255, 255, 255, 0.15)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(100, 181, 246, 0.3)',
      borderColor: 'primary.main',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.light',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
  },
};

// --- Glassmorphism Styles for Buttons ---
const buttonGlassMorphismStyles = {
  bgcolor: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  color: 'text.primary',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.25)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
};

// --- Glassmorphism Styles for Input Fields ---
const inputGlassMorphismStyles = {
  bgcolor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 2,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main',
    boxShadow: '0 0 0 3px rgba(100, 181, 246, 0.3)',
  },
  '& .MuiInputBase-input': {
    color: 'text.primary',
  },
  '& .MuiInputLabel-root': {
    color: 'text.secondary',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'primary.main',
  },
};

// --- Constants ---
const ROLES = {
  ADMIN: "admin",
  AFFILIATE_MANAGER: "affiliate_manager",
  LEAD_MANAGER: "lead_manager",
  AGENT: "agent",
};

const LEAD_STATUSES = {
  ACTIVE: "active",
  CONTACTED: "contacted",
  CONVERTED: "converted",
  INACTIVE: "inactive",
};

const LEAD_TYPES = {
  FTD: "ftd",
  FILLER: "filler",
  COLD: "cold",
  LIVE: "live",
};

// --- Validation Schemas ---
const commentSchema = yup.object({
  text: yup
    .string()
    .required("Comment is required")
    .min(3, "Comment must be at least 3 characters"),
});

const assignmentSchema = yup.object({
  agentId: yup.string().required("Agent is required"),
});

// --- FTD Session Management Component ---
const FTDSessionManagement = React.memo(({ lead }) => {
  const user = useSelector(selectUser);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  // Check if current user is the assigned agent
  const isAssignedAgent = user?.id === lead.assignedTo?._id || user?.id === lead.assignedTo;

  const handleLaunchBrowser = async () => {
    if (!isAssignedAgent) {
      setSessionError('You can only launch browsers for leads assigned to you');
      return;
    }

    setSessionLoading(true);
    setSessionError(null);
    setSessionStatus(null);

    try {
      const response = await api.post(`/orders/${lead.orderId}/launch-agent-browser`, {
        leadId: lead._id
      });

      if (response.data.success) {
        setSessionStatus({
          type: 'success',
          message: response.data.message,
          instructions: response.data.instructions
        });
      } else {
        throw new Error(response.data.message || 'Failed to launch browser');
      }
    } catch (error) {
      console.error('Error launching agent browser:', error);
      setSessionError(
        error.response?.data?.message || 
        error.message || 
        'Failed to launch browser with session'
      );
    } finally {
      setSessionLoading(false);
    }
  };

  const getSessionStatusDisplay = () => {
    if (lead.sessionData?.status) {
      const status = lead.sessionData.status;
      const colors = {
        active: 'success',
        expired: 'warning',
        used: 'info'
      };
      return (
        <Chip 
          label={status.charAt(0).toUpperCase() + status.slice(1)} 
          color={colors[status] || 'default'}
          size="small"
        />
      );
    }
    return <Chip label="No Session" color="default" size="small" />;
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Session Status
            </Typography>
            {getSessionStatusDisplay()}
          </Box>
          
          {lead.sessionData?.createdAt && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Session Created
              </Typography>
              <Typography variant="body2">
                {new Date(lead.sessionData.createdAt).toLocaleString()}
              </Typography>
            </Box>
          )}

          {lead.sessionData?.lastUsed && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Last Used
              </Typography>
              <Typography variant="body2">
                {new Date(lead.sessionData.lastUsed).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isAssignedAgent ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={sessionLoading ? <CircularProgress size={16} /> : <LaunchIcon />}
                onClick={handleLaunchBrowser}
                disabled={sessionLoading || !lead.sessionData?.sessionId}
                fullWidth
              >
                {sessionLoading ? 'Launching Browser...' : 'Launch Browser with Session'}
              </Button>
            ) : (
              <Alert severity="info" sx={{ mb: 1 }}>
                Only the assigned agent can launch the browser session
              </Alert>
            )}

            {!lead.sessionData?.sessionId && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                No session data available. Session must be captured during manual FTD injection.
              </Alert>
            )}
          </Box>
        </Grid>

        {sessionError && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setSessionError(null)}>
              {sessionError}
            </Alert>
          </Grid>
        )}

        {sessionStatus && (
          <Grid item xs={12}>
            <Alert 
              severity={sessionStatus.type} 
              onClose={() => setSessionStatus(null)}
            >
              <Typography variant="body2" gutterBottom>
                {sessionStatus.message}
              </Typography>
              {sessionStatus.instructions && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Instructions:
                  </Typography>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    {Object.entries(sessionStatus.instructions).map(([key, value]) => (
                      <li key={key}>
                        <Typography variant="caption">{value}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
});

// --- Helper Functions ---
const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    contacted: 'info',
    converted: 'success',
    inactive: 'default',
  };
  return colors[status] || 'default';
};

const getLeadTypeColor = (leadType) => {
  const colors = {
    ftd: 'primary',
    filler: 'secondary',
    cold: 'info',
    live: 'success',
  };
  return colors[leadType] || 'default';
};

const getDocumentStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
  };
  return colors[status] || 'default';
};

// Memoized component for lead details to avoid re-renders
const LeadDetails = React.memo(({ lead }) => (
  <Box sx={{
    animation: 'fadeIn 0.3s ease-in-out',
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0,
        transform: 'translateY(-10px)',
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
  }}>
    <Grid container spacing={3}>
      {/* Basic Information Card */}
      <Grid item xs={12} md={4}>
        <Paper elevation={0} sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme => theme.shadows[4],
            transform: 'translateY(-4px)',
          },
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PersonAddIcon fontSize="small" />
            Basic Information
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Full Name</Typography>
              <Typography variant="body1" fontWeight="medium">
                {lead.fullName || `${lead.firstName} ${lead.lastName || ""}`.trim()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Lead ID</Typography>
              <Typography variant="body2" fontFamily="monospace">
                {lead._id}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2">
                {new Date(lead.createdAt).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Last Updated</Typography>
              <Typography variant="body2">
                {new Date(lead.updatedAt).toLocaleString()}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={lead.leadType?.toUpperCase() || 'UNKNOWN'}
                color={getLeadTypeColor(lead.leadType)}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
              <Chip
                label={lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                color={getStatusColor(lead.status)}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      {/* Contact Information Card */}
      <Grid item xs={12} md={4}>
        <Paper elevation={0} sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme => theme.shadows[4],
            transform: 'translateY(-4px)',
          },
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ContactsIcon fontSize="small" />
            Contact Information
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Current Email</Typography>
              <Typography variant="body2">{lead.newEmail}</Typography>
              {lead.oldEmail && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Previous: {lead.oldEmail}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Current Phone</Typography>
              <Typography variant="body2">{lead.newPhone}</Typography>
              {lead.oldPhone && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Previous: {lead.oldPhone}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Address</Typography>
              <Typography variant="body2">
                {typeof lead.address === 'string' ? lead.address :
                  lead.address ? `${lead.address.street || ''}, ${lead.address.city || ''} ${lead.address.postalCode || ''}`.trim() : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Country</Typography>
              <Typography variant="body2">{lead.country || 'N/A'}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>

      {/* Additional Details Card */}
      <Grid item xs={12} md={4}>
        <Paper elevation={0} sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme => theme.shadows[4],
            transform: 'translateY(-4px)',
          },
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoIcon fontSize="small" />
            Additional Details
          </Typography>
          <Stack spacing={2}>
            {lead.sin && (
              <Box>
                <Typography variant="caption" color="text.secondary">SIN</Typography>
                <Typography variant="body2" fontFamily="monospace">{lead.sin}</Typography>
              </Box>
            )}
            {lead.dob && (
              <Box>
                <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body2">{new Date(lead.dob).toLocaleDateString()}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Gender</Typography>
              <Typography variant="body2">
                {lead.gender ? lead.gender.charAt(0).toUpperCase() + lead.gender.slice(1) : 'Not Specified'}
              </Typography>
            </Box>
            {lead.client && (
              <Box>
                <Typography variant="caption" color="text.secondary">Client</Typography>
                <Typography variant="body2">{lead.client}</Typography>
              </Box>
            )}
            {lead.clientBroker && (
              <Box>
                <Typography variant="caption" color="text.secondary">Client Broker</Typography>
                <Typography variant="body2">{lead.clientBroker}</Typography>
              </Box>
            )}
            {lead.clientNetwork && (
              <Box>
                <Typography variant="caption" color="text.secondary">Client Network</Typography>
                <Typography variant="body2">{lead.clientNetwork}</Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Grid>

      {/* Assignment Information */}
      {lead.assignedTo && (
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: theme => theme.shadows[4],
              transform: 'translateY(-4px)',
            },
          }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AssignmentIndIcon fontSize="small" />
              Assignment Information
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {lead.assignedTo.fullName?.charAt(0) || 'A'}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {lead.assignedTo.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Agent Code: {lead.assignedTo.fourDigitCode}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2">
                <Link href={`mailto:${lead.assignedTo.email}`} color="primary">
                  {lead.assignedTo.email}
                </Link>
              </Typography>
              {lead.assignedAt && (
                <Typography variant="caption" color="text.secondary">
                  Assigned on: {new Date(lead.assignedAt).toLocaleString()}
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      )}

      {/* Social Media Profiles */}
      {lead.socialMedia && Object.values(lead.socialMedia).some(Boolean) && (
        <Grid item xs={12} md={lead.assignedTo ? 8 : 12}>
          <Paper elevation={0} sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: theme => theme.shadows[4],
              transform: 'translateY(-4px)',
            },
          }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ShareIcon fontSize="small" />
              Social Media Profiles
            </Typography>
            <Grid container spacing={2}>
              {lead.socialMedia.facebook && (
                <Grid item xs={12} sm={6} md={4}>
                  <Link
                    href={lead.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.primary',
                      textDecoration: 'none',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <FacebookIcon color="primary" />
                    Facebook Profile
                  </Link>
                </Grid>
              )}
              {lead.socialMedia.twitter && (
                <Grid item xs={12} sm={6} md={4}>
                  <Link
                    href={lead.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.primary',
                      textDecoration: 'none',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TwitterIcon color="info" />
                    Twitter Profile
                  </Link>
                </Grid>
              )}
              {lead.socialMedia.linkedin && (
                <Grid item xs={12} sm={6} md={4}>
                  <Link
                    href={lead.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.primary',
                      textDecoration: 'none',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <LinkedInIcon color="primary" />
                    LinkedIn Profile
                  </Link>
                </Grid>
              )}
              {lead.socialMedia.instagram && (
                <Grid item xs={12} sm={6} md={4}>
                  <Link
                    href={lead.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.primary',
                      textDecoration: 'none',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <InstagramIcon color="secondary" />
                    Instagram Profile
                  </Link>
                </Grid>
              )}
              {lead.socialMedia.telegram && (
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                  }}>
                    <TelegramIcon color="info" />
                    <Typography variant="body2">{lead.socialMedia.telegram}</Typography>
                  </Box>
                </Grid>
              )}
              {lead.socialMedia.whatsapp && (
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                  }}>
                    <WhatsAppIcon color="success" />
                    <Typography variant="body2">{lead.socialMedia.whatsapp}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      )}

      {/* Documents Section with Preview */}
      {lead.documents && lead.documents.length > 0 && (
        <Grid item xs={12}>
          <Paper elevation={0} sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: theme => theme.shadows[4],
              transform: 'translateY(-4px)',
            },
          }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DescriptionIcon fontSize="small" />
              Documents
            </Typography>
            <Grid container spacing={2}>
              {lead.documents.map((doc, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper elevation={0} sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}>
                    {doc?.url && doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <Box sx={{ mb: 1 }}>
                        <DocumentPreview
                          url={doc.url}
                          type={doc.description || `Document ${index + 1}`}
                        />
                      </Box>
                    ) : (
                      <Link
                        href={doc?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'primary.main',
                          textDecoration: 'none',
                          mb: 1,
                        }}
                      >
                        <DescriptionIcon fontSize="small" />
                        {doc?.description || 'View Document'}
                      </Link>
                    )}
                    {doc?.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {doc.description}
                      </Typography>
                    )}
                    {doc?.uploadedAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      )}

      {/* FTD Session Management Section - Only for agents with FTD leads */}
      {lead.leadType === 'ftd' && lead.assignedTo && (
        <Grid item xs={12}>
          <Paper elevation={0} sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: theme => theme.shadows[4],
              transform: 'translateY(-4px)',
            },
          }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ComputerIcon fontSize="small" />
              FTD Session Management
            </Typography>
            <FTDSessionManagement lead={lead} />
          </Paper>
        </Grid>
      )}

      {/* Comments Section */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme => theme.shadows[4],
            transform: 'translateY(-4px)',
          },
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CommentIcon fontSize="small" />
            Comments & Activity
          </Typography>
          <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
            {lead.comments && lead.comments.length > 0 ? (
              <Stack spacing={2}>
                {lead.comments.map((comment, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>
                        {comment.author?.fullName?.charAt(0) || 'U'}
                      </Avatar>
                      <Typography variant="subtitle2">
                        {comment.author?.fullName || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {new Date(comment.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{comment.text}</Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                <CommentIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
                <Typography variant="body2">No comments yet</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  </Box>
));

const LeadsPage = () => {
  const user = useSelector(selectUser);

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [leadStats, setLeadStats] = useState(null);

  // Dialog states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteFilters, setBulkDeleteFilters] = useState({
    leadType: "",
    country: "",
    gender: "",
    status: "",
    documentStatus: "",
    isAssigned: "",
    search: "",
  });

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLeads, setTotalLeads] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    leadType: "",
    isAssigned: "",
    country: "",
    gender: "",
    status: "",
    documentStatus: "",
    includeConverted: true,
    order: "newest",
    orderId: "",
    assignedToMe: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // --- Derived State & Roles (Memoized) ---
  const isAdminOrManager = useMemo(
    () => user?.role === ROLES.ADMIN || user?.role === ROLES.AFFILIATE_MANAGER,
    [user?.role]
  );
  const isAffiliateManager = useMemo(() => user?.role === ROLES.AFFILIATE_MANAGER, [user?.role]);
  const isLeadManager = useMemo(() => user?.role === ROLES.LEAD_MANAGER, [user?.role]);
  const isAgent = useMemo(() => user?.role === ROLES.AGENT, [user?.role]);
  const canAssignLeads = useMemo(() => isAdminOrManager, [isAdminOrManager]);
  const canDeleteLeads = useMemo(() => user?.role === ROLES.ADMIN, [user?.role]);
  const numSelected = useMemo(() => selectedLeads.size, [selectedLeads]);

  // --- Forms ---
  const {
    control: commentControl,
    handleSubmit: handleCommentSubmit,
    reset: resetComment,
    formState: { errors: commentErrors, isSubmitting: isCommentSubmitting },
  } = useForm({
    resolver: yupResolver(commentSchema),
    defaultValues: { text: "" },
  });

  const {
    control: assignControl,
    handleSubmit: handleAssignSubmit,
    reset: resetAssign,
    formState: { errors: assignErrors, isSubmitting: isAssignSubmitting },
  } = useForm({
    resolver: yupResolver(assignmentSchema),
    defaultValues: { agentId: "" },
  });

  // --- API Calls (Memoized with useCallback) ---
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      });

      // For admins/managers, if isAssigned filter is empty, remove it to show all leads
      if ((isAdminOrManager || isLeadManager) && filters.isAssigned === "") {
        params.delete("isAssigned");
      }

      const endpoint = isAgent ? "/leads/assigned" : "/leads";
      const response = await api.get(`${endpoint}?${params}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch leads");
      }

      setLeads(response.data.data);
      setTotalLeads(response.data.pagination.totalLeads);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, user, isAdminOrManager, isLeadManager, isAgent]); // Dependencies are complete

  const fetchAgents = useCallback(async () => {
    try {
      const response = await api.get("/users?role=agent&isActive=true");
      setAgents(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch agents");
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    }
  }, []);

  const fetchLeadStats = useCallback(async () => {
    try {
      const response = await api.get('/leads/stats');
      if (response.data.success) {
        setLeadStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch lead stats:', err);
    }
  }, []);

  const onSubmitComment = useCallback(async (data) => {
    try {
      setError(null);
      if (isLeadManager) {
        const lead = leads.find(l => l._id === selectedLead._id);
        if (lead?.createdBy !== user.id) {
          setError("You can only comment on leads that you created.");
          return;
        }
      }
      await api.put(`/leads/${selectedLead._id}/comment`, data);
      setSuccess("Comment added successfully!");
      setCommentDialogOpen(false);
      resetComment();
      fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment.");
    }
  }, [selectedLead, fetchLeads, resetComment, isLeadManager, user?.id, leads, setSuccess, setError]);

  const onSubmitAssignment = useCallback(async (data) => {
    try {
      setError(null);
      const leadIds = Array.from(selectedLeads);
      await api.post("/leads/assign", { leadIds, agentId: data.agentId });
      setSuccess(`${leadIds.length} lead(s) assigned successfully!`);
      setAssignDialogOpen(false);
      resetAssign();
      setSelectedLeads(new Set());
      fetchLeads();
      fetchLeadStats(); // Refresh lead stats after assignment
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign leads.");
    }
  }, [selectedLeads, fetchLeads, fetchLeadStats, resetAssign, setSuccess, setError]);

  const updateLeadStatus = useCallback(async (leadId, status) => {
    try {
      setError(null);
      if (isLeadManager) {
        const lead = leads.find(l => l._id === leadId);
        if (lead?.createdBy !== user.id) {
          setError("You can only update leads that you created.");
          return;
        }
      }
      await api.put(`/leads/${leadId}/status`, { status });
      setSuccess("Lead status updated successfully!");
      fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update lead status.");
    }
  }, [fetchLeads, isLeadManager, user?.id, leads, setSuccess, setError]);

  const handleDeleteLead = useCallback(async (leadId) => {
    try {
      await api.delete(`/leads/${leadId}`);
      setSuccess('Lead deleted successfully');
      fetchLeads();
      fetchLeadStats(); // Refresh lead stats after deletion
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
  }, [fetchLeads, fetchLeadStats, setSuccess, setError]);

  const handleBulkDelete = async () => {
    try {
      setError(null);
      const response = await api.delete("/leads/bulk-delete", { data: bulkDeleteFilters });
      setSuccess(response.data.message);
      setBulkDeleteDialogOpen(false);
      fetchLeads();
      fetchLeadStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete leads");
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (isAdminOrManager) {
      fetchAgents();
      fetchOrders();
      fetchLeadStats();
    }
  }, [isAdminOrManager, fetchAgents, fetchOrders, fetchLeadStats]);

  // Clear success message after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);


  // --- Handlers (Memoized) ---
  const handleLeadAdded = useCallback((lead) => {
    fetchLeads();
    fetchLeadStats(); // Refresh lead stats after adding a new lead
  }, [fetchLeads, fetchLeadStats]);

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "", leadType: "", isAssigned: "", country: "", gender: "", status: "",
      documentStatus: "", includeConverted: true, order: "newest", orderId: "",
    });
    setPage(0);
  }, []);

  const handleSelectAll = useCallback((event) => {
    if (event.target.checked) {
      setSelectedLeads(new Set(leads.map((lead) => lead._id)));
    } else {
      setSelectedLeads(new Set());
    }
  }, [leads]);

  const handleSelectLead = useCallback((leadId) => (event) => {
    setSelectedLeads(prev => {
      const newSelected = new Set(prev);
      if (event.target.checked) {
        newSelected.add(leadId);
      } else {
        newSelected.delete(leadId);
      }
      return newSelected;
    });
  }, []);

  const toggleRowExpansion = useCallback((leadId) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(leadId)) {
        newExpanded.delete(leadId);
      } else {
        newExpanded.add(leadId);
      }
      return newExpanded;
    });
  }, []);

  const handleOpenCommentDialog = useCallback((lead) => {
    setSelectedLead(lead);
    setCommentDialogOpen(true);
  }, []);

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  const handleLeadUpdated = (updatedLead) => {
    setSuccess("Lead updated successfully");
    fetchLeads();
  };



  // --- Render ---
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{
          '& .MuiButton-root': {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme => theme.shadows[4],
            },
          },
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            position: 'relative',
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 4,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '60px',
              height: '4px',
              backgroundColor: 'primary.main',
              borderRadius: '2px',
              transition: 'width 0.3s ease-in-out',
            },
            '&:hover::after': {
              width: '100%',
            },
          }}
        >
          {isAgent ? "My Assigned Leads" : "Lead Management"}
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {(isLeadManager || user?.role === ROLES.ADMIN) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddLeadDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                transition: 'all 0.3s ease-in-out',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'text.primary',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                },
              }}
            >
              Add New Lead
            </Button>
          )}
          {isAdminOrManager && (
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={() => setImportDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
            >
              Import Leads
            </Button>
          )}
          {canAssignLeads && numSelected > 0 && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PersonAddIcon />}
              onClick={() => setAssignDialogOpen(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              Assign {numSelected} Lead{numSelected !== 1 ? "s" : ""}
            </Button>
          )}
          {canDeleteLeads && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setBulkDeleteDialogOpen(true)}
              sx={{ ml: 1 }}
            >
              Bulk Delete
            </Button>
          )}
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats Section */}
      {leadStats && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'text.primary',
                  textAlign: 'center',
                  transition: 'all 0.3s ease-in-out',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 245, 255, 0.8) 100%)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 245, 255, 0.9) 100%)',
                  },
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {leadStats.leads.overall.total}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Total Leads</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'text.primary',
                  textAlign: 'center',
                  transition: 'all 0.3s ease-in-out',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 255, 245, 0.8) 100%)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 255, 245, 0.9) 100%)',
                  },
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {leadStats.leads.overall.assigned}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Assigned Leads</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'text.primary',
                  textAlign: 'center',
                  transition: 'all 0.3s ease-in-out',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 250, 240, 0.8) 100%)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 240, 0.9) 100%)',
                  },
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {leadStats.leads.overall.available}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">Available Leads</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'text.primary',
                  textAlign: 'center',
                  transition: 'all 0.3s ease-in-out',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 245, 255, 0.8) 100%)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 245, 255, 0.9) 100%)',
                  },
                }}
              >
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {leadStats.leads.ftd.total}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">FTD Leads</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Filters Section */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          startIcon={showFilters ? <ExpandLessIcon /> : <FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{
            mb: 2,
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.lighter',
            },
          }}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>

        <Collapse in={showFilters}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Leads"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Name, email, phone..."
                InputProps={{
                  startAdornment: (<SearchIcon sx={{ mr: 1, color: "action.active" }} />),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Lead Type</InputLabel>
                <Select
                  value={filters.leadType}
                  label="Lead Type"
                  onChange={(e) => handleFilterChange("leadType", e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.values(LEAD_TYPES).map(type => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: theme => theme.palette[getLeadTypeColor(type)]?.main,
                          }}
                        />
                        {type.toUpperCase()}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {isAdminOrManager && (
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Assignment</InputLabel>
                  <Select
                    value={filters.isAssigned}
                    label="Assignment"
                    onChange={(e) => handleFilterChange("isAssigned", e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Assigned</MenuItem>
                    <MenuItem value="false">Unassigned</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(LEAD_STATUSES).map(status => (
                    <MenuItem key={status} value={status}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: theme => theme.palette[getStatusColor(status)]?.main,
                          }}
                        />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Country</InputLabel>
                <Select
                  value={filters.country}
                  label="Country"
                  onChange={(e) => handleFilterChange("country", e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Countries</MenuItem>
                  {getSortedCountries().map((country) => (
                    <MenuItem key={country.code} value={country.name}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {isAdminOrManager && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.includeConverted}
                      onChange={(e) => handleFilterChange("includeConverted", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Include Converted Leads"
                />
              </Grid>
            )}

            {isAffiliateManager && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.assignedToMe}
                      onChange={(e) => handleFilterChange("assignedToMe", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="My Assigned Leads"
                />
              </Grid>
            )}
          </Grid>
        </Collapse>
      </Paper>

      {/* --- Leads Table (Desktop) --- */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 180px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {canAssignLeads && <TableCell padding="checkbox" sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem' }}><Checkbox indeterminate={numSelected > 0 && numSelected < leads.length} checked={leads.length > 0 && numSelected === leads.length} onChange={handleSelectAll} /></TableCell>}
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Name</TableCell>
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Type</TableCell>
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Contact</TableCell>
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Country</TableCell>
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Gender</TableCell>
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Client Info</TableCell>
                  {isAdminOrManager && <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Assigned To</TableCell>}
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Status</TableCell>
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Order</TableCell>
                  <TableCell sx={{ borderRight: '1px solid rgba(224, 224, 224, 1)', backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Created</TableCell>
                  <TableCell sx={{ backgroundColor: 'background.paper', fontSize: '0.875rem', py: 1 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={isAdminOrManager ? 12 : 11} align="center"><CircularProgress /></TableCell></TableRow>
                  : leads.length === 0 ? <TableRow><TableCell colSpan={isAdminOrManager ? 12 : 11} align="center">No leads found</TableCell></TableRow>
                    : leads.map(lead => (
                      <React.Fragment key={lead._id}>
                        <LeadRow
                          lead={lead}
                          canAssignLeads={canAssignLeads}
                          canDeleteLeads={canDeleteLeads}
                          isAdminOrManager={isAdminOrManager}
                          isLeadManager={isLeadManager}
                          userId={user?.id}
                          user={user}
                          selectedLeads={selectedLeads}
                          expandedRows={expandedRows}
                          onSelectLead={handleSelectLead}
                          onUpdateStatus={updateLeadStatus}
                          onComment={handleOpenCommentDialog}
                          onToggleExpansion={toggleRowExpansion}
                          onFilterByOrder={(orderId) => handleFilterChange("orderId", orderId)}
                          onDeleteLead={handleDeleteLead}
                          handleEditLead={handleEditLead}
                        />
                        {expandedRows.has(lead._id) && (
                          <TableRow>
                            <TableCell colSpan={isAdminOrManager ? 12 : 11} sx={{ bgcolor: 'background.default', borderBottom: '2px solid', borderColor: 'divider', py: 3 }}>
                              <LeadDetails lead={lead} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={totalLeads} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
        </Paper>
      </Box>

      {/* --- Leads Cards (Mobile/Tablet) --- */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
          : leads.length === 0 ? <Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No leads found</Typography></Paper>
            : (
              <Stack spacing={2}>
                {leads.map(lead => (
                  <LeadCard
                    key={lead._id}
                    lead={lead}
                    canAssignLeads={canAssignLeads}
                    canDeleteLeads={canDeleteLeads}
                    selectedLeads={selectedLeads}
                    expandedRows={expandedRows}
                    onSelectLead={handleSelectLead}
                    onUpdateStatus={updateLeadStatus}
                    onComment={handleOpenCommentDialog}
                    onToggleExpansion={toggleRowExpansion}
                    onDeleteLead={handleDeleteLead}
                    user={user}
                    isLeadManager={isLeadManager}
                    handleEditLead={handleEditLead}
                  />
                ))}
                <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={totalLeads} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
              </Stack>
            )}
      </Box>

      {/* --- Dialogs --- */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <form onSubmit={handleCommentSubmit(onSubmitComment)}>
          <DialogContent>
            {selectedLead && <Box mb={2}><Typography variant="subtitle2">Lead: {selectedLead.firstName} {selectedLead.lastName}</Typography><Typography variant="caption" color="textSecondary">{selectedLead.email} • {selectedLead.leadType.toUpperCase()}</Typography></Box>}
            <Controller name="text" control={commentControl} render={({ field }) => (<TextField {...field} fullWidth label="Comment" multiline rows={4} error={!!commentErrors.text} helperText={commentErrors.text?.message} placeholder="Add your comment about this lead..." />)} />
          </DialogContent>
          <DialogActions><Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={isCommentSubmitting}>{isCommentSubmitting ? <CircularProgress size={24} /> : "Add Comment"}</Button></DialogActions>
        </form>
      </Dialog>
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Leads to Agent</DialogTitle>
        <form onSubmit={handleAssignSubmit(onSubmitAssignment)}>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>Assigning {numSelected} lead{numSelected !== 1 ? "s" : ""} to an agent:</Typography>
            <Controller name="agentId" control={assignControl} render={({ field }) => (<FormControl fullWidth error={!!assignErrors.agentId}><InputLabel>Select Agent</InputLabel><Select {...field} label="Select Agent">{agents.map(agent => (<MenuItem key={agent._id} value={agent._id}><Box display="flex" alignItems="center"><Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: "0.75rem" }}>{agent.fourDigitCode || agent.fullName[0]}</Avatar>{agent.fullName} ({agent.fourDigitCode})</Box></MenuItem>))}</Select>{assignErrors.agentId && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{assignErrors.agentId.message}</Typography>}</FormControl>)} />
          </DialogContent>
          <DialogActions><Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button><Button type="submit" variant="contained" disabled={isAssignSubmitting}>{isAssignSubmitting ? <CircularProgress size={24} /> : "Assign Leads"}</Button></DialogActions>
        </form>
      </Dialog>

      {/* Add ImportLeadsDialog */}
      <ImportLeadsDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={fetchLeads}
      />

      <EditLeadForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onLeadUpdated={handleLeadUpdated}
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(5px)',
          }
        }}
      />

      <Dialog
        open={addLeadDialogOpen}
        onClose={() => setAddLeadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(5px)',
          }
        }}
      >
        <DialogTitle>Add New Lead</DialogTitle>
        <DialogContent>
          <AddLeadForm
            onLeadAdded={(lead) => {
              handleLeadAdded(lead);
              setAddLeadDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulk Delete Leads</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Warning: This action will permanently delete all leads matching the selected filters. This action cannot be undone.
          </DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Lead Type</InputLabel>
                <Select
                  value={bulkDeleteFilters.leadType}
                  label="Lead Type"
                  onChange={(e) => setBulkDeleteFilters(prev => ({ ...prev, leadType: e.target.value }))}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.values(LEAD_TYPES).map(type => (
                    <MenuItem key={type} value={type}>
                      {type.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Country</InputLabel>
                <Select
                  value={bulkDeleteFilters.country}
                  label="Country"
                  onChange={(e) => setBulkDeleteFilters(prev => ({ ...prev, country: e.target.value }))}
                >
                  <MenuItem value="">All Countries</MenuItem>
                  {getSortedCountries().map(country => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={bulkDeleteFilters.gender}
                  label="Gender"
                  onChange={(e) => setBulkDeleteFilters(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <MenuItem value="">All Genders</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={bulkDeleteFilters.status}
                  label="Status"
                  onChange={(e) => setBulkDeleteFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(LEAD_STATUSES).map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Document Status</InputLabel>
                <Select
                  value={bulkDeleteFilters.documentStatus}
                  label="Document Status"
                  onChange={(e) => setBulkDeleteFilters(prev => ({ ...prev, documentStatus: e.target.value }))}
                >
                  <MenuItem value="">All Document Statuses</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="ok">OK</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assignment Status</InputLabel>
                <Select
                  value={bulkDeleteFilters.isAssigned}
                  label="Assignment Status"
                  onChange={(e) => setBulkDeleteFilters(prev => ({ ...prev, isAssigned: e.target.value }))}
                >
                  <MenuItem value="">All Assignment Statuses</MenuItem>
                  <MenuItem value={true}>Assigned</MenuItem>
                  <MenuItem value={false}>Unassigned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search"
                value={bulkDeleteFilters.search}
                onChange={(e) => setBulkDeleteFilters(prev => ({ ...prev, search: e.target.value }))}
                helperText="Search by name, email, or phone"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkDelete}
            color="error"
            variant="contained"
          >
            Delete Matching Leads
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// --- Memoized Row Component for Desktop Table ---
const LeadRow = React.memo(({ lead, canAssignLeads, canDeleteLeads, isAdminOrManager, isLeadManager, userId, selectedLeads, expandedRows, onSelectLead, onUpdateStatus, onComment, onToggleExpansion, onFilterByOrder, onDeleteLead, user, handleEditLead }) => {
  const isOwner = !isLeadManager || lead.createdBy === userId;

  const handleRowClick = (event) => {
    if (event.target.closest('button, input, select, [role="combobox"], .MuiSelect-select, .MuiMenuItem-root')) {
      return;
    }
    onToggleExpansion(lead._id);
  };

  const cellSx = {
    borderRight: '1px solid rgba(224, 224, 224, 1)',
    py: 0.5,
    fontSize: '0.875rem'
  };

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{
        '&:hover': { backgroundColor: 'action.hover' },
        borderLeft: theme => `4px solid ${theme.palette[getLeadTypeColor(lead.leadType)]?.main || theme.palette.grey.main}`,
        cursor: 'pointer'
      }}
    >
      {canAssignLeads && <TableCell padding="checkbox" sx={cellSx}><Checkbox checked={selectedLeads.has(lead._id)} onChange={onSelectLead(lead._id)} /></TableCell>}
      <TableCell sx={cellSx}><Stack direction="row" spacing={1} alignItems="center"><Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: theme => theme.palette[getLeadTypeColor(lead.leadType)]?.light, color: theme => theme.palette[getLeadTypeColor(lead.leadType)]?.main }}>{(lead.fullName || `${lead.firstName} ${lead.lastName || ""}`.trim()).charAt(0).toUpperCase()}</Avatar><Box><Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{lead.fullName || `${lead.firstName} ${lead.lastName || ""}`.trim()}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>ID: {lead._id.slice(-8)}</Typography></Box></Stack></TableCell>
      <TableCell sx={cellSx}><Chip label={(lead.leadType || 'unknown').toUpperCase()} color={getLeadTypeColor(lead.leadType)} size="small" sx={{ fontWeight: 'medium', height: '20px', '& .MuiChip-label': { fontSize: '0.75rem', px: 1 } }} /></TableCell>
      <TableCell sx={cellSx}><Stack spacing={0.5}><Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>📧 {lead.newEmail}</Typography><Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>📱 {lead.newPhone || 'N/A'}</Typography></Stack></TableCell>
      <TableCell sx={cellSx}><Chip label={lead.country || 'Unknown'} size="small" variant="outlined" sx={{ height: '20px', '& .MuiChip-label': { fontSize: '0.75rem', px: 1 } }} /></TableCell>
      <TableCell sx={cellSx}>{lead.gender || 'N/A'}</TableCell>
      <TableCell sx={cellSx}>{lead.clientInfo || 'N/A'}</TableCell>
      {isAdminOrManager && <TableCell sx={cellSx}>{lead.assignedTo ? lead.assignedTo.fullName : 'Unassigned'}</TableCell>}
      <TableCell sx={cellSx}><Chip label={lead.status.charAt(0).toUpperCase() + lead.status.slice(1)} color={getStatusColor(lead.status)} size="small" sx={{ height: '20px', '& .MuiChip-label': { fontSize: '0.75rem', px: 1 } }} /></TableCell>
      <TableCell sx={cellSx}>{lead.orderId ? <Link component="button" onClick={(e) => { e.stopPropagation(); onFilterByOrder(typeof lead.orderId === 'object' ? lead.orderId._id : lead.orderId); }} sx={{ fontSize: '0.875rem' }}>{(typeof lead.orderId === 'object' ? lead.orderId._id : lead.orderId).slice(-8)}</Link> : 'N/A'}</TableCell>
      <TableCell sx={cellSx}>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
      <TableCell sx={{ py: 0.5 }}>
        <Stack direction="row" spacing={0.5}>
          <FormControl size="small" sx={{ minWidth: 100 }}><Select value={lead.status} onChange={(e) => onUpdateStatus(lead._id, e.target.value)} size="small" disabled={!isOwner} sx={{ '& .MuiSelect-select': { py: 0.5, fontSize: '0.875rem' } }}>{Object.values(LEAD_STATUSES).map(status => <MenuItem key={status} value={status} sx={{ fontSize: '0.875rem' }}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>)}</Select></FormControl>
          <IconButton size="small" onClick={() => onComment(lead)} disabled={!isOwner}><CommentIcon sx={{ fontSize: '1.25rem' }} /></IconButton>
          {(user?.role === ROLES.ADMIN || (isLeadManager && lead.createdBy === user?.id)) && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditLead(lead); }} title="Edit Lead">
              <EditIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          )}
          {canDeleteLeads && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this lead?')) { onDeleteLead(lead._id); } }} color="error">
              <DeleteIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          )}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleExpansion(lead._id); }}>
            {expandedRows.has(lead._id) ? <ExpandLessIcon sx={{ fontSize: '1.25rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '1.25rem' }} />}
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  )
});

// --- Memoized Card Component for Mobile View ---
const LeadCard = React.memo(({ lead, canAssignLeads, canDeleteLeads, selectedLeads, expandedRows, onSelectLead, onUpdateStatus, onComment, onToggleExpansion, onDeleteLead, user, isLeadManager, handleEditLead }) => {
  const handleCardClick = (event) => {
    if (event.target.closest('button, input, select, [role="combobox"], .MuiSelect-select, .MuiMenuItem-root')) {
      return;
    }
    onToggleExpansion(lead._id);
  };

  return (
    <Paper
      onClick={handleCardClick}
      sx={{
        p: 2,
        borderLeft: theme => `4px solid ${theme.palette[getLeadTypeColor(lead.leadType)]?.main || theme.palette.grey.main}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'action.hover',
          transform: 'translateX(4px)',
          boxShadow: theme => theme.shadows[4],
        },
        '& .MuiChip-root': {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        '& .MuiIconButton-root': {
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: 'action.hover',
          },
        },
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: theme => theme.palette[getLeadTypeColor(lead.leadType)]?.light, color: theme => theme.palette[getLeadTypeColor(lead.leadType)]?.main }}>{(lead.fullName || `${lead.firstName} ${lead.lastName || ""}`.trim()).charAt(0).toUpperCase()}</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {lead.fullName || `${lead.firstName} ${lead.lastName || ""}`.trim()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {lead._id.slice(-8)}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={(lead.leadType || 'unknown').toUpperCase()}
                color={getLeadTypeColor(lead.leadType)}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
              <Chip
                label={lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                color={getStatusColor(lead.status)}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12}><Divider /></Grid>
        <Grid item xs={12}><FormControl size="small" fullWidth><InputLabel>Status</InputLabel><Select value={lead.status} label="Status" onChange={(e) => onUpdateStatus(lead._id, e.target.value)} size="small">{Object.values(LEAD_STATUSES).map(status => <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>)}</Select></FormControl></Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpansion(lead._id);
              }}
              sx={{ transform: expandedRows.has(lead._id) ? 'rotate(180deg)' : 'none' }}
            >
              <ExpandMoreIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onComment(lead)} sx={{ color: 'info.main' }}><CommentIcon /></IconButton>
            {(user?.role === ROLES.ADMIN || (isLeadManager && lead.createdBy === user?.id)) && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditLead(lead);
                }}
                title="Edit Lead"
              >
                <EditIcon />
              </IconButton>
            )}
            {canDeleteLeads && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this lead?')) {
                    onDeleteLead(lead._id);
                  }
                }}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            )}
            {canAssignLeads && <Checkbox checked={selectedLeads.has(lead._id)} onChange={onSelectLead(lead._id)} size="small" />}
          </Stack>
        </Grid>
        <Collapse in={expandedRows.has(lead._id)} sx={{ width: '100%' }}>
          <Grid item xs={12}>
            <Box sx={{ mt: 2, pb: 2, overflowX: 'hidden' }}>
              <LeadDetails lead={lead} />
            </Box>
          </Grid>
        </Collapse>
      </Grid>
    </Paper>
  )
});



export default LeadsPage;