module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, channel } = req.body || {};

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
    const RESEND_KEY   = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL  = process.env.ADMIN_EMAIL?.trim();

    // ── 1. Supabase REST API 저장 ───────────────────────
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        name:    name.trim(),
        email:   email.trim(),
        phone:   phone?.trim()  || null,
        channel: channel        || null,
      }),
    });

    if (!dbRes.ok) {
      const detail = await dbRes.text();
      console.error('Supabase error:', detail);
      return res.status(500).json({ error: 'DB 저장 실패', detail });
    }

    // ── 2. Resend REST API 이메일 발송 ──────────────────
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    if (ADMIN_EMAIL && RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from:    'onboarding@resend.dev',
          to:      ADMIN_EMAIL,
          subject: `[30일 챌린지] 새 신청 접수 — ${name}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;padding:24px;">
              <h2 style="color:#0D0D12;">새 신청이 접수되었습니다</h2>
              <p style="color:#999;font-size:13px;">${now}</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:8px 0;font-weight:700;width:70px;">이름</td>
                  <td style="padding:8px 0;">${name}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:8px 0;font-weight:700;">이메일</td>
                  <td style="padding:8px 0;">${email}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:8px 0;font-weight:700;">연락처</td>
                  <td style="padding:8px 0;">${phone || '미입력'}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;">채널</td>
                  <td style="padding:8px 0;">${channel || '미입력'}</td>
                </tr>
              </table>
            </div>
          `,
        }),
      });
    }

    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from:    'onboarding@resend.dev',
          to:      email.trim(),
          subject: '[30일 챌린지] 신청이 완료되었습니다 ✓',
          html: `
            <div style="font-family:sans-serif;max-width:480px;padding:24px;">
              <h2 style="color:#0D0D12;">${name}님, 신청이 완료되었습니다!</h2>
              <p style="color:#333;line-height:1.7;">
                <strong>첫 런칭과 콘텐츠 구축을 위한 30일 챌린지</strong> 신청이
                정상적으로 접수되었습니다.
              </p>
              <p style="color:#333;line-height:1.7;">
                자료는 이 이메일(<strong>${email}</strong>)로 곧 전달됩니다.<br>
                스팸함도 꼭 확인해주세요.
              </p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
              <p style="color:#999;font-size:13px;">오늘부터 30일, 함께 시작해봐요.</p>
            </div>
          `,
        }),
      });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    // 실제 오류 메시지 반환 (디버깅용)
    console.error('Fatal error:', err);
    return res.status(500).json({
      error:   err.message,
      node:    process.version,
      hasFetch: typeof fetch !== 'undefined',
    });
  }
};
