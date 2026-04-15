module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  // Bearer 토큰으로 사용자 확인 및 역할 검증
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Unauthorized' });
    const user = await userRes.json();
    const role = user?.user_metadata?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/signups?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey':        SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      return res.status(500).json({ error: 'DB 조회 실패', detail });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
