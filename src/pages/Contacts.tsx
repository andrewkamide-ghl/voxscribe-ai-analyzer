import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { contactsStore, type Contact } from "@/store/contacts";

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    setContacts(contactsStore.getAll());
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Contacts — Saved speakers and notes</title>
        <meta name="description" content="Contacts directory of saved speakers, AI insights, and notes." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.origin + "/contacts" : "https://localhost:8080/contacts"} />
      </Helmet>

      <main>
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">Saved speakers and their information.</p>
        </header>

        <Separator />

        {contacts.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No contacts yet. Save a speaker from the Speakers panel.</p>
        ) : (
          <ScrollArea className="mt-4 h-[calc(100vh-180px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
              {contacts.map((c) => (
                <Card key={c.id} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{c.name || "Untitled"}</span>
                      <Badge variant="outline">Contact</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {c.background && (
                      <div>
                        <div className="text-xs text-muted-foreground">Background</div>
                        <p className="text-sm leading-6">{c.background}</p>
                      </div>
                    )}
                    {c.coreBeliefs && (
                      <div>
                        <div className="text-xs text-muted-foreground">Core Beliefs</div>
                        <p className="text-sm leading-6">{c.coreBeliefs}</p>
                      </div>
                    )}
                    {c.social && (
                      <div>
                        <div className="text-xs text-muted-foreground">Social / Website</div>
                        <p className="text-sm leading-6 break-words">{c.social}</p>
                      </div>
                    )}
                    {c.notes && (
                      <div>
                        <div className="text-xs text-muted-foreground">Notes</div>
                        <p className="text-sm leading-6">{c.notes}</p>
                      </div>
                    )}
                    {c.aiRuns && c.aiRuns.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground">AI Content</div>
                        <p className="text-xs text-muted-foreground">{c.aiRuns.length} analysis run(s) saved</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Saved {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
};

export default Contacts;
