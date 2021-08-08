async function updateDynamicRules(config) {
    console.log(config)
    if (!config) {
        config = {default: ''}
    }
    let rules = {
        s: {
            id: 1,
            condition: {resourceTypes: ['script']},
            action: {type: 'block'}
        },
        i: {
            id: 2,
            condition: {resourceTypes: ['image']},
            action: {type: 'redirect', redirect: {extensionPath: '/redir/empty.svg'}}
        },
        f: {
            id: 3,
            condition: {resourceTypes: ['font']},
            action: {type: 'block'}
        },
        m: {
            id: 4,
            condition: {resourceTypes: ['media']},
            action: {type: 'block'}
        },
        saveDataHeader: {
            id: 5,
            condition: {requestMethods: ['get', 'post']},
            action: {
                type: 'modifyHeaders',
                requestHeaders: [{
                    header: 'Save-Data',
                    operation: 'set',
                    value: 'on'
                }]
            }
        }
    }
    let defaultOpts = config.default || ''
    for (let [domain, opt] of Object.entries(config)) {
        for (let char of opt || '') {
            let rule = rules[char]
            if (!opt) continue
            if (!rule.condition.excludedDomains) {
                rule.condition.excludedDomains = []
            }
            rule.condition.excludedDomains.push(domain)
        }
    }
    for (let char of defaultOpts) {
        delete rules[char]
    }
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2, 3, 4, 5],
        addRules: Object.values(rules)
    })
}

async function updateSessionRules(domain, tabId, opts) {
    let sessRule = (await chrome.declarativeNetRequest.getSessionRules())[0]
    if (sessRule && !sessRule.condition.domains) return // switched off
    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [6],
        addRules: [{
            id: 6,
            priority: 2,
            condition: {
                domains: [domain],
                tabIds: [tabId],
                resourceTypes: ['script', 'image', 'font', 'media'].filter(type => opts.includes(type[0]))
            },
            action: {type: 'allow'}
        }]
    })
}

chrome.runtime.onInstalled.addListener(e => {
    chrome.declarativeNetRequest.getDynamicRules().then(rules => {
        if (rules.filter(r => r.id == 5).length == 0) {  // the Save-Data header rule will always be present
            updateDynamicRules()
            turn(on)
        }
    })
})


async function getState() {
    let sessRule = (await chrome.declarativeNetRequest.getSessionRules())[0]
    if (!sessRule || sessRule.condition.tabIds) return true
    return false
}

async function turn(on) {
    let stateOn = await getState()
    if (on) {
        chrome.declarativeNetRequest.setExtensionActionOptions({displayActionCountAsBadgeText: true})
        if (stateOn) return true
        chrome.declarativeNetRequest.updateSessionRules({removeRuleIds: [6]})
        return true
    } else {
        chrome.declarativeNetRequest.setExtensionActionOptions({displayActionCountAsBadgeText: false})
        if (!stateOn) return false
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [6],
            addRules: [{
                id: 6,
                priority: 2,
                condition: {resourceTypes: ['script', 'image', 'font', 'media']},
                action: {type: 'allow'}
            }]
        })
        return false
    }
}

async function getConfig() {
    let rules = (await chrome.declarativeNetRequest.getDynamicRules()).slice(0, 4)
    let config = {'default': ''}
    for (let rule of rules) {
        if (rule.id === 5) break
        let type = rule.condition.resourceTypes[0][0]
        config.default = config.default.replace(type, '')
        if (!rule.condition.excludedDomains) continue
        for (let domain of rule.condition.excludedDomains) {
            if (!config.hasOwnProperty(domain)) {
                config[domain] = ''
            }
            config[domain] += type
        }
    }
    let sessRule = (await chrome.declarativeNetRequest.getSessionRules())[0]
    let session = {}
    if (sessRule && sessRule.condition.domains) {
        session[sessRule.condition.domains[0]] = sessRule.condition.resourceTypes.map(type => type[0]).join('')
    }
    return {dynamic: config, session}
}

chrome.runtime.onMessage.addListener((message, ctx, sendResponse) => {
    if (message.url) {
        fetch(message.url, {redirect: 'follow'}).then(async res => {
            let reader = res.body.getReader()
            let data = ''
            while (true) {
                let {done, value} = await reader.read()
                if (done) break
                for (let num of value) {
                    data += String.fromCharCode(num)
                }
            }
            sendResponse(data)
        })
    } else if (message == 'switchOn') {
        turn(true).then(sendResponse)
    } else if (message == 'switchOff') {
        turn(false).then(sendResponse)
    } else if (message == 'state') {
        getState().then(sendResponse)
    } else if (message === 'config') {
        getConfig().then(sendResponse)
    } else if (message.type == 'setConfig') {
        updateDynamicRules(message.config).then(sendResponse)
    } else if (message.type == 'setSessConf') {
        updateSessionRules(message.domain, message.tabId, message.opts).then(sendResponse)
    }
    return true
})
