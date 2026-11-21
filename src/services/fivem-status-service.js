function normalizeBaseUrl(address) {
  if (!address) {
    return null;
  }

  const value = address.startsWith('http://') || address.startsWith('https://') ? address : `http://${address}`;
  return value.replace(/\/+$/, '');
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

class FiveMStatusService {
  async getStatus(address) {
    const baseUrl = normalizeBaseUrl(address);
    if (!baseUrl) {
      return {
        online: false,
        serverName: 'Not configured',
        players: 0,
        maxPlayers: 0,
        connect: 'Not configured'
      };
    }

    const [infoResult, dynamicResult, playersResult] = await Promise.allSettled([
      fetchJson(`${baseUrl}/info.json`),
      fetchJson(`${baseUrl}/dynamic.json`),
      fetchJson(`${baseUrl}/players.json`)
    ]);

    const info = infoResult.status === 'fulfilled' ? infoResult.value : null;
    const dynamic = dynamicResult.status === 'fulfilled' ? dynamicResult.value : null;
    const players = playersResult.status === 'fulfilled' && Array.isArray(playersResult.value) ? playersResult.value : [];
    const hostname = info?.vars?.sv_projectName || dynamic?.hostname || info?.vars?.sv_hostname || 'FiveM Server';
    const maxPlayers = Number(dynamic?.sv_maxclients || info?.vars?.sv_maxClients || info?.vars?.sv_maxclients || 0);

    return {
      online: Boolean(info || dynamic || playersResult.status === 'fulfilled'),
      serverName: hostname,
      players: players.length,
      maxPlayers,
      connect: address.replace(/^https?:\/\//, '')
    };
  }
}

module.exports = { FiveMStatusService };
