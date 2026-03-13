# Userscript Helper Lib

A lightweight helper library that provides shared utilities for writing reusable and maintainable userscripts - keyboard shortcut handling, DOM helpers, and a shortcut info modal.

---

## How It Works

The library uses a two-part setup:

1. **`helpersLib.user.js`** - The main library. Installed as a standalone userscript, it runs on every page and registers itself on `window` so other scripts can access it.
2. **`helpersBootstrap.js`** - A small loader included in your userscript via `@require`. It retrieves the library at runtime and throws a helpful error (with an auto-redirect to the install page) if the library isn't installed yet.

Your userscript never imports the library directly - it always goes through the bootstrap.

---

## Installation

### Step 1 - Install the main library

Install [`helpersLib.user.js`](./helpersLib.user.js) as a userscript.

> Click the raw file link and your userscript manager should prompt you to install it automatically.

This script runs on every page at `document-start` and exposes the shared utilities.

### Step 2 - Add the bootstrap to your userscript

In your userscript's metadata block, add:

```js
// @require      https://raw.githubusercontent.com/ush-ruff/Common/main/Userscript-Helper-Lib/helpersBootstrap.js
```

### Step 3 - Load the library in your script

At the top of your userscript (before anything else), retrieve the library:

```js
const ushruffUSKit = ensureUSKit.getUSKit()
```

Then destructure whichever utilities you need:

```js
const { registerShortcutKeys, focusSelectElement, clickElement, setupShortcutInfo, showShortcutInfo } = ushruffUSKit
```

---

## Quick Start

Here's a complete working example putting it all together:

```js
// ==UserScript==
// @name         My Script
// @match        https://example.com/*
// @require      https://raw.githubusercontent.com/ush-ruff/Common/main/Userscript-Helper-Lib/helpersBootstrap.js
// ==/UserScript==

const ushruffUSKit = ensureUSKit.getUSKit()
const { registerShortcutKeys, focusSelectElement, clickElement, setupShortcutInfo, showShortcutInfo } = ushruffUSKit

const SCRIPT_ID = "my-script"
const MODAL_ID = "my-shortcuts"

const KEYS = {
  "F": {
    action: () => focusSelectElement("#search"),
    label: "Focus search bar",
  },
  "Enter": {
    action: () => clickElement("#submit-btn", "#confirm-btn"),
    label: "Submit / Confirm",
  },
  "ArrowDown": {
    action: () => console.log("scrolling..."),
    label: "Scroll down",
    repeat: true,
  },
  "?": {
    action: () => showShortcutInfo(MODAL_ID),
    label: "Show this help",
  },
}

registerShortcutKeys(SCRIPT_ID, KEYS)
setupShortcutInfo(MODAL_ID, KEYS)
```

---

## API Reference

### `registerShortcutKeys(scriptID, keyListObj)`

Registers a keyboard shortcut keymap for a userscript. Each script must provide a unique `scriptID` and can only register once per ID - subsequent calls with the same ID are ignored.

Shortcuts are ignored when the user is focused on an `<input>`, `<textarea>`, or any `contenteditable` element.

> **Note:** If two registered scripts bind the same key, a warning is logged to the console. The first script to register the key wins.

**Parameters**

| Parameter    | Type     | Description                                    |
| ------------ | -------- | ---------------------------------------------- |
| `scriptID`   | String   | A unique identifier for your script            |
| `keyListObj` | Object   | Map of key names to their action configuration |

Each entry in `keyListObj` has the following shape:

| Property | Type     | Required | Description                                            |
| -------- | -------- | -------- | ------------------------------------------------------ |
| `action` | Function | Yes      | Called when the key is pressed                         |
| `label`  | String   | Yes      | Description shown in the shortcut help modal           |
| `repeat` | Boolean  | No       | If `true`, the action fires repeatedly while held down |

**Key name format**

Key names are derived from the browser's `e.key` value. Single character keys are uppercased, named keys keep their natural title case, and modifiers are always title case joined by ` + `.

| Key press          | Key name in object   |
| ------------------ | -------------------- |
| `f`                | `"F"`                |
| `?`                | `"?"`                |
| Arrow down         | `"ArrowDown"`        |
| Escape             | `"Escape"`           |
| Enter              | `"Enter"`            |
| Space              | `"Space"`            |
| F5                 | `"F5"`               |
| Shift + ?          | `"Shift + ?"`        |
| Ctrl + Shift + P   | `"Ctrl + Shift + P"` |

