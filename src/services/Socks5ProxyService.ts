import net from 'net';
import { EventEmitter } from 'events';

export interface ControlMessage {
  type: 'connect' | 'connected' | 'closed' | 'error' | 'data';
  host?: string;
  port?: number;
  message?: string;
  connectionId?: string;
  data?: Buffer;
}

export class Socks5ProxyService extends EventEmitter {
  private server: net.Server | undefined;
  private connections: Map<string, net.Socket> = new Map();
  private dataChannel: any;
  private nextConnectionId = 1;

  constructor(dataChannel: any) {
    super();
    this.dataChannel = dataChannel;
  }

  start(port: number = 1080): void {
    this.server = net.createServer((socket) => {
      this.handleNewConnection(socket);
    });

    this.server.listen(port, () => {
      console.log(`🔌 SOCKS5 proxy listening on port ${port}`);
      console.log(`📋 Configure your applications to use SOCKS5 proxy: 127.0.0.1:${port}`);
    });

    this.server.on('error', (err) => {
      console.error('❌ SOCKS5 server error:', err);
    });
  }

  private handleNewConnection(socket: net.Socket): void {
    const connectionId = `conn_${this.nextConnectionId++}`;
    this.connections.set(connectionId, socket);

    console.log(`🔗 New SOCKS5 connection: ${connectionId}`);

    // Handle SOCKS5 handshake
    socket.once('data', (data) => {
      console.log(`📨 SOCKS5 handshake data from ${connectionId}:`, data);
      this.handleSocks5Handshake(socket, data, connectionId);
    });

    socket.on('close', () => {
      console.log(`🔌 SOCKS5 connection closed: ${connectionId}`);
      this.connections.delete(connectionId);
      this.sendControlMessage({
        type: 'closed',
        connectionId
      });
    });

    socket.on('error', (err) => {
      console.error(`❌ SOCKS5 connection error: ${connectionId}`, err);
      this.connections.delete(connectionId);
    });
  }

  private handleSocks5Handshake(socket: net.Socket, data: Buffer, connectionId: string): void {
    console.log(`🔍 Processing SOCKS5 handshake for ${connectionId}`);
    
    // SOCKS5 handshake
    if (data[0] !== 0x05) {
      console.log(`❌ Invalid SOCKS version for ${connectionId}:`, data[0]);
      socket.end();
      return;
    }

    console.log(`✅ SOCKS5 version check passed for ${connectionId}`);

    // Send authentication method (no auth)
    const response = Buffer.from([0x05, 0x00]);
    console.log(`📤 Sending auth response to ${connectionId}:`, response);
    socket.write(response);

    // Wait for connection request
    socket.once('data', (requestData) => {
      console.log(`📨 SOCKS5 request data from ${connectionId}:`, requestData);
      this.handleSocks5Request(socket, requestData, connectionId);
    });
  }

  private handleSocks5Request(socket: net.Socket, data: Buffer, connectionId: string): void {
    console.log(`🔍 Processing SOCKS5 request for ${connectionId}`);
    
    if (data[0] !== 0x05 || data[1] !== 0x01) {
      console.log(`❌ Invalid SOCKS5 request for ${connectionId}: version=${data[0]}, command=${data[1]}`);
      socket.end();
      return;
    }

    const addressType = data[3];
    let host: string;
    let port: number;

    console.log(`📋 Address type for ${connectionId}:`, addressType);

    if (addressType === 0x01) {
      // IPv4
      host = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
      port = data.readUInt16BE(8);
      console.log(`🌐 IPv4 request for ${connectionId}: ${host}:${port}`);
    } else if (addressType === 0x03) {
      // Domain name
      const domainLength = data[4];
      if (domainLength === undefined) {
        console.log(`❌ Invalid domain length for ${connectionId}`);
        socket.end();
        return;
      }
      host = data.slice(5, 5 + domainLength).toString();
      port = data.readUInt16BE(5 + domainLength);
      console.log(`🌐 Domain request for ${connectionId}: ${host}:${port}`);
    } else {
      console.log(`❌ Unsupported address type for ${connectionId}:`, addressType);
      socket.end();
      return;
    }

    console.log(`🌐 SOCKS5 request: ${connectionId} -> ${host}:${port}`);

    // Send connection request to remote peer
    const controlMsg: ControlMessage = {
      type: 'connect',
      host,
      port,
      connectionId
    };
    console.log(`📤 Sending control message to remote:`, controlMsg);
    this.sendControlMessage(controlMsg);

    // Send success response to client
    const response = Buffer.from([
      0x05, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, // IP (ignored by most clients)
      0x00, 0x00              // Port (ignored by most clients)
    ]);
    console.log(`📤 Sending success response to ${connectionId}:`, response);
    socket.write(response);

    // Set up data forwarding
    socket.on('data', (data) => {
      console.log(`📨 Data from ${connectionId} to remote:`, data.length, 'bytes');
      this.sendDataToRemote(connectionId, data);
    });
  }

  handleRemoteData(connectionId: string, data: Buffer): void {
    console.log(`📨 Data from remote to ${connectionId}:`, data.length, 'bytes');
    const socket = this.connections.get(connectionId);
    if (socket && !socket.destroyed) {
      socket.write(data);
    } else {
      console.log(`❌ Socket not found or destroyed for ${connectionId}`);
    }
  }

  handleRemoteConnectionStatus(connectionId: string, status: 'connected' | 'closed' | 'error', message?: string): void {
    console.log(`📋 Remote status for ${connectionId}:`, status, message || '');
    const socket = this.connections.get(connectionId);
    if (socket) {
      if (status === 'connected') {
        console.log(`✅ Remote connection established: ${connectionId}`);
      } else if (status === 'closed') {
        console.log(`🔌 Remote connection closed: ${connectionId}`);
        socket.end();
      } else if (status === 'error') {
        console.error(`❌ Remote connection error: ${connectionId}`, message);
        socket.end();
      }
    } else {
      console.log(`❌ Socket not found for ${connectionId}`);
    }
  }

  sendDataToRemote(connectionId: string, data: Buffer): void {
    const controlMsg: ControlMessage = {
      type: 'data',
      connectionId,
      data
    };
    console.log(`📤 Sending data to remote for ${connectionId}:`, data.length, 'bytes');
    this.sendControlMessage(controlMsg);
  }

  private sendControlMessage(message: ControlMessage): void {
    console.log(`📤 Sending control message:`, message.type, message.connectionId || '');
    this.dataChannel.send(JSON.stringify(message));
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
    this.connections.forEach(socket => socket.destroy());
    this.connections.clear();
  }
} 