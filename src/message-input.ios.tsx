import { requireNativeView } from "expo";
import { View } from "react-native";
import type { MessageInputProps } from "./message-input-types";

const NativeInput = requireNativeView<
  Omit<MessageInputProps, "onSubmit"> & {
    onSubmit: (event: { nativeEvent: { text: string } }) => void;
  }
>("MessageInput");

export function MessageInput({ onSubmit, style, ...props }: MessageInputProps) {
  return (
    <View style={[{ minHeight: 44 }, style]}>
      <NativeInput
        {...props}
        onSubmit={(event) => onSubmit(event.nativeEvent.text)}
        style={{ flex: 1 }}
      />
    </View>
  );
}
