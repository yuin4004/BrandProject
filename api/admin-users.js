module.exports = async function handler(req, res) {
  // 비밀번호 확인
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  try {
    // 회원 삭제 (DELETE)
    if (req.method === 'DELETE') {
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
