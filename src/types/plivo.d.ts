// Plivo Browser SDK v2 type declarations
declare namespace Plivo {
  interface ClientOptions {
    debug?: "ALL" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "OFF";
    permOnClick?: boolean;
    enableTracking?: boolean;
    closeProtection?: boolean;
    maxAverageBitrate?: number;
    dscp?: boolean;
    allowMultipleIncomingCalls?: boolean;
  }

  interface CallInfo {
    callUUID: string;
    src: string;
    dest: string;
    state: string;
    direction: string;
  }

  interface MediaPermissionResult {
    status: boolean;
    stream?: MediaStream;
  }

  class Client {
    login(username: string, password: string): void;
    logout(): void;
    call(dest: string, extraHeaders?: Record<string, string>): void;
    hangup(): void;
    mute(): void;
    unmute(): void;
    isMuted(): boolean;
    sendDtmf(digit: string): void;
    setRingTone(enabled: boolean): void;
    setRingToneBack(enabled: boolean): void;
    on(event: "onWebrtcNotSupported", handler: () => void): void;
    on(event: "onLogin", handler: () => void): void;
    on(event: "onLoginFailed", handler: (cause: string) => void): void;
    on(event: "onLogout", handler: () => void): void;
    on(event: "onCallRemoteRinging", handler: (callInfo: CallInfo) => void): void;
    on(event: "onCallAnswered", handler: (callInfo: CallInfo) => void): void;
    on(event: "onCallTerminated", handler: (callInfo: CallInfo) => void): void;
    on(event: "onCallFailed", handler: (cause: string) => void): void;
    on(event: "onMediaPermission", handler: (result: MediaPermissionResult) => void): void;
    on(event: "onIncomingCall", handler: (callerName: string, extraHeaders: Record<string, string>) => void): void;
    on(event: "onIncomingCallCanceled", handler: () => void): void;
    on(event: "onConnectionChange", handler: (state: { state: string }) => void): void;
    on(event: string, handler: (...args: any[]) => void): void;
  }
}

interface PlivoBrowserSDK {
  client: Plivo.Client;
}

interface PlivoConstructor {
  new (options?: Plivo.ClientOptions): PlivoBrowserSDK;
}

interface Window {
  Plivo: PlivoConstructor;
}
