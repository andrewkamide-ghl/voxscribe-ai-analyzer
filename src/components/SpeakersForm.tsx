import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SpeakersForm: React.FC = () => {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Placeholder submit — integrate with backend later
  }

  function handleReset(e: React.MouseEvent<HTMLButtonElement>) {
    const form = (e.currentTarget.closest("form") as HTMLFormElement | null);
    form?.reset();
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
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Jane Doe" autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="VP of Communications" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="organization">Organization</Label>
              <Input id="organization" name="organization" placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="jane@example.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="(555) 555-5555" autoComplete="tel" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" placeholder="Short bio or notes about the speaker" className="min-h-24" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="social">Social / Website</Label>
              <Input id="social" name="social" placeholder="@jane or https://example.com" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SpeakersForm;
