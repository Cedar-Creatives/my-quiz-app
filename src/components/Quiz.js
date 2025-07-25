import { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, Card, CardContent, Button, Radio, RadioGroup, FormControlLabel, FormControl, CircularProgress, Alert, Box } from '@mui/material';

function Quiz({ questions, onQuizComplete, onCancel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const isAnsweredRef = useRef(isAnswered);
  const [userAnswers, setUserAnswers] = useState([]);
  const userAnswersRef = useRef(userAnswers);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question
  const timerRef = useRef(null); // Ref to hold the timer interval

  const currentQuestion = questions[currentIndex];

  console.log('Quiz component rendered. currentIndex:', currentIndex, 'isAnswered:', isAnswered);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  const handleNext = useCallback((timeRanOut = false) => {
    console.log('handleNext called. timeRanOut:', timeRanOut, 'currentIndex:', currentIndex, 'isAnswered:', isAnsweredRef.current, 'userAnswers length:', userAnswersRef.current.length);
    let finalAnswers = userAnswersRef.current;
    if (timeRanOut && !isAnsweredRef.current) {
      const unanswered = { question: questions[currentIndex].question, selected: 'No Answer', correct: questions[currentIndex].correctAnswer };
      setUserAnswers((prev) => [...prev, unanswered]);
      finalAnswers = [...finalAnswers, unanswered];
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onQuizComplete(finalAnswers);
    }
  }, [currentIndex, onQuizComplete, questions, setCurrentIndex, setUserAnswers]);

  useEffect(() => {
    console.log('useEffect for question setup triggered. currentIndex:', currentIndex);
    setExplanation('');
    setSelectedOption('');
    setIsAnswered(false); // Reset isAnswered for new question
    isAnsweredRef.current = false;
    setTimeLeft(30); // Reset timer for new question

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        console.log('Timer tick. timeLeft:', prevTime - 1, 'isAnswered:', isAnsweredRef.current);
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Automatically move to next question if time runs out and not answered
          if (!isAnsweredRef.current) {
            handleNext(true);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      console.log('Cleanup: Clearing timer for currentIndex:', currentIndex);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, handleNext]);

  if (!questions || questions.length === 0) {
    return <Typography variant="h6" color="error">No questions available. Please try again.</Typography>;
  }

  const handleSelect = async (option) => {
    console.log('handleSelect called. option:', option, 'currentIndex:', currentIndex, 'isAnswered before:', isAnswered);
    if (!isAnswered) {
      setSelectedOption(option);
      setUserAnswers([...userAnswers, { question: currentQuestion.question, selected: option, correct: currentQuestion.correctAnswer }]);
      isAnsweredRef.current = true; // Update ref immediately
      setIsAnswered(true); // Set isAnswered to true immediately
      console.log('isAnswered set to true. currentIndex:', currentIndex);
      if (timerRef.current) {
        console.log('Clearing timer in handleSelect. currentIndex:', currentIndex);
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsExplaining(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      try {
        const response = await fetch(`${backendUrl}/api/explain-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQuestion.question,
            selectedOption: option,
            correctOption: currentQuestion.correctAnswer,
          }),
        });
        const data = await response.json();
        setExplanation(data.explanation);
        console.log('Explanation fetched. currentIndex:', currentIndex, 'isAnswered:', isAnswered);
      } catch (error) {
        console.error('Error fetching explanation:', error);
        setExplanation('Failed to load explanation.');
      } finally {
        setIsExplaining(false);
      }
    }
  };

  const getOptionColor = (option) => {
    if (!isAnswered) return 'primary';
    if (option === currentQuestion.correctAnswer) return 'success';
    if (option === selectedOption) return 'error';
    return 'primary';
  };

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 5 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Question {currentIndex + 1} of {questions.length}
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
          Time Left: {timeLeft}s
        </Typography>
        <Typography variant="body1" gutterBottom>
          {currentQuestion.question}
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup value={selectedOption} onChange={(e) => handleSelect(e.target.value)}>
            {currentQuestion.options.map((option, idx) => (
              <FormControlLabel
                key={idx}
                value={option}
                control={<Radio color={getOptionColor(option)} />}
                label={option}
                disabled={isAnswered || timeLeft === 0}
              />
            ))}
          </RadioGroup>
        </FormControl>
        {isAnswered && (
          <Box mt={2}>
            {selectedOption === currentQuestion.correctAnswer ? (
              <Alert severity="success">Correct!</Alert>
            ) : (
              <Alert severity="error">Incorrect. The correct answer was: {currentQuestion.correctAnswer}</Alert>
            )}
            {isExplaining ? (
              <CircularProgress size={24} sx={{ mt: 2 }} />
            ) : (
              explanation && <Typography variant="body2" sx={{ mt: 2 }}>{explanation}</Typography>
            )}
            <Button variant="contained" color="primary" onClick={handleNext} sx={{ mt: 2 }}>
              {currentIndex < questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
            <Button variant="outlined" color="secondary" onClick={onCancel} sx={{ mt: 2, ml: 2 }}>
              Cancel
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default Quiz;