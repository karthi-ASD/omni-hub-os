import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  findEntityByPhone,
  normalizePhoneNumber,
  createCommunicationRecord,
  updateCommunicationOnAnswered,
  updateCommunicationOnEnded,
  saveCommunicationDisposition,
  attachTranscriptToCommunication,
  attachSynopsisToCommunication,
  createCallbackFromDisposition,
  createLeadFromColdCall,
  autoCompletePendingCallbacks,
  type PhoneMatchResult,
  type CommunicationRecord,
} from "@/services/crmCommunicationService";

export interface CrmCallContext {
  communicationId: string | null;
  matches: PhoneMatchResult[];
  selectedMatch: PhoneMatchResult | null;
  isExistingEntity: boolean;
  isNewColdCall: boolean;
  lookupDone: boolean;
  lookupLoading: boolean;
}

/**
 * Hook that bridges the dialer with CRM entity matching.
 * DOES NOT touch the core call path — it only creates/updates
 * communication records as a secondary async layer.
 */
export function useDialerCrmLink() {
  const { profile } = useAuth();
  const [crmContext, setCrmContext] = useState<CrmCallContext>({
    communicationId: null,
    matches: [],
    selectedMatch: null,
    isExistingEntity: false,
    isNewColdCall: false,
    lookupDone: false,
    lookupLoading: false,
  });
  const commIdRef = useRef<string | null>(null);

  // ── Pre-call: lookup phone across CRM ────────────────────────
  const lookupPhone = useCallback(async (phone: string): Promise<PhoneMatchResult[]> => {
    if (!profile?.business_id || !phone) return [];
    setCrmContext((c) => ({ ...c, lookupLoading: true }));
    try {
      const matches = await findEntityByPhone(profile.business_id, phone);
      const isExisting = matches.length > 0;

      // Do NOT auto-pick first match if multiple — require agent selection
      const autoSelect = matches.length === 1 ? matches[0] : null;

      setCrmContext({
        communicationId: null,
        matches,
        selectedMatch: autoSelect,
        isExistingEntity: isExisting,
        isNewColdCall: !isExisting,
        lookupDone: true,
        lookupLoading: false,
      });
      return matches;
    } catch {
      setCrmContext((c) => ({ ...c, lookupDone: true, lookupLoading: false }));
      return [];
    }
  }, [profile?.business_id]);

  // ── On call start: create communication record + auto-complete callbacks ──
  const onCallStarted = useCallback(async (
    phoneRaw: string,
    dialerSessionId?: string,
    match?: PhoneMatchResult | null,
    callerIdUsed?: string
  ) => {
    if (!profile?.business_id) return null;
    const norm = normalizePhoneNumber(phoneRaw);
    const selectedMatch = match || crmContext.selectedMatch;

    const comm = await createCommunicationRecord({
      business_id: profile.business_id,
      user_id: profile.user_id,
      phone_number_raw: phoneRaw,
      phone_number_normalized: norm,
      dialer_session_id: dialerSessionId,
      entity_type: selectedMatch?.entity_type,
      entity_id: selectedMatch?.entity_id,
      lead_id: selectedMatch?.lead_id || undefined,
      contact_id: selectedMatch?.contact_id || undefined,
      client_id: selectedMatch?.client_id || undefined,
      account_id: selectedMatch?.account_id || undefined,
      source_type: selectedMatch ? "existing_customer_call" : "cold_call",
      matched_name: selectedMatch?.matched_name || undefined,
      matched_business_name: selectedMatch?.matched_business_name || undefined,
      caller_id_used: callerIdUsed || undefined,
    });

    if (comm) {
      commIdRef.current = comm.id;
      setCrmContext((c) => ({ ...c, communicationId: comm.id }));

      // Auto-complete any pending callbacks for this phone/entity
      autoCompletePendingCallbacks(
        profile.business_id,
        norm,
        selectedMatch?.entity_id,
        comm.id
      ).catch((e) => console.error("CALLBACK_AUTO_COMPLETE_ERROR", e));
    }
    return comm;
  }, [profile, crmContext.selectedMatch]);

  // ── On connected ─────────────────────────────────────────────
  const onCallConnected = useCallback(async () => {
    if (commIdRef.current) {
      await updateCommunicationOnAnswered(commIdRef.current);
    }
  }, []);

  // ── On call ended ────────────────────────────────────────────
  const onCallEnded = useCallback(async (params: {
    duration_seconds?: number;
    talk_time_seconds?: number;
    recording_url?: string;
    call_status?: string;
  }) => {
    if (commIdRef.current) {
      await updateCommunicationOnEnded(commIdRef.current, params);
    }
  }, []);

  // ── Save disposition (auto-triggers callback if needed) ──────
  const saveDisposition = useCallback(async (
    disposition: string,
    notes?: string,
    callbackDatetime?: string,
    callbackReason?: string
  ) => {
    if (!commIdRef.current || !profile?.business_id) return;
    const callbackRequired =
      disposition === "callback_later" ||
      disposition === "callback_requested" ||
      disposition === "follow_up_required";

    await saveCommunicationDisposition(
      commIdRef.current,
      disposition,
      notes,
      callbackRequired,
      callbackDatetime,
      callbackReason,
      disposition === "converted" ? "converted" : undefined
    );

    // Auto-create callback record if needed
    if (callbackRequired && callbackDatetime) {
      const match = crmContext.selectedMatch;
      await createCallbackFromDisposition(
        profile.business_id,
        commIdRef.current,
        profile.user_id,
        callbackDatetime,
        callbackReason || `Follow-up after ${disposition}`,
        match?.entity_type,
        match?.entity_id,
        match?.lead_id || undefined,
        match?.client_id || undefined,
      );
    }
  }, [profile, crmContext.selectedMatch]);

  // ── Attach transcript ────────────────────────────────────────
  const saveTranscript = useCallback(async (transcript: string) => {
    if (commIdRef.current) {
      await attachTranscriptToCommunication(commIdRef.current, transcript);
    }
  }, []);

  // ── Attach AI synopsis ───────────────────────────────────────
  const saveSynopsis = useCallback(async (
    internal: string,
    customerSafe?: string,
    score?: number,
    sentiment?: string
  ) => {
    if (commIdRef.current) {
      await attachSynopsisToCommunication(commIdRef.current, internal, customerSafe, score, sentiment);
    }
  }, []);

  // ── Create lead from unmatched cold call ─────────────────────
  const createLeadFromCall = useCallback(async (
    phone: string,
    name?: string,
    company?: string
  ) => {
    if (!commIdRef.current || !profile?.business_id) return null;
    return createLeadFromColdCall(
      profile.business_id,
      profile.user_id,
      phone,
      commIdRef.current,
      name,
      company
    );
  }, [profile]);

  // ── Select a specific match (if multiple) ────────────────────
  const selectMatch = useCallback((match: PhoneMatchResult) => {
    setCrmContext((c) => ({
      ...c,
      selectedMatch: match,
      isExistingEntity: true,
      isNewColdCall: false,
    }));
  }, []);

  // ── Reset for new call ───────────────────────────────────────
  const resetCrmContext = useCallback(() => {
    commIdRef.current = null;
    setCrmContext({
      communicationId: null,
      matches: [],
      selectedMatch: null,
      isExistingEntity: false,
      isNewColdCall: false,
      lookupDone: false,
      lookupLoading: false,
    });
  }, []);

  return {
    crmContext,
    lookupPhone,
    onCallStarted,
    onCallConnected,
    onCallEnded,
    saveDisposition,
    saveTranscript,
    saveSynopsis,
    createLeadFromCall,
    selectMatch,
    resetCrmContext,
  };
}
