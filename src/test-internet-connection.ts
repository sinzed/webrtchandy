import { PeerConnectionService } from './services/PeerConnectionService';
import { SignalingModule } from './modules/SignalingModule';
import wrtc from 'wrtc';

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

(async (): Promise<void> => {
  console.log('🌐 Testing WebRTC Internet Connectivity');
  console.log('=====================================');
  
  const peerService = new PeerConnectionService();
  const dataChannel = peerService.dataChannel;

  // Enhanced connection state monitoring
  peerService.pc.onconnectionstatechange = () => {
    console.log('🔗 Connection state:', peerService.pc.connectionState);
    if (peerService.pc.connectionState === 'connected') {
      console.log('✅ WebRTC connection established successfully!');
    } else if (peerService.pc.connectionState === 'failed') {
      console.log('❌ WebRTC connection failed - check network/firewall settings');
    }
  };

  peerService.pc.oniceconnectionstatechange = () => {
    console.log('🧊 ICE connection state:', peerService.pc.iceConnectionState);
    if (peerService.pc.iceConnectionState === 'connected') {
      console.log('✅ ICE connection established!');
    } else if (peerService.pc.iceConnectionState === 'failed') {
      console.log('❌ ICE connection failed - may need TURN server');
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
    }
  };

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
  } catch (e) {
    console.error('❌ Failed to set remote answer:', e);
  }
})(); 