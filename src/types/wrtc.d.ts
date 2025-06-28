declare module 'wrtc' {
  export class RTCPeerConnection {
    constructor(configuration?: RTCConfiguration);
    createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel;
    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescription>;
    createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescription>;
    setLocalDescription(description: RTCSessionDescription): Promise<void>;
    setRemoteDescription(description: RTCSessionDescription): Promise<void>;
    localDescription: RTCSessionDescription | null;
    remoteDescription: RTCSessionDescription | null;
    ondatachannel: ((event: RTCDataChannelEvent) => void) | null;
    onconnectionstatechange: (() => void) | null;
    oniceconnectionstatechange: (() => void) | null;
    onicegatheringstatechange: (() => void) | null;
    onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
    connectionState: RTCConnectionState;
    iceConnectionState: RTCIceConnectionState;
    iceGatheringState: RTCIceGatheringState;
  }

  export class RTCSessionDescription {
    constructor(descriptionInitDict: RTCSessionDescriptionInit);
    type: RTCSdpType;
    sdp: string;
  }

  export interface RTCDataChannelEvent {
    channel: RTCDataChannel;
  }

  export interface RTCConfiguration {
    iceServers?: RTCIceServer[];
    bundlePolicy?: RTCBundlePolicy;
    iceCandidatePoolSize?: number;
    rtcpMuxPolicy?: RTCRtcpMuxPolicy;
    iceTransportPolicy?: RTCIceTransportPolicy;
  }

  export interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
  }

  export interface RTCDataChannelInit {
    ordered?: boolean;
    maxPacketLifeTime?: number;
    maxRetransmits?: number;
    protocol?: string;
    negotiated?: boolean;
    id?: number;
  }

  export interface RTCOfferOptions {
    offerToReceiveAudio?: boolean;
    offerToReceiveVideo?: boolean;
    voiceActivityDetection?: boolean;
    iceRestart?: boolean;
  }

  export interface RTCAnswerOptions {
    voiceActivityDetection?: boolean;
  }

  export interface RTCSessionDescriptionInit {
    type: RTCSdpType;
    sdp: string;
  }

  export type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';
  export type RTCConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  export type RTCIceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
  export type RTCIceGatheringState = 'new' | 'gathering' | 'complete';

  export interface RTCDataChannel extends EventTarget {
    label: string;
    ordered: boolean;
    maxPacketLifeTime: number | null;
    maxRetransmits: number | null;
    protocol: string;
    negotiated: boolean;
    id: number | null;
    readyState: RTCDataChannelState;
    bufferedAmount: number;
    bufferedAmountLowThreshold: number;
    onopen: ((this: RTCDataChannel, ev: Event) => any) | null;
    onclose: ((this: RTCDataChannel, ev: Event) => any) | null;
    onmessage: ((this: RTCDataChannel, ev: MessageEvent) => any) | null;
    onerror: ((this: RTCDataChannel, ev: Event) => any) | null;
    send(data: string | Buffer | ArrayBuffer | ArrayBufferView): void;
    close(): void;
  }

  export type RTCDataChannelState = 'connecting' | 'open' | 'closing' | 'closed';

  export type RTCBundlePolicy = 'balanced' | 'max-bundle' | 'max-compat';
  export type RTCRtcpMuxPolicy = 'require' | 'negotiate';
  export type RTCIceTransportPolicy = 'all' | 'relay';

  export interface RTCPeerConnectionIceEvent {
    candidate: RTCIceCandidate | null;
  }

  export interface RTCIceCandidate {
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
    type: RTCIceCandidateType;
    protocol: RTCIceProtocol;
    address: string;
  }

  export type RTCIceCandidateType = 'host' | 'srflx' | 'prflx' | 'relay';
  export type RTCIceProtocol = 'udp' | 'tcp';
} 