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
            target.src = chrome.runtime.getURL('redir/loading.svg')
            let tmp = document.createElement('img')
            tmp.onload = () => {
                target.src = src
                target.dataset.imageLoaded = true  // prevent future click from re downloading
            }
            tmp.src = src
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

// Set youtube playback quality

if (location.host.endsWith('youtube.com')) {
    // both youtube video page and embedded
    chrome.runtime.sendMessage('ytQuality', quality => {
        if (quality == 'none') return  // chosen by youtube
        let script = document.createElement('script')
        script.innerHTML = `
            function restrictQuality() {
                let player = document.querySelector('.html5-video-player')
                if (!player.getAvailableQualityLevels) return console.log('NOOO!')
                let quality = '${quality}'
                // get available levels
                let availableLevels = player.getAvailableQualityLevels()
                // playing or buffering and quality above the available
                let playing = [1, 3].includes(player.getPlayerState())
                if (playing && !availableLevels.includes(quality)) {
                    quality = availableLevels.slice(-1)[0]
                }
                player.setPlaybackQualityRange(quality, quality)
                if (playing && player.getPlaybackQuality() != quality) {
                    player.loadVideoById(player.getVideoData().video_id, player.getCurrentTime(), quality)
                }
                console.log('SUCCESS')
            }
            restrictQuality()
            let lastRestrictedUrl = location.href
            document.getElementsByTagName('video')[0].addEventListener('loadedmetadata', () => {
                if (location.href == lastRestrictedUrl) return
                restrictQuality()
                lastRestrictedUrl = location.href
            })
            `
        document.body.appendChild(script)
    })
}
