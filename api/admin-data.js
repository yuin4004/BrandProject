module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 비밀번호 확인
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 임시 진단 — 환경변수 존재 여부 확인
  if (req.headers['x-debug'] === '1') {
    return res.status(200).json({
      has_supabase_url:     !!process.env.SUPABASE_URL,
      has_service_key:      !!process.env.SUPABASE_SERVICE_KEY,
      has_anon_key:         !!process.env.SUPABASE_ANON_KEY,
      service_key_preview:  process.env.SUPABASE_SERVICE_KEY?.slice(0, 20) + '...',
    });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/signups?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey':        process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
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
