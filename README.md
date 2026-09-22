# React Native Message Input

React Native's `TextInput` with message submission: apply pending iOS autocorrection, read the text, and clear the field in one native operation.

Use the standard input props, styles, events, and ref methods. Add `onSubmit` to receive the message after the field has been cleared, or call `ref.current.submit()` from your send button.

## Installation

In an Expo app, use [Expo CLI](https://docs.expo.dev/more/expo-cli/#installing-dependencies):

```sh
npx expo install @truckroute/message-input
```

Expo selects the package manager from your project's lockfile.

You can also install directly with your preferred package manager:

| Package manager | Command                                 |
| --------------- | --------------------------------------- |
| npm             | `npm install @truckroute/message-input` |
| Yarn            | `yarn add @truckroute/message-input`    |
| pnpm            | `pnpm add @truckroute/message-input`    |
| Bun             | `bun add @truckroute/message-input`     |

### Native setup

Rebuild your iOS app to include the native module:

```sh
npx expo run:ios
```

For an existing native iOS project, install pods before rebuilding:

```sh
npx pod-install
```

The iOS module is autolinked through Expo Modules. It requires a native build and is not available in Expo Go; an OTA update alone cannot add it. Bare React Native apps must have Expo Modules configured first.

### Requirements

| Dependency   | Declared minimum |
| ------------ | ---------------- |
| Expo         | 52               |
| React Native | 0.76             |
| React        | 18.3.1           |

Requires iOS 16.4 or later. Use the React and React Native versions supported by your Expo SDK.

React, React Native, and Expo are peer dependencies. The package adds no runtime dependencies.

## Quick start

```tsx
import { useRef } from "react";
import { Button, StyleSheet, View } from "react-native";
import { MessageInput, type MessageInputRef } from "@truckroute/message-input";

export function Composer({ send }: { send: (text: string) => void }) {
  const input = useRef<MessageInputRef>(null);

  return (
    <View style={styles.composer}>
      <MessageInput
        ref={input}
        placeholder="Write a message…"
        accessibilityLabel="Message"
        maxLength={4000}
        onSubmit={send}
        style={styles.input}
      />
      <Button title="Send" onPress={() => void input.current?.submit()} />
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#8E8E93",
    borderRadius: 12,
  },
});
```

Pass your message-sending function as `send`. Both the keyboard Send key and the button trigger `onSubmit` with the message text.

### Controlled input

Use `value` and `onChangeText` as you would with a regular `TextInput`. Submission calls `onChangeText("")` to keep your state in sync with the cleared field.

```tsx
import { useState } from "react";
import { MessageInput } from "@truckroute/message-input";

export function Composer({ send }: { send: (text: string) => void }) {
  const [text, setText] = useState("");

  return (
    <MessageInput
      value={text}
      onChangeText={setText}
      onSubmit={send}
      placeholder="Write a message…"
      style={{ minHeight: 48, padding: 12, fontSize: 17 }}
    />
  );
}
```

For uncontrolled input, omit `value`. Use `defaultValue` to provide an initial draft.

### Multiline input

With `multiline`, Return inserts a newline by default. Use your send button to call `submit()`, or set `submitBehavior="submit"` to send with the Return key:

```tsx
<MessageInput
  multiline
  submitBehavior="submit"
  onSubmit={send}
  onContentSizeChange={handleContentSizeChange}
  style={{ minHeight: 48, maxHeight: 160, padding: 12 }}
/>
```

## API

### Props

`MessageInputProps` extends [React Native's `TextInputProps`](https://reactnative.dev/docs/textinput). Props retain their platform and React Native version requirements. This includes `value`, `defaultValue`, `multiline`, `editable`, `autoFocus`, `keyboardType`, `autoCorrect`, `autoCapitalize`, `secureTextEntry`, `selection`, `textContentType`, accessibility props, and input events.

`style` applies directly to the `TextInput`, including typography, padding, borders, and sizing.

The package adds two props:

| Prop                | Type                     | Description                                                                                           |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `onSubmit`          | `(text: string) => void` | Receives trimmed, nonempty text after the input is cleared. Enables message submission when provided. |
| `submissionEnabled` | `boolean`                | Enables message submission. Defaults to `true`. Does not disable editing or standard input events.    |

Without `onSubmit`, the component behaves as a regular `TextInput`. With `onSubmit`, single-line inputs default to `returnKeyType="send"` and keep focus on submission. Explicit `returnKeyType`, `submitBehavior`, and `blurOnSubmit` values are respected. `onSubmitEditing` remains available for the standard keyboard event; calling `submit()` does not synthesize that event.

`textColor`, `placeholderColor`, `fontName`, and `fontSize` are supported as legacy aliases. Prefer `style.color`, `placeholderTextColor`, `style.fontFamily`, and `style.fontSize`; the standard props take precedence.

### Ref methods

`MessageInputRef` includes the native `TextInput` ref methods supported by your React Native version, including `focus()`, `blur()`, `clear()`, `isFocused()`, and measurement methods. Their signatures and return values match `TextInput`.

The additional `submit(): Promise<void>` method submits the current message and respects `submissionEnabled`. The promise represents the native submission operation, not network delivery.

```tsx
input.current?.focus();
input.current?.blur();
input.current?.clear();
const focused = input.current?.isFocused();
await input.current?.submit();
```

### Submission behavior

- Leading and trailing whitespace is removed. Empty or whitespace-only messages are ignored.
- The field is cleared before `onSubmit` is called. `onChangeText` receives the empty string so controlled state can be updated.
- `submissionEnabled={false}` preserves the draft and suppresses `onSubmit`; standard keyboard events and explicit blur behavior still apply.
- Sending, errors, and retries belong to your app. Retain the submitted text if you need to retry a failed request.
- As with a regular controlled input, the parent owns `value`. If it keeps supplying the old value, React Native can restore that text.

## Platform behavior

All platforms render React Native's `TextInput`.

On iOS, the module attaches to the underlying `UITextField` or `UITextView`. It commits pending autocorrection, reads the text, and clears it on the UI thread. It also updates React Native's text state and event count, preserving normal input events and controlled-value synchronization.

Android and web submit through React Native input events and the latest text tracked by the component. The iOS autocorrection operation is specific to iOS.

## Migrating from 0.1.x

- `style` now styles the input itself. There is no wrapper or default minimum height; set the size in `style`.
- `focus()`, `blur()`, and `clear()` use standard `TextInput` return types. `submit()` remains asynchronous.
- Multiline inputs support newlines; set `submitBehavior="submit"` if Return should send.
- Rebuild the iOS app after upgrading to include the new native module.

## Contributing

See the [development and release guide](https://github.com/Truckroute-inc/react-native-message-input/blob/main/CONTRIBUTING.md).

## Feedback

Report bugs and request features in [GitHub Issues](https://github.com/Truckroute-inc/react-native-message-input/issues). For keyboard issues, include the platform and OS version, Expo / React Native versions, keyboard language, autocorrection settings, and steps to reproduce.

## License

[MIT](./LICENSE) © Truckroute inc.
