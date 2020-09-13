let bgPage = chrome.extension.getBackgroundPage()
let config = bgPage.config

// TABS FOR OPTIONS
let pageOpt = document.getElementById('pageOpt')
let customOpt = document.getElementById('customOpt')

let configText = document.getElementById('config')

document.getElementById('pageOptTab').addEventListener('click', () => {
    document.body.style.width = '15em'
    pageOpt.style.display = 'block'
    customOpt.style.display = 'none'
})

document.getElementById('customOptTab').addEventListener('click', () => {
    document.body.style.width = '25em'
    pageOpt.style.display = 'none'
    customOpt.style.display = 'block'
    // show current state
    chrome.storage.sync.get(['config'], result => {
        configText.value = result.config
    })
})

// TURN ON/OFF
let switchCheck = document.getElementById('switch')
switchCheck.checked = bgPage.turnedOn
switchCheck.addEventListener('click', () => {
    if (bgPage.turnedOn) {
        bgPage.turn(false)
        event.target.checked = false
    } else {
        bgPage.turn(true)
        event.target.checked = true
    }
})

// save button on custom config tab
document.getElementById('saveConfig').addEventListener('click', () => {
    chrome.extension.getBackgroundPage().parseConfig(configText.value)
    let newText = Object.entries(config)
        .slice(1)
        .map(([url, opt]) => url + ' ' + bgPage.types.map(type => Number(!opt.includes(type))).join(''))
        .join('\n')
    chrome.storage.sync.set({config: newText})
    configText.value = newText
})


// PAGE OPTS
let checkBoard = [
    document.getElementById('image'),
    document.getElementById('script'),
    document.getElementById('font'),
    document.getElementById('media'),
]
let applyButt = document.getElementById('apply');

chrome.tabs.query({active: true}, tabs => {
    let key = new URL(tabs[0].url).origin  // to be checked later in property initiator of details
    let opt = config[key] || config.default
    for (let widget of checkBoard) {
        widget.checked = !opt.includes(widget.id)
    }
})

document.getElementById('apply').addEventListener('click', () => {
    chrome.tabs.query({active: true}, tabs => {
        let tab = tabs[0]
        // temporarily set different options
        let block = bgPage.types.filter((_, i) => !checkBoard[i].checked)
        bgPage.reloadWithTempo({tabId: tab.id, block})
        window.close()
    })
})


document.getElementById('save').addEventListener('click', () => {
    chrome.tabs.query({active: true}, tabs => {
        let key = new URL(tabs[0].url).origin  // to be checked later in property initiator of details
        config[key] = bgPage.types.filter((_, i) => !checkBoard[i].checked)
        let newText = Object.entries(config)
            .slice(1)
            .map(([url, opt]) => url + ' ' + bgPage.types.map(type => Number(!opt.includes(type))).join(''))
            .join('\n')
        chrome.storage.sync.set({config: newText})
    })
})

