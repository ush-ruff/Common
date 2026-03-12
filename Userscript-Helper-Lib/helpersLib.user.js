// ==UserScript==
// @name         [ushruffUSKit] Userscript Helper Library
// @namespace    https://github.com/ush-ruff/
// @author       ushruff
// @version      0.4.1
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
const LIB_VERSION = "0.4.1" // Keep in sync with @version above

;(function () {
  // --------------------------------------------------------------------------------
  // Private Functions
  // --------------------------------------------------------------------------------

  // Key handler
  let timers = {}

  function handleKeyDown(e, keyListObj) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.contentEditable === "true") return

    const keyName = normalizeKey(e)

    if (!(keyName in keyListObj)) return

    e.preventDefault()

    if (keyName in timers) return

    timers[keyName] = null
    keyListObj[keyName].action()
    if (keyListObj[keyName].repeat) {
      timers[keyName] = requestAnimationFrame(repeatAnimation.bind(null, keyName, keyListObj[keyName].action))
    }
  }

  function handleKeyUp(e) {
    const keyName = normalizeKey(e)
    if (timers[keyName] != null) cancelAnimationFrame(timers[keyName])
    delete timers[keyName]
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
    timers[keyName] = requestAnimationFrame(repeatAnimation.bind(null, keyName, func))
  }


  // Modal creation
  function insertModalHTML(modalID, keyListObj) {
    const modal = document.createElement("dialog")
    modal.id = modalID

    const modalInner = `
      <div class="${modalID}-header">
        <h2 class="${modalID}-title">Shortcut Keys</h2>
        <span class="${modalID}-close">&times;</span>
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
   * @param {string} element - A CSS selector string
   */
  function focusSelectElement(element) {
    const el = document.querySelector(element)
    if (el === null) return

    el.focus()
    if (typeof el.select === "function") el.select()
  }


  /**
   * Clicks the first matching element from a list of CSS selectors.
   * Tries each selector in order and clicks the first one found.
   * Silently does nothing if no selectors match.
   * @param {...string} elements - One or more CSS selectors tried in order
   */
  function clickElement(...elements) {
    for (const element of elements) {
      const el = document.querySelector(element)

      if (el !== null) {
        el.click()
        return
      }
    }
  }


  /**
   * Registers a global keyboard shortcut handler. Can only be called once per page -
   * subsequent calls are ignored. Shortcuts are suppressed when focus is on an input,
   * textarea, or contenteditable element.
  *
  * Key name format:
  *   - Single chars: uppercase ("F", "A", "?")
  *   - Named keys: title case from e.key ("Escape", "ArrowDown", "Enter")
  *   - F-keys: as-is ("F1", "F5")
  *   - With modifiers: "Ctrl + S", "Shift + ?"
  *
  * @param {Object.<string, {action: Function, label: string, repeat?: boolean}>} keyListObj
  */
  let keyHandlerInstalled = false

  function installKeyHandler(keyListObj) {
    if (keyHandlerInstalled) return
    document.addEventListener("keydown", (e) => {handleKeyDown(e, keyListObj)})
    document.addEventListener("keyup", handleKeyUp)
    keyHandlerInstalled = true
  }


  /**
   * Creates and injects a keyboard shortcut help dialog into the page.
   * Safe to call multiple times - duplicate calls for the same modalID are ignored.
   * Must be called before showShortcutInfo.
   * @param {string} modalID - A unique ID for the modal element
   * @param {Object} keyListObj - The same key map passed to installKeyHandler
   */
  function setupShortcutInfo(modalID, keyListObj) {
    if (document.getElementById(modalID)) return

    insertModalHTML(modalID, keyListObj)
    addStyle(modalID)

    const shortcutModal = document.querySelector(`#${modalID}`)
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
    const shortcutModal = document.querySelector(`#${modalID}`)
    if (!shortcutModal) return
    shortcutModal.showModal()
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
      installKeyHandler,
      setupShortcutInfo,
      showShortcutInfo,
    })
  }
})()
