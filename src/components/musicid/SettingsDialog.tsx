import { useEffect, useState } from "react";
import { KeyRound, ExternalLink } from "lucide-react";
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
import type { ApiKeys } from "@/lib/keys";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

export function SettingsDialog({ open, onOpenChange, keys, onSave }: Props) {
  const [draft, setDraft] = useState(keys);
  useEffect(() => {
    if (open) setDraft(keys);
  }, [open, keys]);

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
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(draft);
          }}
        >
          <div className="space-y-2">
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
            <Input
              id="audd"
              type="password"
              autoComplete="off"
              placeholder="Required for recognition"
              value={draft.audd}
              onChange={(e) => setDraft({ ...draft, audd: e.target.value })}
            />
          </div>
          <div className="space-y-2">
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
            <Input
              id="mxm"
              type="password"
              autoComplete="off"
              placeholder="Optional, for lyrics preview"
              value={draft.musixmatch}
              onChange={(e) => setDraft({ ...draft, musixmatch: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="hero" className="w-full sm:w-auto">
              Save keys
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
