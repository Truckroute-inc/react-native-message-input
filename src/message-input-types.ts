import type { Ref } from "react";
import type { TextInput, TextInputProps } from "react-native";

export type MessageInputRef = TextInput & {
  submit: () => Promise<void>;
};

export type MessageInputProps = TextInputProps & {
  ref?: Ref<MessageInputRef>;
  onSubmit?: (text: string) => void;
  submissionEnabled?: boolean;
};
