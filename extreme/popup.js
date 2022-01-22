const switchCheck = document.getElementById('switch-data')
// the current tab info
let currentTabDomain
let currentTabId
// PAGE OPTS
const checkBoard = document.querySelectorAll('#pageOpt input[type=checkbox]')
// state of the config for the page when the popup was opened
let config = {default: ''}
let sessionConf = {}
let pageOptInit  // checked when clicking apply
// config textarea
const configText = document.getElementById('config')

// TURN ON/OFF
switchCheck.addEventListener('change', event => {
    let message = switchCheck.checked ? 'switchOn' : 'switchOff'
    chrome.runtime.sendMessage(message, state => switchCheck.checked = state)
})

function updateSwitchBoard() {
    let pageOpt = config[currentTabDomain] || config.default
    for (let widget of checkBoard) {
        widget.checked = pageOpt.includes(widget.id[0])
    }
}

async function init() {
    chrome.runtime.sendMessage('state', state => {
        switchCheck.checked = state
    })
    let currentTab = (await chrome.tabs.query({active: true}))[0]
    if (currentTab?.url) {  // don't need tabs permission, so don't need to check protocol
        let url = new URL(currentTab.url)
        currentTabId = currentTab.id
        currentTabDomain = url.hostname
    } else {
        currentTabDomain = 'default'
    }
    chrome.runtime.sendMessage('config', conf => {
        config = conf.dynamic
        sessionConf = conf.session
        updateSwitchBoard()
        // show loaded outside of config
        let check = ' ' + String.fromCharCode(10003) // U+2713
        let pageSessionOpt = sessionConf[currentTabDomain] || ''
        pageOptInit = pageSessionOpt || config[currentTabDomain] || config.default
        if (pageSessionOpt.length) {
            for (let widget of checkBoard) {
                if (pageSessionOpt.includes(widget.id[0])) {
                    widget.labels[0].innerText += check
                }
            }
        }
    })
    document.getElementById('domain').innerText = currentTabDomain
    if (currentTabDomain.endsWith('youtube.com')) {
        chrome.tabs.sendMessage(currentTabId, 'ytQuality', undefined, quality => {
            if (chrome.runtime.lastError) return
            let ytQualitySel = document.getElementById('yt-quality')
            document.getElementById('yt').style.display = ''
            ytQualitySel.value = quality
            ytQualitySel.addEventListener('change', () => {
                chrome.tabs.sendMessage(currentTabId, {type: 'ytQuality', value: ytQualitySel.value}, undefined, ytQuality => {
                    ytQualitySel.value = ytQuality
                })
            })
        })
    }
}

document.getElementById('settings').addEventListener('change', event => {
    if (event.target.checked) {  // show settings, updated
        configText.value = Object.entries(config).map(pair => pair.join(' ')).join('\n')
    } else {
        updateSwitchBoard()
    }
})

document.getElementById('apply').addEventListener('click', () => {
    // temporarily set different options
    let allow = Array.from(checkBoard).filter(c => c.checked).map(c => c.id[0]).join('')
    if (currentTabDomain == 'default' || allow == pageOptInit || !switchCheck.checked)
        return window.close()  // no change
    chrome.runtime.sendMessage({type: 'setSessConf', domain: currentTabDomain, tabId: currentTabId, opts: allow}, () => {
        chrome.tabs.reload(currentTabId)
        window.close()
    })
})

document.getElementById('save').addEventListener('click', event => {
    let key = currentTabDomain  // to be checked later in property initiator of details
    let newConf = Array.from(checkBoard).filter(c => c.checked).map(c => c.id[0]).join('')
    if (config[key] == newConf) {
        return
    }
    config[key] = newConf
    chrome.runtime.sendMessage({type: 'setConfig', config: {...config, [currentTabDomain]: newConf}}, () => {
        let prevText = event.target.innerText
        event.target.innerText = 'Saved'
        setTimeout(() => event.target.innerText = prevText, 1000)
    })
})

document.getElementById('save-config').addEventListener('click', event => {
    let newConfig = {default: ''}
    for (let line of configText.value.split('\n')) {
        line = line.trim().replace(/\s+/g, ' ')
        if (!line || line[0] == '#') continue
        let [domain, opt] = line.split(' ')
        let url
        try {
            url = new URL('https://' + domain)
        } catch {continue}
        if (url.hostname !== domain || !opt) continue
        newConfig[domain] = opt
    }
    chrome.runtime.sendMessage({type: 'setConfig', config: newConfig}, () => {
        config = newConfig
        configText.value = Object.entries(config).map(pair => pair.join(' ')).join('\n')
        let prevText = event.target.innerText
        event.target.innerText = 'Saved'
        setTimeout(() => event.target.innerText = prevText, 1000)
    })
})

init()
