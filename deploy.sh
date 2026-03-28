#!/bin/bash
set -e

echo "→ Building with Wasp..."
wasp build

echo "→ Copying deployment configs into build output..."
cp railway.json .wasp/out/
cp vercel.json .wasp/out/web-app/

echo ""
echo "✓ Build complete. Deploy with:"
echo ""
echo "  Server (Fly.io):"
echo "    cd .wasp/out && fly deploy"
echo ""
echo "  Client (Vercel):"
echo "    vercel .wasp/out/web-app --prod"
echo ""
echo "  Required Fly.io secrets (fly secrets set --app out KEY=value):"
echo "    DATABASE_URL        — postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres"
echo "    ANTHROPIC_API_KEY   — sk-ant-..."
echo "    SMTP_HOST           — smtp.resend.com"
echo "    SMTP_PORT           — 587"
echo "    SMTP_USERNAME       — resend"
echo "    SMTP_PASSWORD       — <resend api key>"
echo "    JWT_SECRET          — \$(openssl rand -hex 32)"
echo "    WASP_SERVER_URL     — https://out.fly.dev"
echo "    WASP_WEB_CLIENT_URL — https://<project>.vercel.app"
echo ""
echo "  Do NOT set PG_BOSS_NEW_OPTIONS on Fly.io (local dev only)."
