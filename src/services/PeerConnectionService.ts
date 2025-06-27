import wrtc from 'wrtc';

export class PeerConnectionService {
  public pc: wrtc.RTCPeerConnection;
  public dataChannel: wrtc.RTCDataChannel;

  constructor() {
    this.pc = new wrtc.RTCPeerConnection();
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