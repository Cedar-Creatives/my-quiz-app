export const handleAIError = (error) => {
  if (error.response?.status === 429) {
    return 'API rate limit exceeded - please try again later';
  }
  return error.message || 'AI service unavailable';
};