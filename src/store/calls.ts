export type Call = {
  id: string;
  name: string;
  time: string; // ISO
  totalSegments: number;
  contacts: { id: string; name: string }[]; // only saved contacts
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const STORAGE_KEY = "calls_store_v1";

function read(): Call[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Call[]) : [];
  } catch {
    return [];
  }
}

function write(list: Call[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // noop
  }
}

type Listener = (list: Call[]) => void;
const listeners = new Set<Listener>();

function notify() {
  const list = read();
  listeners.forEach((fn) => {
    try {
      fn(list);
    } catch {
      // noop
    }
  });
}

// Live call (in-memory) state
export type LiveCall = { name: string; startedAt: string };
type LiveListener = (live: LiveCall | null) => void;
let live: LiveCall | null = null;
const liveListeners = new Set<LiveListener>();
function notifyLive() {
  liveListeners.forEach((fn) => {
    try {
      fn(live);
    } catch {
      // noop
    }
  });
}

export const callsStore = {
  getAll(): Call[] {
    return read();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    // emit immediately
    try { listener(read()); } catch {}
    return () => {
      listeners.delete(listener);
    };
  },
  add(item: Omit<Call, "id" | "createdAt" | "updatedAt">): Call {
    const list = read();
    const now = new Date().toISOString();
    const newItem: Call = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...item };
    list.unshift(newItem);
    write(list);
    notify();
    return newItem;
  },
  update(id: string, patch: Partial<Call>): Call | null {
    const list = read();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...patch, updatedAt: new Date().toISOString() } as Call;
    list[idx] = updated;
    write(list);
    notify();
    return updated;
  },
  remove(id: string) {
    const next = read().filter((c) => c.id !== id);
    write(next);
    notify();
  },
  // Live helpers
  getLive(): LiveCall | null {
    return live;
  },
  startLive(name = "Live Call") {
    live = { name, startedAt: new Date().toISOString() };
    notifyLive();
  },
  endLive() {
    live = null;
    notifyLive();
  },
  subscribeLive(listener: (live: LiveCall | null) => void) {
    liveListeners.add(listener);
    try { listener(live); } catch {}
    return () => {
      liveListeners.delete(listener);
    };
  },
};
