// optionally show images on right click

function fetchToBlobUrl(url) {
    let newUrl = new URL(url)
    // change only if the url is in one of these protocols
    if (!['http:', 'https:'].includes(newUrl.protocol)) return
    return new Promise(async (resolve, _) => {
        chrome.runtime.sendMessage({url}, data => {
            let binData = new Uint8Array(data.length)
            for (let i = 0; i < data.length; i++) {
                binData[i] = data.charCodeAt(i)
            }
            let blob = new Blob([binData])
            resolve(URL.createObjectURL(blob))
        })
    })
}

let loadingImage = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"/>'

document.addEventListener('contextmenu', event => {
    let target = event.target
    if (target.dataset.imageLoaded) return  // set below
    if (target.tagName === 'IMG') {
        let srcPr = fetchToBlobUrl(target.currentSrc)
        if (!srcPr) return  // maybe it's data:
        target.src = loadingImage
        srcPr.then(src => {
            target.removeAttribute('srcset')
            target.onload = () => URL.revokeObjectURL(src)
            target.src = src
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    } else {
        let bgImg = getComputedStyle(target).backgroundImage
        let urlIndex = bgImg.indexOf('url("')
        if (urlIndex == -1) return  // no bg image
        let urlBegin = urlIndex + 5
        let urlEnd = bgImg.indexOf('")', urlBegin)
        let urlPr = fetchToBlobUrl(bgImg.slice(urlBegin, urlEnd))
        if (!urlPr) return  // maybe it's data:
        target.style.backgroundImage = loadingImage
        urlPr.then(url => {
            target.style.backgroundImage = 'url("' + url + '")'
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    }
})
