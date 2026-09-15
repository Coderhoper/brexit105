import React, { useEffect, useState } from 'react'
import api from '../api'
import DataTable from '../components/DataTable'

export default function SalesHistory() {
  const [sales, setSales] = useState([])

  async function loadSales() {
    try {
      const res = await api.get('/api/sales')
      setSales(res.data.sales || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  return (
    <div className="space-y-6 container">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Sales</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Sales history</h1>
        </div>
      </div>

      <div className="card p-5">
        <DataTable
          columns={[
            { key: 'id', label: 'Receipt' },
            { key: 'sale_date', label: 'Date', render: (row) => new Date(row.sale_date).toLocaleString() },
            { key: 'total_amount', label: 'Total', render: (row) => `KSh ${Number(row.total_amount || 0).toLocaleString()}` },
            { key: 'payment_method', label: 'Payment' },
            { key: 'admin_id', label: 'Cashier ID' }
          ]}
          rows={sales}
          emptyText="No sales recorded yet."
        />
      </div>
    </div>
  )
}
