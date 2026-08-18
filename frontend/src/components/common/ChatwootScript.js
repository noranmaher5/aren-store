import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ChatwootScript() {
  return null;
  /*
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  useEffect(() => {
    if (isDashboard) return

    // امنع التكرار لو الصفحة اتعملت re-render
    if (document.getElementById('chatwoot-sdk')) return

    const BASE_URL = "https://app-bot.syriana.software"
    const script = document.createElement('script')
    script.id = 'chatwoot-sdk'
    script.src = `${BASE_URL}/packs/js/sdk.js`
    script.async = true
    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken: 'ahHbRPEmY3BmUtGyuGZqTAWo',
        baseUrl: BASE_URL
      })

      window.addEventListener('chatwoot:ready', () => {
        const style = document.createElement('style')
        style.innerHTML = `
          #chatwoot_live_chat_widget { clip-path: inset(0px 0px 35px 0px) !important; bottom: -15px !important; }
          .woot-widget-bubble--brand { display: none !important; visibility: hidden !important; }
        `
        document.head.appendChild(style)

        setInterval(() => {
          const widgetHolder = document.querySelector('.woot-widget-holder')
          if (widgetHolder && !document.querySelector('.clean-cover')) {
            const cover = document.createElement('div')
            cover.className = 'clean-cover'
            cover.style.cssText = `
              position: absolute; bottom: 0; right: 0;
              width: 100%; height: 35px; background: #fff;
              z-index: 9999; pointer-events: none;
              border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;
            `
            widgetHolder.appendChild(cover)
          }
        }, 1000)
      })
    }

    document.body.appendChild(script)

    // Cleanup لما المستخدم يروح للداشبورد
    return () => {
      const existingScript = document.getElementById('chatwoot-sdk')
      if (existingScript) existingScript.remove()
      const widget = document.getElementById('chatwoot_live_chat_widget')
      if (widget) widget.remove()
    }
  }, [isDashboard])

  return null
  */
}
