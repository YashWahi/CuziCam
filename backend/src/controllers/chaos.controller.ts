import { Request, Response } from 'express';
import { getChaosWindowStatus } from '../utils/chaosWindow.scheduler';

export const getStatus = async (req: Request, res: Response) => {
  try {
    const status = await getChaosWindowStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chaos status' });
  }
};
