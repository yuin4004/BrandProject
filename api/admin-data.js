module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 비밀번호 확인
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 임시 진단
  if (req.headers['x-debug'] === '1') {
    const key = process.env.SUPABASE_SERVICE_KEY || '';
    return res.status(200).json({
      key_length:   key.length,
      key_start:    key.slice(0, 30),
      key_end:      key.slice(-30),
      has_newline:  key.includes('\n'),
      has_space:    key.includes(' '),
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
