// ==UserScript==
// @name         [ushruffUSKit] Userscript Helper Library
// @namespace    https://github.com/ush-ruff/
// @author       ushruff
// @version      0.7.0
// @description  Shared helper library for userscripts
// @match        *://*/*
// @icon
// @homepageURL  https://github.com/ush-ruff/Common/
// @downloadURL  https://github.com/ush-ruff/Common/raw/main/Userscript-Helper-Lib/helpersLib.user.js
// @grant        none
// @license      GNU GPLv3
// @run-at       document-start
// ==/UserScript==

'use strict'

const LIB_NAME = "ushruffUSKit"
const LIB_VERSION = "0.7.0" // Keep in sync with @version above

;(function () {
  // --------------------------------------------------------------------------------
  // Private Functions
  // --------------------------------------------------------------------------------

  // Key handler
  let timers = new Map()
  const keyMaps = new Map()
  let keyHandlerInstalled = false

  function handleKeyDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.contentEditable === "true") return

    const keyName = normalizeKey(e)

    for (const [, keyListObj] of keyMaps) {
      if (!(keyName in keyListObj)) continue

      e.preventDefault()

      if (timers.has(keyName)) return

      const { action, repeat } = keyListObj[keyName]
      timers.set(keyName, null)
      action()

      if (repeat) {
        timers.set(keyName, requestAnimationFrame(repeatAnimation.bind(null, keyName, action)))
      }

      return
    }
  }

  function handleKeyUp(e) {
    const keyName = normalizeKey(e)
    if (!timers.has(keyName)) return
    if (timers.get(keyName) != null) cancelAnimationFrame(timers.get(keyName))
    timers.delete(keyName)
  }

  function normalizeKey(e) {
    const parts = []
    if (e.ctrlKey) parts.push("Ctrl")
    if (e.shiftKey) parts.push("Shift")
    if (e.altKey) parts.push("Alt")

    // Single character keys are uppercased (e.g. "f" → "F")
    // Named keys keep their natural title case from e.key (e.g. "ArrowDown", "Escape")
    // F-keys kept as-is (e.g. "F1", "F5")
    // Space mapped to a readable label
    let keyText = e.key
    if (keyText === " ") keyText = "Space"
    else if (keyText.length === 1) keyText = keyText.toUpperCase()

    parts.push(keyText)
    return parts.join(" + ")
  }

  function repeatAnimation(keyName, func) {
    func()
    timers.set(keyName, requestAnimationFrame(repeatAnimation.bind(null, keyName, func)))
  }


  // Modal creation
  function insertModalHTML(modalID, keyListObj) {
    const modal = document.createElement("dialog")
    modal.id = modalID

    const modalInner = `
      <div class="${modalID}-header">
        <h2 class="${modalID}-title">Shortcut Keys</h2>
        <span class="${modalID}-close" data-custom-modal-close>&times;</span>
      </div>
    `
    modal.innerHTML = modalInner

    const keyList = document.createElement("ul")

    Object.entries(keyListObj).forEach(([key, {label}]) => {
      const listItem = document.createElement("li")

      const shortcutInfo = document.createElement("span")
      shortcutInfo.textContent = label
      listItem.appendChild(shortcutInfo)

      const shortcutKey = document.createElement("code")
      shortcutKey.classList.add("shortcut-key")
      shortcutKey.textContent = key
      listItem.appendChild(shortcutKey)

      keyList.appendChild(listItem)
    })

    modal.appendChild(keyList)
    document.body.appendChild(modal)
  }

  function addStyle(modalID) {
    const styleSheet = document.createElement("style")

    styleSheet.textContent = `
      #${modalID} {
        min-width: 700px;
        padding: 1rem;
        background: #1f1f1f;
        border: unset;
        border-radius: 0.5rem;
        color: #b9b9b9;
        box-shadow: 0 0 10px 2px rgb(0 0 0 / 0.5);
        outline: none;
      }

      #${modalID}::backdrop {
        background: rgb(0 0 0 / 0.75);
      }

      .${modalID}-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-inline: 1rem;
        border-bottom: 1px solid #333;
      }

      #${modalID} .${modalID}-title {
        font-size: 1.4rem;
        font-weight: 600;
        padding-block: 0.8rem;
        border: unset;
        color: #ccc;
      }

      .${modalID}-close {
        font-size: 2rem;
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;

        &:is(:hover, :focus) {
          border: none;
          color: #f2f2f2;
        }
      }

      #${modalID} ul {
        margin: 0.75rem 1.2rem 0;
        padding: 0;
      }

      #${modalID} li {
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8rem;
        padding-block: 0.75rem;
        color: #b9b9b9;

        &:not(:last-child) {
          border-bottom: 1px solid #333;
        }
      }

      .shortcut-key {
        min-width: 120px;
        font-family: "Overpass Mono", Monospace;
        text-align: center;
        line-height: 2;
        background: #282828;
        border-radius: 0.2rem;
        color: #ccc;
      }
    `
    document.head.append(styleSheet)
  }


  // --------------------------------------------------------------------------------
  // Public API Functions
  // --------------------------------------------------------------------------------

  /**
   * Compares two semver-style version strings.
   * @param {string} a - First version string e.g. "1.2.3"
   * @param {string} b - Second version string e.g. "1.1.0"
   * @returns {1 | -1 | 0} 1 if a > b, -1 if a < b, 0 if equal
   */
  function compareVersions(a, b) {
    const pa = a.split(".").map(Number)
    const pb = b.split(".").map(Number)

    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] ?? 0
      const nb = pb[i] ?? 0
      if (na > nb) return 1
      if (na < nb) return -1
    }
    return 0
  }


  /**
 * Focuses a DOM element and selects its content if supported.
 * Silently does nothing if the selector matches no element.
 *
 * **Basic mode** — focuses the first element matching `selector`:
 * ```js
 * focusSelectElement('input#username')
 * ```
 *
 * **Cycling mode** — pass a persistent `state` object to step through all
 * matching elements in sequence, cycling back around at either end:
 * ```js
 * const state = {}
 * document.addEventListener('keydown', (e) => {
 *   if (e.key === 'Tab' && e.shiftKey) focusSelectElement('input, button', state, 'prev')
 *   else if (e.key === 'Tab')          focusSelectElement('input, button', state)
 * })
 * ```
 *
 * @param {string} selector - A CSS selector string.
 * @param {{ list?: Element[], index?: number }} [state] - Optional persistent
 *   state object for cycling mode. 
 *   `list` is lazily populated on the first call.
 *   `index` tracks the next element to focus. Omit for basic single-element mode.
 * @param {'next'|'prev'} [direction='next'] - Direction to cycle through elements.
 *   Only relevant when `state` is provided.
 */
