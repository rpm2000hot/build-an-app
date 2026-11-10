import { useRef, useState } from "react";
import { Upload, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Equalizer } from "./Equalizer";
import { cn } from "@/lib/utils";
import { CLIP_SECONDS } from "@/lib/audio";
import type { RecorderState } from "@/hooks/use-recorder";

interface Props {
  disabled: boolean;
  busyLabel?: string | undefined;
  onFile: (file: File) => void;
  recorder: RecorderState;
  elapsed: number;
  onRecord: () => void;
  onStop: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function UploadZone({ disabled, busyLabel, onFile, recorder, elapsed, onRecord, onStop }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const recording = recorder === "recording";
  const blocked = disabled || recorder !== "idle";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!blocked) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (blocked) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      aria-busy={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all sm:py-16",
        dragging || recording ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card/50",
        disabled && "opacity-80",
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        {recording && <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />}
        {disabled ? (
          <Equalizer />
        ) : recording ? (
          <Mic className="relative h-7 w-7 text-destructive" />
        ) : (
          <Upload className="h-7 w-7 text-primary" />
        )}
      </div>

      {disabled ? (
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold">{busyLabel ?? "Working…"}</p>
          <p className="text-sm text-muted-foreground">Hang tight, this only takes a moment.</p>
        </div>
      ) : recording ? (
        <div className="space-y-1" aria-live="polite">
          <p className="font-display text-lg font-semibold">
            Recording… <span className="font-mono tabular-nums">{fmt(elapsed)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {elapsed < CLIP_SECONDS
              ? `Hold your device near the music. ${CLIP_SECONDS} seconds is plenty.`
              : "That's enough — press Stop to identify the song."}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold">Drop an MP3 or WAV here, or record</p>
          <p className="text-sm text-muted-foreground">
            Only the first {CLIP_SECONDS} seconds are sent for recognition.
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
        className="sr-only"
        disabled={blocked}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        {recording ? (
          <Button type="button" variant="destructive" size="lg" className="rounded-full" onClick={onStop}>
            <Square className="fill-current" /> Stop
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="hero"
              size="lg"
              disabled={blocked}
              onClick={() => inputRef.current?.click()}
            >
              {disabled ? <Loader2 className="animate-spin" /> : <Upload />}
              {disabled ? "Processing" : "Choose File"}
            </Button>
            {!disabled && (
              <Button
                type="button"
                variant="chip"
                size="lg"
                disabled={recorder === "starting"}
                onClick={onRecord}
              >
                {recorder === "starting" ? <Loader2 className="animate-spin" /> : <Mic />}
                Record
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
