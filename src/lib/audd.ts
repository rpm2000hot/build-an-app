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

/** The AudD token was rejected (invalid, inactive or out of requests). */
export class TokenRejectedError extends FriendlyError {}

export const TOKEN_VALID_MESSAGE = "Token is valid!";
export const TOKEN_INVALID_MESSAGE = "Invalid token or no credits left";

export const TOKEN_REJECTED_MESSAGE =
  "AudD rejected your token — it may be invalid or out of credits. Please check it in the Keys panel.";

// AudD error codes: 900 = invalid/inactive token, 901 = request limit reached.
const TOKEN_ERROR_CODES = [900, 901];

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
    if (code !== undefined && TOKEN_ERROR_CODES.includes(code))
      throw new TokenRejectedError(TOKEN_REJECTED_MESSAGE);
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

export type TokenCheck = "valid" | "invalid";

/**
 * Interprets AudD's reply to a request that carries a token but no audio.
 * AudD checks the token first: a bad or exhausted token returns 900/901,
 * a good one gets as far as "no file sent" (700). No recognition is run.
 */
export function interpretTokenCheck(json: AuddResponse): TokenCheck {
  if (json.status === "error") {
    const code = json.error?.error_code;
    return code === 700 ? "valid" : "invalid";
  }
  return "valid";
}

/** Lightweight token check that doesn't upload audio. Throws FriendlyError on network failure. */
export async function validateAuddToken(apiToken: string): Promise<TokenCheck> {
  const token = apiToken.trim();
  if (!token) return "invalid";
  const form = new FormData();
  form.append("api_token", token);
  let res: Response;
  try {
    res = await fetch("https://api.audd.io/", { method: "POST", body: form });
  } catch {
    throw new FriendlyError("Couldn't reach AudD to test the token. Check your internet connection.");
  }
  if (!res.ok) throw new FriendlyError(`AudD is having trouble right now (HTTP ${res.status}).`);
  return interpretTokenCheck((await res.json()) as AuddResponse);
}
