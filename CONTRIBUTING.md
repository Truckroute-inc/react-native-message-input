# Contributing

## Local development

Use Node.js 24 or newer supported by Vitest, then install dependencies and run the checks with your preferred package manager:

| Package manager | Install dependencies | Run checks       |
| --------------- | -------------------- | ---------------- |
| npm             | `npm install`        | `npm run check`  |
| Yarn            | `yarn install`       | `yarn run check` |
| pnpm            | `pnpm install`       | `pnpm run check` |
| Bun             | `bun install`        | `bun run check`  |

The checks run TypeScript, ESLint with zero warnings, Prettier, and Vitest. Run `npm run lint` for lint alone or `npm run lint:fix` for automatic fixes. Preview the published files with `npm pack --dry-run`.

### Lint rules

The ESLint configuration follows `truck-route-app`: explicit null checks, named conditions, named exports, consistent type imports, no `any`, no non-null assertions, no cyclic imports, and no test imports in production code. Source and example files also prohibit type assertions and CommonJS imports. Type-aware rules check Promise handling and exhaustive switches; React rules check hooks, dependencies, and ref usage.

Tests use the same null-safety and Promise rules. Type assertions are allowed for native event fixtures. Mock modules remain separate from test suites. App-specific route, HTTP-client, and test-filename conventions are not applied to this package.

ESLint 9 is used for compatibility with the Expo preset's React plugin. Lint dependencies are development-only and are not shipped in the npm package. `npm run check` and the prepublish hook both enforce lint.

[example/composer.tsx](https://github.com/Truckroute-inc/react-native-message-input/blob/main/example/composer.tsx) is a component you can mount in an Expo development app, not a standalone example app. To test the packaged module, create a tarball with `npm pack`, install it in that app, and rebuild iOS.

Automated checks cover TypeScript, formatting, standard TextInput prop/ref forwarding, controlled and uncontrolled submission, and the iOS submission bridge. They do not validate the native keyboard. Before a release, verify on a device:

- Pending autocorrection with both the external Send button and keyboard Send key: one corrected message, an empty field, and the keyboard still open.
- A cursor in the middle of text, emoji, pasted text, English/Russian keyboards, and marked-text input such as Japanese.
- Empty submissions and inputs without `onSubmit`, `clear()`, `focus()`, `blur()` preserving the draft, maximum length, and a new draft surviving completion or failure of a previous send.
- Controlled and uncontrolled inputs, multiline newlines and Return submission, selection, placeholder, accessibility, light/dark appearance, and Android/web behavior.
- SDK 52 and the current SDK: install the tarball in a native app, verify autolinking includes the MessageInput pod, and build iOS.

### Publishing

After completing the device checks above, update the version in `package.json` and verify the package contents with `npm pack --dry-run`. Publish from the repository with an npm account that has access to the `@truckroute` scope:

```sh
npm publish
```

`publishConfig` targets the public npm registry with public access. The `prepublishOnly` hook runs the repository checks before publication. It does not run when someone installs the package. The podspec reads the version from `package.json`.
