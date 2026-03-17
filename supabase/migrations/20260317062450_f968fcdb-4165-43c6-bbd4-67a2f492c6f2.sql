
-- Phase 2: Enable pgcrypto + encryption helpers + auto-status trigger

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Encryption/decryption helpers using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_field(plain_text text, passphrase text DEFAULT 'nextweb-vault-key-2026')
RETURNS text
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT encode(extensions.pgp_sym_encrypt(plain_text, passphrase), 'base64')
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_field(cipher_text text, passphrase text DEFAULT 'nextweb-vault-key-2026')
RETURNS text
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT extensions.pgp_sym_decrypt(decode(cipher_text, 'base64'), passphrase)
$$;

-- 2. Auto-update credential status based on expiry_date
CREATE OR REPLACE FUNCTION public.auto_update_credential_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date::date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiry_date::date <= (CURRENT_DATE + (COALESCE(NEW.reminder_days, 30) || ' days')::interval) THEN
      NEW.status := 'expiring_soon';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_credential_status ON public.client_access_credentials;
CREATE TRIGGER trg_auto_credential_status
  BEFORE INSERT OR UPDATE ON public.client_access_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_credential_status();

-- 3. Batch status refresh function (called by cron daily)
CREATE OR REPLACE FUNCTION public.refresh_credential_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.client_access_credentials
  SET status = 'expired', updated_at = now()
  WHERE expiry_date IS NOT NULL
    AND expiry_date::date < CURRENT_DATE
    AND status != 'expired'
    AND is_archived = false;

  UPDATE public.client_access_credentials
  SET status = 'expiring_soon', updated_at = now()
  WHERE expiry_date IS NOT NULL
    AND expiry_date::date >= CURRENT_DATE
    AND expiry_date::date <= (CURRENT_DATE + (COALESCE(reminder_days, 30) || ' days')::interval)
    AND status NOT IN ('expired', 'expiring_soon')
    AND is_archived = false;

  UPDATE public.client_access_credentials
  SET status = 'active', updated_at = now()
  WHERE expiry_date IS NOT NULL
    AND expiry_date::date > (CURRENT_DATE + (COALESCE(reminder_days, 30) || ' days')::interval)
    AND status IN ('expired', 'expiring_soon')
    AND is_archived = false;
END;
$$;
