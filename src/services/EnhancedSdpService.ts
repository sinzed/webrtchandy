import wrtc from 'wrtc';

export class EnhancedSdpService {
  
  /**
   * Creates an enhanced offer with browser-like SDP structure
   */
  static async createEnhancedOffer(pc: wrtc.RTCPeerConnection): Promise<wrtc.RTCSessionDescription> {
    // Create the initial offer
    const offer = await pc.createOffer();
    
    // Enhance the SDP with additional attributes for better compatibility
    let enhancedSdp = offer.sdp;
    
    // Add additional SDP attributes for better browser compatibility
    enhancedSdp = this.addEnhancedSdpAttributes(enhancedSdp);
    
    // Create enhanced offer
    const enhancedOffer = new wrtc.RTCSessionDescription({
      type: 'offer',
      sdp: enhancedSdp
    });
    
    return enhancedOffer;
  }
  
  /**
   * Adds browser-like SDP attributes for better compatibility
   */
  private static addEnhancedSdpAttributes(sdp: string): string {
    let enhancedSdp = sdp;
    
    // Add additional session-level attributes
    const sessionAttributes = [
      'a=ice-options:trickle',
      'a=group:BUNDLE 0',
      'a=extmap-allow-mixed',
      'a=msid-semantic: WMS'
    ];
    
    // Insert session attributes after the timing line
    const timingLineIndex = enhancedSdp.indexOf('t=0 0');
    if (timingLineIndex !== -1) {
      const afterTiming = enhancedSdp.indexOf('\r\n', timingLineIndex) + 2;
      enhancedSdp = enhancedSdp.slice(0, afterTiming) + 
                   sessionAttributes.join('\r\n') + '\r\n' + 
                   enhancedSdp.slice(afterTiming);
    }
    
    // Add media-level attributes for better compatibility
    enhancedSdp = this.addMediaLevelAttributes(enhancedSdp);
    
    return enhancedSdp;
  }
  
  /**
   * Adds media-level attributes for better browser compatibility
   */
  private static addMediaLevelAttributes(sdp: string): string {
    let enhancedSdp = sdp;
    
    // Find media sections and enhance them
    const mediaSections = enhancedSdp.split('m=');
    
    for (let i = 1; i < mediaSections.length; i++) {
      const mediaSection = mediaSections[i];
      if (!mediaSection) continue;
      
      const mediaType = mediaSection.split(' ')[0];
      
      if (mediaType === 'application') {
        // Add application-specific attributes
        const enhancedMediaSection = this.addApplicationMediaAttributes(mediaSection);
        mediaSections[i] = enhancedMediaSection;
      }
    }
    
    return 'm=' + mediaSections.slice(1).join('m=');
  }
  
  /**
   * Adds application media attributes for data channels
   */
  private static addApplicationMediaAttributes(mediaSection: string): string {
    const additionalAttributes = [
      'a=mid:0',
      'a=sctp-port:5000',
      'a=max-message-size:262144',
      'a=setup:actpass',
      'a=ice-options:trickle'
    ];
    
    return mediaSection + '\r\n' + additionalAttributes.join('\r\n');
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