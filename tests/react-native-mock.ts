import {
  createElement,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  type ReactNode,
} from "react";
import type { TextInputProps } from "react-native";
import { vi } from "vitest";

export let input: TextInputProps = {};
export const nativeInput = {
  clear: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  isFocused: vi.fn(() => true),
  measure: vi.fn(),
  measureInWindow: vi.fn(),
  measureLayout: vi.fn(),
  setNativeProps: vi.fn(),
  setSelection: vi.fn(),
};
export const findNodeHandle = vi.fn(() => 42);

export function View({ children }: { children: ReactNode }) {
  return createElement("div", null, children);
}

export const TextInput = forwardRef<typeof nativeInput, TextInputProps>(
  function TextInput(props, ref) {
    useLayoutEffect(() => {
      input = props;
    });
    useImperativeHandle(ref, () => nativeInput);
    return createElement("input", { value: props.value, readOnly: true });
  },
);
