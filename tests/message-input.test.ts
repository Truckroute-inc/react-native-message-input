import { expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import { act, createElement, createRef } from "react";
import type { ReactNode } from "react";
import type { TextInputProps } from "react-native";
import type { MessageInputRef } from "../src/message-input-types";

const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  IS_REACT_ACT_ENVIRONMENT: true,
});
let input: TextInputProps = {};
mock.module("react-native", () => ({
  View: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  TextInput: (props: TextInputProps) => {
    input = props;
    return createElement("input", { value: props.value, readOnly: true });
  },
}));
const { createRoot } = await import("react-dom/client");
const { MessageInput } = await import("../src/message-input");

test("fallback submission trims and clears before notifying; disabled submission preserves text", async () => {
  const host = document.createElement("div");
  const root = createRoot(host);
  const ref = createRef<MessageInputRef>();
  const send = mock();
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
