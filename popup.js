// Load the extension keybinding...
chrome.commands.getAll((commands) => {
    const commandShortcut = commands.find((command) => command.name === "mark-video");
    document.getElementById("current-binding").innerHTML = commandShortcut.shortcut;
});