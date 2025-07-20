import React from 'react';
import { Card, CardContent, Typography, Button, List, ListItem, ListItemText, Container } from '@mui/material';

function Results({ userAnswers, onRetake }) {
  const score = userAnswers.filter(ans => ans.selected === ans.correct).length;
  const missed = userAnswers.filter(ans => ans.selected !== ans.correct);

  return (
    <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '50px' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Quiz Complete!
          </Typography>
          <Typography variant="h6" gutterBottom>
            Your Score: {score} / {userAnswers.length}
          </Typography>
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
                      secondary={`Your answer: ${ans.selected} | Correct: ${ans.correct}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          <Button variant="contained" color="primary" onClick={onRetake}>
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Results;