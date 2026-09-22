import type { TextInput, TextInputProps } from "react-native";

export type MessageInputRef = TextInput & {
  submit: () => Promise<void>;
};

export type MessageInputProps = TextInputProps & {
  onSubmit?: (text: string) => void;
};
