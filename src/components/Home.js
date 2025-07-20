import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function Home({ onStartQuiz, initialTopic, initialComplexity, initialNumQuestions }) {
  const [topic, setTopic] = useState(initialTopic || '');
  const [complexity, setComplexity] = useState(initialComplexity || 'beginner');
  const [numQuestions, setNumQuestions] = useState(initialNumQuestions || 10); // Default to 10 questions

  const handleStart = () => {
    if (topic) onStartQuiz(topic, complexity, numQuestions);
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Junior Developer Quiz App
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Test your software engineering knowledge!
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Complexity</InputLabel>
        <Select value={complexity} onChange={(e) => setComplexity(e.target.value)}>
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
          } else if (e.target.value === '') {
            setNumQuestions(''); // Allow clearing the input
          }
        }}
        inputProps={{ min: 1, max: 100 }}
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleStart} disabled={!topic}>
        Start Quiz
      </Button>
    </Container>
  );
}

export default Home;