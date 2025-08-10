import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { callsStore, type Call } from "@/store/calls";
import { researchStore, type ResearchItem } from "@/store/research";
import { contactsStore, type Contact } from "@/store/contacts";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
];

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function Dashboard() {
  const [view, setView] = useState<"table" | "graph">("table");
  const [calls, setCalls] = useState<Call[]>([]);
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const u1 = callsStore.subscribe(setCalls);
    const u2 = researchStore.subscribe(setResearch);
    // contacts store may not be observable initially, so set and then subscribe if available
    setContacts(contactsStore.getAll());
    const u3 = contactsStore.subscribe ? contactsStore.subscribe(setContacts) : () => {};
    return () => { u1(); u2(); u3(); };
  }, []);

  const recentCalls = useMemo(() => calls.slice().sort((a,b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0,5), [calls]);
  const recentResearch = useMemo(() => research.slice().sort((a,b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0,5), [research]);
  const recentContacts = useMemo(() => contacts.slice().sort((a,b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0,5), [contacts]);

  // Donut data
  const callsDonut = useMemo(() => {
    const buckets = { solo: 0, small: 0, large: 0 };
    calls.forEach((c) => {
      const n = c.contacts?.length || 0;
      if (n <= 1) buckets.solo++;
      else if (n <= 3) buckets.small++;
      else buckets.large++;
    });
    return [
      { name: "Solo", value: buckets.solo },
      { name: "2-3", value: buckets.small },
      { name: "4+", value: buckets.large },
    ];
  }, [calls]);

  const researchDonut = useMemo(() => {
    const buckets = { crawl: 0, qa: 0, note: 0 } as Record<ResearchItem["type"], number> & { note: number };
    research.forEach((r) => { buckets[r.type] = (buckets[r.type] || 0) + 1; });
    return [
      { name: "Crawl", value: buckets.crawl || 0 },
      { name: "Q&A", value: buckets.qa || 0 },
      { name: "Note", value: buckets.note || 0 },
    ];
  }, [research]);

  const contactsDonut = useMemo(() => {
    const withBeliefs = contacts.filter((c) => !!c.coreBeliefs?.trim()).length;
    const withoutBeliefs = contacts.length - withBeliefs;
    return [
      { name: "With beliefs", value: withBeliefs },
      { name: "No beliefs", value: withoutBeliefs },
    ];
  }, [contacts]);

  const renderDonut = (data: { name: string; value: number }[]) => (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Account Dashboard — Calls, Research, Contacts</title>
        <meta name="description" content="Overview of your recent calls, research, and contacts." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.origin + "/" : "https://localhost:8080/"} />
      </Helmet>

      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your recent activity</p>
        </div>
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as any)}>
          <ToggleGroupItem value="table">Table</ToggleGroupItem>
          <ToggleGroupItem value="graph">Graphs</ToggleGroupItem>
        </ToggleGroup>
      </header>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Calls */}
        <Card className="h-full">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Calls</CardTitle>
            <Link to="/calls" className="text-xs underline text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent>
            {view === "table" ? (
              recentCalls.length ? (
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call Name</TableHead>
                        <TableHead>Call Time</TableHead>
                        <TableHead>Total Segments</TableHead>
                        <TableHead>Contacts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCalls.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{formatDate(c.time)}</TableCell>
                          <TableCell>{c.totalSegments}</TableCell>
                          <TableCell>{c.contacts?.map((p) => p.name).join(", ") || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No calls yet. Save one from the Calls page.</p>
              )
            ) : (
              renderDonut(callsDonut)
            )}
          </CardContent>
        </Card>

        {/* Research */}
        <Card className="h-full">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Research</CardTitle>
            <Link to="/research" className="text-xs underline text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent>
            {view === "table" ? (
              recentResearch.length ? (
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL/Question</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentResearch.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.type === "crawl" ? (r.sources?.[0] || r.topic) : r.topic}</TableCell>
                          <TableCell>{formatDate(r.createdAt)}</TableCell>
                          <TableCell>
                            <Link to="/research" className="text-xs underline text-muted-foreground hover:text-foreground">Open</Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No research saved yet.</p>
              )
            ) : (
              renderDonut(researchDonut)
            )}
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card className="h-full">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            <Link to="/contacts" className="text-xs underline text-muted-foreground hover:text-foreground">View all</Link>
          </CardHeader>
          <CardContent>
            {view === "table" ? (
              recentContacts.length ? (
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Background</TableHead>
                        <TableHead>Core Beliefs</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentContacts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={c.background}>{c.background || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={c.coreBeliefs}>{c.coreBeliefs || "—"}</TableCell>
                          <TableCell>
                            <Link to="/contacts" className="text-xs underline text-muted-foreground hover:text-foreground">Open</Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No contacts yet.</p>
              )
            ) : (
              renderDonut(contactsDonut)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
