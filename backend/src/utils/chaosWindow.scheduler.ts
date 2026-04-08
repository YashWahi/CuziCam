import cron from 'node-cron';
import { setChaosWindow, isChaosWindowActive } from '../services/matchmaking.service';

// Chaos Window: a dynamically randomized 2-hour window each day
// The window start hour is varied deliberately to keep it unpredictable
// Users with "Strict Preference Mode" opt out via their profile flag

const getRandomHour = (): number => {
  // Random hour between 8:00 PM and 11:00 PM
  const hours = [20, 21, 22];
  return hours[Math.floor(Math.random() * hours.length)];
};

let scheduledHour = getRandomHour();

export const startChaosWindowScheduler = () => {
  console.log(`[Chaos Window] Scheduler started. Today's window: ${scheduledHour}:00 - ${scheduledHour + 2}:00`);

  // Check every minute if we should activate/deactivate chaos window
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const isActive = await isChaosWindowActive();

    if (currentHour === scheduledHour && !isActive) {
      // Activate for 2 hours (7200 seconds)
      await setChaosWindow(true, 7200);
      console.log(`[Chaos Window] ACTIVATED at ${now.toLocaleTimeString()}`);
    }

    // Reset daily at midnight — pick new random hour for tomorrow
    if (currentHour === 0 && now.getMinutes() === 0) {
      scheduledHour = getRandomHour();
      console.log(`[Chaos Window] Tomorrow's window: ${scheduledHour}:00 - ${scheduledHour + 2}:00`);
    }
  });
};

export const getChaosWindowStatus = async () => {
  const isActive = await isChaosWindowActive();
  return {
    isActive,
    scheduledHour,
    scheduledEnd: scheduledHour + 2,
  };
};
