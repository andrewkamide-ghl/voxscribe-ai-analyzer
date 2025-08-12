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
// Removed browser OpenAI key storage imports
import { useTheme } from "next-themes";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@/store/i18n";

import AIConnectionsAccordion from "@/components/AIConnectionsAccordion";
const TABS = ["account", "billing", "ai"] as const;
type TabKey = typeof TABS[number];

const Settings = () => {
  const { toast } = useToast();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
const urlTab = searchParams.get("tab");
const initialTab: TabKey = (TABS as readonly string[]).includes(urlTab ?? "") ? (urlTab as TabKey) : "account";
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


  const leftNavItemCls = (key: TabKey) =>
    key === tab ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Settings — Account, Billing & AI</title>
        <meta name="description" content="Manage your account, billing, and AI preferences." />
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
                <h2 className="text-lg font-semibold">Default Model</h2>
                <AIModelSelector />
              </Card>

              <Card className="p-4 space-y-4">
                <CrawlPanel />
              </Card>

              <Card className="p-4 space-y-4">
                <h2 className="text-lg font-semibold">AI Assistant Connections</h2>
                <AIConnectionsAccordion />
              </Card>
            </div>
          )}

        </section>
      </div>
    </div>
  );
};
export default Settings;
