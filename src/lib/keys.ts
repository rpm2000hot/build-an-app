// API keys live only in the visitor's own browser (localStorage).
// They are never bundled into the site or sent anywhere except the API they belong to.

export interface ApiKeys {
  audd: string;
  musixmatch: string;
}

const STORAGE_KEY = "musicid.keys.v1";

export function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return { audd: "", musixmatch: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ApiKeys>) : {};
    return { audd: parsed.audd ?? "", musixmatch: parsed.musixmatch ?? "" };
  } catch {
    return { audd: "", musixmatch: "" };
  }
}

export function saveKeys(keys: ApiKeys) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ audd: keys.audd.trim(), musixmatch: keys.musixmatch.trim() }),
  );
}
