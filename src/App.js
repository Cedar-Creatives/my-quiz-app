import React, { useState } from 'react';
import { CssBaseline, CircularProgress, Container, Alert } from '@mui/material';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Results from './components/Results';
import './App.css';

function App() {
  const [screen, setScreen] = useState('home');
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizComplexity, setQuizComplexity] = useState('');
  const [quizNumQuestions, setQuizNumQuestions] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  console.log('Backend URL being used:', backendUrl);

  const handleStartQuiz = async (topic, complexity, numQuestions) => {
    setQuizTopic(topic);
    setQuizComplexity(complexity);
    setQuizNumQuestions(numQuestions);
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${backendUrl}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, complexity, numQuestions }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Invalid quiz data received');
      }
      setQuestions(data.questions);
      setScreen('quiz');
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to generate quiz. Please check if your Gemini API key is valid in backend/.env and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (answers) => {
    setUserAnswers(answers);
    setScreen('results');
  };

  const handleRetake = () => {
    setScreen('home');
    setQuestions([]);
    setUserAnswers([]);
  };

  const handleCancelQuiz = () => {
    setScreen('home');
    setQuestions([]);
    setUserAnswers([]);
  };

  return (
    <>
      <CssBaseline />
      <Container>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
          </div>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {screen === 'home' && <Home onStartQuiz={handleStartQuiz} initialTopic={quizTopic} initialComplexity={quizComplexity} initialNumQuestions={quizNumQuestions} />}            
            {screen === 'quiz' && <Quiz questions={questions} onQuizComplete={handleQuizComplete} onCancel={handleCancelQuiz} />}            
            {screen === 'results' && <Results userAnswers={userAnswers} onRetake={handleRetake} />}
          </>
        )}
      </Container>
    </>
  );
}

export default App;
