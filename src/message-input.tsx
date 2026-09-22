import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import type { MessageInputProps, MessageInputRef } from "./message-input-types";

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput(
    {
      onSubmit,
      submissionEnabled = true,
      style,
      textColor,
      placeholderColor,
      fontName,
      fontSize,
      ...props
    },
    ref,
  ) {
    const input = useRef<TextInput>(null);
    const [text, setText] = useState("");
    const clear = () => {
      if (input.current !== null) input.current.clear();
      setText("");
    };
    const submit = (value: string) => {
      const message = value.trim();
      if (!submissionEnabled || message.length === 0) return;
      clear();
      onSubmit(message);
    };
    useImperativeHandle(ref, () => ({
      clear: async () => clear(),
      submit: async () => submit(text),
      focus: async () => {
        if (input.current !== null) input.current.focus();
      },
    }));
    return (
      <View style={[{ minHeight: 44 }, style]}>
        <TextInput
          {...props}
          ref={input}
          value={text}
          onChangeText={setText}
          onSubmitEditing={(event) => submit(event.nativeEvent.text)}
          submitBehavior="submit"
          returnKeyType="send"
          placeholderTextColor={placeholderColor}
          style={{ flex: 1, color: textColor, fontFamily: fontName, fontSize }}
        />
      </View>
    );
  },
);
