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
    // SOCKS5 handshake
    if (data[0] !== 0x05) {
      socket.end();
      return;
    }

    // Send authentication method (no auth)
    socket.write(Buffer.from([0x05, 0x00]));

    // Wait for connection request
    socket.once('data', (requestData) => {
      this.handleSocks5Request(socket, requestData, connectionId);
    });
  }

  private handleSocks5Request(socket: net.Socket, data: Buffer, connectionId: string): void {
    if (data[0] !== 0x05 || data[1] !== 0x01) {
      socket.end();
      return;
    }

    const addressType = data[3];
    let host: string;
    let port: number;

    if (addressType === 0x01) {
      // IPv4
      host = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
      port = data.readUInt16BE(8);
    } else if (addressType === 0x03) {
      // Domain name
      const domainLength = data[4];
      if (domainLength === undefined) {
        socket.end();
        return;
      }
      host = data.slice(5, 5 + domainLength).toString();
      port = data.readUInt16BE(5 + domainLength);
    } else {
      socket.end();
      return;
    }

    console.log(`🌐 SOCKS5 request: ${connectionId} -> ${host}:${port}`);

    // Send connection request to remote peer
    this.sendControlMessage({
      type: 'connect',
      host,
      port,
      connectionId
    });

    // Send success response to client
    const response = Buffer.from([
      0x05, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, // IP (ignored by most clients)
      0x00, 0x00              // Port (ignored by most clients)
    ]);
    socket.write(response);
  }

  handleRemoteData(connectionId: string, data: Buffer): void {
    const socket = this.connections.get(connectionId);
    if (socket && !socket.destroyed) {
      socket.write(data);
    }
  }

  handleRemoteConnectionStatus(connectionId: string, status: 'connected' | 'closed' | 'error', message?: string): void {
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
    }
  }

  sendDataToRemote(connectionId: string, data: Buffer): void {
    this.sendControlMessage({
      type: 'data',
      connectionId,
      data
    });
  }

  private sendControlMessage(message: ControlMessage): void {
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