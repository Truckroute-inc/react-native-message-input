import {
  createElement,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from "react";
import type { TextInputProps } from "react-native";
import { vi } from "vitest";

export let input: TextInputProps = {};
export const nativeInput = { clear: vi.fn(), focus: vi.fn(), blur: vi.fn() };

export function View({ children }: { children: ReactNode }) {
  return createElement("div", null, children);
}

export const TextInput = forwardRef<typeof nativeInput, TextInputProps>(
  function TextInput(props, ref) {
    input = props;
    useImperativeHandle(ref, () => nativeInput);
    return createElement("input", { value: props.value, readOnly: true });
  },
);
