/**
 * plugins/webfontloader.js
 *
 * webfontloader documentation: https://github.com/typekit/webfontloader
 */

export async function loadFonts () {
  const webFontLoader = await import('webfontloader')

  webFontLoader.load({
    google: {
      families: [
        'Space Grotesk:300,400,500,600,700&display=swap',
        'Orbitron:500,600,700,800&display=swap',
      ],
    },
  })
}
