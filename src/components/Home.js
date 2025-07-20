import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

function Home({ onStartQuiz }) {
  const [topic, setTopic] = useState('');
  const [complexity, setComplexity] = useState('beginner');

  const handleStart = () => {
    if (topic) onStartQuiz(topic, complexity);
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
      <Button variant="contained" color="primary" onClick={handleStart} disabled={!topic}>
        Start Quiz
      </Button>
    </Container>
  );
}

export default Home;