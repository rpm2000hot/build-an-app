import { useEffect, useRef, useState } from "react";
import { KeyRound, ExternalLink, Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  FriendlyError,
  TOKEN_INVALID_MESSAGE,
  TOKEN_VALID_MESSAGE,
  validateAuddToken,
} from "@/lib/audd";
import type { ApiKeys } from "@/lib/keys";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keys: ApiKeys;
  onSaveAudd: (token: string) => void;
  onSaveMusixmatch: (key: string) => void;
}

type TestStatus =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "valid" }
  | { kind: "invalid"; message: string };

export function SettingsDialog({ open, onOpenChange, keys, onSaveAudd, onSaveMusixmatch }: Props) {
  const [audd, setAudd] = useState(keys.audd);
  const [mxm, setMxm] = useState(keys.musixmatch);
  const [status, setStatus] = useState<TestStatus>({ kind: "idle" });
  const [mxmSaved, setMxmSaved] = useState(false);

  // Reset the form each time the panel opens (not when a save updates `keys`).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setAudd(keys.audd);
      setMxm(keys.musixmatch);
      setStatus({ kind: "idle" });
      setMxmSaved(false);
    }
    wasOpen.current = open;
  }, [open, keys]);

  async function testAndSave() {
    const token = audd.trim();
    if (!token) {
      setStatus({ kind: "invalid", message: "Enter your AudD token first." });
      return;
    }
    setStatus({ kind: "testing" });
    try {
      const result = await validateAuddToken(token);
      if (result === "valid") {
        onSaveAudd(token);
        setStatus({ kind: "valid" });
      } else {
        setStatus({ kind: "invalid", message: TOKEN_INVALID_MESSAGE });
      }
    } catch (err) {
      setStatus({
        kind: "invalid",
        message: err instanceof FriendlyError ? err.message : "Couldn't test the token. Please try again.",
      });
    }
  }

  const testing = status.kind === "testing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <KeyRound className="h-5 w-5 text-primary" /> Your API keys
          </DialogTitle>
          <DialogDescription>
            Keys are saved only in this browser and sent only to AudD and Musixmatch. They are
            never part of the website itself.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void testAndSave();
          }}
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="audd">AudD API token</Label>
            <a
              href="https://dashboard.audd.io/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              Get one <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <Input
              id="audd"
              type="password"
              autoComplete="off"
              placeholder="Required for recognition"
              value={audd}
              aria-invalid={status.kind === "invalid"}
              aria-describedby="audd-status"
              onChange={(e) => {
                setAudd(e.target.value);
                if (status.kind !== "testing") setStatus({ kind: "idle" });
              }}
            />
            <Button type="submit" variant="hero" className="shrink-0" disabled={testing}>
              {testing ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {testing ? "Testing…" : "Test & Save"}
            </Button>
          </div>
          <div id="audd-status" aria-live="polite" className="min-h-5 text-sm">
            {status.kind === "valid" && (
              <p className="flex items-center gap-1.5 font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> {TOKEN_VALID_MESSAGE}
              </p>
            )}
            {status.kind === "invalid" && (
              <p role="alert" className="flex items-center gap-1.5 font-medium text-destructive">
                <XCircle className="h-4 w-4" /> {status.message}
              </p>
            )}
            {status.kind === "idle" && keys.audd && audd.trim() === keys.audd && (
              <p className="text-xs text-muted-foreground">A token is saved in this browser.</p>
            )}
          </div>
        </form>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSaveMusixmatch(mxm);
            setMxmSaved(true);
          }}
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="mxm">Musixmatch API key</Label>
            <a
              href="https://developer.musixmatch.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              Get one <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <Input
              id="mxm"
              type="password"
              autoComplete="off"
              placeholder="Optional, for lyrics preview"
              value={mxm}
              onChange={(e) => {
                setMxm(e.target.value);
                setMxmSaved(false);
              }}
            />
            <Button type="submit" variant="chip" className="shrink-0">
              Save
            </Button>
          </div>
          <div aria-live="polite" className="min-h-5 text-sm">
            {mxmSaved && (
              <p className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
