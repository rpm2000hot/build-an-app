export interface SongMatch {
  title: string;
  artist: string;
  album?: string | undefined;
  releaseDate?: string | undefined;
  label?: string | undefined;
  songLink?: string | undefined;
  appleMusicUrl?: string | undefined;
  spotifyUrl?: string | undefined;
  deezerUrl?: string | undefined;
  artworkUrl?: string | undefined;
}

export class FriendlyError extends Error {}

interface AuddResponse {
  status: "success" | "error";
  error?: { error_code: number; error_message: string };
  result: null | {
    title: string;
    artist: string;
    album?: string;
    release_date?: string;
    label?: string;
    song_link?: string;
    apple_music?: { url?: string; artwork?: { url?: string } };
    spotify?: {
      external_urls?: { spotify?: string };
      album?: { images?: { url: string }[] };
    };
    deezer?: { link?: string; album?: { cover_big?: string } };
  };
}

export function parseAuddResponse(json: AuddResponse): SongMatch | null {
  if (json.status === "error") {
    const code = json.error?.error_code;
    if (code === 900 || code === 901)
      throw new FriendlyError("Your AudD token was rejected or has run out of requests. Check it in Settings.");
    if (code === 300 || code === 400 || code === 500)
      throw new FriendlyError("AudD couldn't read that audio. Try a different file.");
    throw new FriendlyError(json.error?.error_message || "AudD returned an error. Please try again.");
  }
  const r = json.result;
  if (!r) return null;
  const artwork = r.apple_music?.artwork?.url
    ?.replace("{w}", "600")
    .replace("{h}", "600");
  return {
    title: r.title,
    artist: r.artist,
    album: r.album || undefined,
    releaseDate: r.release_date || undefined,
    label: r.label || undefined,
    songLink: r.song_link || undefined,
    appleMusicUrl: r.apple_music?.url,
    spotifyUrl: r.spotify?.external_urls?.spotify,
    deezerUrl: r.deezer?.link,
    artworkUrl: artwork || r.spotify?.album?.images?.[0]?.url || r.deezer?.album?.cover_big,
  };
}

export async function recognizeSong(clip: Blob, apiToken: string): Promise<SongMatch | null> {
  const form = new FormData();
  form.append("api_token", apiToken);
  form.append("return", "apple_music,spotify,deezer");
  form.append("file", clip, "clip.wav");
  let res: Response;
  try {
    res = await fetch("https://api.audd.io/", { method: "POST", body: form });
  } catch {
    throw new FriendlyError("Couldn't reach AudD. Check your internet connection.");
  }
  if (!res.ok) throw new FriendlyError(`AudD is having trouble right now (HTTP ${res.status}).`);
  return parseAuddResponse((await res.json()) as AuddResponse);
}
