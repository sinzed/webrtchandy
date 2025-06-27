import { PeerConnectionService } from './services/PeerConnectionService';
import { TcpProxyService, ControlMessage } from './services/TcpProxyService';
import { SignalingModule } from './modules/SignalingModule';

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

(async (): Promise<void> => {
  const peerService = new PeerConnectionService();
  const tcpProxy = new TcpProxyService();
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
    console.log('✅ DataChannel opened! Connection established.');
    console.log('Sending test message...');
    dataChannel.send('Hello from Peer A!');
  };

  dataChannel.onclose = () => {
    console.log('❌ DataChannel closed');
    tcpProxy.destroy();
  };

  dataChannel.onerror = (error) => {
    console.error('❌ DataChannel error:', error);
  };

  dataChannel.onmessage = (event: MessageEvent) => {
    console.log('📨 Received message:', event.data);
    if (typeof event.data === 'string') {
      try {
        const msg: ControlMessage = JSON.parse(event.data);
        if (msg.type === 'connect' && msg.host && msg.port) {
          console.log(`🔗 Connecting to TCP ${msg.host}:${msg.port}`);
          tcpProxy.connect(
            msg.host,
            msg.port,
            (data) => dataChannel.send(data),
            () => dataChannel.send(JSON.stringify({ type: 'closed' } as ControlMessage)),
            (err) => dataChannel.send(JSON.stringify({ type: 'error', message: err.message } as ControlMessage)),
            () => dataChannel.send(JSON.stringify({ type: 'connected' } as ControlMessage))
          );
        }
      } catch (e) {
        // Not a control message, just a regular message
        console.log('📨 Received text message:', event.data);
      }
    } else {
      console.log('📨 Received binary data, length:', event.data.byteLength);
      tcpProxy.write(Buffer.from(event.data));
    }
  };

  dataChannel.onclose = () => {
    tcpProxy.destroy();
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