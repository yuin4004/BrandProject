module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    env: {
      supabase_url: !!process.env.SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_ANON_KEY,
      resend_key:   !!process.env.RESEND_API_KEY,
      admin_email:  !!process.env.ADMIN_EMAIL,
    },
    node: process.version,
  });
};
