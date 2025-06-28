import wrtc from 'wrtc';

export class EnhancedSdpService {
  
  /**
   * Creates an enhanced offer with browser-like SDP structure
   */
  static async createEnhancedOffer(pc: wrtc.RTCPeerConnection): Promise<wrtc.RTCSessionDescription> {
    // Create the initial offer
    const offer = await pc.createOffer();
    
    // For now, just return the original offer without modification
    // to avoid SDP format issues
    return offer;
  }
  
  /**
   * Creates a more comprehensive ICE configuration
   */
  static createComprehensiveIceConfig(): wrtc.RTCConfiguration {
    return {
      iceServers: [
        // Primary STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Additional STUN servers for redundancy
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.schlund.de' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' },
        { urls: 'stun:stun.voxgratia.org' },
        
        // TURN servers for relay
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
        {
          urls: 'turn:relay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:relay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 25, // Increased for more candidates
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    };
  }
  
  /**
   * Analyzes and logs SDP statistics for debugging
   */
  static analyzeSdp(sdp: string): void {
    const lines = sdp.split('\r\n');
    const candidates = lines.filter(line => line.startsWith('a=candidate:'));
    const mediaSections = lines.filter(line => line.startsWith('m='));
    
    console.log('📊 SDP Analysis:');
    console.log(`   Total lines: ${lines.length}`);
    console.log(`   ICE candidates: ${candidates.length}`);
    console.log(`   Media sections: ${mediaSections.length}`);
    
    // Analyze candidate types
    const candidateTypes = candidates.map(c => {
      const parts = c.split(' ');
      return parts[7] || 'unknown'; // typ field with fallback
    });
    
    const typeCounts = candidateTypes.reduce((acc, type) => {
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    console.log('   Candidate types:', typeCounts);
  }
} 