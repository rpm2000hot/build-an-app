import {
  Disc3,
  Mic2,
  CalendarDays,
  Building2,
  Music2,
  Repeat2,
  Sparkles,
  Search,
  ScrollText,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SongMatch } from "@/lib/audd";
import type { LyricsResult } from "@/lib/musixmatch";
import { fullLyricsUrl, remixSearchUrl, similarSongsUrl } from "@/lib/search-links";

interface Props {
  song: SongMatch;
  lyrics: LyricsResult | "loading" | "no-key";
  onAddKey: () => void;
}

function Meta({ icon: Icon, label, value }: { icon: typeof Disc3; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-secondary/60 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function ResultView({ song, lyrics, onAddKey }: Props) {
  const streams = [
    { name: "Apple Music", url: song.appleMusicUrl },
    { name: "Spotify", url: song.spotifyUrl },
    { name: "Deezer", url: song.deezerUrl },
  ].filter((s): s is { name: string; url: string } => Boolean(s.url));

  return (
    <div className="space-y-5">
      {/* Main match card */}
      <section className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0">
            {song.artworkUrl ? (
              <img
                src={song.artworkUrl}
                alt={`${song.album ?? song.title} cover art`}
                className="h-full w-full rounded-2xl object-cover shadow-glow"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary">
                <Disc3 className="h-16 w-16 animate-spin-slow text-primary" />
              </div>
            )}
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Match found</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{song.title}</h2>
            <p className="mt-1 text-lg text-muted-foreground">{song.artist}</p>
            {streams.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                {streams.map((s) => (
                  <Button key={s.name} variant="stream" size="sm" asChild>
                    <ExtLink href={s.url}>
                      <Music2 /> {s.name}
                    </ExtLink>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-3 border-t border-border p-6 sm:grid-cols-2 sm:p-8">
          <Meta icon={Mic2} label="Artist" value={song.artist} />
          <Meta icon={Disc3} label="Album" value={song.album} />
          <Meta icon={CalendarDays} label="Release date" value={song.releaseDate} />
          <Meta icon={Building2} label="Label" value={song.label} />
        </div>
      </section>

      {/* Explore */}
      <section
        className="animate-rise rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
        style={{ animationDelay: "80ms" }}
      >
        <h3 className="text-lg font-semibold">Keep listening</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button variant="chip" size="lg" asChild>
            <ExtLink href={remixSearchUrl(song.title, song.artist)}>
              <Repeat2 className="text-primary" /> Find Remixes
            </ExtLink>
          </Button>
          <Button variant="chip" size="lg" asChild>
            <ExtLink href={similarSongsUrl(song.title, song.artist)}>
              <Sparkles className="text-primary" /> Find Similar Songs
            </ExtLink>
          </Button>
        </div>
      </section>

      {/* Lyrics */}
      <section
        className="animate-rise rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
        style={{ animationDelay: "160ms" }}
      >
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Lyrics preview</h3>
        </div>

        <div className="mt-4">
          {lyrics === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Looking up lyrics…
            </p>
          )}
          {lyrics === "no-key" && (
            <p className="text-sm text-muted-foreground">
              Add a Musixmatch key to see a lyrics preview.{" "}
              <button onClick={onAddKey} className="text-primary underline-offset-4 hover:underline">
                Add key
              </button>
            </p>
          )}
          {typeof lyrics === "object" && lyrics.kind === "none" && (
            <p className="text-sm text-muted-foreground">No lyrics preview available for this track.</p>
          )}
          {typeof lyrics === "object" && lyrics.kind === "error" && (
            <p className="text-sm text-destructive">{lyrics.message}</p>
          )}
          {typeof lyrics === "object" && lyrics.kind === "ok" && (
            <>
              <blockquote className="whitespace-pre-line border-l-2 border-primary/60 pl-4 font-display text-base leading-relaxed text-foreground/90">
                {lyrics.preview}
              </blockquote>
              {lyrics.copyright && (
                <p className="mt-3 text-xs text-muted-foreground">{lyrics.copyright}</p>
              )}
            </>
          )}
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
          <span>Lyrics preview only. Full lyrics require a commercial license.</span>
        </div>

        <Button variant="chip" className="mt-4" asChild>
          <ExtLink href={fullLyricsUrl(song.title, song.artist)}>
            <Search /> Search for full lyrics on Google <ExternalLink className="opacity-60" />
          </ExtLink>
        </Button>
      </section>
    </div>
  );
}
