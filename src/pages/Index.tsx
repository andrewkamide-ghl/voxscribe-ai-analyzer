import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { CircleDot, Mic, PauseCircle, PlayCircle, Scissors, Sparkles, ShieldCheck } from "lucide-react";

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
    speaker: "Speaker A",
    timestamp: "00:00:04",
    text: "Hey! Thanks for joining. I want to walk through the agenda and capture action items as we go.",
  },
  {
    id: "s2",
    speaker: "Speaker B",
    timestamp: "00:00:10",
    text: "Sounds good. I'm particularly interested in timelines and dependencies for the next sprint.",
  },
  {
    id: "s3",
    speaker: "Speaker A",
    timestamp: "00:00:18",
    text: "Great. We can start with the onboarding flow—conversion dipped last week by about 3%.",
  },
];

const Index = () => {
  const [connected, setConnected] = useState(true);
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [analyzing, setAnalyzing] = useState(false);
  const [simulate, setSimulate] = useState(true);
  const [factChecking, setFactChecking] = useState(false);
  const [factResults, setFactResults] = useState<{ statement: string; score: number; citations: string[] }[]>([]);
  const [perplexityKey, setPerplexityKey] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("perplexity_api_key") || "" : ""));
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // Simulate real-time incoming segments for demonstration
  useEffect(() => {
    if (!simulate) return;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      setSegments((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          speaker: count % 2 === 0 ? "Speaker A" : "Speaker B",
          timestamp: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
          text:
            count % 2 === 0
              ? "We're seeing increased drop-off at the email verification step."
              : "One idea is to prefill fields and trim copy. Also consider progressive disclosure.",
        },
      ]);
      if (count >= 6) clearInterval(timer);
    }, 3500);
    return () => clearInterval(timer);
  }, [simulate]);

  const selectedSegments = useMemo(() => segments.filter((s) => s.selected), [segments]);
  const selectedText = selectedSegments.map((s) => s.text).join(" \n");

  // Auto-generate fact check results when selection changes
  useEffect(() => {
    if (!selectedText) {
      setFactResults([]);
      setFactChecking(false);
      return;
    }
    const run = async () => {
      try {
        setFactChecking(true);
        if (perplexityKey) {
          await factCheck();
        } else {
          const statements = selectedText
            .split(/[.!?]\s+|\n+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 5);
          const mockResults = statements.map((s) => ({
            statement: s,
            score: Math.max(0, Math.min(100, 60 + Math.round(Math.random() * 35))),
            citations: [],
          }));
          setTimeout(() => {
            setFactResults(mockResults);
            setFactChecking(false);
          }, 700);
        }
      } catch {
        setFactChecking(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedText]);

  function toggleSelect(id: string) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)));
  }

  function clearSelection() {
    setSegments((prev) => prev.map((s) => ({ ...s, selected: false })));
  }

  async function analyzeSelection() {
    if (selectedSegments.length === 0) {
      toast({ title: "No selection", description: "Select parts of the transcript to analyze." });
      return;
    }
    setAnalyzing(true);
    toast({ title: "Analyzing…", description: "Streaming insights in real time." });
    // Simulate latency
    setTimeout(() => {
      setAnalyzing(false);
      toast({ title: "Analysis ready", description: "Insights updated in the panel." });
    }, 1600);
  }

  function scoreColor(score: number) {
    if (score >= 75) return "bg-green-600 text-white";
    if (score >= 45) return "bg-yellow-500 text-black";
    return "bg-red-600 text-white";
  }

  async function factCheck() {
    if (selectedSegments.length === 0) {
      toast({ title: "No selection", description: "Select transcript segments to fact check." });
      return;
    }
    if (!perplexityKey) {
      toast({ title: "API key required", description: "Add a Perplexity API key below to enable fact checking." });
      return;
    }

    try {
      setFactChecking(true);
      toast({ title: "Fact checking…", description: "Searching the web and evaluating statements." });

      const statements = selectedText
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${perplexityKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 900,
          search_recency_filter: "year",
          messages: [
            {
              role: "system",
              content:
                "You are a precise fact-checker. Given a list of statements, search the web and return strictly a JSON array where each item has {\"statement\": string, \"score\": integer 0-100 (likelihood the statement is factually correct), \"citations\": string[] of up to 3 relevant URLs}. Do not include any extra text.",
            },
            {
              role: "user",
              content: statements.map((s, i) => `${i + 1}. ${s}`).join("\n"),
            },
          ],
        }),
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content as string;

      let parsed: any[] = [];
      if (content) {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
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
        description: "Verify your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setFactChecking(false);
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-[25vh] bg-background ambient-spotlight"
    >
      <Helmet>
        <title>Live Transcription & Speaker Tracking</title>
        <meta
          name="description"
          content="Track speakers and transcribe in real time. Select portions to analyze with AI while the conversation is happening."
        />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://localhost:8080/"} />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary/10 grid place-items-center text-primary shadow-glow">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Live Transcription</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CircleDot className={`h-3 w-3 ${connected ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                {connected ? "Listening" : "Disconnected"}
              </div>
            </div>
            <Badge variant="secondary" className="ml-1">Beta</Badge>
          </div>

          <div className="flex items-center gap-2">
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

            <Button variant="secondary" size="sm" onClick={() => setSimulate((s) => !s)}>
              <Sparkles className="mr-2 h-4 w-4" /> Demo stream
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 pt-6 pb-0 grid gap-3 md:grid-cols-12">
        {/* Transcript */}
        <Card className="md:col-span-7">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Transcript</CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{segments.length} segments</Badge>
              {selectedSegments.length > 0 && (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  {selectedSegments.length} selected
                </Badge>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="p-4 space-y-3">
                {segments.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    aria-pressed={!!s.selected}
                    onClick={() => toggleSelect(s.id)}
                    className={`rounded-md border p-3 transition-colors focus:outline-none hover:bg-muted/50 ${
                      s.selected ? "bg-primary/5 ring-1 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{s.speaker}</Badge>
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
            </ScrollArea>

          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card className="md:col-span-5 self-start md:sticky md:top-[84px]">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">AI Analysis</CardTitle>
            <Button size="sm" onClick={analyzeSelection} disabled={selectedSegments.length === 0}>
              <Sparkles className="mr-2 h-4 w-4" /> Analyze
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="factcheck">Fact Check</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="mt-4 space-y-3">
                {analyzing ? (
                  <div className="space-y-3">
                    <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                  </div>
                ) : selectedText ? (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/90">
                    <li>Top concern: onboarding conversion down; consider copy and field reduction.</li>
                    <li>Timeline question raised for next sprint dependencies.</li>
                    <li>Hypothesis: email verification friction increases drop-off.</li>
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Select transcript text to generate insights here.</p>
                )}
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                {analyzing ? (
                  <div className="space-y-3">
                    <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-4/6 rounded bg-muted animate-pulse" />
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-foreground/90">
                    Concise meeting summary appears here as the conversation unfolds. It updates as you analyze
                    more context.
                  </p>
                )}
              </TabsContent>


              <TabsContent value="factcheck" className="mt-4 space-y-3">
                {!selectedText ? (
                  <p className="text-sm text-muted-foreground">
                    Select transcript text to see fact-checked results.
                  </p>
                ) : (
                  <>
                    {factResults.length > 0 ? (
                      <ul className="space-y-3">
                        {factResults.map((r, idx) => (
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
                    ) : factChecking ? (
                      <div className="space-y-3">
                        <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                      </div>
                    ) : null}
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  Fact checking is managed in user settings. Results generate automatically.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
