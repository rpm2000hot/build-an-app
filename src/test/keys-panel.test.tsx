import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SettingsDialog } from "@/components/musicid/SettingsDialog";
import { interpretTokenCheck, parseAuddResponse, TokenRejectedError } from "@/lib/audd";
import { loadKeys, saveKeys } from "@/lib/keys";

const auddReply = (body: object) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

function renderPanel(onSaveAudd = vi.fn()) {
  render(
    <SettingsDialog
      open
      onOpenChange={() => {}}
      keys={{ audd: "", musixmatch: "" }}
      onSaveAudd={onSaveAudd}
      onSaveMusixmatch={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText("AudD API token"), { target: { value: "my-token" } });
  fireEvent.click(screen.getByRole("button", { name: /test & save/i }));
  return onSaveAudd;
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("AudD token check", () => {
  it("treats 'no file sent' (700) as a valid token", () => {
    expect(interpretTokenCheck({ status: "error", error: { error_code: 700, error_message: "" }, result: null })).toBe("valid");
  });
  it("treats an invalid token (900) as invalid", () => {
    expect(interpretTokenCheck({ status: "error", error: { error_code: 900, error_message: "" }, result: null })).toBe("invalid");
  });
  it("treats an exhausted token (901) as invalid", () => {
    expect(interpretTokenCheck({ status: "error", error: { error_code: 901, error_message: "" }, result: null })).toBe("invalid");
  });
});

describe("Keys panel Test & Save", () => {
  it("shows 'Token is valid!' and saves when AudD accepts the token", async () => {
    vi.stubGlobal("fetch", auddReply({ status: "error", error: { error_code: 700, error_message: "no file" } }));
    const onSave = renderPanel();
    expect(await screen.findByText("Token is valid!")).toBeInTheDocument();
    expect(onSave).toHaveBeenCalledWith("my-token");
  });

  it("shows 'Invalid token or no credits left' and does not save when rejected", async () => {
    vi.stubGlobal("fetch", auddReply({ status: "error", error: { error_code: 900, error_message: "bad" } }));
    const onSave = renderPanel();
    expect(await screen.findByText("Invalid token or no credits left")).toBeInTheDocument();
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });
});

describe("token persistence and rejection", () => {
  it("reads the saved token back from localStorage", () => {
    saveKeys({ audd: "  abc123 ", musixmatch: "" });
    expect(loadKeys().audd).toBe("abc123");
  });
  it("a rejected token during recognition points the user to the Keys panel", () => {
    const run = () =>
      parseAuddResponse({ status: "error", error: { error_code: 901, error_message: "limit" }, result: null });
    expect(run).toThrow(TokenRejectedError);
    expect(run).toThrow(/Keys panel/);
  });
});
