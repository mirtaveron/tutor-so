import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUnits, getLesson, getUserProgress, toggleLessonProgress } from '../api/content';

export const useUnits = () => {
  return useQuery({ queryKey: ['units'], queryFn: getUnits });
};

export const useLesson = (id) => {
  return useQuery({ queryKey: ['lesson', id], queryFn: () => getLesson(id), enabled: !!id });
};

export const useProgress = () => {
  return useQuery({ queryKey: ['progress'], queryFn: getUserProgress });
};

export const useToggleProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLessonProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
  });
};
