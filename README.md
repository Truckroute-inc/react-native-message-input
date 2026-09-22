# React Native Message Input

A reusable single-line message composer for React Native and Expo. No application theme,
translations, API client, or chat state is included.

**Status: experimental.** The iOS implementation is being tested against pending keyboard
autocorrection. Package checks do not prove native keyboard behavior; do not treat 0.1.0 as
a verified fix until the device checks below pass. Android and web use React Native's
TextInput and do not implement the iOS atomic submission path.

## Install

Requires Expo SDK 57, React Native 0.86, and React 19. Earlier versions are not tested.
Bare React Native applications must already have Expo Modules configured.

```sh
bun add @truckroute/message-input@github:Truckroute-inc/react-native-message-input
bunx pod-install ios
bunx expo run:ios
```

Pin a commit after testing for reproducible builds by appending `#COMMIT_SHA` to the GitHub
dependency. The package is not yet published to npm. Metro compiles its TypeScript source;
no postinstall scripts or prebuilt JS artifacts are required. Expo autolinks the iOS module.
It does not run inside Expo Go and cannot be introduced through an OTA update alone.

Do not install alongside another native module named `MessageInput`. When migrating from
a local copy, remove that copy in the same change and rebuild the native app.

## Usage

```tsx
import { useRef } from "react";
import { Button, View } from "react-native";
import { MessageInput, type MessageInputRef } from "@truckroute/message-input";

export function Composer({ send }: { send: (text: string) => void }) {
  const input = useRef<MessageInputRef>(null);
  return (
    <View>
      <MessageInput
        ref={input}
        placeholder="Message"
        maxLength={4000}
        onSubmit={send}
        style={{
          height: 48,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderRadius: 12,
        }}
      />
      <Button
        title="Send"
        onPress={() => {
          if (input.current !== null) void input.current.submit();
        }}
      />
    </View>
  );
}
```

The field owns its text. `onSubmit(text)` receives trimmed, nonempty text after the field
is cleared. There is no controlled `value` prop or JS draft required on iOS. Empty submissions
are ignored. `submissionEnabled={false}` blocks submission without disabling editing.
The keyboard Send key and the imperative `submit()` method use the same native operation
on iOS; the keyboard remains open. Clearing happens before the callback, regardless of any
later network result. The caller owns sending, failures, retries, and keyboard layout.

Ref methods `submit()`, `clear()`, and `focus()` return `Promise<void>`.
Appearance props: `style` (container), `textColor`, `placeholderColor`, `fontName`, and
`fontSize`. Also accepts `placeholder`, `maxLength`, `accessibilityLabel`, and `testID`.
This is not a drop-in replacement for every TextInput feature; multiline and controlled
selection are not implemented.

## Native approach

iOS owns a UITextField. Submission finalizes marked text, moves/restores selection to
commit a pending correction, reads the resulting text, and clears it in the same UI-thread
operation. It then emits `onSubmit` to JavaScript. This avoids sending an older JS snapshot
and issuing a separate React Native clear command.

The selection-commit approach follows Telegram's
[applyKeyboardAutocorrection](https://github.com/TelegramMessenger/Telegram-iOS/blob/master/submodules/UIKitRuntimeUtils/Source/UIKitRuntimeUtils/UIViewController%2BNavigation.m#L811).
Telegram uses UITextView; this package's UITextField behavior still requires the device
verification below. No private UIKit API or timeout is used.

## Development and verification

```sh
bun install
bun run check
bun pm pack --destination /tmp
```

`example/composer.tsx` is a usage component to mount in an Expo development app. It is not
a separate configured app. Install the package tarball there and rebuild before testing.

Before releasing, verify on iOS with autocorrection and predictive text enabled:

- Type a misspelling with a selected correction; tap the external Send button. Confirm
  the corrected message is submitted once, the field remains empty, and the keyboard stays open.
- Repeat with the keyboard Send key, a cursor in the middle of the text, emoji, pasted text,
  Russian/English keyboards, and marked-text input such as Japanese.
- Confirm empty/disabled submission does nothing, clear/focus work, and a newly typed message
  survives completion or failure of the previous network request.
- Check placeholder, accessibility, light/dark appearance, and maximum length.
- Separately verify Android/web fallback behavior. It does not claim iOS-equivalent atomicity.

Publishing to npm is a separate release step requiring access to the `@truckroute` scope;
no registry credentials or automatic publish workflow are stored here.
