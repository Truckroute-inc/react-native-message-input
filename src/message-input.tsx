import { forwardRef, useImperativeHandle, useRef } from "react";
import { TextInput } from "react-native";
import type { MessageInputProps, MessageInputRef } from "./message-input-types";
import { useNativeSubmission } from "./native-submission";

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput({ onSubmit, submissionEnabled = true, ...props }, ref) {
    const input = useRef<TextInput>(null);
    const text = useRef(props.value ?? props.defaultValue ?? "");
    if (props.value !== undefined) text.current = props.value;

    let submitBehavior = props.submitBehavior;
    if (
      !submitBehavior &&
      props.blurOnSubmit === undefined &&
      onSubmit &&
      !props.multiline
    ) {
      submitBehavior = "submit";
    }
    const submitsOnReturn =
      !props.multiline ||
      submitBehavior === "submit" ||
      submitBehavior === "blurAndSubmit" ||
      (!submitBehavior && props.blurOnSubmit === true);
    const native = useNativeSubmission({
      input,
      enabled: submissionEnabled && !!onSubmit,
      interceptReturn: !!onSubmit && submitsOnReturn,
      onSubmit,
    });

    const clear = () => {
      text.current = "";
      input.current?.clear();
    };
    const submitText = (draft: string) => {
      const message = draft.trim();
      if (!submissionEnabled || !onSubmit || !message) return;
      clear();
      props.onChangeText?.("");
      onSubmit(message);
    };
    const submit = async () => {
      if (!submissionEnabled || !onSubmit) return;
      if (native) await native.submit();
      else submitText(text.current);
    };

    // Forward the complete host ref without copying or mutating native methods.
    useImperativeHandle(
      ref,
      () =>
        new Proxy({} as MessageInputRef, {
          get(_target, property) {
            if (property === "submit") return submit;
            if (property === "clear") return clear;
            const host = input.current;
            if (!host) return undefined;
            const member = Reflect.get(host, property, host);
            return typeof member === "function" ? member.bind(host) : member;
          },
        }),
    );

    return (
      <TextInput
        {...props}
        ref={input}
        submitBehavior={submitBehavior}
        returnKeyType={
          props.returnKeyType ??
          (onSubmit && !props.multiline ? "send" : undefined)
        }
        onChangeText={(nextText) => {
          text.current = nextText;
          props.onChangeText?.(nextText);
        }}
        onSubmitEditing={(event) => {
          if (!native) submitText(event.nativeEvent.text);
          props.onSubmitEditing?.(event);
        }}
        onLayout={(event) => {
          native?.attach();
          props.onLayout?.(event);
        }}
        onFocus={(event) => {
          native?.attach();
          props.onFocus?.(event);
        }}
      />
    );
  },
);
