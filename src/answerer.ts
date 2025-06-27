import { PeerConnectionService } from './services/PeerConnectionService';
import { TcpProxyService, ControlMessage } from './services/TcpProxyService';
import wrtc from 'wrtc';
import readline from 'readline';

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

(async (): Promise<void> => {
  const peerService = new PeerConnectionService();
  const tcpProxy = new TcpProxyService();
  
  // Add connection state monitoring
  peerService.pc.onconnectionstatechange = () => {
    console.log('Connection state:', peerService.pc.connectionState);
  };

  peerService.pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerService.pc.iceConnectionState);
  };

  peerService.pc.onicegatheringstatechange = () => {
    console.log('ICE gathering state:', peerService.pc.iceGatheringState);
  };
  
  // For answerer, we need to listen for the data channel from the offerer
  peerService.pc.ondatachannel = (event: wrtc.RTCDataChannelEvent) => {
    const dataChannel = event.channel;
    
    // Monitor data channel state
    dataChannel.onopen = () => {
      console.log('✅ DataChannel opened! Connection established.');
    };

    dataChannel.onclose = () => {
      console.log('❌ DataChannel closed');
      tcpProxy.destroy();
    };

    dataChannel.onerror = (error) => {
      console.error('❌ DataChannel error:', error);
    };
    
    dataChannel.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const msg: ControlMessage = JSON.parse(event.data);
          if (msg.type === 'connect' && msg.host && msg.port) {
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
          console.error('Invalid control message:', e);
        }
      } else {
        tcpProxy.write(Buffer.from(event.data));
      }
    };

    dataChannel.onclose = () => {
      tcpProxy.destroy();
    };
  };

  // Manual signaling: receive offer, create answer
  console.log('Waiting for offer from remote peer...');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  rl.question('Paste the offer JSON from the remote peer:\n', async (offerStr: string) => {
    try {
      const offer: RTCSessionDescription = JSON.parse(offerStr);
      await peerService.pc.setRemoteDescription(new wrtc.RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerService.pc.createAnswer();
      await peerService.pc.setLocalDescription(answer);
      
      console.log('--- COPY THIS ANSWER TO REMOTE ---');
      console.log(JSON.stringify(peerService.pc.localDescription));
      console.log('--- END ANSWER ---');
      
      console.log('Answer created and set. Waiting for data channel connection...');
      console.log('Current connection state:', peerService.pc.connectionState);
      console.log('Current ICE connection state:', peerService.pc.iceConnectionState);
    } catch (e) {
      console.error('Failed to process offer:', e);
    }
    rl.close();
  });
})(); 