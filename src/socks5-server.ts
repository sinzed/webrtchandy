import { PeerConnectionService } from './services/PeerConnectionService';
import { Socks5ProxyService, ControlMessage } from './services/Socks5ProxyService';
import { SignalingModule } from './modules/SignalingModule';

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

(async (): Promise<void> => {
  const peerService = new PeerConnectionService();
  const dataChannel = peerService.dataChannel;

  // Add connection state monitoring
  peerService.pc.onconnectionstatechange = () => {
    console.log('Connection state:', peerService.pc.connectionState);
  };

  peerService.pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerService.pc.iceConnectionState);
  };

  // Monitor data channel state
  dataChannel.onopen = () => {
    console.log('✅ DataChannel opened! SOCKS5 proxy ready.');
    
    // Start SOCKS5 proxy server
    const socks5Proxy = new Socks5ProxyService(dataChannel);
    socks5Proxy.start(1080); // Default SOCKS5 port
    
    // Handle incoming data from remote peer
    dataChannel.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const msg: ControlMessage = JSON.parse(event.data);
          if (msg.type === 'connected' && msg.connectionId) {
            socks5Proxy.handleRemoteConnectionStatus(msg.connectionId, 'connected');
          } else if (msg.type === 'closed' && msg.connectionId) {
            socks5Proxy.handleRemoteConnectionStatus(msg.connectionId, 'closed');
          } else if (msg.type === 'error' && msg.connectionId) {
            socks5Proxy.handleRemoteConnectionStatus(msg.connectionId, 'error', msg.message);
          } else if (msg.type === 'data' && msg.connectionId && msg.data) {
            socks5Proxy.handleRemoteData(msg.connectionId, Buffer.from(msg.data));
          }
        } catch (e) {
          console.error('Invalid control message:', e);
        }
      } else {
        console.log('📨 Received binary data, length:', event.data.byteLength);
      }
    };
  };

  dataChannel.onclose = () => {
    console.log('❌ DataChannel closed');
  };

  dataChannel.onerror = (error) => {
    console.error('❌ DataChannel error:', error);
  };

  // Manual signaling: create offer, print, accept answer
  await peerService.createOffer();
  SignalingModule.printOffer(peerService.pc.localDescription);
  const answerStr = await SignalingModule.getRemoteAnswer();
  try {
    const answer: RTCSessionDescription = JSON.parse(answerStr);
    await peerService.setRemoteDescription(answer);
    console.log('Remote answer set. Waiting for data channel connection...');
    console.log('Current connection state:', peerService.pc.connectionState);
    console.log('Current ICE connection state:', peerService.pc.iceConnectionState);
  } catch (e) {
    console.error('Failed to set remote answer:', e);
  }
})(); 