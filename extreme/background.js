types = ['image', 'script', 'font', 'media'] // what to block, in this order
config = {default: types}  // as a global (in window) what to block

function parseConfig(text) {
    config = {default: types}  // as a global (in window)
    for (let line of text.split('\n')) {
        if (!line.trim() || line[0] == '#') continue
        let [url, opt] = line.split(' ')
        let origin
        if (url == 'default')
            origin = url
        else try {
            origin = new URL(url).origin
        } catch {continue}
        if (isNaN(opt)) opt = '0000'
        config[origin] = types.filter((_, i) => opt[i] !== '1')
    }
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get(['config'], result => {
        if (result.config) parseConfig(result.config)
        else chrome.storage.sync.set({config: ''})
    })

});

tempo = undefined

function reloadWithTempo(opt) {
    tempo = opt
    let reloadCallback = (tabId, details) => {
        if (tempo && tempo.tabId !== tabId || details.status !== 'complete') return
        tempo = undefined
        chrome.tabs.onUpdated.removeListener(reloadCallback)
    }
    chrome.tabs.onUpdated.addListener(reloadCallback)
    chrome.tabs.reload(opt.tabId)
}

let dontBlockNextUrl = undefined  // can be like {url: ..., redirectTo: ...}

// block
function block(details) {
    if (dontBlockNextUrl && details.url == dontBlockNextUrl.url) {
        if (dontBlockNextUrl.redirectTo) {
            dontBlockNextUrl = {url: dontBlockNextUrl.redirectTo}
            return {redirectUrl: dontBlockNextUrl.url}
        }
        dontBlockNextUrl = undefined
        return {cancel: false}
    }
    let opt
    if (tempo && details.tabId == tempo.tabId) {  // set by popup apply button
        opt = tempo.block
    } else {
        opt = config[details.initiator] || config.default
    }
    if (opt.includes(details.type)) {
        if (details.type == 'image') {
            return {redirectUrl: chrome.runtime.getURL('redir/empty.svg')}
        } else if (details.type == 'script') {
            return {redirectUrl: chrome.runtime.getURL('redir/empty.js')}
        }
        return {cancel: true}
    }
    return {cancel: false}
}

turnedOn = true

function turn(on) {
    if (on) {
        chrome.webRequest.onBeforeRequest.addListener(block,
            {urls: ['http://*/*', 'https://*/*']}, ['blocking'])
        turnedOn = true
    } else {
        chrome.webRequest.onBeforeRequest.removeListener(block)
        turnedOn = false
    }
}

turn(true)  // start blocking

// optionally show images on contextmenu
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.dontBlockNextUrl) {
        dontBlockNextUrl = message.dontBlockNextUrl
        sendResponse() // to indicate that what needs to be done here is over
    }
    return true
})
