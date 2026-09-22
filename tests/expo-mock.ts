import { vi } from "vitest";

type SubmitEvent = { identifier: string; text: string };
const listeners = new Set<(event: SubmitEvent) => void>();
export const nativeModule = {
  attach: vi.fn(
    async (
      _tag: number,
      _identifier: string,
      _enabled: boolean,
      _interceptReturn: boolean,
    ) => true,
  ),
  detach: vi.fn(async (_tag: number, _identifier: string) => {}),
  submit: vi.fn(async (_tag: number, _identifier: string) => {}),
  addListener: vi.fn(
    (_event: string, listener: (event: SubmitEvent) => void) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
  ),
};
export const requireNativeModule = () => nativeModule;
export function emitSubmission(event: SubmitEvent) {
  for (const listener of listeners) listener(event);
}
