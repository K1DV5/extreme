// Set youtube playback quality
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
