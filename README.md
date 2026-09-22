# React Native Message Input

A message input for React Native and Expo that applies iOS keyboard autocorrection before submitting the text and clears the field immediately after.

On iOS, `MessageInput` commits the pending correction, reads the message, and clears the native field in one UI-thread operation. JavaScript receives the text through `onSubmit` after the field is empty. The keyboard stays open for the next message.

Works with the keyboard Send key and custom send buttons. Android and web use React Native's `TextInput` with the same component API.

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

### Submission behavior

- Leading and trailing whitespace is removed. Empty or whitespace-only submissions are ignored.
- The field is cleared before `onSubmit` is called. Submission does not dismiss the keyboard.
- `submissionEnabled={false}` blocks both submission paths while allowing the user to keep editing. It preserves the draft.
- Sending, loading indicators, errors, and retries belong to your app. The component does not await a network request or restore text after a failed send, so retain the submitted message if you need to retry it.

## API

### Props

Only `onSubmit` is required. The package exports `MessageInputProps` and `MessageInputRef` for TypeScript consumers.

| Prop                 | Type                     | Description                                                              |
| -------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `onSubmit`           | `(text: string) => void` | Receives trimmed, nonempty text after the field is cleared.              |
| `ref`                | `Ref<MessageInputRef>`   | Access to `submit()`, `clear()`, and `focus()`.                          |
| `submissionEnabled`  | `boolean`                | Enables submission. Defaults to `true`; does not disable editing.        |
| `placeholder`        | `string`                 | Text displayed when the field is empty.                                  |
| `maxLength`          | `number`                 | Input length limit. On iOS, measured in UTF-16 code units.               |
| `style`              | `StyleProp<ViewStyle>`   | Outer container styles, including size, padding, border, and background. |
| `textColor`          | `ColorValue`             | Input text color.                                                        |
| `placeholderColor`   | `ColorValue`             | Placeholder color.                                                       |
| `fontName`           | `string`                 | Font name on iOS; `fontFamily` on Android and web.                       |
| `fontSize`           | `number`                 | Input font size. Defaults to `17` on iOS.                                |
| `accessibilityLabel` | `string`                 | Accessibility label passed to the underlying input view.                 |
| `testID`             | `string`                 | Test identifier passed to the underlying input view.                     |

The container has a default minimum height of `44`. Use `style` for layout and the dedicated color and font props for text appearance.

### Ref methods

All methods return `Promise<void>`.

| Method     | Behavior                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `submit()` | Submits the current text using the same path as the keyboard Send key. Respects `submissionEnabled`. |
| `clear()`  | Clears the field without calling `onSubmit`.                                                         |
| `focus()`  | Focuses the field.                                                                                   |

```tsx
await input.current?.focus();
await input.current?.clear();
await input.current?.submit();
```

`submit()` returns no message or delivery result. Receive the text through `onSubmit` and track delivery in your app.

## Platform behavior

| Platform      | Input implementation     | Submission                                                                                          |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| iOS           | Native `UITextField`     | Finalizes editing, reads text, and clears the field on the UI thread before emitting to JavaScript. |
| Android / web | React Native `TextInput` | Uses React state and React Native input events; clears before calling `onSubmit`.                   |

On iOS, the native field finalizes marked text and moves/restores the selection to commit pending autocorrection. Reading and clearing happen in the same native operation. Android and web handle submission through React Native input events and React state.

The input is single-line and manages its own text. Controlled `value`, `onChangeText`, multiline input, and selection control are not supported.

If you are migrating from a local copy of this module, remove it before installing the package and rebuild the app. Two native modules named `MessageInput` cannot be installed together.

## Contributing

See the [development and release guide](https://github.com/Truckroute-inc/react-native-message-input/blob/main/CONTRIBUTING.md).

## Feedback

Report bugs and request features in [GitHub Issues](https://github.com/Truckroute-inc/react-native-message-input/issues). For keyboard issues, include the platform and OS version, Expo / React Native versions, keyboard language, autocorrection settings, and steps to reproduce.

## License

[MIT](./LICENSE) © Truckroute inc.
