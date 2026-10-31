-- Add editable signatory designation to saved EHO offer letters.
ALTER TABLE public.eho_offer_letters
  ADD COLUMN IF NOT EXISTS signatory_title text NOT NULL DEFAULT 'Authorized Signatory'
  CHECK (length(trim(signatory_title)) BETWEEN 1 AND 100);

CREATE OR REPLACE FUNCTION public.update_eho_offer_letter(
  p_offer_letter_id text,
  p_recipient_name text,
  p_program_name text,
  p_participation text,
  p_duration text,
  p_start_date date,
  p_end_date date,
  p_issue_date date,
  p_issuer_name text,
  p_signatory_name text DEFAULT NULL,
  p_details text DEFAULT NULL,
  p_signatory_title text DEFAULT 'Authorized Signatory'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_eho_admin() THEN
    RAISE EXCEPTION 'Administrator authorization required';
  END IF;

  IF length(trim(coalesce(p_offer_letter_id,''))) NOT BETWEEN 1 AND 100
     OR length(trim(coalesce(p_recipient_name,''))) NOT BETWEEN 1 AND 160
     OR length(trim(coalesce(p_program_name,''))) NOT BETWEEN 1 AND 180
     OR length(trim(coalesce(p_participation,''))) NOT BETWEEN 1 AND 240
     OR length(trim(coalesce(p_duration,''))) NOT BETWEEN 1 AND 80
     OR length(trim(coalesce(p_issuer_name,''))) NOT BETWEEN 1 AND 180
     OR length(trim(coalesce(p_signatory_title,''))) NOT BETWEEN 1 AND 100
     OR length(coalesce(p_details,'')) > 1200
     OR p_start_date IS NULL OR p_end_date IS NULL
     OR p_end_date < p_start_date OR p_issue_date IS NULL THEN
    RAISE EXCEPTION 'Invalid offer letter input';
  END IF;

  UPDATE public.eho_offer_letters
     SET recipient_name = trim(p_recipient_name),
         program_name = trim(p_program_name),
         participation = trim(p_participation),
         duration = trim(p_duration),
         start_date = p_start_date,
         end_date = p_end_date,
         issue_date = p_issue_date,
         issuer_name = trim(p_issuer_name),
         signatory_name = nullif(trim(coalesce(p_signatory_name,'')),''),
         signatory_title = trim(p_signatory_title),
         details = nullif(trim(coalesce(p_details,'')),'')
   WHERE offer_letter_id = trim(p_offer_letter_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer letter not found';
  END IF;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.update_eho_offer_letter(
  text,text,text,text,text,date,date,date,text,text,text,text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.update_eho_offer_letter(
  text,text,text,text,text,date,date,date,text,text,text,text
) TO authenticated;

NOTIFY pgrst, 'reload schema';
