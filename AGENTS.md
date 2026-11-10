<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (MusicID)

- The app is 100% client-side and deploys to GitHub Pages; never add server functions, server routes, a database or backend dependencies — Pages only serves static files.
- Third-party API keys (AudD, Musixmatch) are entered by the visitor and kept in localStorage (`src/lib/keys.ts`); never read them from `VITE_*` env or Lovable Secrets — anything bundled is public.
- Musixmatch is called via JSONP (`src/lib/musixmatch.ts`) because it sends no CORS headers; AudD is called with fetch (it allows CORS).
- Audio is trimmed with the Web Audio API to mono WAV (`src/lib/audio.ts`), not ffmpeg.wasm — avoids a ~30 MB download.
- GitHub Pages builds are switched on by `GITHUB_PAGES=true` in `vite.config.ts` (subpath base, router basepath, nitro off, prerender `/`); the default config must stay untouched so the Lovable preview keeps working. Output is `dist/client`.
- Asset URLs in `__root.tsx` head must use `import.meta.env.BASE_URL` so they resolve under the Pages subpath.
