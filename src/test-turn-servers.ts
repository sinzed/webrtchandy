import wrtc from 'wrtc';

(async (): Promise<void> => {
  console.log('🧊 Testing TURN Server Connectivity');
  console.log('==================================');
  console.log('This test will check if TURN servers are accessible.');
  console.log('');

  // Create a minimal peer connection to test TURN servers
  const pc = new wrtc.RTCPeerConnection({
    iceServers: [
      // Test with just TURN servers
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
        urls: 'turn:relay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  });

  let turnCandidatesFound = 0;
  let totalCandidates = 0;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      totalCandidates++;
      console.log(`🧊 Candidate ${totalCandidates}:`, event.candidate.type, event.candidate.protocol, event.candidate.address);
      
      if (event.candidate.type === 'relay') {
        turnCandidatesFound++;
        console.log(`✅ TURN candidate found: ${event.candidate.address}`);
      }
    } else {
      console.log('✅ ICE gathering complete');
      console.log(`📊 Summary: ${totalCandidates} total candidates, ${turnCandidatesFound} TURN candidates`);
      
      if (turnCandidatesFound > 0) {
        console.log('✅ TURN servers are accessible!');
      } else {
        console.log('❌ No TURN candidates found - TURN servers may be blocked');
        console.log('💡 This could be due to:');
        console.log('   - Firewall blocking TURN traffic');
        console.log('   - Network restrictions');
        console.log('   - TURN servers being down');
      }
    }
  };

  pc.onicegatheringstatechange = () => {
    console.log('🧊 ICE gathering state:', pc.iceGatheringState);
  };

  // Create a data channel to trigger ICE gathering
  
  console.log('📤 Creating offer to test TURN servers...');
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  
  console.log('⏳ Waiting for ICE candidates...');
  
  // Wait for ICE gathering to complete
  setTimeout(() => {
    console.log('⏰ Test completed');
    process.exit(0);
  }, 15000); // 15 seconds
})(); 