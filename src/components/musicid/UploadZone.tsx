import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Equalizer } from "./Equalizer";
import { cn } from "@/lib/utils";

interface Props {
  disabled: boolean;
  busyLabel?: string;
  onFile: (file: File) => void;
}

export function UploadZone({ disabled, busyLabel, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      aria-busy={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all sm:py-16",
        dragging ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card/50",
        disabled && "opacity-80",
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        {disabled ? <Equalizer /> : <Upload className="h-7 w-7 text-primary" />}
      </div>

      {disabled ? (
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold">{busyLabel ?? "Working…"}</p>
          <p className="text-sm text-muted-foreground">Hang tight, this only takes a moment.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold">Drop an MP3 or WAV here</p>
          <p className="text-sm text-muted-foreground">
            Only the first 12 seconds are sent for recognition.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="hero"
        size="lg"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {disabled ? <Loader2 className="animate-spin" /> : <Upload />}
        {disabled ? "Processing" : "Choose File"}
      </Button>
    </div>
  );
}
