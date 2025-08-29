import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Container,
  Stack,
  Chip,
  Divider,
  Box,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

function Results({ userAnswers, onRetake, currentDifficulty, progress }) {
  const { currentUser } = useAuth();
  const total = userAnswers.length;
  const score = userAnswers.filter(
    (ans) => ans.selected === ans.correct
  ).length;
  const missed = userAnswers.filter((ans) => ans.selected !== ans.correct);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Adaptive difficulty suggestion logic
  const suggestNextDifficulty = (current, pct) => {
    const order = ["beginner", "intermediate", "advanced"];
    const idx = order.indexOf(current) === -1 ? 1 : order.indexOf(current); // default to intermediate if unknown
    if (pct >= 80) return order[Math.min(idx + 1, order.length - 1)];
    if (pct <= 50) return order[Math.max(idx - 1, 0)];
    return order[idx];
  };

  const nextDifficulty = suggestNextDifficulty(currentDifficulty, percentage);

  const handleRetakeSuggested = () => {
    onRetake(nextDifficulty);
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", marginTop: "50px" }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Quiz Complete!
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mb: 1 }}
          >
            <Chip label={`Score: ${score}/${total}`} color="primary" />
            <Chip
              label={`Accuracy: ${percentage}%`}
              color={
                percentage >= 80
                  ? "success"
                  : percentage <= 50
                  ? "warning"
                  : "default"
              }
            />
            {currentDifficulty && (
              <Chip label={`Current: ${currentDifficulty}`} />
            )}
          </Stack>
          <Typography variant="subtitle1" gutterBottom>
            Suggested next difficulty: <strong>{nextDifficulty}</strong>
          </Typography>

          {/* Past Quiz Results */}
          {progress && progress.history && progress.history.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Recent Quiz History:
              </Typography>
              <Box sx={{ mb: 2 }}>
                {progress.history
                  .slice(-3)
                  .reverse()
                  .map((quiz, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mb: 1,
                        p: 1,
                        border: "1px solid #eee",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Topic: <strong>{quiz.topic}</strong> | Difficulty:{" "}
                        <strong>{quiz.difficulty}</strong> | Score:{" "}
                        <strong>{quiz.accuracy}%</strong> | Date:{" "}
                        <strong>
                          {new Date(quiz.ts).toLocaleDateString()}
                        </strong>
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </>
          )}
          {missed.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Missed Questions:
              </Typography>
              <List>
                {missed.map((ans, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={ans.question}
                      secondary={`Your answer: ${
                        ans.selected === "No Answer"
                          ? "No Answer (Time Expired)"
                          : ans.selected
                      } | Correct: ${ans.correct}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          {currentUser && (
            <Box mt={2} mb={2}>
              <Alert severity="success" variant="outlined">
                Your quiz result has been saved to the cloud!
              </Alert>
            </Box>
          )}

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" onClick={() => onRetake()}>
              Back to Home
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetakeSuggested}
            >
              Retake with {nextDifficulty}
            </Button>
            <Button variant="outlined" color="secondary" href="/subscription">
              Upgrade to Premium
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Results;
