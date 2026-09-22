import { forwardRef, useImperativeHandle, useRef } from "react";
import { findNodeHandle, TextInput } from "react-native";
import { requireNativeModule } from "expo";
import type { MessageInputProps, MessageInputRef } from "./message-input-types";

const native = requireNativeModule<{
  submit: (tag: number) => Promise<string | null>;
}>("MessageInput");

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput({ onSubmit, ...props }, ref) {
    const input = useRef<TextInput>(null);
    const submit = async () => {
      if (onSubmit === undefined) {
        return;
      }
      const tag = findNodeHandle(input.current);
      if (tag === null) {
        return;
      }
      const message = await native.submit(tag);
      if (message !== null) {
        onSubmit(message);
      }
    };

    useImperativeHandle(ref, () => {
      if (input.current === null) {
        throw new Error("MessageInput is not mounted.");
      }
      return Object.assign(input.current, { submit });
    });

    return (
      <TextInput
        {...props}
        ref={input}
        onSubmitEditing={(event) => {
          void submit();
          if (props.onSubmitEditing !== undefined) {
            props.onSubmitEditing(event);
          }
        }}
      />
    );
  },
);
