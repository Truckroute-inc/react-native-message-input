import type { Ref } from "react";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

export type MessageInputRef = {
  submit: () => Promise<void>;
  clear: () => Promise<void>;
  focus: () => Promise<void>;
  blur: () => Promise<void>;
};

export type MessageInputProps = {
  ref?: Ref<MessageInputRef>;
  onSubmit: (text: string) => void;
  submissionEnabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  textColor?: ColorValue;
  placeholderColor?: ColorValue;
  fontName?: string;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};
