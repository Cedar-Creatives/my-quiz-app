import React, { useState, useEffect } from "react";
import {
  CssBaseline,
  CircularProgress,
  Container,
  Alert,
  Button,
} from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  SubscriptionProvider,
  useSubscription,
} from "./context/SubscriptionContext";
import { saveQuizResult, getUserQuizHistory } from "./firebase/firestore";
import Home from "./components/Home";
import Quiz from "./components/Quiz";
import Results from "./components/Results";
import Profile from "./components/Profile";
import SubscriptionPlans from "./components/SubscriptionPlans";
import "./App.css";
import Auth from "./components/Auth";
import PrivateRoute from "./components/PrivateRoute";

function AppContent() {
  const [screen, setScreen] = useState("home");
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizComplexity, setQuizComplexity] = useState("");
  const [quizNumQuestions, setQuizNumQuestions] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({
    overall: {
      quizzes: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      lastCompletedAt: null,
    },
    byTopic: {},
    history: [],
  });
  const { currentUser } = useAuth();
  const { subscription, canTakeQuiz, incrementQuizCount } = useSubscription();

  useEffect(() => {
    // Load progress from localStorage on mount
    try {
      const saved = localStorage.getItem("progress_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProgress(normalizeProgress(parsed));
      }
    } catch (e) {
      console.warn("Failed to parse saved progress");
    }
  }, []);

  // Load quiz history from Firestore when user changes
  useEffect(() => {
    const loadFirestoreData = async () => {
      if (currentUser) {
        try {
          // Get user's quiz history from Firestore
          const quizHistory = await getUserQuizHistory(currentUser.uid, 10);

          // If we have Firestore data, update the local progress
          if (quizHistory && quizHistory.length > 0) {
            // Convert Firestore data to match local format
            const firestoreHistory = quizHistory.map((quiz) => ({
              ts: quiz.timestamp?.toMillis() || Date.now(),
              topic: quiz.topic,
              difficulty: quiz.difficulty,
              total: quiz.totalQuestions,
              correct: quiz.score,
              accuracy: quiz.percentage,
            }));

            // Merge with existing history, prioritizing Firestore data
            const next = JSON.parse(JSON.stringify(progress));
            next.history = [...firestoreHistory, ...next.history]
              // Remove duplicates (based on timestamp)
              .filter(
                (item, index, self) =>
                  index === self.findIndex((t) => t.ts === item.ts)
              )
              // Sort by timestamp (newest first)
              .sort((a, b) => b.ts - a.ts)
              // Limit to 1000 entries
              .slice(0, 1000);

            setProgress(next);
            saveProgress(next);
          }
        } catch (error) {
          console.error("Error loading quiz history from Firestore:", error);
        }
      }
    };

    loadFirestoreData();
  }, [currentUser?.uid, progress]);

  const normalizeProgress = (p) => {
    const base = {
      overall: {
        quizzes: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        lastCompletedAt: null,
      },
      byTopic: {},
      history: [],
    };
    const merged = { ...base, ...p };
    merged.overall = {
      ...base.overall,
      ...(p?.overall || {}),
      lastCompletedAt: p?.overall?.lastCompletedAt || null,
    };
    const newByTopic = {};
    const srcByTopic = p?.byTopic || {};
    Object.keys(srcByTopic).forEach((k) => {
      const t = srcByTopic[k] || {};
      newByTopic[k] = {
        quizzes: t.quizzes || 0,
        questionsAnswered: t.questionsAnswered || 0,
        correctAnswers: t.correctAnswers || 0,
        accuracy: t.accuracy || 0,
        lastDifficulty: t.lastDifficulty || "beginner",
        lastScore: t.lastScore || 0,
        lastCompletedAt: t.lastCompletedAt || null,
      };
    });
    merged.byTopic = newByTopic;
    merged.history = Array.isArray(p?.history) ? p.history : [];
    return merged;
  };

  const saveProgress = (p) => {
    try {
      localStorage.setItem("progress_v1", JSON.stringify(p));
    } catch (e) {
      console.warn("Failed to save progress");
    }
  };

  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
  console.log("Backend URL being used:", backendUrl);

  const handleStartQuiz = async (topic, complexity, numQuestions) => {
    setQuizTopic(topic);
    setQuizComplexity(complexity);

    // Check if user can take another quiz based on subscription plan
    if (currentUser && !canTakeQuiz()) {
      setError(
        `You've reached your daily quiz limit (${subscription.features.quizLimit} quizzes). Upgrade your plan for unlimited access!`
      );
      return;
    }

    // Check if requested number of questions exceeds subscription limit
    const maxQuestions = subscription.features.questionsPerQuiz;
    const adjustedNumQuestions = Math.min(numQuestions, maxQuestions);

    if (adjustedNumQuestions < numQuestions) {
      setError(
        `Your current plan allows maximum ${maxQuestions} questions per quiz. Upgrade for more!`
      );
      // We'll still proceed with the maximum allowed questions
    }

    setQuizNumQuestions(adjustedNumQuestions);
    setIsLoading(true);
    setError("");

    try {
      // Increment quiz count in subscription
      if (currentUser) {
        await incrementQuizCount();
      }

      // Include last score so backend can adapt difficulty for the next quiz
      const lastScore = progress?.byTopic?.[topic]?.lastScore;
      const response = await fetch(`${backendUrl}/api/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          complexity,
          numQuestions: adjustedNumQuestions,
          score: lastScore,
        }),
      });
      if (!response.ok) {
        // Try to parse any details from backend
        let detail = "";
        try {
          const errJson = await response.json();
          detail = errJson?.details || errJson?.error || "";
        } catch (e) {
          try {
            detail = await response.text();
          } catch {}
        }
        // Specific handling for 402 Payment Required (insufficient credits)
        if (response.status === 402) {
          setError(
            `We’re out of AI credits. Try fewer questions or come back later.${
              detail ? ` (${detail})` : ""
            }`
          );
          return; // Stop here—don’t proceed or throw generic error
        }
        throw new Error(
          `Backend error ${response.status}${detail ? `: ${detail}` : ""}`
        );
      }
      const data = await response.json();
      if (
        !data.questions ||
        !Array.isArray(data.questions) ||
        data.questions.length === 0
      ) {
        throw new Error("Invalid quiz data received");
      }
      setQuestions(data.questions);
      setScreen("quiz");
    } catch (error) {
      console.error("Error fetching quiz:", error);
      // Keep this generic path for non-402 errors
      setError(
        `Failed to generate quiz. ${error.message}. Please ensure your backend is healthy and the selected model is available.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Demo mode: local, static questions without backend
  const handleStartDemo = () => {
    const demoQuestions = [
      {
        question: "What does === check in JavaScript?",
        options: [
          "Value only",
          "Type only",
          "Value and type",
          "Reference only",
        ],
        correctAnswer: "Value and type",
      },
      {
        question: "Which array method creates a new array without mutating?",
        options: ["push", "splice", "map", "sort"],
        correctAnswer: "map",
      },
      {
        question: "What is the output of typeof null?",
        options: ["null", "undefined", "object", "number"],
        correctAnswer: "object",
      },
      {
        question: "Which keyword declares a block-scoped variable?",
        options: ["var", "let", "function", "const var"],
        correctAnswer: "let",
      },
    ];
    setQuizTopic("JavaScript Demo");
    setQuizComplexity("beginner");
    setQuizNumQuestions(demoQuestions.length);
    setQuestions(demoQuestions);
    setScreen("quiz");
  };

  const updateProgress = async (topic, difficulty, answers) => {
    const total = answers.length;
    const correct = answers.filter((a) => a.isCorrect).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    const now = Date.now();
    const next = JSON.parse(JSON.stringify(progress));

    // overall
    next.overall.quizzes += 1;
    next.overall.questionsAnswered += total;
    next.overall.correctAnswers += correct;
    next.overall.accuracy =
      next.overall.questionsAnswered > 0
        ? Math.round(
            (next.overall.correctAnswers / next.overall.questionsAnswered) * 100
          )
        : 0;
    next.overall.lastCompletedAt = now;

    // by topic
    if (!next.byTopic[topic]) {
      next.byTopic[topic] = {
        quizzes: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        lastDifficulty: difficulty,
        lastScore: 0,
        lastCompletedAt: null,
      };
    }
    const t = next.byTopic[topic];
    t.quizzes += 1;
    t.questionsAnswered += total;
    t.correctAnswers += correct;
    t.accuracy =
      t.questionsAnswered > 0
        ? Math.round((t.correctAnswers / t.questionsAnswered) * 100)
        : 0;
    t.lastDifficulty = difficulty;
    t.lastScore = percentage;
    t.lastCompletedAt = now;

    // history (append)
    if (!Array.isArray(next.history)) next.history = [];
    next.history.push({
      ts: now,
      topic,
      difficulty,
      total,
      correct,
      accuracy: percentage,
    });
    // Optionally cap history length
    if (next.history.length > 1000) {
      next.history = next.history.slice(next.history.length - 1000);
    }

    setProgress(next);
    saveProgress(next);

    // Save to Firestore if user is logged in
    if (currentUser) {
      try {
        await saveQuizResult(currentUser.uid, {
          topic,
          difficulty,
          score: correct,
          totalQuestions: total,
          percentage,
        });
      } catch (error) {
        console.error("Error saving quiz result to Firestore:", error);
      }
    }
  };

  const handleQuizComplete = async (answers) => {
    setUserAnswers(answers);
    // Update progress before showing results
    if (quizTopic) {
      await updateProgress(quizTopic, quizComplexity || "beginner", answers);
    }
    setScreen("results");
  };

  // Allow retake with optional suggested next difficulty
  const handleRetake = (nextDifficulty) => {
    if (nextDifficulty) {
      setQuizComplexity(nextDifficulty);
    }
    setScreen("home");
    setQuestions([]);
    setUserAnswers([]);
  };

  const handleCancelQuiz = () => {
    setScreen("home");
    setQuestions([]);
    setUserAnswers([]);
  };

  const handleResetProgress = () => {
    const initial = {
      overall: {
        quizzes: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        lastCompletedAt: null,
      },
      byTopic: {},
      history: [],
    };
    setProgress(initial);
    try {
      localStorage.removeItem("progress_v1");
    } catch {}
  };

  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect happens automatically due to AuthContext
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <>
      <CssBaseline />
      <Container>
        {currentUser && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "10px 0",
              gap: "10px",
            }}
          >
            <Button variant="contained" color="secondary" href="/subscription">
              Subscription
            </Button>
            <Button variant="outlined" color="primary" href="/profile">
              Profile
            </Button>
            <Button variant="outlined" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "80vh",
            }}
          >
            <CircularProgress />
          </div>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {screen === "home" && (
              <Home
                onStartQuiz={handleStartQuiz}
                onStartDemo={handleStartDemo}
                initialTopic={quizTopic}
                initialComplexity={quizComplexity}
                initialNumQuestions={quizNumQuestions}
                progress={progress}
                onResetProgress={handleResetProgress}
              />
            )}
            {screen === "quiz" && (
              <Quiz
                questions={questions}
                onQuizComplete={handleQuizComplete}
                onCancel={handleCancelQuiz}
              />
            )}
            {screen === "results" && (
              <Results
                userAnswers={userAnswers}
                onRetake={handleRetake}
                currentDifficulty={quizComplexity}
                progress={progress}
              />
            )}
          </>
        )}
      </Container>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <AppContent />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Container>
                    <Profile />
                  </Container>
                </PrivateRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <PrivateRoute>
                  <Container>
                    <SubscriptionPlans />
                  </Container>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
