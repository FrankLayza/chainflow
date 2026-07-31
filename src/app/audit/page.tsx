"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuditLogsTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/audit-logs');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch');
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <div className="p-8 bg-smoke-charcoal min-h-screen text-warm-off-white font-mono">
      <div className="mb-6 flex justify-between items-center border-b border-iron-veil pb-4">
        <h1 className="text-2xl font-bold">Raw Audit Logs Test View</h1>
        <Link href="/app" className="text-muted-cobalt underline hover:text-white">
          ← Back to Chat App
        </Link>
      </div>

      {loading && <p>Loading audit logs from API...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && data && (
        <pre className="bg-absolute p-4 rounded border border-iron-veil overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
