import { beforeEach, expect, test, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { input, nativeInput } from "./react-native-mock";
import { nativeModule } from "./expo-mock";
import { required } from "./required";
import type { TextInputProps } from "react-native";
import type { MessageInputRef } from "../src/message-input-types";

const { MessageInput } = await import("../src/message-input.ios");
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

beforeEach(() => {
  vi.clearAllMocks();
  nativeModule.submit.mockResolvedValue("Corrected native text");
});

test("iOS submits the native result instead of the JS draft", async () => {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  const onSubmit = vi.fn();
  try {
    await act(async () =>
      root.render(
        createElement(MessageInput, { ref, onSubmit, value: "Stale JS draft" }),
      ),
    );

    await act(async () => required(ref.current).submit());
    expect(nativeModule.submit).toHaveBeenCalledExactlyOnceWith(42);
    expect(nativeInput.clear).not.toHaveBeenCalled();
    expect(required(ref.current).clear).toBe(nativeInput.clear);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Corrected native text");
  } finally {
    await act(async () => root.unmount());
  }
});

test("iOS ignores empty submissions and does no native work without onSubmit", async () => {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  const onSubmit = vi.fn();
  try {
    await act(async () =>
      root.render(
        createElement(MessageInput, { ref, value: "Stale JS draft" }),
      ),
    );
    await act(async () => required(ref.current).submit());
    expect(nativeModule.submit).not.toHaveBeenCalled();
    await act(async () =>
      root.render(
        createElement(MessageInput, { ref, onSubmit, value: "Stale JS draft" }),
      ),
    );
    nativeModule.submit.mockResolvedValue(null);
    await act(async () => required(ref.current).submit());
    expect(onSubmit).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

test("iOS forwards submission errors to the caller", async () => {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  try {
    await act(async () =>
      root.render(createElement(MessageInput, { ref, onSubmit: vi.fn() })),
    );
    nativeModule.submit.mockRejectedValue(new Error("Native failure"));
    await expect(required(ref.current).submit()).rejects.toThrow(
      "Native failure",
    );
  } finally {
    await act(async () => root.unmount());
  }
});

test("iOS keyboard submission preserves the standard event and uses native text", async () => {
  const root = createRoot(document.createElement("div"));
  const onSubmit = vi.fn();
  const onSubmitEditing = vi.fn();
  const onChangeText = vi.fn();
  try {
    await act(async () =>
      root.render(
        createElement(MessageInput, {
          onSubmit,
          onSubmitEditing,
          onChangeText,
          submitBehavior: "submit",
        }),
      ),
    );
    expect(input.onChangeText).toBe(onChangeText);
    const event = {
      nativeEvent: { text: "Keyboard event", target: 42, eventCount: 1 },
    } as unknown as Parameters<
      NonNullable<TextInputProps["onSubmitEditing"]>
    >[0];
    await act(async () => required(input.onSubmitEditing)(event));
    expect(onSubmitEditing).toHaveBeenCalledExactlyOnceWith(event);
    expect(nativeModule.submit).toHaveBeenCalledExactlyOnceWith(42);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Corrected native text");
    expect(onChangeText).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
