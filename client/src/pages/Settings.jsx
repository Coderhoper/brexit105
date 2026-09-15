import React, { useEffect, useState } from 'react'
import api from '../api'

const emptySettings = {
  business_name: 'Danlu',
  business_email: '',
  phone: '',
  address: '',
  currency: 'KES',
  timezone: 'Africa/Nairobi',
  report_email_recipients: ''
}

export default function Settings() {
  const [settings, setSettings] = useState(emptySettings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/api/settings')
        setSettings({ ...emptySettings, ...(res.data.settings || {}) })
      } catch (err) {
        console.error(err)
      }
    }
    loadSettings()
  }, [])

  async function handleSave() {
    try {
      setSaving(true)
      const res = await api.put('/api/settings', settings)
      setSettings({ ...emptySettings, ...(res.data.settings || {}) })
      alert('Settings saved successfully')
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Configuration</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Business settings</h1>
      </div>

      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Business name</span>
            <input value={settings.business_name || ''} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} className="w-full rounded-xl border p-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Business email</span>
            <input value={settings.business_email || ''} onChange={(e) => setSettings({ ...settings, business_email: e.target.value })} className="w-full rounded-xl border p-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone</span>
            <input value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full rounded-xl border p-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Currency</span>
            <select value={settings.currency || 'KES'} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full rounded-xl border p-2.5">
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Address</span>
            <input value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full rounded-xl border p-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Timezone</span>
            <input value={settings.timezone || 'Africa/Nairobi'} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full rounded-xl border p-2.5" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Report recipients</span>
            <input value={settings.report_email_recipients || ''} onChange={(e) => setSettings({ ...settings, report_email_recipients: e.target.value })} className="w-full rounded-xl border p-2.5" />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
        </div>
      </div>
    </div>
  )
}
