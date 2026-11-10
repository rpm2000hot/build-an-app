import { useCallback, useEffect, useRef, useState } from "react";

// Safety cap so a forgotten recording doesn't grow forever. Only the first
// 12 seconds are sent to AudD anyway.
export const MAX_RECORDING_SECONDS = 60;

export type RecorderState = "idle" | "starting" | "recording";

export class RecorderError extends Error {}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

/** Microphone recording via MediaRecorder. `onRecorded` fires with the audio after Stop. */
export function useRecorder(onRecorded: (audio: Blob) => void, onError: (message: string) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const callbacks = useRef({ onRecorded, onError });
  callbacks.current = { onRecorded, onError };

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      callbacks.current.onError("Recording isn't supported in this browser. Try uploading a file instead.");
      return;
    }
    setState("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setState("idle");
      const name = err instanceof DOMException ? err.name : "";
      callbacks.current.onError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Allow the microphone in your browser and try again."
          : name === "NotFoundError"
            ? "No microphone was found on this device."
            : "Couldn't start the microphone. Please try again.",
      );
      return;
    }
    streamRef.current = stream;
    const mimeType = pickMimeType();
    const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = rec;
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      const type = rec.mimeType || mimeType || "audio/webm";
      cleanup();
      setState("idle");
      setElapsed(0);
      const audio = new Blob(chunks, { type });
      if (audio.size === 0) {
        callbacks.current.onError("Nothing was recorded. Please try again.");
        return;
      }
      callbacks.current.onRecorded(audio);
    };
    const startedAt = Date.now();
    setElapsed(0);
    timerRef.current = window.setInterval(() => {
      const secs = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(secs);
      if (secs >= MAX_RECORDING_SECONDS) stop();
    }, 250);
    rec.start(250);
    setState("recording");
  }, [cleanup, stop]);

  return { state, elapsed, start, stop };
}
