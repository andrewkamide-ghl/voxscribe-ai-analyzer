export type ResearchItem = {
  id: string;
  topic: string;
  type: "crawl" | "qa" | "note";
  content: string; // markdown or plain text
  sources?: string[];
  tags?: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const STORAGE_KEY = "research_store_v1";

function read(): ResearchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResearchItem[]) : [];
  } catch {
    return [];
  }
}

function write(list: ResearchItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // noop
  }
}

type Listener = (list: ResearchItem[]) => void;
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

export const researchStore = {
  getAll(): ResearchItem[] {
    return read();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    // emit current state immediately
    try { listener(read()); } catch {}
    return () => {
      listeners.delete(listener);
    };
  },
  add(item: Omit<ResearchItem, "id" | "createdAt" | "updatedAt">): ResearchItem {
    const list = read();
    const now = new Date().toISOString();
    const newItem: ResearchItem = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...item };
    list.unshift(newItem);
    write(list);
    notify();
    return newItem;
  },
  update(id: string, patch: Partial<ResearchItem>): ResearchItem | null {
    const list = read();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
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
};
