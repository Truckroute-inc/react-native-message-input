import { useLayoutEffect, useRef } from "react";
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
const session = Date.now().toString(36);
let nextIdentifier = 0;

export function useNativeSubmission(
  options: NativeSubmissionOptions,
): NativeSubmission {
  const current = useRef(options);
  current.current = options;
  const identifier = useRef<string | null>(null);
  if (identifier.current === null) {
    identifier.current = `${session}:${++nextIdentifier}`;
  }
  const token = identifier.current;
  const tags = useRef(new Set<number>());
  const active = useRef(false);

  const configure = async () => {
    const { input, enabled, interceptReturn } = current.current;
    const tag = findNodeHandle(input.current);
    if (tag === null || !active.current) return null;
    tags.current.add(tag);
    const attached = await native.attach(tag, token, enabled, interceptReturn);
    return attached ? tag : null;
  };

  useLayoutEffect(() => {
    active.current = true;
    const subscription = native.addListener("onSubmit", (event) => {
      if (active.current && event.identifier === token) {
        current.current.onSubmit?.(event.text);
      }
    });
    const attachedTags = tags.current;
    return () => {
      active.current = false;
      subscription.remove();
      for (const tag of attachedTags) void native.detach(tag, token);
      attachedTags.clear();
    };
  }, [token]);

  // A layout event retries attachment if React hasn't mounted the native view yet.
  useLayoutEffect(() => {
    void configure();
  });

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
