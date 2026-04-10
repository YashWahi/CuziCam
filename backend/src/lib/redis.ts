// In-memory Redis Mock
const store = new Map<string, string>();
const sortedSets = new Map<string, { value: string, score: number }[]>();

const client = {
  isOpen: false,
  connect: async () => {
    client.isOpen = true;
    console.log('[Redis Mock] Connected (In-Memory)');
  },
  on: (event: string, cb: Function) => {
    if (event === 'connect') setTimeout(cb, 10);
  },
  get: async (key: string) => store.get(key) || null,
  set: async (key: string, value: string, options?: any) => {
    store.set(key, value);
    return 'OK';
  },
  setEx: async (key: string, ttl: number, value: string) => {
    store.set(key, value);
    // TTL not strictly enforced in mock but could be with setTimeout if needed
    return 'OK';
  },
  del: async (key: string) => {
    store.delete(key);
    sortedSets.delete(key);
    return 1;
  },
  zAdd: async (key: string, entry: { score: number, value: string }) => {
    let set = sortedSets.get(key) || [];
    set = set.filter(i => i.value !== entry.value);
    set.push(entry);
    set.sort((a, b) => a.score - b.score);
    sortedSets.set(key, set);
    return 1;
  },
  zRem: async (key: string, value: string) => {
    let set = sortedSets.get(key) || [];
    const initialLen = set.length;
    set = set.filter(i => i.value !== value);
    sortedSets.set(key, set);
    return initialLen - set.length;
  },
  zRange: async (key: string, start: number, stop: number, options?: any) => {
    let set = sortedSets.get(key) || [];
    if (options?.REV) {
      set = [...set].reverse();
    }
    return set.slice(start, stop + 1).map(i => i.value);
  }
};

export const connectRedis = async () => {
  if (!client.isOpen) await client.connect();
};

export { client as redis };

