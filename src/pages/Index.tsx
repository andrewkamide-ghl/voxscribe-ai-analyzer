
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { CircleDot, Mic, PauseCircle, PlayCircle, Scissors, Sparkles, ShieldCheck, Download, ArrowUp } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import RightFeatureBar from "@/components/RightFeatureBar";
import SpeakersForm from "@/components/SpeakersForm";
import AssetsPanel from "@/components/AssetsPanel";
import AIModelSelector from "@/components/AIModelSelector";
import { useAIConfig } from "@/store/ai";
import { askWithConfig } from "@/utils/AIClient";
import { callsStore } from "@/store/calls";
import { contactsStore, type Contact } from "@/store/contacts";
interface Segment {
  id: string;
  speaker: string;
  timestamp: string; // e.g. 00:01:23
  text: string;
  selected?: boolean;
}

const initialSegments: Segment[] = [
  {
    id: "s1",
    speaker: "Moderator",
    timestamp: "00:00:04",
    text:
      "Good evening and welcome to tonight's debate. Each candidate will offer an opening statement, and then we'll move through questions on the budget, housing, transportation, and public safety. Let's keep answers focused and respectful.",
  },
  {
    id: "s2",
    speaker: "Candidate A",
    timestamp: "00:00:22",
    text:
      "Thank you. Our city is at an inflection point. My plan prioritizes affordability and opportunity: we will accelerate housing near transit, reform outdated zoning, and invest in community safety that is both effective and accountable. This is about pragmatic leadership and measurable results.",
  },
  {
    id: "s3",
    speaker: "Candidate B",
    timestamp: "00:00:47",
    text:
      "I appreciate the chance to speak with you tonight. We need bold climate action, reliable transit, and a government that works for everyone, not just the well-connected. I will champion clean energy jobs, fix our roads, and make City Hall more transparent and responsive.",
  },
  {
    id: "s4",
    speaker: "Moderator",
    timestamp: "00:01:12",
    text:
      "Let's begin with the budget. The city faces a projected shortfall next year. What specific steps will you take to close the gap without undermining essential services like sanitation, public safety, and libraries?",
  },
  {
    id: "s5",
    speaker: "Candidate A",
    timestamp: "00:01:35",
    text:
      "We can balance the budget without deep service cuts by auditing no-bid contracts, consolidating duplicative programs, and renegotiating vendor rates. We'll also modernize procurement to reduce waste and invest in digital tools that save money over time.",
  },
  {
    id: "s6",
    speaker: "Candidate B",
    timestamp: "00:02:03",
    text:
      "My approach is to grow revenue fairly while prioritizing core services. We will close tax loopholes, expand the commercial tax base by streamlining permits for small businesses, and target federal infrastructure dollars to projects that unlock long-term savings.",
  },
  {
    id: "s7",
    speaker: "Moderator",
    timestamp: "00:02:28",
    text:
      "On transportation: commuters report longer travel times and inconsistent service. What investments will you make to improve reliability while reducing congestion and emissions?",
  },
  {
    id: "s8",
    speaker: "Candidate A",
    timestamp: "00:02:52",
    text:
      "We'll fund bus rapid transit corridors, upgrade signals for transit priority, and fix dangerous intersections. I will also expand secure bike networks and adopt a state-of-good-repair strategy for roads to reduce costly emergency repairs.",
  },
];

