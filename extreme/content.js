let cacheBuster = 'EXTREME'

document.addEventListener('contextmenu', () => {
    let target = event.target
    if (target.dataset.imageLoaded) return  // set below
    if (target.tagName === 'IMG') {
        let src = target.currentSrc
        chrome.runtime.sendMessage({dontBlockNextUrl: {url: src + cacheBuster, redirectTo: src}}, () => {
            target.srcset = ''
            target.src = src + cacheBuster
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    } else {
        let bgImg = getComputedStyle(target).backgroundImage
        let urlIndex = bgImg.indexOf('url("')
        if (urlIndex == -1) return
        if (urlIndex > 0) alert(bgImg)
        let urlBegin = urlIndex + 5
        let urlEnd = bgImg.indexOf('")', urlBegin)
        let url = bgImg.slice(urlBegin, urlEnd)
        chrome.runtime.sendMessage({dontBlockNextUrl: {url: url + cacheBuster, redirectTo: url}}, () => {
            target.style.backgroundImage = 'url("' + url + cacheBuster + '")'
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    }
})

// Set youtube playback quality

// get player
// let player = document.getElementById('movie_player')
// if (window.videoPlayer) {
//     for (let i in window.videoPlayer) {
//         if (window.videoPlayer[i] && window.videoPlayer[i].setPlaybackQualityRange) {
//             player = window.videoPlayer[i]
//             break
//         }
//     }
// } else {
//     player = window.document.getElementById('movie_player') ||
//              window.document.getElementsByClassName("html5-video-player")[0] ||
//              window.document.getElementById('movie_player-flash') ||
//              window.document.getElementById('movie_player-html5') ||
//              window.document.getElementById('movie_player-html5-flash')
// }

if (location.host.endsWith('youtube.com')) {  // Youtube video page
    if (location.pathname == '/watch') {
        chrome.runtime.sendMessage('youtubeQuality', quality => {
            if (quality == 'none') return  // chosen by youtube
            window.localStorage.setItem('youtubeQuality', quality)
            let script = document.createElement('script')
            script.innerHTML = `
                let player = document.getElementById('movie_player')
                if (player.getAvailableQualityLevels) {
                    // set quality
                    let quality = window.localStorage.getItem('youtubeQuality')
                    // get available levels
                    let availableLevels = player.getAvailableQualityLevels()
                    if (!availableLevels.includes(quality)) {
                        quality = availableLevels.slice(-1)[0]
                    }
                    player.setPlaybackQualityRange(quality, quality)
                    if (player.getPlaybackQuality() != quality) {
                        player.loadVideoById(player.getVideoData().video_id, player.getCurrentTime(), quality)
                    }
                    console.log('SUCCESS')
                } else {
                    console.log('NOOO')
                }`
            document.body.appendChild(script)
        })
    } else if (location.pathname.startsWith('/embed/')) {
        document.querySelector('video').addEventListener('canplay', () => {
            let settings = document.querySelector('ytp-settings-button')
            if (settings) settings.click()
        })
    }
}
