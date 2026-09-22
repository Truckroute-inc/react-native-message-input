import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { TextInput } from "react-native";
import type { MessageInputProps, MessageInputRef } from "./message-input-types";
import { useNativeSubmission } from "./native-submission";

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput({ onSubmit, submissionEnabled = true, ...props }, ref) {
    const input = useRef<TextInput>(null);
    const text = useRef(props.value ?? props.defaultValue ?? "");
    useLayoutEffect(() => {
      if (props.value !== undefined) {
        text.current = props.value;
      }
    }, [props.value]);

    let submitBehavior = props.submitBehavior;
    if (
      !submitBehavior &&
      props.blurOnSubmit === undefined &&
      onSubmit &&
      !props.multiline
    ) {
      submitBehavior = "submit";
    }
    const legacySubmit = !submitBehavior && props.blurOnSubmit === true;
    const sendKey = onSubmit !== undefined && !props.multiline;
    const submitsOnReturn =
      !props.multiline ||
      submitBehavior === "submit" ||
      submitBehavior === "blurAndSubmit" ||
      legacySubmit;
    const native = useNativeSubmission({
      input,
      multiline: props.multiline,
      enabled: submissionEnabled && !!onSubmit,
      interceptReturn: !!onSubmit && submitsOnReturn,
      onSubmit,
    });

    const clear = () => {
      text.current = "";
      if (input.current !== null) {
        input.current.clear();
      }
    };
    const submitText = (draft: string) => {
      const message = draft.trim();
      if (!submissionEnabled || !onSubmit || !message) {
        return;
      }
      clear();
      if (props.onChangeText !== undefined) {
        props.onChangeText("");
      }
      onSubmit(message);
    };
    const submit = async () => {
      if (!submissionEnabled || !onSubmit) {
        return;
      }
      if (native) {
        await native.submit();
      } else {
        submitText(text.current);
      }
    };

    // Extend the host ref while preserving the native methods and their receiver.
    useImperativeHandle(ref, () => {
      const host = input.current;
      if (host === null) {
        throw new Error("MessageInput is not mounted.");
      }
      return new Proxy(Object.assign(host, { submit }), {
        get(_target, property) {
          if (property === "submit") {
            return submit;
          }
          if (property === "clear") {
            return clear;
          }
          const member = Reflect.get(host, property, host);
          return typeof member === "function" ? member.bind(host) : member;
        },
      });
    });

    return (
      <TextInput
        {...props}
        ref={input}
        submitBehavior={submitBehavior}
        returnKeyType={props.returnKeyType ?? (sendKey ? "send" : undefined)}
        onChangeText={(nextText) => {
          text.current = nextText;
          if (props.onChangeText !== undefined) {
            props.onChangeText(nextText);
          }
        }}
        onSubmitEditing={(event) => {
          if (!native) {
            submitText(event.nativeEvent.text);
          }
          if (props.onSubmitEditing !== undefined) {
            props.onSubmitEditing(event);
          }
        }}
        onLayout={(event) => {
          if (native !== null) {
            native.attach();
          }
          if (props.onLayout !== undefined) {
            props.onLayout(event);
          }
        }}
      />
    );
  },
);
