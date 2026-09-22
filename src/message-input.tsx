import { forwardRef, useImperativeHandle, useRef } from "react";
import { TextInput } from "react-native";
import type { MessageInputProps, MessageInputRef } from "./message-input-types";
import { useNativeSubmission } from "./native-submission";

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput(
    {
      onSubmit,
      submissionEnabled = true,
      onChangeText,
      onSubmitEditing,
      onLayout,
      onFocus,
      value,
      defaultValue,
      multiline,
      submitBehavior,
      blurOnSubmit,
      returnKeyType,
      style,
      textColor,
      placeholderColor,
      placeholderTextColor,
      fontName,
      fontSize,
      ...props
    },
    ref,
  ) {
    const input = useRef<TextInput>(null);
    const text = useRef(value ?? defaultValue ?? "");
    if (value !== undefined) text.current = value;

    // Respect explicit TextInput behavior; keep the keyboard open for messages.
    const behavior =
      submitBehavior ??
      (blurOnSubmit !== undefined
        ? blurOnSubmit
          ? "blurAndSubmit"
          : multiline
            ? "newline"
            : "submit"
        : onSubmit && !multiline
          ? "submit"
          : undefined);
    const submitsOnReturn = behavior
      ? behavior !== "newline" || !multiline
      : !multiline;
    const native = useNativeSubmission({
      input,
      enabled: submissionEnabled && onSubmit !== undefined,
      interceptReturn: onSubmit !== undefined && submitsOnReturn,
      onSubmit,
    });

    const clear = () => {
      text.current = "";
      input.current?.clear();
    };
    const submit = (draft: string) => {
      const message = draft.trim();
      if (!submissionEnabled || !onSubmit || message.length === 0) return;
      clear();
      onChangeText?.("");
      onSubmit(message);
    };

    useImperativeHandle(ref, () => {
      // Preserve the host ref, including measurement and future TextInput methods.
      return new Proxy({} as MessageInputRef, {
        get(_target, property) {
          if (property === "submit") {
            return async () => {
              if (!submissionEnabled || !onSubmit) return;
              if (native) await native.submit();
              else submit(text.current);
            };
          }
          if (property === "clear") return clear;
          const host = input.current;
          if (!host) return undefined;
          const member = Reflect.get(host, property, host);
          return typeof member === "function" ? member.bind(host) : member;
        },
      });
    });

    return (
      <TextInput
        {...props}
        ref={input}
        value={value}
        defaultValue={defaultValue}
        multiline={multiline}
        submitBehavior={behavior}
        blurOnSubmit={blurOnSubmit}
        returnKeyType={
          returnKeyType ?? (onSubmit && !multiline ? "send" : undefined)
        }
        placeholderTextColor={placeholderTextColor ?? placeholderColor}
        style={[{ color: textColor, fontFamily: fontName, fontSize }, style]}
        onChangeText={(nextText) => {
          text.current = nextText;
          onChangeText?.(nextText);
        }}
        onSubmitEditing={(event) => {
          if (!native) submit(event.nativeEvent.text);
          onSubmitEditing?.(event);
        }}
        onLayout={(event) => {
          native?.attach();
          onLayout?.(event);
        }}
        onFocus={(event) => {
          native?.attach();
          onFocus?.(event);
        }}
      />
    );
  },
);
