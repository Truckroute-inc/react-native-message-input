import { vi } from "vitest";

export const nativeModule = {
  submit: vi.fn(
    async (_tag: number): Promise<string | null> => "Native message",
  ),
};
export const requireNativeModule = () => nativeModule;
