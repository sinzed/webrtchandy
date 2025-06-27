import wrtc from 'wrtc';
import net from 'net';
import readline from 'readline';

// Type definitions
interface ControlMessage {
  type: 'connect' | 'connected' | 'closed' | 'error';
  host?: string;
  port?: number;
  message?: string;
}

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

// Create PeerConnection
const pc = new wrtc.RTCPeerConnection();
const dataChannel = pc.createDataChannel('proxy');
let tcpSocket: net.Socket | undefined;

// DataChannel event handlers (proxy logic)
dataChannel.onmessage = (event: MessageEvent) => {
  if (typeof event.data === 'string') {
    try {
      const msg: ControlMessage = JSON.parse(event.data);
      if (msg.type === 'connect' && msg.host && msg.port) {
        tcpSocket = net.createConnection({ host: msg.host, port: msg.port }, () => {
          console.log(`Connected to ${msg.host}:${msg.port}`);
          dataChannel.send(JSON.stringify({ type: 'connected' } as ControlMessage));
        });
        
        tcpSocket.on('data', (data: Buffer) => {
          dataChannel.send(data);
        });
        
        tcpSocket.on('close', () => {
          dataChannel.send(JSON.stringify({ type: 'closed' } as ControlMessage));
        });
        
        tcpSocket.on('error', (err: Error) => {
          dataChannel.send(JSON.stringify({ 
            type: 'error', 
            message: err.message 
          } as ControlMessage));
        });
      }
    } catch (e) {
      console.error('Invalid control message:', e);
    }
  } else {
    if (tcpSocket && !tcpSocket.destroyed) {
      tcpSocket.write(Buffer.from(event.data));
    }
  }
};

dataChannel.onclose = () => {
  if (tcpSocket) tcpSocket.destroy();
};

// Manual signaling: create offer, print, accept answer
(async (): Promise<void> => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log('--- COPY THIS OFFER TO REMOTE ---');
  console.log(JSON.stringify(pc.localDescription));
  console.log('--- END OFFER ---');

  // Read answer from stdin
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Paste remote answer JSON:\n', async (answerStr: string) => {
    try {
      const answer: RTCSessionDescription = JSON.parse(answerStr);
      await pc.setRemoteDescription(new wrtc.RTCSessionDescription(answer));
      console.log('Remote answer set. Waiting for data channel connection...');
    } catch (e) {
      console.error('Failed to set remote answer:', e);
    }
    rl.close();
  });
})(); 