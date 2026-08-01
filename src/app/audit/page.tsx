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
    <div className="p-8 bg-gray-900 min-h-screen text-white font-mono">
      <div className="mb-6 flex justify-between items-center gap-4 border-b border-white/[0.06] pb-4">
        <h1 className="text-2xl font-bold">Raw Audit Logs Test View</h1>
        <Link
          href="/app"
          className="text-violet-400 underline hover:text-white transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded"
        >
          ← Back to Chat App
        </Link>
      </div>

      {loading && <p className="text-gray-400">Loading audit logs from API...</p>}
      {error && <p className="text-danger">Error: {error}</p>}

      {!loading && !error && data && (
        <pre className="bg-gray-950 p-5 rounded-2xl border border-white/[0.06] overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
