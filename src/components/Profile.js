import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Divider,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  Button,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { getUserStats } from "../firebase/firestore";

function Profile() {
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userStats = await getUserStats(currentUser.uid);
        setStats(userStats);
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError("Failed to load your statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Profile
          </Typography>
          <Typography>Please log in to view your profile.</Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            src={currentUser.photoURL}
            alt={currentUser.displayName || currentUser.email}
            sx={{ width: 80, height: 80, mr: 2 }}
          />
          <Box>
            <Typography variant="h5">
              {currentUser.displayName || "User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Member since{" "}
              {currentUser.metadata?.creationTime
                ? new Date(
                    currentUser.metadata.creationTime
                  ).toLocaleDateString()
                : "Unknown"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Subscription Status
        </Typography>
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="subtitle1">
                {subscription.plan.charAt(0).toUpperCase() +
                  subscription.plan.slice(1)}{" "}
                Plan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subscription.features.quizLimit === Infinity
                  ? "Unlimited"
                  : subscription.features.quizLimit}{" "}
                daily quizzes • Up to {subscription.features.questionsPerQuiz}{" "}
                questions per quiz
              </Typography>
              {subscription.plan !== "PREMIUM" && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    href="/subscription"
                    sx={{ ml: 1 }}
                  >
                    Upgrade Plan
                  </Button>
                </Alert>
              )}
            </Box>
            <Chip
              label={
                subscription.plan === "PREMIUM"
                  ? "Premium"
                  : "Upgrade Available"
              }
              color={subscription.plan === "PREMIUM" ? "secondary" : "primary"}
            />
          </Box>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Quiz Statistics
        </Typography>

        {error ? (
          <Typography color="error">{error}</Typography>
        ) : stats ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4">{stats.totalQuizzes || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Quizzes Completed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4">
                  {stats.averageScore ? `${stats.averageScore}%` : "0%"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4">
                  {stats.totalQuestions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Questions Answered
                </Typography>
              </Paper>
            </Grid>

            {stats.topTopics && stats.topTopics.length > 0 && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Top Topics
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {stats.topTopics.map((topic, index) => (
                      <Chip
                        key={index}
                        label={`${topic.name}: ${topic.score}%`}
                        color={
                          topic.score >= 80
                            ? "success"
                            : topic.score >= 60
                            ? "primary"
                            : "default"
                        }
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography>
            No quiz data available yet. Complete some quizzes to see your
            statistics!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default Profile;
