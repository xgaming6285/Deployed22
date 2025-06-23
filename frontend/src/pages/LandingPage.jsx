import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Fade,
} from "@mui/material";
import {
  Email,
  Person,
  Phone,
  Public,
  Send,
  CheckCircle,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { motion } from "framer-motion";
import api from "../services/api"; // Import the API service

// Country codes for the prefix dropdown
const countryCodes = [
  { code: "+1", country: "US/Canada" },
  { code: "+44", country: "UK" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+31", country: "Netherlands" },
  { code: "+46", country: "Sweden" },
  { code: "+47", country: "Norway" },
  { code: "+45", country: "Denmark" },
  { code: "+41", country: "Switzerland" },
  { code: "+43", country: "Austria" },
  { code: "+32", country: "Belgium" },
  { code: "+351", country: "Portugal" },
  { code: "+30", country: "Greece" },
  { code: "+48", country: "Poland" },
  { code: "+7", country: "Russia" },
  { code: "+81", country: "Japan" },
  { code: "+86", country: "China" },
  { code: "+91", country: "India" },
  { code: "+61", country: "Australia" },
  { code: "+64", country: "New Zealand" },
  { code: "+27", country: "South Africa" },
  { code: "+55", country: "Brazil" },
  { code: "+52", country: "Mexico" },
  { code: "+971", country: "UAE" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+965", country: "Kuwait" },
  { code: "+974", country: "Qatar" },
  { code: "+973", country: "Bahrain" },
];

// Validation schema
const schema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  prefix: yup.string().required("Country code is required"),
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^\d+$/, "Phone number must contain only digits")
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number must not exceed 15 digits"),
});

const LandingPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      prefix: "+1",
      phone: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSubmitError("");

    try {
      // Check if we're in injection mode (set by the injector script)
      const isInjectionMode = window.localStorage.getItem('isInjectionMode') === 'true';
      
      if (isInjectionMode) {
        // Skip API call in injection mode, just show success
        setIsSubmitted(true);
        reset();
        return;
      }

      const response = await api.post("/landing", data);
      
      if (response.data.success) {
        setIsSubmitted(true);
        reset();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      
      if (error.response?.data?.message) {
        setSubmitError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(", ");
        setSubmitError(errorMessages);
      } else {
        setSubmitError("Something went wrong. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Fade in={isSubmitted} timeout={1000}>
            <Paper
              elevation={24}
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 4,
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              >
                <CheckCircle 
                  sx={{ 
                    fontSize: 80, 
                    color: "success.main",
                    mb: 2 
                  }} 
                />
              </motion.div>
              
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: "text.primary" }}>
                Thank You!
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 3, color: "text.secondary" }}>
                Your information has been submitted successfully.
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
                We'll be in touch with you soon. Our team will contact you within 24 hours.
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={() => setIsSubmitted(false)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                  },
                }}
              >
                Submit Another Form
              </Button>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 2,
                }}
              >
                Get Started Today
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  maxWidth: 600,
                  mx: "auto",
                  mb: 1,
                }}
              >
                Join thousands of satisfied customers. Fill out the form below and our team will contact you within 24 hours.
              </Typography>
              
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontStyle: "italic" }}
              >
                Your information is secure and will never be shared with third parties.
              </Typography>
            </Box>

            {submitError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {submitError}
              </Alert>
            )}

            <Box 
              component="form" 
              id="landingForm"
              data-testid="landingForm"
              onSubmit={handleSubmit(onSubmit)}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="First Name"
                        id="firstName"
                        data-testid="firstName"
                        name="firstName"
                        placeholder="Enter your first name"
                        error={!!errors.firstName}
                        helperText={errors.firstName?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Last Name"
                        id="lastName"
                        data-testid="lastName"
                        name="lastName"
                        placeholder="Enter your last name"
                        error={!!errors.lastName}
                        helperText={errors.lastName?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email Address"
                        type="email"
                        id="email"
                        data-testid="email"
                        name="email"
                        placeholder="Enter your email address"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    name="prefix"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.prefix}>
                        <InputLabel id="prefix-label">Country Code</InputLabel>
                        <Select
                          {...field}
                          labelId="prefix-label"
                          label="Country Code"
                          id="prefix"
                          data-testid="prefix"
                          name="prefix"
                          startAdornment={
                            <InputAdornment position="start">
                              <Public sx={{ color: "primary.main", ml: 1 }} />
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: 2,
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          }}
                        >
                          {countryCodes.map((item) => (
                            <MenuItem 
                              key={item.code} 
                              value={item.code}
                              data-testid={`prefix-option-${item.code.replace('+', '')}`}
                            >
                              {item.code} ({item.country})
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.prefix && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                            {errors.prefix.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone Number"
                        id="phone"
                        data-testid="phone"
                        name="phone"
                        placeholder="Enter your phone number"
                        error={!!errors.phone}
                        helperText={errors.phone?.message || "Enter your phone number without the country code"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    id="submitBtn"
                    data-testid="submitBtn"
                    disabled={isLoading}
                    sx={{
                      py: 2,
                      borderRadius: 3,
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
                      },
                      "&:disabled": {
                        background: "rgba(0, 0, 0, 0.12)",
                      },
                      transition: "all 0.3s ease",
                    }}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Send />
                      )
                    }
                  >
                    {isLoading ? "Submitting..." : "Submit Information"}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✨ Why choose us?
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 3 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  🔒 Secure & Private
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  ⚡ Fast Response
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  💬 24/7 Support
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  ✅ No Hidden Fees
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LandingPage; 