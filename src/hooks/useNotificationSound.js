import { useCallback } from 'react';

export const useNotificationSound = () => {
  const playAlert = useCallback(() => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch((err) => console.log("Audio play blocked by browser policies until user interacts: ", err));
  }, []);

  return playAlert;
};