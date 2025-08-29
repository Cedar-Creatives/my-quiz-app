import React, { useMemo, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Stack,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Paper,
  Tooltip,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

function Home({
  onStartQuiz,
  initialTopic,
  initialComplexity,
  initialNumQuestions,
  progress,
  onResetProgress,
}) {
  const { currentUser } = useAuth();
  const [topic, setTopic] = useState(initialTopic || "");
  const [complexity, setComplexity] = useState(initialComplexity || "beginner");
  const [numQuestions, setNumQuestions] = useState(initialNumQuestions || 10); // Default to 10 questions
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleStart = () => {
    if (topic) onStartQuiz(topic, complexity, numQuestions);
  };

  // Clean up duplicate progress entries
  const handleCleanupProgress = () => {
    if (progress && progress.history && Array.isArray(progress.history)) {
      const uniqueHistoryMap = new Map();
      progress.history.forEach((item) => {
        const key = `${item.topic}-${item.ts}-${item.accuracy}`;
        if (!uniqueHistoryMap.has(key)) {
          uniqueHistoryMap.set(key, item);
        }
      });

      const cleanedHistory = Array.from(uniqueHistoryMap.values())
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 1000);

      // Update progress with cleaned history
      const cleanedProgress = {
        ...progress,
        history: cleanedHistory,
      };

      // Save to localStorage
      try {
        localStorage.setItem("progress_v1", JSON.stringify(cleanedProgress));
        window.location.reload(); // Refresh to show cleaned data
      } catch (e) {
        console.warn("Failed to save cleaned progress");
      }
    }
  };

  const overall = progress?.overall || {
    quizzes: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    accuracy: 0,
  };
  const byTopic = useMemo(() => progress?.byTopic || {}, [progress?.byTopic]);
  const topics = Object.keys(byTopic);

  const formatDateTime = (ts) => {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "—";
    }
  };

  const toLocalDateKey = (ts) => {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const last7Days = useMemo(() => {
    const now = Date.now();
    const start = now - 7 * 24 * 60 * 60 * 1000;
    const history = Array.isArray(progress?.history) ? progress.history : [];
    const filtered = history.filter((h) => h.ts >= start);
    const total = filtered.reduce((acc, h) => acc + h.total, 0);
    const correct = filtered.reduce((acc, h) => acc + h.correct, 0);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    // build daily buckets for a tiny trend sparkline
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayTotal = filtered
        .filter((h) => h.ts >= dayStart.getTime() && h.ts <= dayEnd.getTime())
        .reduce((acc, h) => acc + h.total, 0);
      const dayCorrect = filtered
        .filter((h) => h.ts >= dayStart.getTime() && h.ts <= dayEnd.getTime())
        .reduce((acc, h) => acc + h.correct, 0);
      const dayAcc =
        dayTotal > 0 ? Math.round((dayCorrect / dayTotal) * 100) : 0;
      days.push({
        label: dayStart.toLocaleDateString(undefined, { weekday: "short" }),
        acc: dayAcc,
        total: dayTotal,
      });
    }
    return { total, correct, accuracy, days };
  }, [progress]);

  const maxAnswered = useMemo(() => {
    const vals = Object.values(byTopic).map((v) => v.questionsAnswered || 0);
    return vals.length ? Math.max(...vals) : 0;
  }, [byTopic]);

  const streakDays = useMemo(() => {
    const history = Array.isArray(progress?.history) ? progress.history : [];
    const daySet = new Set(history.map((h) => toLocalDateKey(h.ts)));
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    let count = 0;
    while (daySet.has(toLocalDateKey(cur.getTime()))) {
      count += 1;
      cur.setDate(cur.getDate() - 1);
    }
    return count;
  }, [progress]);

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", marginTop: "50px" }}>
      <Typography variant="h4" gutterBottom>
        Software Engineering Quiz App
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Test your software engineering knowledge!
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Complexity</InputLabel>
        <Select
          value={complexity}
          onChange={(e) => setComplexity(e.target.value)}
        >
          <MenuItem value="beginner">Beginner</MenuItem>
          <MenuItem value="intermediate">Intermediate</MenuItem>
          <MenuItem value="advanced">Advanced</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Enter Quiz Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Number of Questions (1-100)"
        type="number"
        value={numQuestions}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          if (!isNaN(value) && value >= 1 && value <= 100) {
            setNumQuestions(value);
          } else if (e.target.value === "") {
            setNumQuestions(""); // Allow clearing the input
          }
        }}
        inputProps={{ min: 1, max: 100 }}
        margin="normal"
      />
      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        sx={{ mt: 1, mb: 2 }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleStart}
          disabled={!topic}
        >
          Start Quiz
        </Button>
        {overall.quizzes > 0 && (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setConfirmOpen(true)}
            >
              Reset Progress
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCleanupProgress}
              title="Clean up duplicate quiz history entries"
            >
              Clean History
            </Button>
          </>
        )}
      </Stack>

      {overall.quizzes > 0 && (
        <Box mt={2} textAlign="left">
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Your Progress
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
            <Tooltip title="Consecutive days with at least one quiz completed (includes today)">
              <Chip
                label={`Streak: ${streakDays} day${
                  streakDays === 1 ? "" : "s"
                } 🔥`}
                color={streakDays > 0 ? "secondary" : "default"}
              />
            </Tooltip>
            <Chip label={`Quizzes: ${overall.quizzes}`} color="primary" />
            <Chip label={`Answered: ${overall.questionsAnswered}`} />
            <Chip label={`Correct: ${overall.correctAnswers}`} />
            <Chip
              label={`Accuracy: ${overall.accuracy}%`}
              color={
                overall.accuracy >= 80
                  ? "success"
                  : overall.accuracy <= 50
                  ? "warning"
                  : "default"
              }
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last quiz completed: {formatDateTime(overall.lastCompletedAt)}
          </Typography>

          {/* Overall accuracy progress bar */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Overall Accuracy</Typography>
            <LinearProgress
              variant="determinate"
              value={overall.accuracy}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          {topics.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                By Topic
              </Typography>
              <Stack spacing={1}>
                {topics.slice(0, 10).map((t) => (
                  <Paper key={t} variant="outlined" sx={{ p: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="subtitle2">{t}</Typography>
                      <Tooltip
                        title={`Quizzes: ${byTopic[t].quizzes} • Answered: ${byTopic[t].questionsAnswered} • Correct: ${byTopic[t].correctAnswers}`}
                      >
                        <Chip
                          size="small"
                          label={`${byTopic[t].accuracy}%`}
                          color={
                            byTopic[t].accuracy >= 80
                              ? "success"
                              : byTopic[t].accuracy <= 50
                              ? "warning"
                              : "default"
                          }
                        />
                      </Tooltip>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Accuracy
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={byTopic[t].accuracy}
                      sx={{ height: 8, borderRadius: 4, mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Practice Volume
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        maxAnswered > 0
                          ? Math.round(
                              (byTopic[t].questionsAnswered / maxAnswered) * 100
                            )
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 4, mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Questions answered: {byTopic[t].questionsAnswered}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      Last: {byTopic[t].lastScore}% ({byTopic[t].lastDifficulty}
                      ) • {formatDateTime(byTopic[t].lastCompletedAt)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </>
          )}

          {/* Last 7 days trend */}
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Last 7 Days Trend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {last7Days.total > 0
                ? `Answered ${last7Days.correct}/${last7Days.total} correctly (${last7Days.accuracy}%)`
                : "No activity in the last 7 days."}
            </Typography>
            <Stack direction="row" spacing={1}>
              {last7Days.days.map((d, idx) => (
                <Tooltip
                  key={idx}
                  title={`${d.label}: ${d.acc}% accuracy • ${d.total} answered`}
                >
                  <Box sx={{ width: "100%", textAlign: "center" }}>
                    <LinearProgress
                      variant="determinate"
                      value={d.acc}
                      sx={{ height: 20, borderRadius: 1 }}
                    />
                    <Typography variant="caption">{d.label}</Typography>
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        </Box>
      )}

      {/* Cloud sync indicator */}
      {currentUser && (
        <Box mt={2} mb={2}>
          <Alert severity="info" variant="outlined">
            Your quiz data is being synchronized with the cloud. You can access
            your progress on any device when logged in.
          </Alert>
        </Box>
      )}

      {/* Confirm Reset Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Reset Progress?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {currentUser
              ? "This will reset your local progress. Your cloud data will be preserved and will sync again on your next quiz completion."
              : "This will permanently delete your local progress (overall stats, per-topic stats, and history). This cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setConfirmOpen(false);
              onResetProgress && onResetProgress();
            }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Home;