// Rotating political sample lines for continuous streaming
const POLITICAL_SAMPLE: { speaker: string; text: string }[] = [
  { speaker: "Moderator", text: "Housing costs have outpaced wages for years. Name two actions you would take in your first 100 days to meaningfully increase supply without displacing existing residents." },
  { speaker: "Candidate A", text: "Day one, I will sign an executive directive to fast-track projects near transit with clear affordability targets, and I will propose a by-right code update for missing-middle housing in designated corridors." },
  { speaker: "Candidate B", text: "I will launch a city–university design lab to convert underutilized commercial space into housing and establish a public land bank to activate vacant parcels for mixed-income developments." },
  { speaker: "Moderator", text: "Public safety remains a top concern. How will you reduce violent crime while ensuring civil liberties and community trust?" },
  { speaker: "Candidate A", text: "We'll focus on the small number of individuals driving violent offenses with precision policing and expand non-emergency response teams for mental health and substance use calls." },
  { speaker: "Candidate B", text: "We need a prevention-first strategy: youth jobs, after-school programs, and evidence-based violence interruption, paired with training and accountability for law enforcement." },
  { speaker: "Moderator", text: "Climate resilience: storms and heat waves are intensifying. What is your plan to protect vulnerable neighborhoods?" },
  { speaker: "Candidate A", text: "We'll accelerate cool roofs and tree canopy in heat islands, harden critical infrastructure, and elevate or retrofit homes in flood zones with federal support." },
  { speaker: "Candidate B", text: "I will create a resilience bond to finance green infrastructure—bioswales, permeable streets, and coastal wetlands—while setting ambitious emissions targets for city operations." },
  { speaker: "Moderator", text: "Education: test scores have declined post-pandemic. What will you do to improve outcomes?" },
  { speaker: "Candidate A", text: "We'll invest in high-dosage tutoring, expand early literacy programs, and partner with community organizations to provide wraparound services for students and families." },
  { speaker: "Candidate B", text: "Teachers need support and classrooms need resources. We'll reduce administrative burdens, expand apprenticeships with local employers, and provide universal aftercare." },
  { speaker: "Moderator", text: "Small business formation is slowing. How will you cut red tape while maintaining consumer protections?" },
  { speaker: "Candidate A", text: "We'll launch a one-stop digital permit portal with service-level guarantees and publish a plain-language code to reduce uncertainty for entrepreneurs." },
  { speaker: "Candidate B", text: "I'll implement a 72-hour permit review for low-risk businesses, waive first-year fees for startups in underserved neighborhoods, and expand main street grants." },
  { speaker: "Moderator", text: "Tax policy: would you adjust property taxes or introduce new fees to stabilize revenue?" },
  { speaker: "Candidate A", text: "No across-the-board hikes. We'll reassess ultra-high-value properties, close speculative loopholes, and ensure fairness without burdening working families." },
  { speaker: "Candidate B", text: "I'll create a progressive circuit breaker to protect seniors and low-income homeowners while modestly increasing rates on vacant luxury units to discourage warehousing." },
  { speaker: "Moderator", text: "Infrastructure: we've seen water main breaks and power outages. What's your plan?" },
  { speaker: "Candidate A", text: "A transparent capital plan prioritizing risk: replace failing mains, upgrade substations, and coordinate street openings across agencies to cut costs and delays." },
  { speaker: "Candidate B", text: "Public–private partnerships for grid modernization, citywide smart meters, and an open data dashboard so residents can track progress in real time." },
  { speaker: "Moderator", text: "Data privacy and technology: how will you harness AI while safeguarding rights?" },
  { speaker: "Candidate A", text: "We'll adopt an AI accountability framework: algorithmic impact assessments, procurement standards, and an ethics board with community representation." },
  { speaker: "Candidate B", text: "Open-source by default, privacy-by-design for all new systems, and strict limits on automated decision-making in sensitive services." },
  { speaker: "Moderator", text: "Homelessness: shelters are at capacity. What interventions will you scale?" },
  { speaker: "Candidate A", text: "Housing-first with supportive services, master leasing vacant buildings, and expanding street outreach teams with clinical staff." },
  { speaker: "Candidate B", text: "Right-to-counsel for tenants, rapid rehousing vouchers, and mental health stabilization centers that divert people from the criminal justice system." },
  { speaker: "Moderator", text: "Transit reliability has been uneven across neighborhoods. How will you ensure equity?" },
  { speaker: "Candidate A", text: "We'll prioritize bus lanes and signal priority in underserved areas first and tie capital investments to accessibility and on-time performance metrics." },
  { speaker: "Candidate B", text: "A universal fare discount for low-income riders, more frequent off-peak service, and safe, well-lit stations with working elevators." },
  { speaker: "Moderator", text: "Government transparency: what commitments will you make on your first day?" },
  { speaker: "Candidate A", text: "Publish all meeting calendars, release machine-readable budget data, and livestream procurement board decisions." },
  { speaker: "Candidate B", text: "Adopt an open contracts platform, strengthen whistleblower protections, and require department performance reports every quarter." },
];

