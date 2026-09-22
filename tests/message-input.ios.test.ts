import { beforeEach, expect, test, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import { input, nativeInput } from "./react-native-mock";
import { emitSubmission, nativeModule } from "./expo-mock";
import type { MessageInputRef } from "../src/message-input-types";

vi.mock(
  "../src/native-submission",
  () => import("../src/native-submission.ios"),
);
const { MessageInput } = await import("../src/message-input");
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => {
  vi.clearAllMocks();
});

test("iOS routes submission to native and filters native events by input instance", async () => {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  const onSubmit = vi.fn();
  try {
    await act(() =>
      root.render(createElement(MessageInput, { ref, onSubmit })),
    );
    const identifier = nativeModule.attach.mock.calls.at(-1)![1];
    expect(nativeModule.attach).toHaveBeenLastCalledWith(
      42,
      identifier,
      true,
      true,
    );
    await act(() => input.onChangeText?.("Stale JS text"));
    await act(() => ref.current!.submit());
    expect(nativeModule.submit).toHaveBeenCalledWith(42, identifier);
    expect(nativeInput.clear).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    emitSubmission({ identifier: "another-input", text: "Ignore" });
    expect(onSubmit).not.toHaveBeenCalled();
    emitSubmission({ identifier, text: "Corrected native text" });
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Corrected native text");
  } finally {
    await act(() => root.unmount());
  }
  expect(nativeModule.detach).toHaveBeenCalled();
  emitSubmission({
    identifier: nativeModule.attach.mock.calls.at(-1)![1],
    text: "Unmounted",
  });
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test("iOS preserves multiline newlines and updates disabled submission", async () => {
  const root = createRoot(document.createElement("div"));
  const onSubmit = vi.fn();
  try {
    await act(() =>
      root.render(createElement(MessageInput, { onSubmit, multiline: true })),
    );
    expect(nativeModule.attach.mock.calls.at(-1)?.slice(2)).toEqual([
      true,
      false,
    ]);
    await act(() =>
      root.render(
        createElement(MessageInput, {
          onSubmit,
          multiline: true,
          submitBehavior: "submit",
          submissionEnabled: false,
        }),
      ),
    );
    expect(nativeModule.attach.mock.calls.at(-1)?.slice(2)).toEqual([
      false,
      true,
    ]);
  } finally {
    await act(() => root.unmount());
  }
});

test("iOS reports an unavailable native input instead of submitting stale JS text", async () => {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  try {
    nativeModule.attach.mockResolvedValue(false);
    await act(() =>
      root.render(createElement(MessageInput, { ref, onSubmit: vi.fn() })),
    );
    await expect(ref.current!.submit()).rejects.toThrow("must be mounted");
    expect(nativeModule.submit).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
    nativeModule.attach.mockResolvedValue(true);
  }
});

test("iOS keeps its attachment while text and callbacks change", async () => {
  const root = createRoot(document.createElement("div"));
  const first = vi.fn();
  const latest = vi.fn();
  try {
    await act(() =>
      root.render(
        createElement(MessageInput, { value: "draft", onSubmit: first }),
      ),
    );
    const identifier = nativeModule.attach.mock.calls.at(-1)![1];
    const attachments = nativeModule.attach.mock.calls.length;
    await act(() =>
      root.render(
        createElement(MessageInput, { value: "edited", onSubmit: latest }),
      ),
    );
    expect(nativeModule.attach).toHaveBeenCalledTimes(attachments);
    emitSubmission({ identifier, text: "edited" });
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith("edited");

    // Native layout still retries attachment when the host view becomes available.
    await act(() =>
      input.onLayout?.({} as Parameters<NonNullable<typeof input.onLayout>>[0]),
    );
    expect(nativeModule.attach).toHaveBeenCalledTimes(attachments + 1);

    // Switching to UITextView can replace the native input without changing send behavior.
    await act(() =>
      root.render(
        createElement(MessageInput, {
          onSubmit: latest,
          value: "edited",
          multiline: true,
          submitBehavior: "submit",
        }),
      ),
    );
    expect(nativeModule.attach).toHaveBeenCalledTimes(attachments + 2);
  } finally {
    await act(() => root.unmount());
  }
});
