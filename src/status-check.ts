import net from 'net';
import { exec } from 'child_process';

console.log('🔍 Checking SOCKS5 proxy status...');

// Check if port 1080 is listening
const client = net.createConnection({ port: 1080, host: '127.0.0.1' }, () => {
  console.log('✅ SOCKS5 proxy is listening on port 1080');
  
  // Send a simple SOCKS5 handshake to test
  const handshake = Buffer.from([0x05, 0x01, 0x00]);
  client.write(handshake);
});

client.on('data', (data) => {
  if (data[0] === 0x05 && data[1] === 0x00) {
    console.log('✅ SOCKS5 server is responding correctly');
    console.log('📋 Status: SOCKS5 proxy is ready for connections');
  } else {
    console.log('❌ SOCKS5 server response unexpected:', data);
  }
  client.end();
});

client.on('close', () => {
  console.log('🔌 Test connection closed');
});

client.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ SOCKS5 proxy is not running on port 1080');
    console.log('💡 Make sure to run: npm run socks5:server');
  } else {
    console.error('❌ Connection error:', err.message);
  }
});

// Also check if the process is running
exec('ps aux | grep "socks5-server" | grep -v grep', (_, stdout) => {
  if (stdout.trim()) {
    console.log('✅ SOCKS5 server process is running');
  } else {
    console.log('❌ SOCKS5 server process is not running');
  }
}); 