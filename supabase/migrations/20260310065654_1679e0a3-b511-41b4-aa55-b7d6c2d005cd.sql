CREATE POLICY "Public can read active businesses by slug"
ON public.businesses
FOR SELECT
TO anon
USING (status = 'active');