import { beforeEach, expect, test, vi } from "vitest";
import { input, nativeInput } from "./react-native-mock";
import { act, createElement, createRef, useState } from "react";
import type { TextInputProps } from "react-native";
import type {
  MessageInputProps,
  MessageInputRef,
} from "../src/message-input-types";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
const { MessageInput } = await import("../src/message-input");

beforeEach(() => vi.clearAllMocks());

type SubmitEvent = Parameters<
  NonNullable<TextInputProps["onSubmitEditing"]>
>[0];
const submitEvent = (text: string) =>
  ({
    nativeEvent: { text, target: 42, eventCount: 1 },
  }) as unknown as SubmitEvent;

async function mount(props: MessageInputProps = {}) {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  const render = async (next: MessageInputProps) => {
    await act(() => root.render(createElement(MessageInput, { ...next, ref })));
  };
  await render(props);
  return { ref, render, unmount: () => act(() => root.unmount()) };
}

test("submission trims, clears, updates the draft, and then notifies", async () => {
  const order: string[] = [];
  nativeInput.clear.mockImplementation(() => {
    order.push("clear");
  });
  const onChangeText = vi.fn((text: string) => {
    order.push(`change:${text}`);
  });
  const onSubmit = vi.fn((text: string) => {
    order.push(`submit:${text}`);
  });
  const component = await mount({ onSubmit, onChangeText });
  try {
    await act(() => input.onChangeText?.("  Hello  "));
    order.length = 0;
    await act(() => component.ref.current!.submit());
    expect(order).toEqual(["clear", "change:", "submit:Hello"]);
    await act(() => component.ref.current!.submit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(input.value).toBeUndefined();
  } finally {
    await component.unmount();
  }
});

test("disabled submission and blur preserve the draft", async () => {
  const onSubmit = vi.fn();
  const component = await mount({ onSubmit, submissionEnabled: false });
  try {
    await act(() => input.onChangeText?.("Draft"));
    await act(() => component.ref.current!.submit());
    component.ref.current!.blur();
    expect(nativeInput.blur).toHaveBeenCalledOnce();
    expect(nativeInput.clear).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    await component.render({ onSubmit, submissionEnabled: true });
    await act(() => component.ref.current!.submit());
    expect(onSubmit).toHaveBeenCalledWith("Draft");
  } finally {
    await component.unmount();
  }
});

test("controlled value follows parent changes and is cleared through onChangeText", async () => {
  const root = createRoot(document.createElement("div"));
  const ref = createRef<MessageInputRef>();
  const onSubmit = vi.fn();
  let updateValue!: (text: string) => void;
  function Controlled() {
    const [value, setValue] = useState("Initial");
    updateValue = setValue;
    return createElement(MessageInput, {
      ref,
      value,
      onChangeText: setValue,
      onSubmit,
    });
  }
  try {
    await act(() => root.render(createElement(Controlled)));
    await act(() => updateValue("Updated externally"));
    await act(() => ref.current!.submit());
    expect(onSubmit).toHaveBeenCalledWith("Updated externally");
    expect(input.value).toBe("");
  } finally {
    await act(() => root.unmount());
  }
});

test("defaultValue initializes the draft and does not overwrite subsequent input", async () => {
  const onSubmit = vi.fn();
  const component = await mount({ defaultValue: "Initial draft", onSubmit });
  try {
    await act(() => component.ref.current!.submit());
    expect(onSubmit).toHaveBeenLastCalledWith("Initial draft");
    await act(() => input.onChangeText?.("Next draft"));
    await component.render({ defaultValue: "Changed default", onSubmit });
    await act(() => component.ref.current!.submit());
    expect(onSubmit).toHaveBeenLastCalledWith("Next draft");
  } finally {
    await component.unmount();
  }
});

test("keyboard submission uses event text and preserves onSubmitEditing", async () => {
  const onSubmit = vi.fn();
  const onSubmitEditing = vi.fn();
  const component = await mount({ onSubmit, onSubmitEditing });
  try {
    await act(() => input.onChangeText?.("Stale JS draft"));
    const event = submitEvent("  Corrected text  ");
    await act(() => input.onSubmitEditing?.(event));
    expect(onSubmit).toHaveBeenCalledWith("Corrected text");
    expect(onSubmitEditing).toHaveBeenCalledWith(event);
  } finally {
    await component.unmount();
  }
});

test("without onSubmit it preserves standard TextInput behavior", async () => {
  const onSubmitEditing = vi.fn();
  const component = await mount({ onSubmitEditing });
  try {
    const event = submitEvent("Normal input");
    await act(() => input.onSubmitEditing?.(event));
    expect(onSubmitEditing).toHaveBeenCalledWith(event);
    expect(nativeInput.clear).not.toHaveBeenCalled();
    expect(input.returnKeyType).toBeUndefined();
    expect(input.submitBehavior).toBeUndefined();
  } finally {
    await component.unmount();
  }
});

test("standard props, text styles, and event handlers reach TextInput", async () => {
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onContentSizeChange = vi.fn();
  const onBlur = vi.fn();
  const onFocus = vi.fn();
  const onLayout = vi.fn();
  const style = { fontSize: 20, color: "red", padding: 12, lineHeight: 24 };
  const component = await mount({
    multiline: true,
    numberOfLines: 4,
    autoFocus: true,
    editable: false,
    autoCapitalize: "words",
    autoCorrect: false,
    spellCheck: false,
    keyboardType: "email-address",
    secureTextEntry: true,
    selection: { start: 1, end: 2 },
    selectionColor: "blue",
    placeholderTextColor: "gray",
    textContentType: "username",
    accessibilityHint: "Write a message",
    testID: "composer",
    style,
    onChange,
    onSelectionChange,
    onContentSizeChange,
    onBlur,
    onFocus,
    onLayout,
  });
  try {
    expect(input).toMatchObject({
      multiline: true,
      numberOfLines: 4,
      autoFocus: true,
      editable: false,
      autoCapitalize: "words",
      autoCorrect: false,
      spellCheck: false,
      keyboardType: "email-address",
      secureTextEntry: true,
      selection: { start: 1, end: 2 },
      selectionColor: "blue",
      placeholderTextColor: "gray",
      textContentType: "username",
      accessibilityHint: "Write a message",
      testID: "composer",
      onChange,
      onSelectionChange,
      onContentSizeChange,
      onBlur,
    });
    expect(input.style).toBe(style);
    const focusEvent = { nativeEvent: { target: 42 } } as Parameters<
      NonNullable<TextInputProps["onFocus"]>
    >[0];
    input.onFocus?.(focusEvent);
    expect(onFocus).toHaveBeenCalledWith(focusEvent);
  } finally {
    await component.unmount();
  }
});

test("ref preserves native focus, blur, measurement and selection methods", async () => {
  const component = await mount();
  try {
    expect(component.ref.current!.focus()).toBeUndefined();
    expect(component.ref.current!.blur()).toBeUndefined();
    expect(component.ref.current!.isFocused()).toBe(true);
    const callback = vi.fn();
    component.ref.current!.measure(callback);
    component.ref.current!.setSelection(1, 2);
    expect(nativeInput.focus).toHaveBeenCalledOnce();
    expect(nativeInput.blur).toHaveBeenCalledOnce();
    expect(nativeInput.measure).toHaveBeenCalledWith(callback);
    expect(nativeInput.setSelection).toHaveBeenCalledWith(1, 2);
  } finally {
    await component.unmount();
  }
});

test.each([
  [{}, "submit"],
  [{ multiline: true }, undefined],
  [{ multiline: true, submitBehavior: "submit" }, "submit"],
  [{ submitBehavior: "blurAndSubmit" }, "blurAndSubmit"],
  [{ blurOnSubmit: true }, undefined],
  [{ multiline: true, blurOnSubmit: false }, undefined],
] as const)("respects return key behavior: %j", async (props, expected) => {
  const component = await mount({ ...props, onSubmit: vi.fn() });
  try {
    expect(input.submitBehavior).toBe(expected);
    if ("blurOnSubmit" in props)
      expect(input.blurOnSubmit).toBe(props.blurOnSubmit);
    expect(input.returnKeyType).toBe("multiline" in props ? undefined : "send");
  } finally {
    await component.unmount();
  }
});
