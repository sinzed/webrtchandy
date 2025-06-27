import net from 'net';

// Test SOCKS5 handshake manually
const client = net.createConnection({ port: 1080, host: '127.0.0.1' }, () => {
  console.log('✅ Connected to SOCKS5 server');
  
  // Send SOCKS5 handshake
  const handshake = Buffer.from([0x05, 0x01, 0x00]); // SOCKS5, 1 auth method, no auth
  client.write(handshake);
});

client.on('data', (data) => {
  console.log('📨 Received:', data);
  
  if (data[0] === 0x05 && data[1] === 0x00) {
    console.log('✅ SOCKS5 handshake successful');
    
    // Send connection request for example.com:80
    const request = Buffer.from([
      0x05, 0x01, 0x00, 0x03, // SOCKS5, CONNECT, reserved, domain
      0x0B, // domain length (11)
      0x65, 0x78, 0x61, 0x6D, 0x70, 0x6C, 0x65, 0x2E, 0x63, 0x6F, 0x6D, // "example.com"
      0x00, 0x50 // port 80
    ]);
    client.write(request);
  } else if (data[0] === 0x05 && data[1] === 0x00 && data[3] === 0x01) {
    console.log('✅ SOCKS5 connection request successful');
    console.log('🔗 Connection established, sending HTTP request...');
    
    // Send HTTP request
    const httpRequest = 'GET / HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n';
    client.write(httpRequest);
  } else {
    console.log('📄 HTTP response received');
    console.log('Response:', data.toString());
    client.end();
  }
});

client.on('close', () => {
  console.log('🔌 Connection closed');
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err);
}); 