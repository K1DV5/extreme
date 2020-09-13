# Extreme: A Data Saver

Extreme is a data saver, designed to be used as a tool to reduce the data usage
of Chrome especially for someone who is used to Opera mini. It is not an ad
blocker. It is not a content blocker. But it works in a similar fashion, giving
emphasis on data saving trying not to reduce the normal user experience (which
may be reduced sometimes).

## Blocking

The biggest offenders I've noticed when it comes to data usage are:

- Images
- Media
- Scripts
- Fonts

And these are the focus of this extension. By default, the extension blocks all
four of these things from any site with the URL scheme of `http://` or
`https://`. But what is blocked can be customized on a host name basis (like
`https://www.google.com`). I could implement a more granular approach but since
almost all sites implement their styles universally across their host name, it
would be unnecessary CPU load.

## Customization

There are three stages of unblocking the items.

### Show single hidden image

After a page has loaded, it can be seen that all images (except those with
`data:` URLs) are blocked. To show an image, you can right-click (or long press
on Android) the image. This will not show the context menu but will download
the image. If you really wanted the context menu, you can right-click on the
image again. The extension only downloads the image once, and it doesn't
interfere with subsequent right clicks.

### Change what is blocked once

If the page relies on JS and you want to load the JS, you can click on the icon
of the extension on the extensions toolbar. This brings some options and you
can check what you want downloaded and click 'Apply & reload'. This is for a
single reload only.

### Save customizations

If you want a site to always load with some items, you can check what you want
to be loaded and click save. This will save your configuration in the Custom
list tab, and will use it for future loading.

