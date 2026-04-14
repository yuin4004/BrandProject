module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, channel } = req.body || {};

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  // ── 1. Supabase 저장 ──────────────────────────────────
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { error: dbError } = await supabase.from('signups').insert({
      name:    name.trim(),
      email:   email.trim(),
      phone:   phone?.trim()  || null,
      channel: channel        || null,
    });

    if (dbError) {
      console.error('Supabase error:', dbError);
      return res.status(500).json({ error: 'DB 저장 실패', detail: dbError.message });
    }
  } catch (err) {
    console.error('Supabase init error:', err);
    return res.status(500).json({ error: 'Supabase 초기화 실패', detail: err.message });
  }

  // ── 2. Resend 이메일 발송 ─────────────────────────────
  try {
    const { Resend } = await import('resend');
    const resend     = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const now        = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    // 관리자 알림
    if (adminEmail) {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to:   adminEmail,
        subject: `[30일 챌린지] 새 신청 접수 — ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;padding:24px;">
            <h2 style="color:#0D0D12;margin-bottom:4px;">새 신청이 접수되었습니다</h2>
            <p style="color:#6A6A6A;margin-top:0;font-size:13px;">${now}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px 0;font-weight:700;width:70px;">이름</td>
                <td style="padding:10px 0;">${name}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px 0;font-weight:700;">이메일</td>
                <td style="padding:10px 0;">${email}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px 0;font-weight:700;">연락처</td>
                <td style="padding:10px 0;">${phone || '미입력'}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-weight:700;">채널</td>
                <td style="padding:10px 0;">${channel || '미입력'}</td>
              </tr>
            </table>
          </div>
        `,
      });
    }

    // 신청자 확인 메일
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to:   email.trim(),
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
    });
  } catch (emailError) {
    // 이메일 오류는 무시 — DB 저장 성공으로 200 반환
    console.error('Resend error:', emailError);
  }

  return res.status(200).json({ ok: true });
};
