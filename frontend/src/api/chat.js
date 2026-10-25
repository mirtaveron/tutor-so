import axios from './axios';

export const sendChatMessage = async ({ message, history, context }) => {
  const { data } = await axios.post('/chat', {
    message,
    history,
    context
  });
  return data;
};
