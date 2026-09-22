import { forwardRef } from "react";
import { requireNativeView } from "expo";
import { View } from "react-native";
import type { MessageInputProps, MessageInputRef } from "./message-input-types";

const NativeInput = requireNativeView<
  Omit<MessageInputProps, "onSubmit"> & {
    onSubmit: (event: { nativeEvent: { text: string } }) => void;
  }
>("MessageInput");

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput({ onSubmit, style, ...props }, ref) {
    return (
      <View style={[{ minHeight: 44 }, style]}>
        <NativeInput
          {...props}
          ref={ref}
          onSubmit={(event) => onSubmit(event.nativeEvent.text)}
          style={{ flex: 1 }}
        />
      </View>
    );
  },
);