const Index = () => {
  const { config } = useAIConfig();
  const [connected, setConnected] = useState(true);
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [analyzing, setAnalyzing] = useState(false);
  const [simulate, setSimulate] = useState(true);
  const [factChecking, setFactChecking] = useState(false);
  const [factResults, setFactResults] = useState<{ statement: string; score: number; citations: string[] }[]>([]);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
 
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const [isAtTop, setIsAtTop] = useState(true);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [badgeVisibleIds, setBadgeVisibleIds] = useState<Set<string>>(new Set());
  const removeTimersRef = useRef<Map<string, number>>(new Map());
  const sampleIndexRef = useRef<number>(0);
  
  const prevLenRef = useRef<number>(initialSegments.length);
  
  // Right panel feature state: "assistant" (default) or "speakers"
  const [activeFeature, setActiveFeature] = useState<"assistant" | "speakers" | "assets">("assistant");
  // Unique speakers from transcript (exclude Moderator)
  const uniqueSpeakers = useMemo(() => Array.from(new Set(segments.map((s) => s.speaker))).filter((n) => n && n !== "Moderator"), [segments]);

  function saveCall() {
    const name = `Call ${new Date().toLocaleString()}`;
    const time = new Date().toISOString();
    const participants = uniqueSpeakers;
    const allContacts = contactsStore.getAll();
    const savedContacts = participants
      .map((n) => allContacts.find((c) => c.name === n))
      .filter(Boolean) as Contact[];
    callsStore.add({
      name,
      time,
      totalSegments: segments.length,
      contacts: savedContacts.map((c) => ({ id: c.id, name: c.name })),
    });
    toast({ title: "Call saved", description: "Added to Calls." });
  }

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) setIsAtTop(el.scrollTop <= 1);
  }, []);


  const isElementVisibleInContainer = (target: HTMLElement, container: HTMLElement, headerH: number) => {
    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const topCutoff = cRect.top + headerH + 8;
    return tRect.top >= topCutoff && tRect.top <= cRect.bottom;
  };

  type FactResult = { statement: string; score: number; citations: string[] };
  interface AnalysisRun {
    id: string;
    timestamp: string; // ISO
    summary: string;
    insights: string[];
    facts: FactResult[];
    selection: string;
  }

  const [runs, setRuns] = useState<AnalysisRun[]>([]);

  // Cursor spotlight signature moment
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--spot-x", `${x}%`);
    el.style.setProperty("--spot-y", `${y}%`);
  }

// Simulate continuous real-time incoming segments (political conversation)
useEffect(() => {
  if (!simulate || !connected) return;
  const timer = setInterval(() => {
    const i = sampleIndexRef.current % POLITICAL_SAMPLE.length;
    const line = POLITICAL_SAMPLE[i];
    sampleIndexRef.current = (sampleIndexRef.current + 1) % POLITICAL_SAMPLE.length;
    setSegments((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        speaker: line.speaker,
        timestamp: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
        text: line.text,
      },
    ]);
  }, 2500);
  return () => clearInterval(timer);
}, [simulate, connected]);

  const selectedSegments = useMemo(() => segments.filter((s) => s.selected), [segments]);
  const selectedText = selectedSegments.map((s) => s.text).join(" \n");
  const orderedSegments = useMemo(() => segments.slice().reverse(), [segments]);

  function toggleSelect(id: string) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));
  }

  function clearSelection() {
    setSegments((prev) => prev.map((s) => ({ ...s, selected: false })));
  }

  const handleTranscriptScroll = () => {
    const el = transcriptRef.current;
    if (!el) return;
    const atTopNow = el.scrollTop <= 1;
    setIsAtTop(atTopNow);
  };
