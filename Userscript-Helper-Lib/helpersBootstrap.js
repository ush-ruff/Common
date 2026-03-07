const LIB_INSTALL_URL = "https://raw.githubusercontent.com/ush-ruff/Common/main/Userscript-Helper-Lib/helpersLib.user.js"

;(function () {
  
  function getUSKit() {
    const helpersLib = window.ushruffUSKit
    
    if (!helpersLib) {
      console.error(
        `The installed script requires ushrufUSKit library.\n` +
        `Install the script and refresh the current tab.\n` +
        `If the script does not automatically redirect you, visit:\n${LIB_INSTALL_URL}\n` +
        `Ensure the library runs before the current script.`
      )
      window.open(LIB_INSTALL_URL, "_blank", "noopener")
      throw new Error("ushruffUSKit library missing")
    }
    
    return helpersLib
  }
  
  window.ensureUSKit ??= {}

  Object.assign(window.ensureUSKit, {
    getUSKit,
  })

})()
