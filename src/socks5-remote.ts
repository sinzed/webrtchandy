import { PeerConnectionService } from './services/PeerConnectionService';
import { ControlMessage } from './services/Socks5ProxyService';
import wrtc from 'wrtc';
import readline from 'readline';
import net from 'net';

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

(async (): Promise<void> => {
  const peerService = new PeerConnectionService();
  const connections: Map<string, net.Socket> = new Map();
  
  // Add connection state monitoring
  peerService.pc.onconnectionstatechange = () => {
    console.log('Connection state:', peerService.pc.connectionState);
  };

  peerService.pc.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerService.pc.iceConnectionState);
  };
  
  // For remote peer, we need to listen for the data channel from the offerer
  peerService.pc.ondatachannel = (event: wrtc.RTCDataChannelEvent) => {
    const dataChannel = event.channel;
    
    // Monitor data channel state
    dataChannel.onopen = () => {
      console.log('✅ DataChannel opened! SOCKS5 remote ready.');
    };

    dataChannel.onclose = () => {
      console.log('❌ DataChannel closed');
      // Close all TCP connections
      connections.forEach(socket => socket.destroy());
      connections.clear();
    };

    dataChannel.onerror = (error) => {
      console.error('❌ DataChannel error:', error);
    };
    
    dataChannel.onmessage = (event: MessageEvent) => {
      console.log('📨 Received message from DataChannel:', typeof event.data, event.data.length || 'string');
      
      if (typeof event.data === 'string') {
        try {
          const msg: ControlMessage = JSON.parse(event.data);
          console.log('📋 Parsed control message:', msg.type, msg.connectionId || '');
          
          if (msg.type === 'connect' && msg.host && msg.port && msg.connectionId) {
            console.log(`🌐 SOCKS5 request: ${msg.connectionId} -> ${msg.host}:${msg.port}`);
            
            // Create TCP connection to the requested service
            const socket = net.createConnection({ host: msg.host, port: msg.port }, () => {
              console.log(`✅ TCP connected: ${msg.connectionId} -> ${msg.host}:${msg.port}`);
              dataChannel.send(JSON.stringify({
                type: 'connected',
                connectionId: msg.connectionId
              }));
            });
            
            connections.set(msg.connectionId, socket);
            
            socket.on('data', (data) => {
              console.log(`📨 TCP data from ${msg.host}:${msg.port} to ${msg.connectionId}:`, data.length, 'bytes');
              dataChannel.send(JSON.stringify({
                type: 'data',
                connectionId: msg.connectionId,
                data: data
              }));
            });
            
            socket.on('close', () => {
              console.log(`🔌 TCP closed: ${msg.connectionId}`);
              if (msg.connectionId) {
                connections.delete(msg.connectionId);
              }
              dataChannel.send(JSON.stringify({
                type: 'closed',
                connectionId: msg.connectionId
              }));
            });
            
            socket.on('error', (err) => {
              console.error(`❌ TCP error: ${msg.connectionId}`, err.message);
              if (msg.connectionId) {
                connections.delete(msg.connectionId);
              }
              dataChannel.send(JSON.stringify({
                type: 'error',
                connectionId: msg.connectionId,
                message: err.message
              }));
            });
            
          } else if (msg.type === 'data' && msg.connectionId && msg.data) {
            console.log(`📨 Received data for ${msg.connectionId}:`, msg.data.length, 'bytes');
            // Forward data to TCP connection
            const socket = connections.get(msg.connectionId);
            if (socket && !socket.destroyed) {
              socket.write(Buffer.from(msg.data));
            } else {
              console.log(`❌ Socket not found or destroyed for ${msg.connectionId}`);
            }
          } else if (msg.type === 'closed' && msg.connectionId) {
            console.log(`📋 Closing connection: ${msg.connectionId}`);
            // Close TCP connection
            const socket = connections.get(msg.connectionId);
            if (socket) {
              socket.destroy();
              connections.delete(msg.connectionId);
            }
          } else {
            console.log(`📋 Unknown message type: ${msg.type}`);
          }
        } catch (e) {
          console.error('❌ Invalid control message:', e);
        }
      } else {
        console.log('📨 Received binary data, length:', event.data.byteLength);
      }
    };
  };

  // Manual signaling: receive offer, create answer
  console.log('Waiting for offer from SOCKS5 server...');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  rl.question('Paste the offer JSON from the SOCKS5 server:\n', async (offerStr: string) => {
    try {
      const offer: RTCSessionDescription = JSON.parse(offerStr);
      await peerService.pc.setRemoteDescription(new wrtc.RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerService.pc.createAnswer();
      await peerService.pc.setLocalDescription(answer);
      
      console.log('--- COPY THIS ANSWER TO SOCKS5 SERVER ---');
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