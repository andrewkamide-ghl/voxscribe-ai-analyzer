import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { contactsStore } from "@/store/contacts";

interface SpeakersFormProps {
  speakers?: string[];
  onRename?: (payload: { from: string; to: string }) => void;
  aiRuns?: any[];
}

const SpeakersForm: React.FC<SpeakersFormProps> = ({ speakers = [], onRename, aiRuns }) => {
  const initialFrom = useMemo(() => (speakers.find((s) => s !== "Moderator") ?? ""), [speakers]);
  const [fromName, setFromName] = useState<string>(initialFrom);

  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [coreBeliefs, setCoreBeliefs] = useState("");
  const [social, setSocial] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (name && fromName && onRename) {
      onRename({ from: fromName, to: name });
      toast({ title: "Speaker updated", description: `Renamed ${fromName} to ${name} in transcript.` });
    }
  }

  function handleReset() {
    setName("");
    setBackground("");
    setCoreBeliefs("");
    setSocial("");
    setNotes("");
  }

  function saveToContacts() {
    const saved = contactsStore.add({
      name: name || fromName || "Untitled",
      background, coreBeliefs, social, notes,
      aiRuns: aiRuns && aiRuns.length ? aiRuns : undefined,
    });
    toast({ title: "Saved to Contacts", description: `Contact “${saved.name}” added.` });
  }

  return (
    <Card className="md:col-span-5 h-full flex flex-col min-h-0">
      <CardHeader className="flex-row items-center justify-between min-h-[72px] py-4">
        <CardTitle className="text-lg">Speakers</CardTitle>
        <div className="text-xs text-muted-foreground">Profile form</div>
      </CardHeader>
      <CardContent className="p-4 overflow-auto">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="from">Speaker from feed</Label>
              <Select value={fromName} onValueChange={setFromName}>
                <SelectTrigger id="from" aria-label="Select speaker from feed">
                  <SelectValue placeholder="Select a speaker" />
                </SelectTrigger>
                <SelectContent>
                  {speakers.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Jane Doe" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="background">Background</Label>
              <Textarea id="background" name="background" placeholder="Professional and personal background" className="min-h-24" value={background} onChange={(e) => setBackground(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coreBeliefs">Core Beliefs</Label>
              <Textarea id="coreBeliefs" name="coreBeliefs" placeholder="Key principles and positions" className="min-h-24" value={coreBeliefs} onChange={(e) => setCoreBeliefs(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="social">Social / Website</Label>
              <Input id="social" name="social" placeholder="@handle or https://example.com" value={social} onChange={(e) => setSocial(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes" className="min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit">Apply Name to Feed</Button>
            <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
            <Button type="button" variant="secondary" onClick={saveToContacts}>Save to Contacts</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SpeakersForm;
