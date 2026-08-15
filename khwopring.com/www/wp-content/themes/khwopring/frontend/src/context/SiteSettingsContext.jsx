import { createContext, useContext, useEffect, useState } from 'react'
import { getSiteSettings, getMenu } from '../services/settingsService'

const SiteSettingsContext = createContext(null)

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSiteSettings(), getMenu('primary')])
      .then(([settingsData, menuData]) => {
        setSettings(settingsData)
        setMenu(menuData)
      })
      .catch(() => {
        setSettings({})
        setMenu([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <SiteSettingsContext.Provider value={{ settings, menu, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider')
  return ctx
}