> **Note:** Single character keys are always uppercase (`"F"`, `"A"`, `"?"`). Named multi-character keys use the exact title case from `e.key` (`"Escape"`, `"ArrowDown"`, `"Enter"`). Modifier prefixes (`Ctrl`, `Shift`, `Alt`) are always title case.

**Example**

```js
const KEYS = {
  "F": {
    action: () => focusSelectElement("#search"),
    label: "Focus search",
  },
  "ArrowDown": {
    action: () => window.scrollBy(0, 10),
    label: "Scroll down",
    repeat: true,
  },
}

registerShortcutKeys("my-script", KEYS)
```

---

### `focusSelectElement(selector)`

Focuses a DOM element and selects its content. Useful for input fields and textareas.

Silently does nothing if the selector doesn't match any element.

**Parameters**

| Parameter  | Type   | Description           |
| ---------- | ------ | --------------------- |
| `selector` | String | A CSS selector string |

**Returns:** `void`

**Example**

```js
focusSelectElement("#search-input")
```

---

### `clickElement(...selectors)`

Clicks the first element that matches from a list of CSS selectors. Useful when a button might appear under different selectors depending on the page state.

Silently does nothing if none of the selectors match.

**Parameters**

| Parameter     | Type        | Description                               |
| ------------- | ----------- | ----------------------------------------- |
| `...selectors`| `...String` | One or more CSS selectors, tried in order |

**Returns:** `void`

**Example**

```js
// Tries #confirm-btn first, falls back to #ok-btn, then .dialog-accept
clickElement("#confirm-btn", "#ok-btn", ".dialog-accept")
```

---

### `setupShortcutInfo(modalID, keyListObj)`

Creates and injects a keyboard shortcut help dialog into the page. Call this once during initialization, before calling `showShortcutInfo`. Safe to call multiple times — duplicate calls for the same `modalID` are ignored.

The modal is built from the same `keyListObj` passed to `registerShortcutKeys`. It can be closed by clicking the × button or clicking outside the dialog.

> **Note:** The modalID should conform to the ID selector formatting standards in CSS. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/ID_selectors

**Parameters**

| Parameter    | Type   | Description                                       |
| ------------ | ------ | ------------------------------------------------- |
| `modalID`    | String | A unique ID for the modal element                 |
| `keyListObj` | Object | The same key map passed to `registerShortcutKeys` |

**Returns:** `void`

**Example**

```js
setupShortcutInfo("my-shortcuts", KEYS)
```

---

### `showShortcutInfo(modalID)`

Opens the shortcut help dialog. Requires `setupShortcutInfo` to have been called first with the same `modalID`.

**Parameters**

| Parameter | Type   | Description                                 |
| --------- | ------ | ------------------------------------------- |
| `modalID` | String | The ID passed to `setupShortcutInfo`        |

**Returns:** `void`

**Typical usage** - bind it to a key in your `KEYS` map:

```js
const KEYS = {
  "?": {
    action: () => showShortcutInfo("my-shortcuts"),
    label: "Show shortcut help",
  },
}
```

---

### `compareVersions(a, b)`

Compares two semver-style version strings.

**Parameters**

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| `a`       | String | Version string, e.g. `"1.2.3"` |
| `b`       | String | Version string to compare against |

**Returns:** `1` if `a > b`, `-1` if `a < b`, `0` if equal.

**Example**

```js
compareVersions("1.2.0", "1.1.9") // → 1
compareVersions("0.3.4", "0.3.4") // → 0
```

---

## Development Notes

The library is installed as a **separate, standalone userscript** so it can be updated independently of any script that depends on it. This means:

- Bug fixes apply automatically across all your scripts
- New helpers are available without touching individual scripts
- The version check on `window` ensures the newest loaded version always wins

---

## Recommended Userscript Managers

- **Violentmonkey** *(recommended)*
- Tampermonkey
- Greasemonkey

---

## Future Ideas

- Additional DOM helpers
- Page wait / polling utilities
- Mutation observer helpers
- Storage wrappers
- Clipboard helpers
- Notification helper
- Modal UI helper

---

## License

[GNU GPLv3](../LICENSE)
