// optionally show images on right click

function changeUrl(url) {
    let newUrl = new URL(url)
    // change only if the url is in one of these protocols
    if (['http:', 'https:'].includes(newUrl.protocol)) {
        newUrl.search += (newUrl.search ? '&' : '?') + 'EXTREME=1'
    }
    return newUrl.toString()
}

document.addEventListener('contextmenu', () => {
    let target = event.target
    if (target.dataset.imageLoaded) return  // set below
    if (target.tagName === 'IMG') {
        let src = changeUrl(target.currentSrc)
        chrome.runtime.sendMessage({allowNextUrl: src}, () => {
            target.removeAttribute('srcset')
            target.src = src
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    } else {
        let bgImg = getComputedStyle(target).backgroundImage
        let urlIndex = bgImg.indexOf('url("')
        if (urlIndex == -1) return
        let urlBegin = urlIndex + 5
        let urlEnd = bgImg.indexOf('")', urlBegin)
        let url = changeUrl(bgImg.slice(urlBegin, urlEnd))
        chrome.runtime.sendMessage({allowNextUrl: url}, () => {
            target.style.backgroundImage = 'url("' + url + '")'
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    }
})