function focusSelectElement(selector, state, direction = 'next') {
  if (!state) {
    const el = document.querySelector(selector)
    if (el === null) return

    el.focus()
    if (typeof el.select === "function") el.select()
    return
  }

  const elements = state.list ??= Array.from(document.querySelectorAll(selector))
  if (!elements.length) return

  const step = direction === 'prev' ? -1 : 1
  const base = state.index ?? (direction === 'prev' ? elements.length : -1)
  const index = (base + step + elements.length) % elements.length

  state.index = index
  elements[index].focus()
  if (typeof elements[index].select === "function") elements[index].select()
}


  /**
   * Clicks the first matching element from a list of CSS selectors.
   * Tries each selector in order and clicks the first one found.
   * Silently does nothing if no selectors match.
   * @param {...string} selectors - One or more CSS selectors tried in order
   */
  function clickElement(...selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector)

      if (el !== null) {
        el.click()
        return
      }
    }
  }


  /**
   * Registers a keyboard shortcut keymap for a userscript.
   * Each script must provide a unique ID and can only register once.
   * If a duplicate ID is used, the registration is ignored.
   *
   * Key name format:
   *   - Single chars: uppercase ("F", "A", "?")
   *   - Named keys: title case from e.key ("Escape", "ArrowDown", "Enter")
   *   - F-keys: as-is ("F1", "F5")
   *   - With modifiers: "Ctrl + S", "Shift + ?"
   *
   * @param {string} scriptID - Unique identifier for the script registering shortcuts
   * @param {Object.<string, {action: Function, label: string, repeat?: boolean}>} keyListObj
   */
  function registerShortcutKeys(scriptID, keyListObj) {
    if (keyMaps.has(scriptID)) return

    // Conflict detection
    for (const [existingID, existingMap] of keyMaps) {
      for (const key of Object.keys(keyListObj)) {
        if (key in existingMap) {
          console.warn(`[${LIB_NAME}] Shortcut conflict detected for "${key}" between "${existingID}" and "${scriptID}".`)
        }
      }
    }

    keyMaps.set(scriptID, keyListObj)

    if (!keyHandlerInstalled) {
      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("keyup", handleKeyUp)
      keyHandlerInstalled = true
    }
  }


  /**
   * Creates and injects a keyboard shortcut help dialog into the page.
   * Safe to call multiple times - duplicate calls for the same modalID are ignored.
   * Must be called before showShortcutInfo.
   *
   * The modalID should conform to the ID selector formatting standards in CSS.
   * https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/ID_selectors
   *
   * @param {string} modalID - A unique ID for the modal element
   */
  function setupShortcutInfo(modalID, keyListObj) {
    if (document.getElementById(modalID)) return

    insertModalHTML(modalID, keyListObj)
    addStyle(modalID)

    const shortcutModal = document.getElementById(modalID)
    const closeBtn = shortcutModal.querySelector(`.${modalID}-close`)
    closeBtn.addEventListener("click", () => {shortcutModal.close()})

    document.addEventListener("click", (event) => {
      if (event.target === shortcutModal) shortcutModal.close()
    })
  }


  /**
   * Opens the shortcut help dialog.
   * Requires setupShortcutInfo to have been called first with the same modalID.
   * @param {string} modalID - The ID passed to setupShortcutInfo
   */
  function showShortcutInfo(modalID) {
    const shortcutModal = document.getElementById(modalID)
    if (!shortcutModal) return
    shortcutModal.showModal()
  }


  /**
   * Polls the DOM at 100ms intervals until an element matching `selector` appears and resolves with it.
   * Rejects with an error if the element does not appear within `timeout` milliseconds.
   * @param {string} selector - A CSS selector string
   * @param {number} [timeout=5000] - Maximum wait time in milliseconds
   * @returns {Promise<Element>}
   */
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now()

      const interval = setInterval(() => {
        const element = document.querySelector(selector)

        if (element) {
          clearInterval(interval)
          resolve(element)
        } else if (Date.now() - start > timeout) {
          clearInterval(interval)
          reject(new Error(`Element not found: ${selector}`))
        }
      }, 100)
    })
  }


  // --------------------------------------------------------------------------------
  // Register exports
  // --------------------------------------------------------------------------------
  window[LIB_NAME] ??= {}
  const existingVersion = window[LIB_NAME].version

  if (!existingVersion || compareVersions(LIB_VERSION, existingVersion) > 0) {
    Object.assign(window[LIB_NAME], {
      version: LIB_VERSION,
      compareVersions,
      focusSelectElement,
      clickElement,
      registerShortcutKeys,
      setupShortcutInfo,
      showShortcutInfo,
      waitForElement,
    })
  }
})()
