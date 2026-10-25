import axios from './axios';

export const getUnits = async () => {
  const { data } = await axios.get('/content/units');
  return data;
};

export const getLesson = async (id) => {
  const { data } = await axios.get(`/content/lessons/${id}`);
  return data;
};

export const getUserProgress = async () => {
  const { data } = await axios.get('/content/progress');
  return data; // Array de { lessonId, completedAt }
};

export const toggleLessonProgress = async (id) => {
  const { data } = await axios.post(`/content/lessons/${id}/progress`);
  return data; // { message, completed }
};
