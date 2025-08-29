# Software Engineering Quiz Application

## Project Overview
A dynamic quiz application built with React (frontend) and Node.js/Express (backend) that generates software engineering questions using OpenRouter's AI API. The application supports various topics and difficulty levels, providing instant feedback and explanations for answers.

## Architecture

### Frontend (React)
- **Deployment**: Hosted on Netlify
- **Key Components**:
  - `App.js`: Main application component managing quiz state and screen navigation
  - `Home.js`: Quiz configuration screen (topic, complexity, number of questions)
  - `Quiz.js`: Interactive quiz interface with timer and answer validation
  - `Results.js`: Score display and quiz review

### Backend (Node.js/Express)
- **Deployment**: Hosted on Render
- **Key Components**:
  - `server.js`: Express server with quiz generation and answer explanation endpoints
  - `config/openrouter.js`: OpenRouter API configuration
  - `middleware/rateLimit.js`: Request rate limiting
  - `utils/errorHandler.js`: Error handling utilities

## API Endpoints

### `/api/generate-quiz` (POST)
- Generates quiz questions based on topic and complexity
- Parameters:
  ```json
  {
    "topic": "string",
    "complexity": "string",
    "numQuestions": "number"
  }
  ```

### `/api/explain-answer` (POST)
- Provides detailed explanations for quiz answers
- Parameters:
  ```json
  {
    "question": "string",
    "selectedOption": "string",
    "correctOption": "string"
  }
  ```

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
```

### Backend (.env)
```
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-quiz-app
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install

   # Backend dependencies
   cd backend
   npm install
   ```

3. **Configure environment variables**
   - Create `.env` files in both root and backend directories
   - Add required environment variables as specified above

4. **Start development servers**
   ```bash
   # Frontend (from root directory)
   npm start

   # Backend (from backend directory)
   npm start
   ```

## Deployment

### Frontend (Netlify)
1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
3. Add environment variables in Netlify dashboard
4. Deploy

### Backend (Render)
1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables in Render dashboard
5. Deploy

## Project Structure
```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js
│   │   │   ├── Quiz.js
│   │   │   └── Results.js
│   │   ├── App.js
│   │   └── index.js
│   └── public/
└── backend/
    ├── config/
    ├── middleware/
    ├── utils/
    └── server.js
```

## Features
- Dynamic quiz generation using AI
- Multiple topics and complexity levels
- Timed questions with automatic progression
- Detailed answer explanations
- Score tracking and quiz review
- Responsive design for mobile and desktop

## Technical Considerations
- Uses Material-UI for consistent styling
- Implements error handling and input validation
- Includes rate limiting for API endpoints
- Supports environment-based configuration
- Implements CORS security

## Future Enhancements
- User authentication and profile management
- Quiz history and progress tracking
- Offline mode support
- Social sharing features
- Performance analytics and reporting

## Troubleshooting
- If the backend returns 401 errors, verify the OpenRouter API key in Render environment variables
- For frontend connection issues, ensure the REACT_APP_BACKEND_URL is correctly set in Netlify
- Clear browser cache after frontend updates
- Check browser console for detailed error messages
