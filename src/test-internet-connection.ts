import { PeerConnectionService } from './services/PeerConnectionService';
import { SignalingModule } from './modules/SignalingModule';

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

(async (): Promise<void> => {
  console.log('🌐 Testing WebRTC Internet Connectivity');
  console.log('=====================================');
  console.log('This test will help diagnose internet connectivity issues.');
  console.log('');
  
  const peerService = new PeerConnectionService();
  const dataChannel = peerService.dataChannel;

  let connectionEstablished = false;
  let timeoutId: NodeJS.Timeout;

  // Enhanced connection state monitoring
  peerService.pc.onconnectionstatechange = () => {
    console.log('🔗 Connection state:', peerService.pc.connectionState);
    if (peerService.pc.connectionState === 'connected') {
      console.log('✅ WebRTC connection established successfully!');
      connectionEstablished = true;
      if (timeoutId) clearTimeout(timeoutId);
    } else if (peerService.pc.connectionState === 'failed') {
      console.log('❌ WebRTC connection failed - check network/firewall settings');
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  peerService.pc.oniceconnectionstatechange = () => {
    console.log('🧊 ICE connection state:', peerService.pc.iceConnectionState);
    if (peerService.pc.iceConnectionState === 'connected') {
      console.log('✅ ICE connection established!');
    } else if (peerService.pc.iceConnectionState === 'failed') {
      console.log('❌ ICE connection failed - may need TURN server');
      console.log('💡 This usually means:');
      console.log('   - Both peers are behind restrictive NATs');
      console.log('   - Firewall is blocking P2P connections');
      console.log('   - TURN servers are not accessible');
    } else if (peerService.pc.iceConnectionState === 'checking') {
      console.log('⏳ ICE checking in progress...');
    }
  };

  peerService.pc.onicegatheringstatechange = () => {
    console.log('🧊 ICE gathering state:', peerService.pc.iceGatheringState);
  };

  // Monitor data channel state
  dataChannel.onopen = () => {
    console.log('✅ DataChannel opened! Internet connectivity test ready.');
    console.log('📤 Sending test message...');
    dataChannel.send('Hello from internet test!');
  };

  dataChannel.onclose = () => {
    console.log('❌ DataChannel closed');
  };

  dataChannel.onerror = (error) => {
    console.error('❌ DataChannel error:', error);
  };

  dataChannel.onmessage = (event: MessageEvent) => {
    console.log('📨 Received message:', event.data);
    if (typeof event.data === 'string') {
      console.log('✅ Internet connectivity test successful!');
      console.log('🌐 Your WebRTC connection is working across the internet.');
      connectionEstablished = true;
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  // Set up connection timeout
  timeoutId = setTimeout(() => {
    if (!connectionEstablished) {
      console.log('');
      console.log('⏰ Connection timeout reached!');
      console.log('📊 Current status:');
      console.log('   Connection state:', peerService.pc.connectionState);
      console.log('   ICE connection state:', peerService.pc.iceConnectionState);
      console.log('   ICE gathering state:', peerService.pc.iceGatheringState);
      console.log('');
      console.log('🔧 Troubleshooting steps:');
      console.log('   1. Check if both peers are on different networks');
      console.log('   2. Try using mobile hotspot on one peer');
      console.log('   3. Check firewall/antivirus settings');
      console.log('   4. Verify TURN servers are accessible');
      console.log('   5. Try from different network locations');
    }
  }, 45000); // 45 seconds

  // Manual signaling: create offer, print, accept answer
  console.log('📤 Creating offer...');
  await peerService.createOffer();
  
  console.log('\n--- COPY THIS OFFER TO REMOTE PEER ---');
  SignalingModule.printOffer(peerService.pc.localDescription);
  
  console.log('\n📥 Waiting for answer from remote peer...');
  const answerStr = await SignalingModule.getRemoteAnswer();
  
  try {
    const answer: RTCSessionDescription = JSON.parse(answerStr);
    await peerService.setRemoteDescription(answer);
    console.log('✅ Remote answer set successfully');
    console.log('⏳ Waiting for connection establishment...');
    console.log('Current connection state:', peerService.pc.connectionState);
    console.log('Current ICE connection state:', peerService.pc.iceConnectionState);
    
    // Wait for connection or timeout
    console.log('⏰ Waiting up to 45 seconds for connection...');
  } catch (e) {
    console.error('❌ Failed to set remote answer:', e);
    if (timeoutId) clearTimeout(timeoutId);
  }
})(); 