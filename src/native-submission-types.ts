import type { RefObject } from "react";
import type { TextInput } from "react-native";

export type NativeSubmissionOptions = {
  input: RefObject<TextInput | null>;
  enabled: boolean;
  multiline?: boolean;
  interceptReturn: boolean;
  onSubmit?: (text: string) => void;
};

export type NativeSubmission = {
  attach: () => void;
  submit: () => Promise<void>;
};
