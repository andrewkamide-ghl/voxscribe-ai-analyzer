import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, Users } from "lucide-react";
import React from "react";

export type FeatureKey = "assistant" | "speakers";

interface RightFeatureBarProps {
  active: FeatureKey;
  onChange: (feature: FeatureKey) => void;
}

const RightFeatureBar: React.FC<RightFeatureBarProps> = ({ active, onChange }) => {
  const items: { key: FeatureKey; label: string; icon: React.ReactNode }[] = [
    { key: "assistant", label: "AI Assistant", icon: <Bot className="h-5 w-5" aria-hidden="true" /> },
    { key: "speakers", label: "Speakers", icon: <Users className="h-5 w-5" aria-hidden="true" /> },
  ];

  return (
    <aside
      aria-label="Feature navigation"
      className="fixed right-0 top-16 bottom-6 z-40 w-14 border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex flex-col items-center py-2"
    >
      <nav className="flex-1 flex flex-col items-center gap-2">
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <Tooltip key={it.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="icon"
                  aria-pressed={isActive}
                  aria-label={it.label}
                  onClick={() => {
                    if (!isActive) onChange(it.key);
                  }}
                  className="rounded-lg"
                >
                  {it.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{it.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
};

export default RightFeatureBar;
