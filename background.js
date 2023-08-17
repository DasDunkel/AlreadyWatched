/**
 * Already Watched
 * Version 1.0
 * Created: 8/15/2023
 * Last Update: 8/16/2023
 *
 * A V8 Engine (Chrome) extension that allows you to easily mark videos as Already Watched.
 * Intended design is:
 *  1 - Hover mouse over video thumbnail.
 *  2 - Press hotkey.
 *  3 - Video is now marked as already watched.
 *
 */
console.log("%cLoaded service worker for AlreadyWatched", "font-weight: bold; font-size: 18px;")
let MOUSE_X, MOUSE_Y;

/**
 * Basic style injection
 */
const injectStyles = (tab) => {
    console.log("Injecting CSS")
    chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["./css/inject.css"],
    });
    injectRootCSSVariables(tab)
}

/**
 * Update the CSS variables in the root element.
 */
const injectRootCSSVariables = (tab) => {
    console.log("%cInjecting CSS variables...", "color: #FFA707")
    chrome.commands.getAll((commands) => {
        const hotkey = commands.find(key => key.name === 'mark-video').shortcut
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [hotkey],
            func: (_hotkey) => {
                document.querySelector(":root").style.setProperty("--not-interested-hotkey", `'${_hotkey}'`);
            }
        })
    })
    console.log("%cSuccessfully injected CSS variables.", "color: #00dd00")
}

/**
 * Anything here will be injected and executed in the browser tab.
 * All variables & functions must be scoped to this function.
 */
async function markVideoAsNotInterested() {
    const PLAYLIST_THUMBNAIL = "ytd-playlist-video-renderer";
    const THUMBNAIL_TYPES = [
        "ytd-rich-item-renderer", // Thumbnail details section
        "ytd-compact-video-renderer", // Video on the sidebar
        "ytd-compact-playlist-renderer", // Mix on the sidebar
        "ytd-compact-radio-renderer", // Mix variant on the sidebar
        PLAYLIST_THUMBNAIL, // Video in a playlist (on watch later)
    ]
    const tryGetVideoThumbnail = () => {
        if(document.querySelector('#dismissed-content:hover'))
            return null
        const tryFromHover = () => {
            for(const querySelector of THUMBNAIL_TYPES) {
                const hovered = document.querySelector(querySelector + ":hover")
                if(hovered) return hovered
            }
            console.log("Could not find video using hover strategy.")
        }
        return tryFromHover()
    }
    // Get the element that is currently being hovered.
    const videoThumbnail = tryGetVideoThumbnail()

    // ### If there is a video, find the "Not Interested" button.
    if (videoThumbnail) {
        console.log("Marking video", videoThumbnail);
        // Open the Iron dropdown container by clicking the hamburger button
        const dropdownBtn = videoThumbnail.querySelector("button.yt-icon-button");
        if (dropdownBtn)
            dropdownBtn.click();
        else {
            console.log("No dropdown button found.");
            return; // If there isn't a dropdown button, exit;
        }

        setTimeout(() => {
            // Now a popup menu will appear under the ytd-popup-container.
            // The "Not Interested" button will be in this container in a element named ytd-menu-service-item-renderer...
            // Click "Not Interested" button.
            const popupButtons = document.querySelectorAll("ytd-popup-container ytd-menu-service-item-renderer, tp-yt-iron-dropdown ytd-menu-service-item-renderer");
            let targetButton = null;
            const shouldRemoveInstead = videoThumbnail.matches(PLAYLIST_THUMBNAIL);
            for (let popupBtn of popupButtons) {
                // Check if the button contains the text "Not Interested"
                const targetText = shouldRemoveInstead ? "REMOVE FROM" : "NOT INTERESTED";
                const popupBtnString = popupBtn.querySelector("yt-formatted-string");
                console.log("Popup button string", popupBtnString.innerHTML)
                if (popupBtnString.innerHTML.toUpperCase().includes(targetText)) {
                    targetButton = popupBtn;
                    break;
                }
            }

            // If we found a "Not interested" button, click it.
            if (targetButton)
                targetButton.click();
        }, 10);

        // click the "Tell us why" button
        setTimeout(() => {
            const tellBtns = videoThumbnail.getElementsByTagName("button");
            for (let tellBtn of tellBtns) {
                if (tellBtn.innerHTML.toLocaleUpperCase().includes("TELL US WHY")){
                    tellBtn.click();
                }
            }
        }, 10);

        // click the "I've Already Watched" button
        setTimeout(() => {
            const dismissBtns = document.getElementsByTagName("yt-formatted-string");
            for (let dismissBtn of dismissBtns) {
                if (dismissBtn.innerHTML.toLocaleUpperCase().includes("I'VE ALREADY WATCHED THE VIDEO")){
                    dismissBtn.click();
                }
            }
        }, 250);

        // Click the "submit" button
        setTimeout(() => {
            const submitBtns = document.getElementsByTagName("button");
            for (let submitBtn of submitBtns) {
                if (submitBtn.innerHTML.toLocaleUpperCase().includes("SUBMIT")){
                    submitBtn.click();
                }
            }
        }, 250);
        
    }
}

chrome.commands.onCommand.addListener(async (command) => {
    // Check if the command is "Mark Video"
    if (command === "mark-video") {
        // Get the active tab and execute code...
        let tabList = await chrome.tabs.query({active: true, currentWindow: true});
        console.log("Tab list", tabList)
        const validTab = tabList[0]
        if(!validTab) {
            console.warn("No valid tab found.")
            return;
        }
        chrome.scripting.executeScript({
            target: { tabId: validTab.id },
            func: markVideoAsNotInterested,
        });
    }
});

const onLaunch = async () => {
    let tabList = await chrome.tabs.query({active: true, currentWindow: true});
    const validTab = tabList[0]
    if(!validTab) {
        console.warn("No valid tab found.")
        return;
    }
    injectStyles(validTab)
}

const onUpdated = () => {
    console.log("Updated")
    onLaunch()
}

const onActivated = () => {
    console.log("Activated")
    onLaunch()
}

const onCreated = () => {
    console.log("Created")
    onLaunch()
}

chrome.tabs.onUpdated.addListener(onUpdated);
chrome.tabs.onActivated.addListener(onActivated);
chrome.tabs.onCreated.addListener(onCreated);
