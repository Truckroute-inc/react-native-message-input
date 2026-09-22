import type { Ref } from "react";
import type { ColorValue, TextInput, TextInputProps } from "react-native";

export type MessageInputRef = TextInput & {
  submit: () => Promise<void>;
};

export type MessageInputProps = TextInputProps & {
  ref?: Ref<MessageInputRef>;
  onSubmit?: (text: string) => void;
  submissionEnabled?: boolean;
  /** @deprecated Use style.color. */
  textColor?: ColorValue;
  /** @deprecated Use placeholderTextColor. */
  placeholderColor?: ColorValue;
  /** @deprecated Use style.fontFamily. */
  fontName?: string;
  /** @deprecated Use style.fontSize. */
  fontSize?: number;
};
