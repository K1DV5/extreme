# Extreme: A Data Saver

Extreme is a data saver, designed to be used as a tool to reduce the data usage
of Chrome using extreme maneuvers, like Opera mini but in different ways. It
mainly uses content blocking (which may reduce the browsing experience), but
also uses data saving request header, and some customizations for user
experience. It is not an ad blocker or a content blocker. Although it works in
a similar fashion, everything is seen and implemented from a data saving
perspective.

## Content Blocking

The biggest offenders to data I've noticed are:

- Images
- Media
- Scripts
- Fonts

According to a report from
[httparchive](https://httparchive.org/reports/page-weight), they account for
75% to 94% of the average page weight and thus are the focus of this
extension. By default, the extension blocks all of these things from any site
with the URL scheme of `http://` or `https://`. But what is blocked can be
customized on a host name basis (like `https://www.google.com`). A more
granular approach could be implemented but since almost all sites implement
their styles universally across their host name, it would be unnecessary load
on the browser.

## `Save-Data` header

Some sites may use less data if the headers of the requests contain the
`Save-Data: on` directive. This extension adds it to every request to increase
the amount of data saved.

## Customization

There are two stages of unblocking the items.

### Change what is blocked once

If the page relies on some part (example: JS scripts) and you want to load the
JS for just one time, you can click on the icon of the extension on the
extensions toolbar. This brings some options and you can check what you want
downloaded and click 'Apply'. This is only for the lifetime of the tab, until
the extension is turned off from the popup, or until 'Apply' is clicked for another
domain.

### Save customizations

If you want a site to always load with some items, you can check what you want
to be loaded and click save. This will save your configuration in the Custom
list tab, and will use it for future page loads.
