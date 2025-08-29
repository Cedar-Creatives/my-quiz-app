import React, { useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import {
  useSubscription,
  SUBSCRIPTION_PLANS,
  PLAN_FEATURES,
} from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";

function SubscriptionPlans() {
  const { subscription, upgradePlan } = useSubscription();
  const { currentUser } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Mock payment processing
  const handleUpgrade = async () => {
    if (!selectedPlan || !currentUser) return;

    setLoading(true);
    setError("");

    try {
      // In a real app, this would integrate with a payment processor like Stripe
      // For this demo, we'll simulate a successful payment after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Calculate expiry date (1 month from now)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      // Update subscription in Firestore
      const result = await upgradePlan(selectedPlan, expiryDate);

      if (result) {
        setSuccess(true);
        setTimeout(() => {
          setOpenDialog(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError("Failed to upgrade subscription. Please try again.");
      }
    } catch (error) {
      setError("Payment processing failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan) => {
    setSelectedPlan(plan);
    setOpenDialog(true);
    setError("");
    setSuccess(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPlan(null);
  };

  const getPlanPrice = (plan) => {
    switch (plan) {
      case SUBSCRIPTION_PLANS.FREE:
        return "Free";
      case SUBSCRIPTION_PLANS.BASIC:
        return "$4.99/month";
      case SUBSCRIPTION_PLANS.PREMIUM:
        return "$9.99/month";
      default:
        return "";
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscription Plans
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Choose the plan that best fits your learning needs
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                ...(subscription.plan === plan
                  ? {
                      border: "2px solid",
                      borderColor: "primary.main",
                    }
                  : {}),
              }}
            >
              {subscription.plan === plan && (
                <Chip
                  label="Current Plan"
                  color="primary"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    align="center"
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    {plan === SUBSCRIPTION_PLANS.PREMIUM && (
                      <StarIcon sx={{ ml: 1, color: "gold" }} />
                    )}
                  </Typography>
                </Box>

                <Typography
                  variant="h4"
                  component="p"
                  align="center"
                  gutterBottom
                >
                  {getPlanPrice(plan)}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      {PLAN_FEATURES[plan].quizLimit === Infinity ? (
                        <CheckIcon color="success" />
                      ) : (
                        <Typography variant="body2">
                          {PLAN_FEATURES[plan].quizLimit}
                        </Typography>
                      )}
                    </ListItemIcon>
                    <ListItemText primary="Daily Quizzes" />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Typography variant="body2">
                        {PLAN_FEATURES[plan].questionsPerQuiz}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText primary="Questions Per Quiz" />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      {PLAN_FEATURES[plan].analytics ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="Advanced Analytics"
                      secondary={
                        PLAN_FEATURES[plan].analytics
                          ? "Detailed performance tracking"
                          : "Basic stats only"
                      }
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      {PLAN_FEATURES[plan].explanations ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="Detailed Explanations"
                      secondary={
                        PLAN_FEATURES[plan].explanations
                          ? "Learn from your mistakes"
                          : "Basic feedback only"
                      }
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      {PLAN_FEATURES[plan].topics === null ? (
                        <CheckIcon color="success" />
                      ) : (
                        <Typography variant="body2">
                          {PLAN_FEATURES[plan].topics.length}
                        </Typography>
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="Available Topics"
                      secondary={
                        PLAN_FEATURES[plan].topics === null
                          ? "All topics included"
                          : `Limited to ${PLAN_FEATURES[plan].topics.length} topics`
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>

              <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                {subscription.plan === plan ? (
                  <Button variant="outlined" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color={
                      plan === SUBSCRIPTION_PLANS.PREMIUM
                        ? "secondary"
                        : "primary"
                    }
                    onClick={() => handleOpenDialog(plan)}
                    disabled={!currentUser}
                  >
                    {plan === SUBSCRIPTION_PLANS.FREE ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!currentUser && (
        <Alert severity="info" sx={{ mt: 4 }}>
          Please log in to upgrade your subscription.
        </Alert>
      )}

      {/* Payment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedPlan === SUBSCRIPTION_PLANS.FREE
            ? "Downgrade to Free Plan"
            : `Upgrade to ${
                selectedPlan?.charAt(0).toUpperCase() + selectedPlan?.slice(1)
              } Plan`}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Subscription updated successfully!
            </Alert>
          )}

          {!success && (
            <>
              <Typography variant="body1" paragraph>
                {selectedPlan === SUBSCRIPTION_PLANS.FREE
                  ? "Are you sure you want to downgrade to the Free plan? You will lose access to premium features."
                  : `You are about to subscribe to the ${
                      selectedPlan?.charAt(0).toUpperCase() +
                      selectedPlan?.slice(1)
                    } plan for ${getPlanPrice(selectedPlan)}.`}
              </Typography>

              {selectedPlan !== SUBSCRIPTION_PLANS.FREE && (
                <Typography variant="body2" color="text.secondary">
                  Your subscription will renew automatically each month until
                  canceled.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            variant="contained"
            color={
              selectedPlan === SUBSCRIPTION_PLANS.FREE ? "error" : "primary"
            }
            disabled={loading || success}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading
              ? "Processing..."
              : selectedPlan === SUBSCRIPTION_PLANS.FREE
              ? "Downgrade"
              : "Confirm Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SubscriptionPlans;
