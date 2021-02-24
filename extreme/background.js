types = ['script', 'image', 'font', 'media'] // what to block, in this order
config = {default: []}  // as a global (in window) what to block
tempo = {}  // config for session only, takes precedence over config
state = {
    saving: true,
    allowNextUrl: undefined,  // can be like {url: ..., redirectTo: ...}, set in content.js
    ytQuality: 'tiny',
}

let imagePlaceholderOpt = {redirectUrl: chrome.runtime.getURL('redir/empty.svg')}
function block(details) {
    let opt = tempo[details.tabId + details.initiator] || config[details.initiator] || config.default
    if (opt.includes(details.type)) return
    if (details.type == 'image') {
        return imagePlaceholderOpt
    }
    return {cancel: true}
}

function saveDataHeader(details) {  // add Save-Data: on header
    return {requestHeaders: [...details.requestHeaders, {name: 'Save-Data', value: 'on'}]}
}

function turn(on) {
    if (on) {
        chrome.webRequest.onBeforeRequest.addListener(block,
            {urls: ['http://*/*', 'https://*/*'], types}, ['blocking'])
        chrome.webRequest.onBeforeSendHeaders.addListener(saveDataHeader,
            {urls: ['http://*/*', 'https://*/*']}, ['blocking', 'requestHeaders'])
        state.saving = true
    } else {
        chrome.webRequest.onBeforeRequest.removeListener(block)
        chrome.webRequest.onBeforeSendHeaders.removeListener(block)
        state.saving = false
    }
}

// load configuration
chrome.storage.local.get(['config', 'ytQuality'], result => {
    if (result.config) config = result.config
    if (result.ytQuality) state.ytQuality = result.ytQuality
    turn(true)  // start blocking
})

function allowNextUrl(url) {
    let allowUrl = url
    let requestId
    let tempBlock = details => {
        if (details.url != allowUrl) {
            return {cancel: true}
        }
        requestId = details.requestId
    }
    chrome.webRequest.onBeforeRequest.addListener(tempBlock, {urls: [url], types}, ['blocking'])
    chrome.webRequest.onBeforeRequest.removeListener(block)
    let updateAllow = details => {
        if (details.requestId == requestId) {
            allowUrl = details.redirectUrl
        }
    }
    chrome.webRequest.onBeforeRedirect.addListener(updateAllow, {urls: ['http://*/*', 'https://*/*'], types: ['image']})
    let finish = details => {
        if (details.requestId != requestId) {
            return
        }
        chrome.webRequest.onBeforeRequest.removeListener(tempBlock)
        chrome.webRequest.onBeforeRedirect.removeListener(updateAllow)
        chrome.webRequest.onCompleted.removeListener(finish)
        chrome.webRequest.onErrorOccurred.removeListener(finish)
        chrome.webRequest.onBeforeRequest.addListener(block,
            {urls: ['http://*/*', 'https://*/*'], types}, ['blocking'])
    }
    chrome.webRequest.onCompleted.addListener(finish, {urls: ['http://*/*', 'https://*/*'], types: ['image']})
    chrome.webRequest.onErrorOccurred.addListener(finish, {urls: ['http://*/*', 'https://*/*'], types: ['image']})
}

// MESSAGING WITH PAGE CONTEXT SCRIPTS
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.allowNextUrl) { // optionally show images on contextmenu
        allowNextUrl(message.allowNextUrl)
        sendResponse() // to indicate that what needs to be done here is over
    } else if (message == 'ytQuality') {  // get the desired default youtube playback quality
        sendResponse(state.ytQuality)
    }
    return true
})
