import cron from 'node-cron';
import { getChaosWindowStatus as readChaosStatus, setChaosStart } from '../services/matchmaking.service';

const getRandomHour = (): number => Math.floor(Math.random() * 15) + 8;

let scheduledHour = getRandomHour();

const scheduleToday = async () => {
  const start = new Date();
  start.setHours(scheduledHour, 0, 0, 0);
  await setChaosStart(start.getTime());
};

export const startChaosWindowScheduler = () => {
  scheduleToday().catch(() => undefined);
  console.log(`[Chaos Window] Scheduler started. Today's window: ${scheduledHour}:00 - ${scheduledHour + 2}:00`);

  cron.schedule('0 0 * * *', async () => {
    scheduledHour = getRandomHour();
    await scheduleToday();
    console.log(`[Chaos Window] Today's window: ${scheduledHour}:00 - ${scheduledHour + 2}:00`);
  });
};

export const getChaosWindowStatus = async () => {
  const status = await readChaosStatus();
  return { ...status, scheduledHour, scheduledEnd: scheduledHour + 2 };
};
