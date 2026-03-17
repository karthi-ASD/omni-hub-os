import { supabase } from "@/integrations/supabase/client";

/**
 * Encrypt a plaintext value using server-side pgcrypto via edge function.
 */
export async function encryptField(plainText: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("vault-crypto", {
    body: { action: "encrypt", value: plainText },
  });
  if (error) throw error;
  return data.encrypted;
}

/**
 * Decrypt an encrypted value using server-side pgcrypto via edge function.
 * Requires record_id for audit trail purposes.
 */
export async function decryptField(cipherText: string, recordId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("vault-crypto", {
    body: { action: "decrypt", value: cipherText, record_id: recordId },
  });
  if (error) throw error;
  return data.decrypted;
}
