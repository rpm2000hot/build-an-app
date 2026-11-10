import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings2, AlertCircle, SearchX, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/musicid/UploadZone";
import { ResultView } from "@/components/musicid/ResultView";
import { SettingsDialog } from "@/components/musicid/SettingsDialog";
import { Equalizer } from "@/components/musicid/Equalizer";
import { isAcceptedAudio, MAX_UPLOAD_BYTES, trimToWav } from "@/lib/audio";
import { FriendlyError, recognizeSong, type SongMatch } from "@/lib/audd";
import { fetchLyricsPreview, type LyricsResult } from "@/lib/musixmatch";
import { loadKeys, saveKeys, type ApiKeys } from "@/lib/keys";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MusicID — Identify any song from an audio file" },
      {
        name: "description",
        content:
          "Upload an MP3 or WAV and MusicID tells you the song, artist, album and where to stream it, plus a lyrics preview.",
      },
      { property: "og:title", content: "MusicID — Identify any song from an audio file" },
      {
        property: "og:description",
        content: "Drop in a clip, get the title, artist, streaming links and a lyrics preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Phase =
  | { kind: "idle" }
  | { kind: "busy"; label: string }
  | { kind: "error"; message: string }
  | { kind: "nomatch"; fileName: string }
  | { kind: "match"; song: SongMatch };

function Index() {
  const [keys, setKeys] = useState<ApiKeys>({ audd: "", musixmatch: "" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [lyrics, setLyrics] = useState<LyricsResult | "loading" | "no-key">("loading");

  useEffect(() => {
    const k = loadKeys();
    setKeys(k);
    if (!k.audd) setSettingsOpen(true);
  }, []);

  const busy = phase.kind === "busy";

  async function handleFile(file: File) {
    if (busy) return;
    if (!isAcceptedAudio(file)) {
      setPhase({ kind: "error", message: "Please choose an .mp3 or .wav file." });
      return;
    }
    if (!keys.audd) {
      setSettingsOpen(true);
      toast("Add your AudD token first");
      return;
    }
    try {
      setPhase({ kind: "busy", label: "Trimming to 12 seconds…" });
      let clip: Blob;
      try {
        clip = await trimToWav(file);
      } catch {
        throw new FriendlyError("This file couldn't be decoded. Is it a valid MP3 or WAV?");
      }
      if (clip.size > MAX_UPLOAD_BYTES) {
        throw new FriendlyError("The trimmed clip is still over 10 MB. Try a different file.");
      }
      setPhase({ kind: "busy", label: "Listening…" });
      const song = await recognizeSong(clip, keys.audd);
      if (!song) {
        setPhase({ kind: "nomatch", fileName: file.name });
        return;
      }
      setPhase({ kind: "match", song });
      if (!keys.musixmatch) {
        setLyrics("no-key");
      } else {
        setLyrics("loading");
        setLyrics(await fetchLyricsPreview(song.title, song.artist, keys.musixmatch));
      }
    } catch (err) {
      setPhase({
        kind: "error",
        message:
          err instanceof FriendlyError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <Equalizer className="h-5" active={busy} />
          <span className="font-display text-xl font-bold tracking-tight">MusicID</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          <Settings2 /> Keys
        </Button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
        {phase.kind !== "match" && (
          <div className="mb-8 mt-4 text-center sm:mt-10">
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              What's that <span className="text-gradient-signal">song?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Upload a recording and get the title, artist, streaming links and a lyrics preview.
            </p>
          </div>
        )}

        {phase.kind === "match" ? (
          <div className="mt-2 space-y-5">
            <ResultView song={phase.song} lyrics={lyrics} onAddKey={() => setSettingsOpen(true)} />
            <div className="flex justify-center">
              <Button variant="ghost" onClick={() => setPhase({ kind: "idle" })}>
                <RotateCcw /> Identify another song
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <UploadZone
              disabled={busy}
              busyLabel={phase.kind === "busy" ? phase.label : undefined}
              onFile={handleFile}
            />
            {phase.kind === "error" && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>{phase.message}</span>
              </div>
            )}
            {phase.kind === "nomatch" && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm"
              >
                <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  No match for <strong>{phase.fileName}</strong>. Try a clearer recording, or a
                  part of the song with vocals or the main melody.
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Powered by AudD &amp; Musixmatch.
      </footer>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        keys={keys}
        onSave={(k) => {
          saveKeys(k);
          setKeys(loadKeys());
          setSettingsOpen(false);
          toast.success("Keys saved in this browser");
        }}
      />
    </div>
  );
}
