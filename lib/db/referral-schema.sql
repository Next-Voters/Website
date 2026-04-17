CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_email TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'clicked', 'signed_up', 'subscribed')),
  region_requested JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_email);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
