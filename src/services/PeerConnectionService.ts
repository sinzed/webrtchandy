import wrtc from 'wrtc';

export class PeerConnectionService {
  public pc: wrtc.RTCPeerConnection;
  public dataChannel: wrtc.RTCDataChannel;

  constructor(configuration?: wrtc.RTCConfiguration) {
    const defaultConfig: wrtc.RTCConfiguration = {
      iceServers: [
        // STUN servers for NAT traversal
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.schlund.de' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' },
        { urls: 'stun:stun.voxgratia.org' },
        // TURN servers for relay when direct connection fails
        { 
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        { 
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        { 
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      bundlePolicy: 'max-bundle',
      iceCandidatePoolSize: 10,
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    };

    const finalConfig = configuration || defaultConfig;
    this.pc = new wrtc.RTCPeerConnection(finalConfig);
    this.dataChannel = this.pc.createDataChannel('proxy');
    
    // Add ICE candidate monitoring for debugging
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE Candidate:', event.candidate.type, event.candidate.protocol, event.candidate.address);
      } else {
        console.log('✅ ICE gathering complete');
      }
    };
    
    this.pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', this.pc.iceGatheringState);
    };
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