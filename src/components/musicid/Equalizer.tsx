import { cn } from "@/lib/utils";

const DELAYS = ["0s", "-0.4s", "-0.8s", "-0.2s", "-0.6s"];

export function Equalizer({ className, active = true }: { className?: string; active?: boolean }) {
  return (
    <div className={cn("flex h-6 items-end gap-1", className)} aria-hidden>
      {DELAYS.map((d) => (
        <span
          key={d}
          className={cn(
            "h-full w-1 origin-bottom rounded-full bg-gradient-signal",
            active ? "animate-eq" : "scale-y-25",
          )}
          style={{ animationDelay: d }}
        />
      ))}
    </div>
  );
}
