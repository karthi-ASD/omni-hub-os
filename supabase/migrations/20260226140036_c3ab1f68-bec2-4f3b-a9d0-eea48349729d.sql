
-- Tighten proposal_views insert: require valid proposal_id
DROP POLICY "Anyone can insert proposal views" ON public.proposal_views;
CREATE POLICY "Insert proposal views with valid proposal" ON public.proposal_views FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals WHERE id = proposal_id));

-- Tighten signatures insert: require valid contract_id  
DROP POLICY "Anyone can insert signatures" ON public.signatures;
CREATE POLICY "Insert signatures with valid contract" ON public.signatures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.contracts WHERE id = contract_id));
