import { Card, CardContent, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, Box, Alert, CircularProgress } from '@mui/material';
import { useState, useEffect, useRef } from 'react';

function Quiz({ questions, onQuizComplete, onCancel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const isAnsweredRef = useRef(isAnswered);
  const [userAnswers, setUserAnswers] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question

  if (!questions || questions.length === 0) {
    return <Typography variant="h6" color="error">No questions available. Please try again.</Typography>;
  }

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setExplanation('');
    setSelectedOption('');
    setIsAnswered(false); // Reset isAnswered for new question
    setTimeLeft(30); // Reset timer for new question

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Automatically move to next question if time runs out and not answered
          if (!isAnsweredRef.current) {
            handleNext(true); // Pass true to indicate time ran out
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  useEffect(() => {
    isAnsweredRef.current = isAnswered;
  }, [isAnswered]);

  const handleSelect = async (option) => {
    if (!isAnswered) {
      setSelectedOption(option);
      setUserAnswers([...userAnswers, { question: currentQuestion.question, selected: option, correct: currentQuestion.correctAnswer }]);

      setIsExplaining(true);
      try {
        const response = await fetch('http://localhost:5000/api/explain-answer', {
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
      } catch (error) {
        console.error('Error fetching explanation:', error);
        setExplanation('Failed to load explanation.');
      } finally {
        setIsExplaining(false);
        setIsAnswered(true); // Set isAnswered to true after explanation is fetched
      }
    }
  };

  const handleNext = (timeRanOut = false) => {
    // If time ran out and user didn't answer, record it as unanswered
    if (timeRanOut && !isAnswered) {
      setUserAnswers((prevAnswers) => [
        ...prevAnswers,
        { question: currentQuestion.question, selected: 'No Answer', correct: currentQuestion.correctAnswer },
      ]);
    }

    // Always advance to the next question
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsAnswered(false); // Reset isAnswered for the next question
    } else {
      onQuizComplete(userAnswers);
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