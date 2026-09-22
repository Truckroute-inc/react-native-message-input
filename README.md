# React Native Message Input

**Submit the autocorrected message. Clear the field. Keep typing.**

A single-line message input for React Native and Expo that addresses two connected problems on iOS: submitting text while a keyboard correction is still pending, and clearing the input immediately after submission.

A chat composer that sends its JavaScript draft and then clears the native field uses separate steps. When keyboard autocorrection is pending, that draft can lag behind the text the user expects to send. `MessageInput` handles the sequence inside the native iOS input:

1. **Commit pending autocorrection** before reading the message.
2. **Read and clear the field in one UI-thread operation**, keeping the keyboard open.
3. **Deliver the corrected text to `onSubmit`**, with the input already ready for the next message.

Both the keyboard Send key and your own send button use this path. No controlled draft, separate clear call, or timeout is needed in your app. You handle message delivery and style the composer to fit your UI.

> Early release: iOS autocorrection behavior is still undergoing device validation. Android and web do not use the native iOS submission path.

## Installation

In an Expo app, use [Expo CLI](https://docs.expo.dev/more/expo-cli/#installing-dependencies):

```sh
npx expo install @truckroute/message-input
```

The command is `expo install`. Expo selects the package manager from your project's lockfile, or you can choose it explicitly with `--npm`, `--yarn`, `--pnpm`, or `--bun`.

You can also install directly with your preferred package manager:

| Package manager | Command                                 |
| --------------- | --------------------------------------- |
| npm             | `npm install @truckroute/message-input` |
| Yarn            | `yarn add @truckroute/message-input`    |
| pnpm            | `pnpm add @truckroute/message-input`    |
| Bun             | `bun add @truckroute/message-input`     |

The package works with any of these package managers. It includes its TypeScript and native iOS sources, with no install-time scripts or JavaScript build step. Metro compiles the TypeScript in your app.

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

Use the React and React Native versions appropriate for your Expo SDK. The compatibility baseline is Expo SDK 52 / React Native 0.76 / React 18.3.1; the development environment uses SDK 57. Native keyboard behavior still requires device verification. The native module declares iOS 16.4 as its deployment target; your app must also meet the requirements of its Expo and React Native versions.

### Package size and dependencies

There are no runtime `dependencies`. React, React Native, and Expo are peer dependencies supplied by your app. Development tools and test libraries are listed under `devDependencies`; they are not installed with this library or included in its npm archive. Only the source files, iOS module, module configuration, package metadata, README, and license are published.

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

On iOS, submission finalizes marked text and moves/restores the selection to commit a pending correction before reading the field. This keeps the read-and-clear operation native, without a separate JavaScript clear command, private UIKit API, or timeout. Keyboard and input-method behavior still needs device testing; the fallback does not provide the same atomic operation.

The component is intentionally single-line. It does not expose controlled `value`, `onChangeText`, multiline input, or selection control. Your app provides the send button, attachments, message history, and keyboard-aware layout.

If you are migrating from a local copy of this module, remove it before installing the package and rebuild the app. Two native modules named `MessageInput` cannot be installed together.

## Development

Use Node.js 24 or newer supported by Vitest, then install dependencies and run the checks with your preferred package manager:

| Package manager | Install dependencies | Run checks       |
| --------------- | -------------------- | ---------------- |
| npm             | `npm install`        | `npm run check`  |
| Yarn            | `yarn install`       | `yarn run check` |
| pnpm            | `pnpm install`       | `pnpm run check` |
| Bun             | `bun install`        | `bun run check`  |

The checks run TypeScript, Prettier, and Vitest. Preview the published files with `npm pack --dry-run`.

[example/composer.tsx](https://github.com/Truckroute-inc/react-native-message-input/blob/main/example/composer.tsx) is a component you can mount in an Expo development app, not a standalone example app. To test the packaged module, create a tarball with `npm pack`, install it in that app, and rebuild iOS.

Automated checks cover TypeScript, formatting, and fallback submission behavior. They do not validate the native keyboard. Before a release, verify on a device:

- Pending autocorrection with both the external Send button and keyboard Send key: one corrected message, an empty field, and the keyboard still open.
- A cursor in the middle of text, emoji, pasted text, English/Russian keyboards, and marked-text input such as Japanese.
- Empty and disabled submissions, `clear()`, `focus()`, maximum length, and a new draft surviving completion or failure of a previous send.
- Placeholder, accessibility, light/dark appearance, and Android/web fallback behavior.

### Publishing

After completing the device checks above, update the version in `package.json` and verify the package contents with `npm pack --dry-run`. Publish from the repository with an npm account that has access to the `@truckroute` scope:

```sh
npm publish
```

`publishConfig` targets the public npm registry with public access. The `prepublishOnly` hook runs the repository checks before publication. It does not run when someone installs the package. The podspec reads the version from `package.json`.

## Feedback

Report bugs and request features in [GitHub Issues](https://github.com/Truckroute-inc/react-native-message-input/issues). For keyboard issues, include the platform and OS version, Expo / React Native versions, keyboard language, autocorrection settings, and steps to reproduce.

## License

[MIT](./LICENSE) © Truckroute inc.
