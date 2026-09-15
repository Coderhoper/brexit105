import React, { useEffect, useState } from 'react'
import api from '../api'
import DataTable from '../components/DataTable'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: ''
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(emptyForm)

  async function loadCustomers() {
    try {
      const res = await api.get('/api/stock-movements')
      // API does not provide customers, so we keep a lightweight local list for the workflow.
      setCustomers([])
    } catch (err) {
      console.error(err)
      setCustomers([])
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  function addCustomer() {
    if (!form.name.trim()) return

    setCustomers((prev) => [
      {
        id: Date.now(),
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address
      },
      ...prev
    ])

    setForm(emptyForm)
  }

  return (
    <div className="space-y-6 container">
      <div className="page-header">
        <div>
          <p className="section-kicker">Customers</p>
          <h1 className="page-title">Customer records</h1>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add customer</h2>
          <div className="mt-5 space-y-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} placeholder="Address" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
            <button onClick={addCustomer} className="w-full btn btn-primary">Save customer</button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer list</h2>
          <div className="mt-4">
            <DataTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' }
              ]}
              rows={customers}
              emptyText="No customers added yet."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
