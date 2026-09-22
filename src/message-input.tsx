import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { TextInput } from "react-native";
import type { MessageInputProps, MessageInputRef } from "./message-input-types";

export const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(
  function MessageInput({ onSubmit, ...props }, ref) {
    const input = useRef<TextInput>(null);
    const draft = useRef(props.defaultValue ?? "");
    useLayoutEffect(() => {
      if (props.value !== undefined) {
        draft.current = props.value;
      }
    }, [props.value]);

    const changeText = (text: string) => {
      draft.current = text;
      if (props.onChangeText !== undefined) {
        props.onChangeText(text);
      }
    };
    const submit = async (text = draft.current) => {
      if (onSubmit === undefined || input.current === null) {
        return;
      }
      const message = text.trim();
      if (!message) {
        return;
      }
      input.current.clear();
      changeText("");
      onSubmit(message);
    };

    const setInput = useCallback((host: TextInput | null) => {
      input.current = host;
      if (host === null) {
        return;
      }
      const clear = host.clear.bind(host);
      host.clear = () => {
        draft.current = "";
        clear();
      };
    }, []);

    useImperativeHandle(ref, () => {
      if (input.current === null) {
        throw new Error("MessageInput is not mounted.");
      }
      return Object.assign(input.current, { submit: () => submit() });
    });

    return (
      <TextInput
        {...props}
        ref={setInput}
        onChangeText={changeText}
        onSubmitEditing={(event) => {
          void submit(event.nativeEvent.text);
          if (props.onSubmitEditing !== undefined) {
            props.onSubmitEditing(event);
          }
        }}
      />
    );
  },
);
