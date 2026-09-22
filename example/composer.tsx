import { useRef } from "react";
import { Button, View } from "react-native";
import { MessageInput } from "../src/message-input";
import type { MessageInputRef } from "../src/message-input-types";

export function Composer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const input = useRef<MessageInputRef>(null);
  return (
    <View>
      <MessageInput
        ref={input}
        onSubmit={onSubmit}
        placeholder="Message"
        maxLength={4000}
        style={{
          height: 48,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderRadius: 12,
        }}
      />
      <Button
        title="Send"
        onPress={() => {
          if (input.current !== null) void input.current.submit();
        }}
      />
    </View>
  );
}
