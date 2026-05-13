import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      send_fax: 'Send Fax',
      sending: 'Sending…',
      sent: 'Sent',
      send_failed: 'Send failed',
      live_preview: 'Live Preview',
      preview_hint: 'Drag images to reposition · pull corner to resize',
      lang_toggle: 'NL',
      to_light: 'Light mode',
      to_dark: 'Dark mode',
      copy_html: 'Copy HTML',
      mode_visual: 'Visual',
      mode_html: 'HTML',
      insert_image: 'Image',
      insert_image_full: 'Full-page',
      images_panel: 'Images',
      insert_inline: 'Inline',
      insert_full: 'Full page',
      remove_image: 'Remove',
    },
  },
  nl: {
    translation: {
      send_fax: 'Fax Versturen',
      sending: 'Versturen…',
      sent: 'Verstuurd',
      send_failed: 'Versturen mislukt',
      live_preview: 'Live Voorbeeld',
      preview_hint: 'Sleep afbeeldingen om te verplaatsen · hoek trekken om formaat te wijzigen',
      lang_toggle: 'EN',
      to_light: 'Lichte modus',
      to_dark: 'Donkere modus',
      copy_html: 'HTML Kopiëren',
      mode_visual: 'Visueel',
      mode_html: 'HTML',
      insert_image: 'Afbeelding',
      insert_image_full: 'Volledige pagina',
      images_panel: 'Afbeeldingen',
      insert_inline: 'Inline',
      insert_full: 'Volledig',
      remove_image: 'Verwijderen',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
