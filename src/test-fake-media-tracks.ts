import wrtc from 'wrtc';
import { MediaTrackService } from './services/MediaTrackService';
import { EnhancedSdpService } from './services/EnhancedSdpService';

(async (): Promise<void> => {
  console.log('🎭 Testing Fake Media Tracks for Browser-Like SDP');
  console.log('=================================================');
  
  // First, check wrtc media support
  MediaTrackService.checkMediaSupport();
  console.log('');
  
  // Test 1: Without fake media tracks (data channel only)
  console.log('📊 TEST 1: Data Channel Only (No Media Tracks)');
  console.log('==============================================');
  
  const pc1 = new wrtc.RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  pc1.createDataChannel('test');
  const offer1 = await pc1.createOffer();
  await pc1.setLocalDescription(offer1);
  
  // Wait for ICE gathering
  setTimeout(async () => {
    if (pc1.localDescription) {
      console.log('📋 SDP WITHOUT Media Tracks:');
      EnhancedSdpService.analyzeSdp(pc1.localDescription.sdp);
      
      // Check for media sections
      const lines = pc1.localDescription.sdp.split('\r\n');
      const mediaSections = lines.filter(line => line.startsWith('m='));
      console.log('   Media sections found:', mediaSections);
      console.log('');
      
      // Test 2: With fake media tracks
      console.log('📊 TEST 2: With Fake Media Tracks');
      console.log('=================================');
      
      const pc2 = new wrtc.RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Add fake media tracks
      MediaTrackService.addFakeMediaTracks(pc2);
      
      pc2.createDataChannel('test');
      const offer2 = await pc2.createOffer();
      await pc2.setLocalDescription(offer2);
      
      // Wait for ICE gathering
      setTimeout(() => {
        if (pc2.localDescription && pc1.localDescription) {
          console.log('📋 SDP WITH Media Tracks:');
          EnhancedSdpService.analyzeSdp(pc2.localDescription.sdp);
          
          // Check for media sections
          const lines2 = pc2.localDescription.sdp.split('\r\n');
          const mediaSections2 = lines2.filter(line => line.startsWith('m='));
          console.log('   Media sections found:', mediaSections2);
          
          console.log('\n📊 COMPARISON:');
          console.log('==============');
          console.log('Without media tracks:');
          console.log('   - SDP length:', pc1.localDescription.sdp.length);
          console.log('   - Media sections:', mediaSections.length);
          console.log('   - SDP type: Data channel only');
          
          console.log('\nWith fake media tracks:');
          console.log('   - SDP length:', pc2.localDescription.sdp.length);
          console.log('   - Media sections:', mediaSections2.length);
          console.log('   - SDP type: Audio + Video + Data channel');
          
          console.log('\n✅ Benefits of Fake Media Tracks:');
          console.log('==================================');
          console.log('✅ SDP looks more like browser-generated SDP');
          console.log('✅ Better compatibility with browser WebRTC');
          console.log('✅ Includes audio/video media sections');
          console.log('✅ More comprehensive SDP structure');
          console.log('✅ May improve interoperability with some systems');
          
          process.exit(0);
        }
      }, 15000);
    }
  }, 15000);
})(); 