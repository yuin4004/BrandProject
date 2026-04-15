module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  // Bearer 토큰으로 사용자 확인 및 역할 검증
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let actorRole = null;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Unauthorized' });
    const actor = await userRes.json();
    actorRole = actor?.user_metadata?.role;
    if (actorRole !== 'admin' && actorRole !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  try {
    // 권한 변경 (PATCH) — 최고관리자만 가능
    if (req.method === 'PATCH') {
      if (actorRole !== 'super_admin') {
        return res.status(403).json({ error: '최고관리자만 권한을 변경할 수 있습니다.' });
      }
      const { userId, role } = req.body || {};
      const allowed = ['user', 'admin', 'super_admin'];
      if (!userId || !allowed.includes(role)) {
        return res.status(400).json({ error: 'userId, role(user|admin|super_admin) required' });
      }

      const patchRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
        {
          method: 'PUT',
          headers: {
            'apikey':        SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ user_metadata: { role } }),
        }
      );
      if (!patchRes.ok) {
        const detail = await patchRes.text();
        return res.status(500).json({ error: '권한 변경 실패', detail });
      }
      return res.status(200).json({ ok: true });
    }

    // 회원 삭제 (DELETE) — 최고관리자만 가능
    if (req.method === 'DELETE') {
      if (actorRole !== 'super_admin') {
        return res.status(403).json({ error: '최고관리자만 회원을 삭제할 수 있습니다.' });
      }
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'userId required' });

      const delRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey':        SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
        }
      );
      if (!delRes.ok) {
        const detail = await delRes.text();
        return res.status(500).json({ error: '삭제 실패', detail });
      }
      return res.status(200).json({ ok: true });
    }

    // 회원 목록 조회 (GET)
    if (req.method === 'GET') {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
        {
          headers: {
            'apikey':        SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        return res.status(500).json({ error: '회원 조회 실패', detail });
      }

      const json = await response.json();
      return res.status(200).json(json.users || []);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
