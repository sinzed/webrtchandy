import net from 'net';

export interface ControlMessage {
  type: 'connect' | 'connected' | 'closed' | 'error';
  host?: string;
  port?: number;
  message?: string;
}

export class TcpProxyService {
  private socket: net.Socket | undefined;

  connect(host: string, port: number, onData: (data: Buffer) => void, onClose: () => void, onError: (err: Error) => void, onConnect: () => void) {
    this.socket = net.createConnection({ host, port }, onConnect);
    this.socket.on('data', onData);
    this.socket.on('close', onClose);
    this.socket.on('error', onError);
  }

  write(data: Buffer) {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(data);
    }
  }

  destroy() {
    if (this.socket) {
      this.socket.destroy();
    }
  }
} 