import wrtc from 'wrtc';

export class PeerConnectionService {
  public pc: wrtc.RTCPeerConnection;
  public dataChannel: wrtc.RTCDataChannel;

  constructor(configuration?: wrtc.RTCConfiguration) {
    const defaultConfig: wrtc.RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    };

    const finalConfig = configuration || defaultConfig;
    this.pc = new wrtc.RTCPeerConnection(finalConfig);
    this.dataChannel = this.pc.createDataChannel('proxy');
  }

  async createOffer(): Promise<wrtc.RTCSessionDescription> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async setRemoteDescription(answer: wrtc.RTCSessionDescription): Promise<void> {
    await this.pc.setRemoteDescription(new wrtc.RTCSessionDescription(answer));
  }
} 