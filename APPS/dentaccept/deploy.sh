#!/bin/bash
# deploy.sh

# 1. Deploy to Vercel (free)
npm i -g vercel
vercel --prod

# 2. Deploy Supabase edge function
supabase functions deploy ai-explain

# 3. Set environment variables
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 4. Stripe webhook setup (for subscriptions)
# Go to Stripe Dashboard → Developers → Webhooks
# Add endpoint: https://your-app.vercel.app/api/stripe-webhook
# Select events: customer.subscription.created, updated, deleted

echo "DentAccept deployed!"
echo "App: https://dentaccept.vercel.app"
echo "API: https://your-project.supabase.co"