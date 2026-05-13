import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const checkToxicity = async (message: string): Promise<{ isToxic: boolean; confidence: number }> => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/moderate`, { message });
    return {
      isToxic: Boolean((response.data as any).is_toxic),
      confidence: Number((response.data as any).confidence || 0),
    };
  } catch (error) {
    return { isToxic: false, confidence: 0 };
  }
};

export const getIcebreaker = async (interestsA: string[], interestsB: string[]): Promise<string> => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/icebreaker`, {
      interests_a: interestsA,
      interests_b: interestsB,
    });
    return (response.data as any).icebreaker;
  } catch (error) {
    const fallbacks = [
      "What's a project you're currently working on?",
      "If you could learn anything in 30 days, what would it be?",
      "What's the most underrated thing at your college?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

export default {
  checkToxicity,
  getIcebreaker,
};
