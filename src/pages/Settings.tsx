import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import AIModelSelector from "@/components/AIModelSelector";
import ApiAccessPanel from "@/components/ApiAccessPanel";
import CrawlPanel from "@/components/CrawlPanel";
import { clearOpenAIKey, getOpenAIKey, setOpenAIKey } from "@/store/ai";
import { useTheme } from "next-themes";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@/store/i18n";
import { StorageProvider, useStorageSettings } from "@/store/storage";

const TABS = ["account", "billing", "ai", "storage"] as const;
type TabKey = typeof TABS[number];

const Settings = () => {
  const { toast } = useToast();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "account";
  const [tab, setTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.set("tab", tab);
      return next;
    });
  }, [tab, setSearchParams]);

  // Account forms state
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // AI Assistants state
  const [openaiKey, setKey] = useState<string>(() => getOpenAIKey() || "");
  const connected = useMemo(() => Boolean(getOpenAIKey()), []);

  const saveOpenAI = () => {
    if (!openaiKey) return;
    setOpenAIKey(openaiKey);
    toast({ title: t("actions.connected"), description: t("ai.connectOpenAI") + " ✓" });
  };
  const disconnectOpenAI = () => {
    clearOpenAIKey();
    setKey("");
    toast({ title: t("actions.disconnect"), description: t("ai.connectOpenAI") + " ✕" });
  };

  // Storage settings
  const { connections, defaultProvider, connect, disconnect, setDefault } = useStorageSettings();
  const isConnected = (p: StorageProvider) => Boolean(connections[p]);

  const leftNavItemCls = (key: TabKey) =>
    key === tab ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Settings — Account, Billing, AI Assistants & Storage</title>
        <meta name="description" content="Manage account, billing, AI assistants, and storage preferences." />
        <link
          rel="canonical"
          href={typeof window !== "undefined" ? window.location.href : "https://localhost:8080/settings"}
        />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left vertical menu */}
        <aside className="lg:col-span-3">
          <nav aria-label="Settings sections" className="space-y-1">
            <button type="button" onClick={() => setTab("account")} className={`w-full text-left rounded-md px-3 py-2 ${leftNavItemCls("account")}`} aria-current={tab === "account" ? "page" : undefined}>
              {t("settings.account")}
            </button>
            <button type="button" onClick={() => setTab("billing")} className={`w-full text-left rounded-md px-3 py-2 ${leftNavItemCls("billing")}`} aria-current={tab === "billing" ? "page" : undefined}>
              {t("settings.billing")}
            </button>
            <button type="button" onClick={() => setTab("ai")} className={`w-full text-left rounded-md px-3 py-2 ${leftNavItemCls("ai")}`} aria-current={tab === "ai" ? "page" : undefined}>
              {t("settings.ai")}
            </button>
            <button type="button" onClick={() => setTab("storage")} className={`w-full text-left rounded-md px-3 py-2 ${leftNavItemCls("storage")}`} aria-current={tab === "storage" ? "page" : undefined}>
              {t("settings.storage")}
            </button>
          </nav>
        </aside>

        {/* Right content */}
        <section className="lg:col-span-9 space-y-4">
          {tab === "account" && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <h2 className="text-lg font-semibold">{t("account.changeEmail")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="newEmail">{t("account.newEmail")}</Label>
                    <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@example.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmEmail">{t("account.confirmEmail")}</Label>
                    <Input id="confirmEmail" type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="name@example.com" />
                  </div>
                </div>
                <div>
                  <Button type="button" onClick={() => {
                    if (!newEmail || newEmail !== confirmEmail) {
                      toast({ title: "Check inputs", description: "Emails must match" });
                      return;
                    }
                    toast({ title: "Email updated" });
                  }}>{t("actions.save")}</Button>
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <h2 className="text-lg font-semibold">{t("account.changePassword")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="currentPassword">{t("account.currentPassword")}</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newPassword">{t("account.newPassword")}</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmNewPassword">{t("account.confirmNewPassword")}</Label>
                    <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Button type="button" onClick={() => {
                    if (!newPassword || newPassword !== confirmNewPassword) {
                      toast({ title: "Check inputs", description: "Passwords must match" });
                      return;
                    }
                    toast({ title: "Password updated" });
                  }}>{t("actions.save")}</Button>
                </div>
              </Card>

              <Card className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{t("account.theme")}</Label>
                    <Select value={theme as string} onValueChange={(v) => setTheme(v)}>
                      <SelectTrigger aria-label="Theme">
                        <SelectValue placeholder={t("account.theme")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t("theme.light")}</SelectItem>
                        <SelectItem value="dark">{t("theme.dark")}</SelectItem>
                        <SelectItem value="system">{t("theme.system")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{t("account.language")}</Label>
                    <Select value={lang} onValueChange={(v) => setLang(v as any)}>
                      <SelectTrigger aria-label="Language">
                        <SelectValue placeholder={t("account.language")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === "billing" && (
            <Card className="p-4 space-y-2">
              <h2 className="text-lg font-semibold">{t("billing.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("billing.subtitle")}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" onClick={() => toast({ title: "Coming soon" })}>{t("billing.managePlan")}</Button>
                <Button type="button" variant="secondary" onClick={() => toast({ title: "Coming soon" })}>{t("billing.updatePayment")}</Button>
                <Button type="button" variant="outline" onClick={() => toast({ title: "Coming soon" })}>{t("billing.viewInvoices")}</Button>
              </div>
            </Card>
          )}

          {tab === "ai" && (
            <div className="space-y-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t("ai.connectOpenAI")}</h2>
                  <span className="text-xs text-muted-foreground">{connected ? t("actions.connected") : t("actions.notConnected")}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="openai">{t("ai.apiKey")}</Label>
                    <Input id="openai" value={openaiKey} onChange={(e) => setKey(e.target.value)} placeholder="sk-..." />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button type="button" className="w-full" onClick={saveOpenAI}>{t("actions.save")}</Button>
                    <Button type="button" variant="outline" className="w-full" onClick={disconnectOpenAI}>{t("actions.disconnect")}</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("ai.tip")}</p>
              </Card>

              <Card className="p-4 space-y-4">
                <h2 className="text-lg font-semibold">{t("ai.defaultModel")}</h2>
                <AIModelSelector />
              </Card>

              <Card className="p-4 space-y-4">
                <ApiAccessPanel />
              </Card>

              <Card className="p-4 space-y-4">
                <CrawlPanel />
              </Card>
            </div>
          )}

          {tab === "storage" && (
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <h2 className="text-lg font-semibold">{t("storage.connect")}</h2>
                {["google", "dropbox", "icloud"].map((p) => {
                  const provider = p as StorageProvider;
                  const nameMap: Record<StorageProvider, string> = {
                    google: t("storage.google"),
                    dropbox: t("storage.dropbox"),
                    icloud: t("storage.icloud"),
                  };
                  const connected = isConnected(provider);
                  return (
                    <div key={provider} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div>
                        <div className="font-medium">{nameMap[provider]}</div>
                        <div className="text-xs text-muted-foreground">
                          {connected ? t("actions.connected") : t("actions.notConnected")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!connected ? (
                          <Button type="button" onClick={() => {
                            const token = window.prompt(`Paste ${nameMap[provider]} token (placeholder)`);
                            if (token) {
                              connect(provider, token);
                              toast({ title: nameMap[provider], description: t("actions.connected") });
                            }
                          }}>{t("actions.connect")}</Button>
                        ) : (
                          <Button type="button" variant="outline" onClick={() => {
                            disconnect(provider);
                            toast({ title: nameMap[provider], description: t("actions.disconnect") });
                          }}>{t("actions.disconnect")}</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>

              <Card className="p-4 space-y-2">
                <h3 className="text-base font-semibold">{t("storage.default")}</h3>
                <Select
                  value={defaultProvider ?? undefined}
                  onValueChange={(v) => setDefault(v as StorageProvider)}
                >
                  <SelectTrigger aria-label="Default storage">
                    <SelectValue placeholder={t("storage.default")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["google", "dropbox", "icloud"] as StorageProvider[])
                      .filter((p) => isConnected(p))
                      .map((p) => (
                        <SelectItem key={p} value={p}>
                          {p === "google" ? t("storage.google") : p === "dropbox" ? t("storage.dropbox") : t("storage.icloud")}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
export default Settings;
