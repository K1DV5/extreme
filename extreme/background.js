types = ['image', 'script', 'font', 'media'] // what to block, in this order
config = {default: types}  // as a global (in window) what to block
state = {
    saving: true,
    tempo: undefined,  // temporary config, set in popup.js
    allowNextUrl: undefined,  // can be like {url: ..., redirectTo: ...}, set in content.js
    ytQuality: 'tiny',
}


function parseConfig(text) {
    let lastConf = Object.fromEntries(Object.keys(config).map(url => [url, 1]))  // to remove
    delete lastConf.default
    for (let line of text.split('\n')) {
        if (!line.trim() || line[0] == '#') continue
        let [url, opt] = line.split(' ')
        let origin
        if (url == 'default')
            origin = url
        else try {
            origin = new URL(url).origin
        } catch {continue}
        if (isNaN(opt)) opt = '00000'
        config[origin] = types.filter((_, i) => opt[i] !== '1')
        delete lastConf[origin]
    }
    for (let url of Object.keys(lastConf)) {
        delete config[url]
    }
}

// block
function block(details) {
    if (state.allowNextUrl && details.url == state.allowNextUrl.url) {
        if (state.allowNextUrl.redirectTo) {
            state.allowNextUrl = {url: state.allowNextUrl.redirectTo}
            return {redirectUrl: state.allowNextUrl.url}
        }
        state.allowNextUrl = undefined
        return
    }
    let opt
    if (state.tempo && details.tabId == state.tempo.tabId) {  // set by popup apply button
        opt = state.tempo.block
    } else {
        opt = config[details.initiator] || config.default
    }
    if (!opt.includes(details.type)) return
    if (details.type == 'image') {
        return {redirectUrl: chrome.runtime.getURL('redir/empty.svg')}
    } else if (details.type == 'script') {
        return {redirectUrl: chrome.runtime.getURL('redir/empty.js')}
    }
    return {cancel: true}
}

function saveDataHeader(details) {  // add Save-Data: on header
    return {requestHeaders: [...details.requestHeaders, {name: 'Save-Data', value: 'on'}]}
}

function turn(on) {
    if (on) {
        chrome.webRequest.onBeforeRequest.addListener(block,
            {urls: ['http://*/*', 'https://*/*']}, ['blocking'])
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

// MESSAGING WITH PAGE CONTEXT SCRIPTS
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.allowNextUrl) { // optionally show images on contextmenu
        state.allowNextUrl = message.allowNextUrl
        sendResponse() // to indicate that what needs to be done here is over
    } else if (message == 'ytQuality') {  // get the desired default youtube playback quality
        sendResponse(state.ytQuality)
    }
    return true
})
