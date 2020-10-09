let bgPage = chrome.extension.getBackgroundPage()

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
    // show current state
    chrome.storage.sync.get(['config'], result => {
        configText.value = result.config
    })
})

// TURN ON/OFF
let switchCheck = document.getElementById('switch-data')
switchCheck.checked = bgPage.savingOn
switchCheck.addEventListener('click', () => {
    if (bgPage.savingOn) {
        bgPage.turn(false)
        event.target.checked = false
    } else {
        bgPage.turn(true)
        event.target.checked = true
    }
})

// save button on custom config tab
document.getElementById('saveConfig').addEventListener('click', event => {
    chrome.extension.getBackgroundPage().parseConfig(configText.value)
    let newText = Object.entries(bgPage.config)
        .slice(1)
        .map(([url, opt]) => url + ' ' + bgPage.types.map(type => Number(!opt.includes(type))).join(''))
        .join('\n')
    chrome.storage.sync.set({config: newText})
    configText.value = newText
    let prevText = event.target.innerText
    event.target.innerText = 'Saved'
    setTimeout(() => event.target.innerText = prevText, 1000)
})


// PAGE OPTS
let checkBoard = [
    document.getElementById('image'),
    document.getElementById('script'),
    document.getElementById('font'),
    document.getElementById('media'),
    document.getElementById('ad'),
]

let optsAtPopup = []  // options at popup

chrome.tabs.query({active: true}, tabs => {
    let url = new URL(tabs[0].url)
    if (['http:', 'https:'].includes(url.protocol)) {
        optsAtPopup = bgPage.config[url.origin] || bgPage.config.default  // to be checked later by details.initiator
        for (let widget of checkBoard) {
            widget.checked = !optsAtPopup.includes(widget.id)
        }
    } else {  // hide irrelevant parts
        document.getElementById('pageOptTab').style.display = 'none'
        document.getElementById('pageOpt').style.display = 'none'
    }
})

document.getElementById('apply').addEventListener('click', () => {
    chrome.tabs.query({active: true}, tabs => {
        let tab = tabs[0]
        // temporarily set different options
        let block = bgPage.types.filter((_, i) => !checkBoard[i].checked)
        if (block.length == optsAtPopup.length && block.every((val, i) => val == optsAtPopup[i]))
            return window.close()  // no change
        let tempo = {tabId: tab.id, block}
        bgPage.tempo = tempo
        let reloadCallback = (tabId, details) => {
            if (tempo && tempo.tabId !== tabId || details.status !== 'complete') return
            bgPage.tempo = undefined
            chrome.tabs.onUpdated.removeListener(reloadCallback)
        }
        chrome.tabs.onUpdated.addListener(reloadCallback)
        chrome.tabs.reload(tempo.tabId)
        window.close()
    })
})


document.getElementById('save').addEventListener('click', event => {
    chrome.tabs.query({active: true}, tabs => {
        let key = new URL(tabs[0].url).origin  // to be checked later in property initiator of details
        bgPage.config[key] = bgPage.types.filter((_, i) => !checkBoard[i].checked)
        let newText = Object.entries(bgPage.config)
            .slice(1)
            .map(([url, opt]) => url + ' ' + bgPage.types.map(type => Number(!opt.includes(type))).join(''))
            .join('\n')
        chrome.storage.sync.set({config: newText})
        let prevText = event.target.innerText
        event.target.innerText = 'Saved'
        setTimeout(() => event.target.innerText = prevText, 1000)
    })
})

// Ad block

// Show last blacklist update time
let blacklistUpdated = document.getElementById('ad-blacklist-updated')
chrome.storage.sync.get(['adsBlacklistUpdated'], result => {
    if (result.adsBlacklistUpdated)
        blacklistUpdated.innerText = new Date(result.adsBlacklistUpdated).toLocaleString()
    else
        blacklistUpdated.innerText = 'never'
})

// TURN ON/OFF
let adSwitchCheck = document.getElementById('switch-ad')
adSwitchCheck.checked = bgPage.adBlockOn
adSwitchCheck.addEventListener('click', () => {
    if (bgPage.adBlockOn) {
        bgPage.turnAdBlock(false)
        event.target.checked = false
    } else {
        bgPage.turnAdBlock(true)
        event.target.checked = true
    }
})

let blacklistFile = document.getElementById('ad-blacklist-file')
let blacklistLabel = blacklistFile.parentElement.children[1]

function updateBlacklist(text, messageWidget, widgetText) {
    // extract urls
    let adPatterns = []
    let afterStevenBlackStart = false
    for (let line of text.split('\n')) {
        if (afterStevenBlackStart) {
            if (line.trim().length && !line.startsWith('#')) {
                adPatterns.push('*://' + line.trim().split(' ')[1] + '/*')
            }
        } else if (line.includes('Start StevenBlack'))
            afterStevenBlackStart = true
    }
    chrome.storage.local.set({adPatterns: adPatterns.join('\n')}, () => {
        bgPage.adPatterns = adPatterns
        bgPage.turnAdBlock(true)
        // save last update time
        let now = Date.now()
        chrome.storage.sync.set({adsBlacklistUpdated: now}, () => {
            blacklistUpdated.innerText = new Date(now).toLocaleString()
        })
        messageWidget.innerText = 'Updated'
        setTimeout(() => {
            messageWidget.innerText = widgetText
        }, 1000)
    })
}

blacklistFile.addEventListener('change', async () => {
    if (!blacklistFile.files) {
        blacklistLabel.innerText = 'No file chosen'
        setTimeout(() => {
            blacklistLabel.innerText = 'Select file...'
        }, 1000)
        return
    }
    let text = await blacklistFile.files[0].text()
    updateBlacklist(text, blacklistLabel, 'Select file...')
})

let blackListUrl = 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts'

document.getElementById('update-blacklist').addEventListener('click', () => {
    let target = event.target
    target.innerText = 'Updating...'
    fetch(blackListUrl).then(res => {
        res.text().then(text => {
            updateBlacklist(text, target, 'Update')
        })
    })
})


// YouTube quality

let qualitySelector = document.getElementById('yt-quality')

qualitySelector.value = bgPage.youtubeQuality

qualitySelector.addEventListener('change', () => {
    let quality = event.target.value
    chrome.storage.sync.set({youtubeQuality: quality}, () => {
        bgPage.youtubeQuality = quality
    })
})
