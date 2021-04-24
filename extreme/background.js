types = ['script', 'image', 'font', 'media'] // what to block, in this order
config = {default: []}  // as a global (in window) what to block
tempo = {}  // config for session only, takes precedence over config
state = {
    saving: true,
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

const listenerOpts = {urls: ['http://*/*', 'https://*/*'], types}

function turn(on) {
    if (on) {
        chrome.webRequest.onBeforeRequest.addListener(block, listenerOpts, ['blocking'])
        chrome.webRequest.onBeforeSendHeaders.addListener(saveDataHeader,
            listenerOpts, ['blocking', 'requestHeaders'])
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
    let requestId
    let tempBlock = details => {
        if (details.requestId == requestId) {
            return  // allow
        }
        if (details.url == url) {
            requestId = details.requestId
            return
        }
        // as normal for other requests
        return block(details)
    }
    chrome.webRequest.onBeforeRequest.addListener(tempBlock, listenerOpts, ['blocking'])
    chrome.webRequest.onBeforeRequest.removeListener(block)
    let cleanup = details => {
        if (details.requestId != requestId) {
            return
        }
        chrome.webRequest.onBeforeRequest.removeListener(tempBlock)
        chrome.webRequest.onCompleted.removeListener(cleanup)
        chrome.webRequest.onErrorOccurred.removeListener(cleanup)
        chrome.webRequest.onBeforeRedirect.removeListener(handleRedirect)
        chrome.webRequest.onBeforeRequest.addListener(block, listenerOpts, ['blocking'])
    }
    let handleRedirect = details => {  // to handle redirects to data: urls
        if (details.requestId == requestId && new URL(details.redirectUrl).protocol == 'data:') {
            cleanup(details)
        }
    }
    chrome.webRequest.onBeforeRedirect.addListener(handleRedirect, listenerOpts)
    chrome.webRequest.onCompleted.addListener(cleanup, listenerOpts)
    chrome.webRequest.onErrorOccurred.addListener(cleanup, listenerOpts)
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
