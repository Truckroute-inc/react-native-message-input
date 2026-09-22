import { beforeEach, expect, test, vi } from "vitest";
import { input, nativeInput } from "./react-native-mock";
import { act, createElement, createRef } from "react";
import type { MessageInputRef } from "../src/message-input-types";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
const { MessageInput } = await import("../src/message-input");

beforeEach(() => {
  vi.clearAllMocks();
});

test("fallback submission trims and clears before notifying; disabled submission preserves text", async () => {
  const host = document.createElement("div");
  const root = createRoot(host);
  const ref = createRef<MessageInputRef>();
  const send = vi.fn();
  const render = (submissionEnabled: boolean) =>
    root.render(
      createElement(MessageInput, {
        ref,
        onSubmit: send,
        submissionEnabled,
      }),
    );
  await act(() => render(true));
  await act(async () => {
    await ref.current?.focus();
  });
  expect(nativeInput.focus).toHaveBeenCalledOnce();
  await act(async () => {
    if (ref.current !== null) await ref.current.submit();
  });
  expect(send).not.toHaveBeenCalled();
  await act(() => {
    if (input.onChangeText !== undefined) input.onChangeText("  Hello  ");
  });
  await act(() => render(false));
  await act(async () => {
    if (ref.current !== null) await ref.current.submit();
  });
  expect(send).not.toHaveBeenCalled();
  expect(input.value).toBe("  Hello  ");
  await act(() => render(true));
  await act(async () => {
    if (ref.current !== null) await ref.current.submit();
  });
  expect(send).toHaveBeenLastCalledWith("Hello");
  expect(nativeInput.clear).toHaveBeenCalledOnce();
  expect(input.value).toBe("");
  await act(() => {
    if (input.onChangeText !== undefined) input.onChangeText("Next message");
  });
  await act(() => render(true));
  expect(input.value).toBe("Next message");
  await act(async () => {
    if (ref.current !== null) await ref.current.clear();
  });
  expect(input.value).toBe("");
  await act(() => root.unmount());
});

test("blur dismisses the input without clearing or submitting the draft", async () => {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  const send = vi.fn();
  try {
    await act(() => {
      root.render(
        createElement(MessageInput, {
          ref,
          onSubmit: send,
          submissionEnabled: false,
        }),
      );
    });
    await act(() => input.onChangeText?.("Unsent message"));
    await act(async () => {
      await ref.current?.blur();
    });
    expect(nativeInput.blur).toHaveBeenCalledOnce();
    expect(nativeInput.clear).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(input.value).toBe("Unsent message");
  } finally {
    await act(() => root.unmount());
  }
});
