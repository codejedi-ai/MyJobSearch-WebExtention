# Extension Icons

This extension requires three icon sizes:

- **icon16.png** - 16x16 pixels (for toolbar)
- **icon48.png** - 48x48 pixels (for extension management page)
- **icon128.png** - 128x128 pixels (for Chrome Web Store)

## How to Create Icons

You can create these icons in several ways:

1. **Use an online tool**: Sites like [Favicon Generator](https://realfavicongenerator.net/) or [Icon Generator](https://cthedot.de/icongen/)
2. **Design in Figma/Photoshop**: Create a square design and export in three sizes
3. **Use a simple colored square**: As a placeholder, you can use solid colored PNGs

## Temporary Placeholder

For development, you can use any PNG images of the correct sizes. The extension will work with placeholder icons, but you should replace them with proper branding before publishing.

## Quick Placeholder Generation

If you have ImageMagick installed, you can generate placeholder icons:

```bash
convert -size 16x16 xc:#667eea public/icons/icon16.png
convert -size 48x48 xc:#667eea public/icons/icon48.png
convert -size 128x128 xc:#667eea public/icons/icon128.png
```
