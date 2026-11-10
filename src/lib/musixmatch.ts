// Musixmatch doesn't send CORS headers, but supports JSONP — so the
// static site can call it directly with a <script> tag.

const BASE = "https://api.musixmatch.com/ws/1.1/";

interface MxmEnvelope<T> {
  message: { header: { status_code: number }; body: T };
}

let counter = 0;

function jsonp<T>(method: string, params: Record<string, string>, timeoutMs = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const cb = `__mxm_cb_${Date.now()}_${counter++}`;
    const qs = new URLSearchParams({ ...params, format: "jsonp", callback: cb });
    const script = document.createElement("script");
    const w = window as unknown as Record<string, unknown>;
    const cleanup = () => {
      delete w[cb];
      script.remove();
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, timeoutMs);
    w[cb] = (data: T) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("network"));
    };
    script.src = `${BASE}${method}?${qs.toString()}`;
    document.body.appendChild(script);
  });
}

export type LyricsResult =
  | { kind: "ok"; preview: string; copyright?: string | undefined }
  | { kind: "none" }
  | { kind: "error"; message: string };

export function cleanLyrics(body: string): string {
  return body
    .replace(/\*{3,}[^*]*\*{3,}/g, "")
    .replace(/\(\d+\)\s*$/, "")
    .trim();
}

export async function fetchLyricsPreview(
  title: string,
  artist: string,
  apiKey: string,
): Promise<LyricsResult> {
  try {
    const match = await jsonp<MxmEnvelope<{ track?: { track_id: number; has_lyrics: number } }>>(
      "matcher.track.get",
      { q_track: title, q_artist: artist, apikey: apiKey },
    );
    const status = match.message.header.status_code;
    if (status === 401) return { kind: "error", message: "Your Musixmatch key was rejected. Check it in Settings." };
    if (status === 402) return { kind: "error", message: "Your Musixmatch key has hit its daily limit." };
    const track = match.message.body?.track;
    if (status !== 200 || !track || !track.has_lyrics) return { kind: "none" };

    const lyr = await jsonp<
      MxmEnvelope<{ lyrics?: { lyrics_body: string; lyrics_copyright?: string } }>
    >("track.lyrics.get", { track_id: String(track.track_id), apikey: apiKey });
    const body = lyr.message.body?.lyrics?.lyrics_body;
    if (lyr.message.header.status_code !== 200 || !body) return { kind: "none" };
    const preview = cleanLyrics(body);
    if (!preview) return { kind: "none" };
    return { kind: "ok", preview, copyright: lyr.message.body?.lyrics?.lyrics_copyright };
  } catch {
    return { kind: "error", message: "Couldn't reach Musixmatch right now." };
  }
}
