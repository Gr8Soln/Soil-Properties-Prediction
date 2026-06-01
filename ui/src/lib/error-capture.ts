let lastCapturedError: unknown;

function captureError(event: ErrorEvent | PromiseRejectionEvent) {
  lastCapturedError = "reason" in event ? event.reason : event.error;
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", captureError as EventListener);
  globalThis.addEventListener("unhandledrejection", captureError as EventListener);
}

export function consumeLastCapturedError() {
  const error = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
