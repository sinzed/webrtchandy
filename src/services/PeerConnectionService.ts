import wrtc from 'wrtc';

export class PeerConnectionService {
  public pc: wrtc.RTCPeerConnection;
  public dataChannel: wrtc.RTCDataChannel;
  private connectionTimeout: NodeJS.Timeout | null = null;

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
        },
        // Additional TURN servers for better reliability
        {
          urls: 'turn:relay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:relay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:relay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        // Free TURN server from Twilio (no auth required for testing)
        {
          urls: 'turn:openrelay.metered.ca:80?transport=udp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:80?transport=tcp',
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
        // Reset timeout when we get new candidates
        this.resetConnectionTimeout();
      } else {
        console.log('✅ ICE gathering complete');
      }
    };
    
    this.pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', this.pc.iceGatheringState);
    };

    // Add connection timeout
    this.startConnectionTimeout();
  }

  private startConnectionTimeout(): void {
    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    // Set 30 second timeout for connection
    this.connectionTimeout = setTimeout(() => {
      console.log('⏰ Connection timeout - checking connection state...');
      console.log('Current connection state:', this.pc.connectionState);
      console.log('Current ICE connection state:', this.pc.iceConnectionState);
      
      if (this.pc.connectionState === 'connecting') {
        console.log('⚠️  Connection taking too long - this may indicate:');
        console.log('   1. Firewall blocking WebRTC traffic');
        console.log('   2. TURN servers not accessible');
        console.log('   3. Network restrictions preventing P2P');
        console.log('   4. Try using a different network (mobile hotspot)');
      }
    }, 30000); // 30 seconds
  }

  private resetConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
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