import http from 'node:http';

const PORT = Number(process.env.STUB_PORT || 4599);
const calls = [];

const send = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/__calls') return send(res, 200, { calls });
    if (url.pathname === '/__reset') {
      calls.length = 0;
      return send(res, 200, { ok: true });
    }

    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (url.pathname === '/api/execute/transfer' && req.method === 'POST') {
        let body = {};
        try {
          body = JSON.parse(raw || '{}');
        } catch {}
        calls.push({ amount: body.amount, to: body.recipientAddress, at: new Date().toISOString() });
        const id = `stub-${calls.length}`;
        return send(res, 200, {
          executionId: id,
          status: 'confirmed',
          transactionHash: `0xstub${String(calls.length).padStart(60, '0')}`,
          gasUsed: 21000,
          sponsored: true,
        });
      }

      if (url.pathname.startsWith('/api/execute/') && url.pathname.endsWith('/status')) {
        return send(res, 200, {
          executionId: url.pathname.split('/')[3],
          status: 'confirmed',
          transactionHash: `0xstub${'0'.repeat(60)}`,
          gasUsed: 21000,
          sponsored: true,
        });
      }

      // Anything else (including /mcp) fails, so the REST adapter is what runs.
      send(res, 404, { error: `stub: no route for ${req.method} ${url.pathname}` });
    });
  })
  .listen(PORT, () => console.log(`[stub] KeeperHub stub listening on ${PORT}`));
