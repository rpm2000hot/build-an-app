const google = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export const remixSearchUrl = (title: string, artist: string) =>
  google(`"${title}" "${artist}" remix`);

export const similarSongsUrl = (title: string, artist: string) =>
  google(`songs similar to "${title}" by "${artist}"`);

export const fullLyricsUrl = (title: string, artist: string) =>
  google(`"${title}" "${artist}" lyrics`);
