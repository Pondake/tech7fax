import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      html_content:   'HTML Content',
      copy_html:      'Copy HTML',
      images:         'Images',
      drop_images:    'Drop images here or click to browse',
      inline:         'Inline',
      full:           'Full',
      insert:         'Insert',
      remove:         'Remove',
      send_fax:       'Send Fax',
      sending:        'Sending…',
      sent:           'Sent',
      send_failed:    'Send failed',
      live_preview:   'Live Preview',
      preview_hint:   'Drag images to reposition · pull corner to resize',
      lang_toggle:    'NL',
      to_light:       'Light mode',
      to_dark:        'Dark mode',
      canvas_dark:    'Dark canvas',
      canvas_light:   'Light canvas',
    },
  },
  nl: {
    translation: {
      html_content:   'HTML Inhoud',
      copy_html:      'HTML Kopiëren',
      images:         'Afbeeldingen',
      drop_images:    'Sleep afbeeldingen hiernaartoe of klik om te bladeren',
      inline:         'Inline',
      full:           'Volledig',
      insert:         'Invoegen',
      remove:         'Verwijderen',
      send_fax:       'Fax Versturen',
      sending:        'Versturen…',
      sent:           'Verstuurd',
      send_failed:    'Versturen mislukt',
      live_preview:   'Live Voorbeeld',
      preview_hint:   'Sleep afbeeldingen om te verplaatsen · hoek trekken om formaat te wijzigen',
      lang_toggle:    'EN',
      to_light:       'Lichte modus',
      to_dark:        'Donkere modus',
      canvas_dark:    'Donker canvas',
      canvas_light:   'Licht canvas',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
