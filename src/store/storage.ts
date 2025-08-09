export type StorageProvider = "google" | "dropbox" | "icloud";

const STORAGE_CONNS_KEY = "storage:connections";
const STORAGE_DEFAULT_KEY = "storage:default";

export type Connections = Partial<Record<StorageProvider, string>>;

function readConnections(): Connections {
  try {
    const raw = localStorage.getItem(STORAGE_CONNS_KEY);
    return raw ? (JSON.parse(raw) as Connections) : {};
  } catch {
    return {};
  }
}

function writeConnections(next: Connections) {
  try {
    localStorage.setItem(STORAGE_CONNS_KEY, JSON.stringify(next));
  } catch {}
}

export function getStorageConnections(): Connections {
  return readConnections();
}

export function setStorageConnection(provider: StorageProvider, token: string) {
  const next = { ...readConnections(), [provider]: token };
  writeConnections(next);
}

export function clearStorageConnection(provider: StorageProvider) {
  const next = { ...readConnections() };
  delete next[provider];
  writeConnections(next);
}

export function getDefaultStorage(): StorageProvider | null {
  try {
    return (localStorage.getItem(STORAGE_DEFAULT_KEY) as StorageProvider | null) || null;
  } catch {
    return null;
  }
}

export function setDefaultStorage(provider: StorageProvider) {
  try {
    localStorage.setItem(STORAGE_DEFAULT_KEY, provider);
  } catch {}
}

// Optional hook for convenience
import { useEffect, useState } from "react";

export function useStorageSettings() {
  const [connections, setConnections] = useState<Connections>(() => getStorageConnections());
  const [defaultProvider, setDefaultProviderState] = useState<StorageProvider | null>(() => getDefaultStorage());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_CONNS_KEY) setConnections(getStorageConnections());
      if (e.key === STORAGE_DEFAULT_KEY) setDefaultProviderState(getDefaultStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const connect = (provider: StorageProvider, token: string) => {
    setStorageConnection(provider, token);
    setConnections(getStorageConnections());
  };
  const disconnect = (provider: StorageProvider) => {
    clearStorageConnection(provider);
    setConnections(getStorageConnections());
    if (defaultProvider === provider) {
      setDefaultStorage("google"); // reset to a default if needed
      setDefaultProviderState(getDefaultStorage());
    }
  };
  const setDefault = (provider: StorageProvider) => {
    setDefaultStorage(provider);
    setDefaultProviderState(provider);
  };

  return { connections, defaultProvider, connect, disconnect, setDefault } as const;
}
