import { useCallback, useId, useLayoutEffect, useRef } from "react";
import { findNodeHandle } from "react-native";
import { requireNativeModule } from "expo";
import type {
  NativeSubmission,
  NativeSubmissionOptions,
} from "./native-submission-types";

type SubmitEvent = { identifier: string; text: string };
type SubmissionModule = {
  attach: (
    tag: number,
    identifier: string,
    enabled: boolean,
    interceptReturn: boolean,
  ) => Promise<boolean>;
  detach: (tag: number, identifier: string) => Promise<void>;
  submit: (tag: number, identifier: string) => Promise<void>;
  addListener: (
    event: "onSubmit",
    listener: (event: SubmitEvent) => void,
  ) => { remove: () => void };
};

const native = requireNativeModule<SubmissionModule>("MessageInput");

export function useNativeSubmission(
  options: NativeSubmissionOptions,
): NativeSubmission {
  const { input: inputRef, enabled, interceptReturn, onSubmit } = options;
  const token = useId();
  const callback = useRef(onSubmit);
  useLayoutEffect(() => {
    callback.current = onSubmit;
  }, [onSubmit]);
  const tags = useRef(new Set<number>());

  const configure = useCallback(async () => {
    const tag = findNodeHandle(inputRef.current);
    if (tag === null) {
      return null;
    }
    tags.current.add(tag);
    const attached = await native.attach(tag, token, enabled, interceptReturn);
    return attached ? tag : null;
  }, [inputRef, token, enabled, interceptReturn]);

  useLayoutEffect(() => {
    const subscription = native.addListener("onSubmit", (event) => {
      if (event.identifier === token) {
        if (callback.current !== undefined) {
          callback.current(event.text);
        }
      }
    });
    const attachedTags = tags.current;
    return () => {
      subscription.remove();
      for (const tag of attachedTags) {
        void native.detach(tag, token);
      }
      attachedTags.clear();
    };
  }, [token]);

  // A layout event retries attachment if React hasn't mounted the native view yet.
  useLayoutEffect(() => {
    void configure();
  }, [configure, options.multiline]);

  return {
    attach: () => void configure(),
    submit: async () => {
      const tag = await configure();
      if (tag === null) {
        throw new Error(
          "MessageInput must be mounted before calling submit().",
        );
      }
      await native.submit(tag, token);
    },
  };
}
