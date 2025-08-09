export type Contact = {
  id: string;
  name: string;
  background?: string;
  coreBeliefs?: string;
  social?: string;
  notes?: string;
  aiRuns?: any[]; // optional AI assistant content snapshots
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const STORAGE_KEY = "contacts_store_v1";

function read(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Contact[]) : [];
  } catch {
    return [];
  }
}

function write(list: Contact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // noop
  }
}

export const contactsStore = {
  getAll(): Contact[] {
    return read();
  },
  add(contact: Omit<Contact, "id" | "createdAt" | "updatedAt">): Contact {
    const list = read();
    const now = new Date().toISOString();
    const newItem: Contact = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...contact };
    list.unshift(newItem);
    write(list);
    return newItem;
  },
  update(id: string, patch: Partial<Contact>): Contact | null {
    const list = read();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    write(list);
    return updated;
  },
  remove(id: string) {
    const next = read().filter((c) => c.id !== id);
    write(next);
  },
};
