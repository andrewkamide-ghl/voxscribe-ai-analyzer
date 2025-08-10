import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircleDot, ArrowRight } from "lucide-react";
import { callsStore, type Call, type LiveCall } from "@/store/calls";
import { liveSession } from "@/store/live-session";

const Calls = () => {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<Call[]>(callsStore.getAll());
  const [live, setLive] = useState<LiveCall | null>(callsStore.getLive());

  useEffect(() => {
    const unsubList = callsStore.subscribe(setCalls);
    const unsubLive = callsStore.subscribeLive(setLive);
    return () => {
      unsubList();
      unsubLive();
    };
  }, []);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Calls | Recent calls and live session</title>
        <meta name="description" content="View recent calls, see if a call is live, and start a new call." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://localhost:8080/calls"} />
      </Helmet>

      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Calls</h1>
        <Button onClick={() => { liveSession.connect(); navigate("/calls/live"); }}>Start New Call</Button>
      </header>

      {live && (
        <NavLink to="/calls/live" className="block">
          <Card className="mb-4 shadow-sm transition-shadow hover:shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CircleDot className="h-4 w-4 text-destructive animate-pulse" />
                  <div className="text-sm">
                    <div className="font-medium">Live call in progress</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[16rem]">{live.name}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </NavLink>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Total Segments</TableHead>
                <TableHead>Contacts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No calls yet. Click "Start New Call" to begin.
                  </TableCell>
                </TableRow>
              ) : (
                calls.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{formatTime(c.time)}</TableCell>
                    <TableCell>{c.totalSegments}</TableCell>
                    <TableCell className="truncate max-w-[20rem]">
                      {c.contacts && c.contacts.length > 0 ? c.contacts.map((p) => p.name).join(", ") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calls;
