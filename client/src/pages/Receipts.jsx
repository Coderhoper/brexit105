import React, { useEffect, useState } from 'react'
import api from '../api'
import DataTable from '../components/DataTable'

export default function Receipts() {
  const [sales, setSales] = useState([])

  async function loadSales() {
    try {
      const res = await api.get('/api/sales')
      setSales((res.data.sales || []).slice(0, 12))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  return (
    <div className="space-y-6 container">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sales</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Receipts</h1>
      </div>

      <div className="card p-5">
        <DataTable
          columns={[
            { key: 'id', label: 'Receipt no.' },
            { key: 'sale_date', label: 'Date', render: (row) => new Date(row.sale_date).toLocaleString() },
            { key: 'total_amount', label: 'Amount', render: (row) => `KSh ${Number(row.total_amount || 0).toLocaleString()}` },
            { key: 'payment_method', label: 'Method' }
          ]}
          rows={sales}
          emptyText="No receipts available yet."
        />
      </div>
    </div>
  )
}
