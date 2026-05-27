-- Create payment_ai_verifications table
CREATE TABLE IF NOT EXISTS public.payment_ai_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    payment_proof_id uuid NOT NULL REFERENCES public.payment_proofs(id) ON DELETE CASCADE,
    provider text NOT NULL,
    verification_status text NOT NULL,
    confidence_score numeric NOT NULL,
    trust_score numeric NOT NULL,
    expected_amount numeric NOT NULL,
    detected_amount numeric,
    amount_match boolean,
    detected_reference text,
    detected_sender text,
    detected_recipient text,
    detected_method text,
    detected_datetime text,
    recommendation text,
    warnings jsonb DEFAULT '[]'::jsonb,
    raw_response jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_ai_verifications ENABLE ROW LEVEL SECURITY;

-- Admins can read all verifications
CREATE POLICY "Admins can view AI verifications"
ON public.payment_ai_verifications
FOR SELECT
USING (public.get_admin_role() IN ('owner', 'admin'));

-- Service role can insert verifications
CREATE POLICY "Service role can insert AI verifications"
ON public.payment_ai_verifications
FOR INSERT
WITH CHECK (true); -- Requires service role key to bypass RLS or function with SECURITY DEFINER

-- Include in realtime publication for Admin UI
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_ai_verifications;