const scrollToLatest = () => {
  const el = transcriptRef.current;
  if (!el) return;
  el.scrollTo({ top: 0, behavior: "smooth" });
};
  useEffect(() => {
    const curr = segments.length;
    const prev = prevLenRef.current;
    if (curr > prev) {
      const added = curr - prev;
      const el = transcriptRef.current;
      if (isAtTop && el) {
        el.scrollTop = 0;
      } else {
setUnreadIds((prevSet) => {
  const next = new Set(prevSet);
  for (let i = prev; i < curr; i++) {
    const seg = segments[i];
    if (seg) next.add(seg.id);
  }
  return next;
});
      }
    }
    prevLenRef.current = curr;
  }, [segments.length, isAtTop]);

  async function analyzeSelection() {
    if (selectedSegments.length === 0) {
      toast({ title: "No selection", description: "Select parts of the transcript to analyze." });
      return;
    }
    setAnalyzing(true);
    toast({ title: "Analyzing…", description: "Generating summary, insights, and fact check." });

    const timestamp = new Date().toISOString();

    // Simple summary: first 1-2 sentences of the selection
    const sentences = selectedText
      .split(/[.!?]\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const summary = sentences.slice(0, 2).join(". ") + (sentences.length > 0 ? "." : "");

    // Simple insights: reuse or extract highlights
    const insights = [
      "Top concern: onboarding conversion down; consider copy and field reduction.",
      "Timeline question raised for next sprint dependencies.",
      "Hypothesis: email verification friction increases drop-off.",
    ];

    // Fact check results (mocked for now or provider-managed in Settings)
    const facts: FactResult[] = sentences.slice(0, 5).map((s) => ({
      statement: s,
      score: Math.max(0, Math.min(100, 60 + Math.round(Math.random() * 35))),
      citations: [],
    }));

    const run: AnalysisRun = {
      id: `run-${Date.now()}`,
      timestamp,
      summary: summary || "No concise summary available for the current selection.",
      insights,
      facts,
      selection: selectedText,
    };

    // Simulate latency then store run in history
    setTimeout(() => {
      setRuns((prev) => [run, ...prev]);
      setAnalyzing(false);
      toast({ title: "Analysis ready", description: "New results added to the history." });
    }, 800);
  }

  function scoreColor(score: number) {
    if (score >= 75) return "bg-green-600 text-white";
    if (score >= 45) return "bg-yellow-500 text-black";
    return "bg-red-600 text-white";
  }

  function formatTimestamp(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  async function downloadRun(run: AnalysisRun) {
    try {
      const zip = new JSZip();
      zip.file("summary.txt", run.summary + "\n");
      zip.file("insights.txt", run.insights.map((i) => `- ${i}`).join("\n"));
      zip.file("factcheck.json", JSON.stringify(run.facts, null, 2));
      zip.file("selection.txt", run.selection);
      const blob = await zip.generateAsync({ type: "blob" });
      const stamp = run.timestamp.replace(/[:.]/g, "-");
      saveAs(blob, `analysis-${stamp}.zip`);
      toast({ title: "Download ready", description: "Saved ZIP to your device." });
    } catch (e) {
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    }
  }

  function onSaveTo(provider: "supabase" | "gdrive" | "dropbox", run: AnalysisRun) {
    const providerName = provider === "gdrive" ? "Google Drive" : provider === "dropbox" ? "Dropbox" : "Supabase";
    toast({
      title: `Connect ${providerName}`,
      description: "Manage cloud storage connections in Settings. We'll save this run once connected.",
    });
  }

  async function factCheck() {
    if (selectedSegments.length === 0) {
      toast({ title: "No selection", description: "Select transcript segments to fact check." });
      return;
    }

    try {
      setFactChecking(true);
      toast({ title: "Fact checking…", description: "Analyzing statements with ChatGPT." });

      const statements = selectedText
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);

      const prompt = [
        "You are a precise fact-checker.",
        "Given a list of statements, evaluate each for factual accuracy.",
        "Return strictly a JSON array where each item has {\"statement\": string, \"score\": integer 0-100 (likelihood the statement is factually correct), \"citations\": string[] of up to 3 relevant URLs}.",
        "Do not include any extra text.",
        "",
        statements.map((s, i) => `${i + 1}. ${s}`).join("\n"),
      ].join("\n");

      const data = await askWithConfig(config, prompt);
      const content = data?.choices?.[0]?.message?.content as string;

      let parsed: any[] = [];
      if (content) {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }

      const results = Array.isArray(parsed)
        ? parsed.map((it: any) => ({
            statement: typeof it.statement === "string" ? it.statement : "",
            score: Math.max(0, Math.min(100, Number(it.score) || 0)),
            citations: Array.isArray(it.citations) ? it.citations.slice(0, 3) : [],
          }))
        : [];

      setFactResults(results);
      toast({ title: "Fact check complete", description: "See scores and citations below." });
    } catch (error) {
      console.error(error);
      toast({
        title: "Fact check failed",
        description: "Add your OpenAI API key in Settings and try again.",
        variant: "destructive",
      });
    } finally {
      setFactChecking(false);
    }
  }

  // Show badge immediately for unread items and manage removal timers separately
  useEffect(() => {
    // Ensure all unread ids have a visible badge immediately
    setBadgeVisibleIds((prev) => {
      const next = new Set(prev);
      unreadIds.forEach((id) => next.add(id));
      return next;
    });

    // Safety: clear any timers for ids that are no longer unread
    const timers = removeTimersRef.current;
    Array.from(timers.entries()).forEach(([id, t]) => {
      if (!unreadIds.has(id)) {
        clearTimeout(t);
        timers.delete(id);
      }
    });
  }, [unreadIds]);

  // IntersectionObserver to remove unread/badge 0.5s after visibility
  useEffect(() => {
    const rootEl = transcriptRef.current;
    if (!rootEl) return;
    const headerH = stickyHeaderRef.current?.offsetHeight ?? 0;
    const timers = removeTimersRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const id = target.getAttribute("data-seg-id");
          if (!id) return;

          const isUnread = unreadIds.has(id);
          const existing = timers.get(id);

          if (entry.isIntersecting && isUnread) {
            if (!existing) {
              const t = window.setTimeout(() => {
                setUnreadIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
                setBadgeVisibleIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
                timers.delete(id);
              }, 500);
              timers.set(id, t);
            }
          } else {
            if (existing) {
              clearTimeout(existing);
              timers.delete(id);
            }
          }
        });
      },
      {
        root: rootEl,
        rootMargin: `-${headerH + 8}px 0px 0px 0px`,
        threshold: 0.6,
      }
    );

    // Observe all segment nodes
    itemRefs.current.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [segments, unreadIds]);

  // Cleanup any pending timers on unmount
  useEffect(() => {
    return () => {
      const timers = removeTimersRef.current;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="h-screen min-h-screen overflow-hidden bg-background ambient-spotlight flex flex-col"
    >
      <Helmet>
        <title>Live Transcription & Speaker Tracking</title>
        <meta
          name="description"
          content="Track speakers and transcribe in real time. Select portions to analyze with AI while the conversation is happening."
        />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://localhost:8080/"} />
      </Helmet>

      <main className="container mx-auto px-4 pt-6 pb-6 pr-14 md:pr-16 grid gap-3 md:grid-cols-12 flex-1 overflow-hidden min-h-0">
        {/* Transcript */}
        <Card className="md:col-span-7 h-full flex flex-col min-h-0">
          <CardHeader className="flex-row items-center justify-between min-h-[72px] py-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">Transcript</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CircleDot className={`h-4 w-4 ${connected ? "text-destructive pulse drop-shadow-[0_0_10px_hsl(var(--destructive))]" : "text-muted-foreground"}`} />
                  {connected ? "Recording" : "Disconnected"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={saveCall}>
                <Download className="mr-2 h-4 w-4" /> Save Call
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  {connected ? (
                    <Button variant="destructive" size="sm" onClick={() => setConnected(false)}>
                      <PauseCircle className="mr-2 h-4 w-4" /> Stop
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={() => setConnected(true)}>
                      <PlayCircle className="mr-2 h-4 w-4" /> Start
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent>Toggle live session</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0 flex-1 overflow-hidden min-h-0">
            <div
              ref={transcriptRef}
              onScroll={handleTranscriptScroll}
              className="h-full min-h-0 overflow-auto relative"
              style={{ scrollbarGutter: "stable both-edges" }}
            >
              <div ref={stickyHeaderRef} className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="px-4 py-2 flex items-center justify-end gap-2">
                  <Badge variant="outline" className="rounded-md h-8 box-border py-0">
                    {segments.length} segments
                  </Badge>
                  {selectedSegments.length > 0 && (
                    <Badge className="rounded-md h-8 box-border py-0 bg-primary/10 text-primary hover:bg-primary/20">
                      {selectedSegments.length} selected
                    </Badge>
                  )}
                </div>
              </div>
              

              <div className="px-4 pt-4 pb-16 space-y-3">
                {orderedSegments.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    aria-pressed={!!s.selected}
                    data-seg-id={s.id}
                    onClick={() => toggleSelect(s.id)}
                    ref={(node) => {
                      if (node) itemRefs.current.set(s.id, node);
                      else itemRefs.current.delete(s.id);
                    }}
                    className={`relative rounded-md border p-3 transition-colors focus:outline-none hover:bg-muted/50 ${
                      s.selected ? "bg-primary/5 ring-1 ring-primary" : unreadIds.has(s.id) ? "ring-1 ring-primary/40" : ""
                    }`}
                  >
                    {badgeVisibleIds.has(s.id) && (
                      <span className="pointer-events-none absolute -top-2 left-3 z-10">
                        <Badge className="h-5 px-2 py-0 text-[10px] rounded-full shadow-sm">New Segment</Badge>
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-md">{s.speaker}</Badge>
                        <span className="text-xs text-muted-foreground">{s.timestamp}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.selected ? "Selected" : "Click to select"}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground/90">{s.text}</p>
                  </div>
                ))}

                {connected && (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    Streaming new segments…
                  </div>
                )}
              </div>

              {unreadIds.size > 0 && (
                <div className="sticky bottom-3 z-30 px-4 pointer-events-none">
                  <div className="flex justify-center">
                    <Button
                      variant="default"
                      onClick={scrollToLatest}
                      className="pointer-events-auto h-9 rounded-full shadow-lg"
                    >
                      Scroll to Latest
                      <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Right Panel: Feature-aware */}
        {activeFeature === "assistant" ? (
          <Card className="md:col-span-5 h-full flex flex-col min-h-0">
            <CardHeader className="flex-row items-center justify-between min-h-[72px] py-4">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <Button size="sm" onClick={analyzeSelection} disabled={selectedSegments.length === 0}>
                <Sparkles className="mr-2 h-4 w-4" /> Analyze
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-0 flex-1 overflow-hidden min-h-0">
              <Tabs defaultValue="insights" className="w-full h-full flex flex-col min-h-0">
                <ScrollArea className="h-full flex-1 min-h-0">
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                    <div className="px-4 py-2 flex items-center justify-end gap-2">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary" className="w-full px-2 py-1 text-xs rounded-md">Summary</TabsTrigger>
                        <TabsTrigger value="insights" className="w-full px-2 py-1 text-xs rounded-md">Insights</TabsTrigger>
                        <TabsTrigger value="factcheck" className="w-full px-2 py-1 text-xs rounded-md">Fact Check</TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                  {/* Insights */}
                  <TabsContent value="insights" className="px-4 pt-4 pb-0 space-y-3">
                    {analyzing ? (
                      <div className="space-y-3">
                        <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                      </div>
                    ) : runs.length > 0 ? (
                      <div className="space-y-3">
                        {runs.map((run) => (
                          <div key={run.id} className="rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">{formatTimestamp(run.timestamp)}</div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">Save</Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50">
                                    <DropdownMenuItem onClick={() => onSaveTo("supabase", run)}>Supabase</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSaveTo("gdrive", run)}>Google Drive</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSaveTo("dropbox", run)}>Dropbox</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="outline" size="sm" onClick={() => downloadRun(run)}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                              </div>
                            </div>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/90">
                              {run.insights.map((i, idx) => (
                                <li key={idx}>{i}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Click Analyze to generate insights.</p>
                    )}
                  </TabsContent>
                  {/* Summary */}
                  <TabsContent value="summary" className="px-4 pt-4 pb-0 space-y-3">
                    {analyzing ? (
                      <div className="space-y-3">
                        <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-4/6 rounded bg-muted animate-pulse" />
                      </div>
                    ) : runs.length > 0 ? (
                      <div className="space-y-3">
                        {runs.map((run) => (
                          <div key={run.id} className="rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">{formatTimestamp(run.timestamp)}</div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">Save</Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50">
                                    <DropdownMenuItem onClick={() => onSaveTo("supabase", run)}>Supabase</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSaveTo("gdrive", run)}>Google Drive</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSaveTo("dropbox", run)}>Dropbox</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="outline" size="sm" onClick={() => downloadRun(run)}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm leading-6 text-foreground/90">{run.summary}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-foreground/90">
                        Click Analyze to generate a concise meeting summary.
                      </p>
                    )}
                  </TabsContent>
                  {/* Fact Check */}
                  <TabsContent value="factcheck" className="px-4 pt-4 pb-0 space-y-3">
                    {runs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Click Analyze to generate fact-checked results.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {runs.map((run) => (
                          <div key={run.id} className="rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" /> {formatTimestamp(run.timestamp)}
                              </div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">Save</Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50">
                                    <DropdownMenuItem onClick={() => onSaveTo("supabase", run)}>Supabase</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSaveTo("gdrive", run)}>Google Drive</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSaveTo("dropbox", run)}>Dropbox</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="outline" size="sm" onClick={() => downloadRun(run)}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                              </div>
                            </div>
                            {run.facts.length > 0 ? (
                              <ul className="space-y-3">
                                {run.facts.map((r, idx) => (
                                  <li key={idx} className="rounded-md border p-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm leading-6 text-foreground/90">{r.statement}</p>
                                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${scoreColor(r.score)}`}>
                                        {r.score}%
                                      </span>
                                    </div>
                                    {r.citations && r.citations.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {r.citations.map((c, i) => (
                                          <a
                                            key={i}
                                            href={c}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
                                          >
                                            {c}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No fact check statements detected.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Fact checking is managed in user settings. Results generate when you click Analyze.
                    </p>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        ) : activeFeature === "speakers" ? (
          <SpeakersForm
            speakers={uniqueSpeakers}
            onRename={({ from, to }) => {
              setSegments((prev) => prev.map((s) => (s.speaker === from ? { ...s, speaker: to } : s)));
            }}
            aiRuns={runs}
          />
        ) : (
          <AssetsPanel />
        )}
       </main>

      {/* Always-visible feature rail on the right */}
      <RightFeatureBar
        active={activeFeature}
        onChange={(f) => setActiveFeature((prev) => (prev === f ? prev : f))}
      />
    </div>
  );
};

export default Index;
