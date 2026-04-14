import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const checkToxicity = async (text: string): Promise<number> => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/toxicity`, { text });
    return (response.data as any).score;
  } catch (error) {
    console.error('[AI Service] Toxicity check failed, falling back to 0');
    return 0;
  }
};

export const getIcebreaker = async (interestsA: string[], interestsB: string[]): Promise<string> => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/icebreaker`, { interestsA, interestsB });
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
