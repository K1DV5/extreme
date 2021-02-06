let {state, types, config, parseConfig, turn} = chrome.extension.getBackgroundPage()

// TABS FOR OPTIONS
let pageOpt = document.getElementById('pageOpt')
let customOpt = document.getElementById('preferences')

let configText = document.getElementById('config')

document.getElementById('pageOptTab').addEventListener('click', () => {
    document.body.style.width = '16em'
    pageOpt.style.display = 'block'
    customOpt.style.display = 'none'
})

document.getElementById('prefTab').addEventListener('click', () => {
    document.body.style.width = '28em'
    pageOpt.style.display = 'none'
    customOpt.style.display = 'block'
    // show current config
    configText.value = Object.entries(config)
        .map(([url, opt]) => url + ' ' + types.map(type => Number(!opt.includes(type))).join(''))
        .join('\n')
})

// TURN ON/OFF
let switchCheck = document.getElementById('switch-data')
switchCheck.checked = state.saving
switchCheck.addEventListener('click', () => {
    if (state.saving) {
        turn(false)
        event.target.checked = false
    } else {
        turn(true)
        event.target.checked = true
    }
})

// PAGE OPTS
let checkBoard = [
    document.getElementById('image'),
    document.getElementById('script'),
    document.getElementById('font'),
    document.getElementById('media'),
]

let currentTabUrl
// state of the config for the page when the popup was opened
let pageOptAtPopup
let currentTabId


function updateSwitchBoard() {
    if (['http:', 'https:'].includes(currentTabUrl.protocol)) {
        let pageOpt = config[currentTabUrl.origin] || config.default  // to be checked later by details.initiator
        for (let widget of checkBoard) {
            widget.checked = !pageOpt.includes(widget.id)
        }
    } else {  // hide irrelevant parts
        document.getElementById('pageOptTab').style.display = 'none'
        document.getElementById('pageOpt').style.display = 'none'
    }
}

chrome.tabs.query({active: true}, tabs => {
    currentTabId = tabs[0].id
    currentTabUrl = new URL(tabs[0].url)
    pageOptAtPopup = config[currentTabUrl.origin] || config.default
    updateSwitchBoard()
})

document.getElementById('apply').addEventListener('click', () => {
    // temporarily set different options
    let block = types.filter((_, i) => !checkBoard[i].checked)
    if (block.length == pageOptAtPopup.length && block.every((val, i) => val == pageOptAtPopup[i]))
        return window.close()  // no change
    state.tempo = {tabId: currentTabId, block}
    let reloadCallback = (tabId, details) => {
        if (state.tempo && state.tempo.tabId !== tabId || details.status !== 'complete') return
        state.tempo = undefined
        chrome.tabs.onUpdated.removeListener(reloadCallback)
    }
    chrome.tabs.onUpdated.addListener(reloadCallback)
    chrome.tabs.reload(state.tempo.tabId)
    window.close()
})


document.getElementById('save').addEventListener('click', event => {
    let key = currentTabUrl.origin  // to be checked later in property initiator of details
    config[key] = types.filter((_, i) => !checkBoard[i].checked)
    chrome.storage.local.set({config})
    let prevText = event.target.innerText
    event.target.innerText = 'Saved'
    setTimeout(() => event.target.innerText = prevText, 1000)
})

// save button on custom config tab
document.getElementById('save-config').addEventListener('click', event => {
    parseConfig(configText.value)
    // {url: ['images', ...]} => 'url 01000'
    let newText = Object.entries(config)
        .map(([url, opt]) => url + ' ' + types
            .map(type => Number(!opt.includes(type))).join(''))
        .join('\n')
    chrome.storage.local.set({config}, () => {
        configText.value = newText
        let prevText = event.target.innerText
        event.target.innerText = 'Saved'
        setTimeout(() => event.target.innerText = prevText, 1000)
        updateSwitchBoard()
    })
})


// YouTube quality

let qualitySelector = document.getElementById('yt-quality')

qualitySelector.value = state.ytQuality

qualitySelector.addEventListener('change', () => {
    let quality = event.target.value
    chrome.storage.local.set({ytQuality: quality}, () => {
        state.ytQuality = quality
    })
})
