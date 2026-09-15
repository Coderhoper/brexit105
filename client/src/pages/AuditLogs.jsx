import React, { useEffect, useState } from 'react'
import api from '../api'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.get('/api/audit-logs')
        setLogs(res.data.logs || [])
      } catch (err) {
        console.error(err)
      }
    }
    loadLogs()
  }, [])

  return (
    <div className="container space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Audit trail</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">System activity</h1>
      </div>

      <div className="card p-5">
        {logs.length === 0 ? (
          <div className="text-slate-500 dark:text-slate-400">No audit entries yet.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{log.action}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {log.entity_type ? `Entity: ${log.entity_type}` : 'System event'}
                </div>
                {log.details && (
                  <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(log.details, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
