import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "es";

type Translations = Record<string, string>;

const STORAGE_KEY = "app_lang";

const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    "nav.group": "Navigation",
    "nav.home": "Home",
    "nav.calls": "Calls",
    "nav.research": "Research",
    "nav.contacts": "Contacts",
    "nav.settings": "Settings",

    // Global actions
    "actions.save": "Save",
    "actions.connect": "Connect",
    "actions.disconnect": "Disconnect",
    "actions.connected": "Connected",
    "actions.notConnected": "Not connected",
    "actions.logout": "Logout",
    "actions.loggedOut": "Logged out",

    // Settings shell
    "settings.title": "Settings",
    "settings.subtitle": "Manage your preferences and connected services.",
    "settings.account": "Account",
    "settings.billing": "Billing",
    "settings.ai": "AI Assistants",
    "settings.storage": "Storage",

    // Account
    "account.changeEmail": "Change Email",
    "account.newEmail": "New Email",
    "account.confirmEmail": "Confirm New Email",
    "account.changePassword": "Change Password",
    "account.currentPassword": "Current Password",
    "account.newPassword": "New Password",
    "account.confirmNewPassword": "Confirm New Password",
    "account.theme": "Theme",
    "account.language": "Language",

    // Theme
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",

    // Billing
    "billing.title": "Subscription & Billing",
    "billing.subtitle": "Manage your plan, payment method, and invoices.",
    "billing.managePlan": "Manage Plan",
    "billing.updatePayment": "Update Payment Method",
    "billing.viewInvoices": "View Invoices",

    // AI Assistants
    "ai.connectOpenAI": "Connect ChatGPT (OpenAI)",
    "ai.apiKey": "OpenAI API Key",
    "ai.tip": "Tip: For production, store secrets in Supabase and call providers from an Edge Function.",
    "ai.defaultModel": "Default AI Model",

    // Storage
    "storage.connect": "Connect your cloud storage",
    "storage.default": "Default Storage",
    "storage.google": "Google Drive",
    "storage.dropbox": "Dropbox",
    "storage.icloud": "iCloud",

    // Profile menu
    "profile.edit": "Edit Profile",
    "profile.editorComingSoon": "Profile editor coming soon.",
  },
  es: {
    // Navigation
    "nav.group": "Navegación",
    "nav.home": "Inicio",
    "nav.calls": "Llamadas",
    "nav.research": "Investigación",
    "nav.contacts": "Contactos",
    "nav.settings": "Ajustes",

    // Global actions
    "actions.save": "Guardar",
    "actions.connect": "Conectar",
    "actions.disconnect": "Desconectar",
    "actions.connected": "Conectado",
    "actions.notConnected": "No conectado",
    "actions.logout": "Cerrar sesión",
    "actions.loggedOut": "Sesión cerrada",

    // Settings shell
    "settings.title": "Ajustes",
    "settings.subtitle": "Administra tus preferencias y servicios conectados.",
    "settings.account": "Cuenta",
    "settings.billing": "Facturación",
    "settings.ai": "Asistentes de IA",
    "settings.storage": "Almacenamiento",

    // Account
    "account.changeEmail": "Cambiar correo",
    "account.newEmail": "Correo nuevo",
    "account.confirmEmail": "Confirmar correo",
    "account.changePassword": "Cambiar contraseña",
    "account.currentPassword": "Contraseña actual",
    "account.newPassword": "Nueva contraseña",
    "account.confirmNewPassword": "Confirmar nueva contraseña",
    "account.theme": "Tema",
    "account.language": "Idioma",

    // Theme
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "theme.system": "Sistema",

    // Billing
    "billing.title": "Suscripción y Facturación",
    "billing.subtitle": "Administra tu plan, método de pago y facturas.",
    "billing.managePlan": "Gestionar plan",
    "billing.updatePayment": "Actualizar método de pago",
    "billing.viewInvoices": "Ver facturas",

    // AI Assistants
    "ai.connectOpenAI": "Conectar ChatGPT (OpenAI)",
    "ai.apiKey": "Clave de API de OpenAI",
    "ai.tip": "Consejo: En producción, guarda secretos en Supabase y llama a los proveedores desde una Edge Function.",
    "ai.defaultModel": "Modelo de IA predeterminado",

    // Storage
    "storage.connect": "Conecta tu almacenamiento en la nube",
    "storage.default": "Almacenamiento predeterminado",
    "storage.google": "Google Drive",
    "storage.dropbox": "Dropbox",
    "storage.icloud": "iCloud",

    // Profile menu
    "profile.edit": "Editar perfil",
    "profile.editorComingSoon": "El editor de perfil estará disponible pronto.",
  },
};

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Language | null;
    return saved || "en";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  const setLang = (l: Language) => setLangState(l);

  const t = useMemo(() => {
    return (key: string) => {
      const dict = translations[lang] || translations.en;
      return dict[key] ?? key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
