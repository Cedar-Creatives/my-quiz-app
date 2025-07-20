import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, Box } from '@mui/material';

function Quiz({ questions, onQuizComplete }) {
  if (!questions || questions.length === 0) {
    return <Typography variant="h6" color="error">No questions available. Please try again.</Typography>;
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (option) => {
    if (!isAnswered) {
      setSelectedOption(option);
      setIsAnswered(true);
      setUserAnswers([...userAnswers, { question: currentQuestion.question, selected: option, correct: currentQuestion.correctAnswer }]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption('');
      setIsAnswered(false);
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
                disabled={isAnswered && option !== selectedOption}
              />
            ))}
          </RadioGroup>
        </FormControl>
        {isAnswered && (
          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default Quiz;