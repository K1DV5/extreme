let {tempo, state, types, config, turn} = chrome.extension.getBackgroundPage()

// TABS FOR OPTIONS
let pageOpt = document.getElementById('pageOpt')
let customOpt = document.getElementById('preferences')
let configText = document.getElementById('config')
let ytQuality = document.getElementById('yt-quality')
let switchCheck = document.getElementById('switch-data')
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

// TURN ON/OFF
switchCheck.addEventListener('click', () => {
    if (state.saving) {
        turn(false)
        event.target.checked = false
    } else {
        turn(true)
        event.target.checked = true
    }
})

function updateSwitchBoard() {
    let pageOpt = config[currentTabUrl] || config.default  // to be checked later by details.initiator
    for (let widget of checkBoard) {
        widget.checked = pageOpt.includes(widget.id)
    }
}

document.getElementById('settings').addEventListener('change', () => {
    if (event.target.checked) {  // show settings, updated
        switchCheck.checked = state.saving
        configText.value = Object.entries(config)
            .map(([url, opt]) => url + ' ' + types.map(type => Number(opt.includes(type))).join(''))
            .join('\n')
        ytQuality.value = state.ytQuality
    } else {
        updateSwitchBoard()
    }
})

chrome.tabs.query({active: true}, tabs => {
    let url = new URL(tabs[0].url)
    if (['http:', 'https:'].includes(url.protocol)) {
        currentTabId = tabs[0].id
        currentTabUrl = url.origin
        pageOptAtPopup = config[currentTabUrl] || config.default
    } else {
        currentTabUrl = 'default'
        // apply not needed
        document.getElementById('apply').disabled = true
    }
    updateSwitchBoard()
    document.getElementById('origin').innerText = currentTabUrl
})

document.getElementById('apply').addEventListener('click', () => {
    // temporarily set different options
    let allow = types.filter((_, i) => checkBoard[i].checked)
    if (allow.length == pageOptAtPopup.length && allow.every((val, i) => val == pageOptAtPopup[i]))
        return window.close()  // no change
    tempo[currentTabUrl] = allow
    chrome.tabs.reload(currentTabId)
    window.close()
})

document.getElementById('save').addEventListener('click', event => {
    let key = currentTabUrl  // to be checked later in property initiator of details
    config[key] = types.filter((_, i) => checkBoard[i].checked)
    chrome.storage.local.set({config})
    let prevText = event.target.innerText
    event.target.innerText = 'Saved'
    setTimeout(() => event.target.innerText = prevText, 1000)
})

// save button on custom config tab
document.getElementById('save-config').addEventListener('click', event => {
    let toRemove = {}
    for (let url of Object.keys(config)) {
        toRemove[url] = 1
    }
    delete toRemove.default
    let newText = ''
    for (let line of configText.value.split('\n')) {
        if (!line.trim() || line[0] == '#') continue
        let [url, opt] = line.split(' ')
        let origin
        if (url == 'default')
            origin = url
        else try {
            origin = new URL(url).origin
        } catch {continue}
        if (isNaN(opt)) {
            toRemove[origin] = 1
            continue
        }
        config[origin] = types.filter((_, i) => opt[i] == 1)
        delete toRemove[origin]
        newText += line + '\n'
    }
    for (let url of Object.keys(toRemove)) {
        delete config[url]
    }
    let quality = ytQuality.value
    chrome.storage.local.set({config, ytQuality: quality}, () => {
        configText.value = newText
        let prevText = event.target.innerText
        event.target.innerText = 'Saved'
        setTimeout(() => event.target.innerText = prevText, 1000)
        updateSwitchBoard()
        state.ytQuality = quality
    })
})

// make wider for desktop
if (window.screen.orientation && ['landscape-primary', 'portrait-secondary', undefined].includes(window.screen.orientation.type)) {
    document.body.style.width = '22em'
}
