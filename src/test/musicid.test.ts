import { describe, expect, it } from "vitest";
import { fullLyricsUrl, remixSearchUrl, similarSongsUrl } from "@/lib/search-links";
import { parseAuddResponse, FriendlyError } from "@/lib/audd";
import { encodeWav, CLIP_SECONDS, MAX_UPLOAD_BYTES } from "@/lib/audio";
import { cleanLyrics } from "@/lib/musixmatch";

const q = (url: string) => new URL(url).searchParams.get("q");

describe("Google search buttons", () => {
  it("Find Remixes searches \"{title}\" \"{artist}\" remix", () => {
    expect(q(remixSearchUrl("Hello", "Adele"))).toBe('"Hello" "Adele" remix');
  });
  it("Find Similar Songs searches songs similar to \"{title}\" by \"{artist}\"", () => {
    expect(q(similarSongsUrl("Hello", "Adele"))).toBe('songs similar to "Hello" by "Adele"');
  });
  it("full lyrics search includes title, artist and lyrics", () => {
    expect(q(fullLyricsUrl("Hello", "Adele"))).toBe('"Hello" "Adele" lyrics');
  });
});

describe("AudD response handling", () => {
  it("returns null when AudD finds no match", () => {
    expect(parseAuddResponse({ status: "success", result: null })).toBeNull();
  });
  it("turns an invalid token error into a friendly message", () => {
    expect(() =>
      parseAuddResponse({
        status: "error",
        error: { error_code: 900, error_message: "wrong token" },
        result: null,
      }),
    ).toThrow(FriendlyError);
  });
  it("extracts streaming links", () => {
    const m = parseAuddResponse({
      status: "success",
      result: {
        title: "T",
        artist: "A",
        apple_music: { url: "https://music.apple.com/x" },
        spotify: { external_urls: { spotify: "https://open.spotify.com/x" } },
        deezer: { link: "https://deezer.com/x" },
      },
    });
    expect(m?.appleMusicUrl).toBe("https://music.apple.com/x");
    expect(m?.spotifyUrl).toBe("https://open.spotify.com/x");
    expect(m?.deezerUrl).toBe("https://deezer.com/x");
  });
});

describe("audio clip limits", () => {
  it("clips to 12 seconds and stays under 10 MB", () => {
    expect(CLIP_SECONDS).toBe(12);
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
    const wav = encodeWav(new Float32Array(48000 * 12), 48000);
    expect(wav.size).toBeLessThan(MAX_UPLOAD_BYTES);
  });
});

describe("lyrics preview", () => {
  it("strips the Musixmatch non-commercial banner", () => {
    const body = "line one\nline two\n...\n\n******* This Lyrics is NOT for Commercial use *******\n(1409623456)";
    expect(cleanLyrics(body)).toBe("line one\nline two\n...");
  });
});
