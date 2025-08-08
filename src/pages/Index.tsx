import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { CircleDot, Mic, PauseCircle, PlayCircle, Scissors, Sparkles } from "lucide-react";

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

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-background ambient-spotlight"
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
      <main className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-12">
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
            <ScrollArea className="h-[56vh]">
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

            {/* Selection actions */}
            <div className="sticky bottom-0 border-t bg-background/80 backdrop-blur p-3 flex items-center gap-2 justify-between">
              <div className="text-xs text-muted-foreground">
                {selectedSegments.length > 0
                  ? `${selectedSegments.length} segment${selectedSegments.length > 1 ? "s" : ""} selected`
                  : "Select transcript parts to analyze in real time"}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={clearSelection} disabled={selectedSegments.length === 0}>
                  <Scissors className="mr-2 h-4 w-4" /> Clear
                </Button>
                <Button size="sm" onClick={analyzeSelection} disabled={selectedSegments.length === 0}>
                  <Sparkles className="mr-2 h-4 w-4" /> Analyze selection
                </Button>
              </div>
            </div>
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
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
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

              <TabsContent value="actions" className="mt-4 space-y-2">
                {analyzing ? (
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                ) : (
                  <ul className="list-disc pl-5 text-sm text-foreground/90">
                    <li>Draft experiment to simplify email verification step.</li>
                    <li>Prepare sprint plan focusing on onboarding friction.</li>
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
