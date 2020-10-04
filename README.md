# Extreme: A Data Saver

Extreme is a data saver, designed to be used as a tool to reduce the data usage
of Chrome using extreme maneuvers, like Opera mini but in different ways. It
mainly uses content blocking (which may reduce the browsing experience), but
also uses data saving request header, and some customizations for user
experience. It is not an ad blocker (although it can block most). It is not a
content blocker. But it works in a similar fashion, focusing on data saving
trying not to reduce the normal user experience.

## Content Blocking

The biggest offenders to data I've noticed are:

- Images
- Media
- Scripts
- Fonts
- Ads

According to a report from
[httparchive](https://httparchive.org/reports/page-weight), they account for
more than 94% of the average page weight and thus are the focus of this
extension. By default, the extension blocks all of these things from any site
with the URL scheme of `http://` or `https://`. But what is blocked can be
customized on a host name basis (like `https://www.google.com`). A more
granular approach could be implemented but since almost all sites implement
their styles universally across their host name, it would be unnecessary load
on the browser.

## YouTube videos

YouTube's auto selection of quality eats up a lot of data, especially if it
detects a fast connection and switches to a high definition version of the
video. But if the quality is set to a specific value, there will be some
reduction on data usage. This extension can restrict the playback quality
of YouTube videos to a specific value, which works both on YouTube's website
and pages with embedded videos.
 
## `Save-Data` header

Some sites may use less data if the headers of the requests contain the
`Save-Data: on` directive. This extension adds it to every request to increase
the amount of data saved.

## Customization

There are three stages of unblocking the items.

### Download and show single image

After a page has loaded, it can be seen that all images (except those with
`data:` URLs) are blocked. To show an image, you can right-click (or long press
on the touchscreen) the image. This will not show the context menu but will
download and show the image. If you really wanted the context menu, you can
right-click on the image again. The extension only downloads the image once,
and it doesn't interfere with subsequent right clicks.

### Change what is blocked once

If the page relies on some part (example: JS scripts) and you want to load the
JS for just one time, you can click on the icon of the extension on the
extensions toolbar. This brings some options and you can check what you want
downloaded and click 'Apply'. This is for a single reload only.

### Save customizations

If you want a site to always load with some items, you can check what you want
to be loaded and click save. This will save your configuration in the Custom
list tab, and will use it for future page loads.
