import wrtc from 'wrtc';
import { EnhancedSdpService } from './EnhancedSdpService';
import { MediaTrackService } from './MediaTrackService';

export class PeerConnectionService {
  public pc: wrtc.RTCPeerConnection;
  public dataChannel: wrtc.RTCDataChannel;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private iceGatheringTimeout: NodeJS.Timeout | null = null;

  constructor(configuration?: wrtc.RTCConfiguration) {
    // Use enhanced ICE configuration for better connectivity
    const defaultConfig = EnhancedSdpService.createComprehensiveIceConfig();
    const finalConfig = configuration || defaultConfig;
    
    this.pc = new wrtc.RTCPeerConnection(finalConfig);
    
    // Add fake media tracks for browser-like SDP
    MediaTrackService.addFakeMediaTracks(this.pc);
    
    // Create data channel after adding media tracks
    this.dataChannel = this.pc.createDataChannel('proxy');
    
    // Enhanced ICE candidate monitoring
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE Candidate:', event.candidate.type, event.candidate.protocol, event.candidate.address);
        this.resetConnectionTimeout();
      } else {
        console.log('✅ ICE gathering complete');
        this.onIceGatheringComplete();
      }
    };
    
    this.pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', this.pc.iceGatheringState);
      
      if (this.pc.iceGatheringState === 'gathering') {
        this.startIceGatheringTimeout();
      }
    };

    // Enhanced connection monitoring
    this.pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', this.pc.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', this.pc.iceConnectionState);
    };

    // Add connection timeout
    this.startConnectionTimeout();
  }

  private startIceGatheringTimeout(): void {
    if (this.iceGatheringTimeout) {
      clearTimeout(this.iceGatheringTimeout);
    }
    
    this.iceGatheringTimeout = setTimeout(() => {
      console.log('⏰ ICE gathering timeout - proceeding with current candidates');
      this.onIceGatheringComplete();
    }, 30000); // Increased from 10 seconds to 30 seconds
  }

  private onIceGatheringComplete(): void {
    if (this.iceGatheringTimeout) {
      clearTimeout(this.iceGatheringTimeout);
      this.iceGatheringTimeout = null;
    }
    
    // Analyze the generated SDP
    if (this.pc.localDescription) {
      EnhancedSdpService.analyzeSdp(this.pc.localDescription.sdp);
    }
  }

  private startConnectionTimeout(): void {
    this.connectionTimeout = setTimeout(() => {
      console.log('⏰ Connection timeout reached');
      console.log('📊 Current status:');
      console.log('   Connection state:', this.pc.connectionState);
      console.log('   ICE connection state:', this.pc.iceConnectionState);
      console.log('   ICE gathering state:', this.pc.iceGatheringState);
      
      // Provide more detailed troubleshooting information
      if (this.pc.iceConnectionState === 'failed') {
        console.log('\n🔧 Troubleshooting suggestions:');
        console.log('   1. Check if both peers are on different networks');
        console.log('   2. Try using mobile hotspot on one peer');
        console.log('   3. Check firewall/antivirus settings');
        console.log('   4. Verify TURN servers are accessible');
        console.log('   5. Try from different network locations');
        console.log('   6. Consider using a VPN or different network');
      }
    }, 60000); // Increased from 30 seconds to 60 seconds
  }

  private resetConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    this.startConnectionTimeout();
  }

  async createOffer(): Promise<wrtc.RTCSessionDescription> {
    console.log('📤 Creating offer with fake media tracks...');
    
    // Use standard createOffer to avoid SDP format issues
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    
    console.log('✅ Offer created and set with fake media tracks');
    return offer;
  }

  async setRemoteDescription(answer: wrtc.RTCSessionDescription): Promise<void> {
    await this.pc.setRemoteDescription(new wrtc.RTCSessionDescription(answer));
  }

  destroy(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    if (this.iceGatheringTimeout) {
      clearTimeout(this.iceGatheringTimeout);
    }
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    // wrtc RTCPeerConnection doesn't have a close() method
    // The connection will be garbage collected when references are cleared
  }
} 