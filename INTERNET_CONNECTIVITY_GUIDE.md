# WebRTC Internet Connectivity Guide

## Problem
Your WebRTC connection works on local network but fails when connecting across different PCs on the internet.

## Root Cause
The issue is that you only had STUN servers configured. STUN servers can only help with NAT traversal when both peers can reach each other directly. When peers are behind restrictive NATs, firewalls, or corporate networks, TURN servers are required to relay traffic.

## Solution Applied

### 1. Added TURN Servers
I've added free TURN servers to your `PeerConnectionService`:

```typescript
// TURN servers for relay when direct connection fails
{ 
  urls: 'turn:openrelay.metered.ca:80',
  username: 'openrelayproject',
  credential: 'openrelayproject'
},
{ 
  urls: 'turn:openrelay.metered.ca:443',
  username: 'openrelayproject',
  credential: 'openrelayproject'
},
{ 
  urls: 'turn:openrelay.metered.ca:443?transport=tcp',
  username: 'openrelayproject',
  credential: 'openrelayproject'
}
```

### 2. Enhanced Debugging
Added ICE candidate monitoring to help diagnose connection issues:

```typescript
this.pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('🧊 ICE Candidate:', event.candidate.type, event.candidate.protocol, event.candidate.address);
  } else {
    console.log('✅ ICE gathering complete');
  }
};
```

### 3. Internet Connectivity Test
Created a new test script: `npm run test:internet`

## Testing Steps

### Step 1: Test Basic Internet Connectivity
```bash
# On PC 1 (Offerer)
npm run test:internet

# On PC 2 (Answerer)  
npm run answerer
```

### Step 2: Test SOCKS5 Proxy
```bash
# On PC 1 (SOCKS5 Server)
npm run socks5:server

# On PC 2 (SOCKS5 Remote)
npm run socks5:remote
```

## Expected Connection Flow

1. **ICE Gathering**: `new` → `gathering` → `complete`
2. **ICE Connection**: `new` → `checking` → `connected` → `completed`
3. **WebRTC Connection**: `new` → `connecting` → `connected`
4. **DataChannel**: `connecting` → `open`

## Debugging Output

You should now see detailed logs like:
```
🧊 ICE gathering state: gathering
🧊 ICE Candidate: host udp 192.168.1.100
🧊 ICE Candidate: srflx udp 203.0.113.1
🧊 ICE Candidate: relay tcp 52.123.45.67
✅ ICE gathering complete
🧊 ICE connection state: checking
🔗 Connection state: connecting
🧊 ICE connection state: connected
🔗 Connection state: connected
✅ DataChannel opened!
```

## Common Issues & Solutions

### Issue: Still stuck in "checking" state
**Solution**: Check if your firewall/antivirus is blocking WebRTC traffic

### Issue: Only relay candidates available
**Solution**: This is normal for restrictive networks - TURN servers will handle the relay

### Issue: Connection times out
**Solution**: 
1. Try different networks (mobile hotspot)
2. Check if corporate firewall blocks P2P connections
3. Verify TURN servers are accessible

## Alternative TURN Servers

If the current TURN servers don't work, you can try these alternatives:

```typescript
// Alternative 1: Twilio TURN (requires account)
{
  urls: 'turn:global.turn.twilio.com:3478?transport=udp',
  username: 'your_username',
  credential: 'your_credential'
}

// Alternative 2: Coturn (self-hosted)
{
  urls: 'turn:your-turn-server.com:3478',
  username: 'username',
  credential: 'password'
}
```

## Network Requirements

For WebRTC to work across the internet:

1. **UDP ports**: 3478, 5349 (STUN/TURN)
2. **TCP ports**: 80, 443 (TURN over HTTPS)
3. **No symmetric NAT**: Some NAT types block P2P connections
4. **No restrictive firewall**: Corporate firewalls often block WebRTC

## Success Indicators

✅ Connection state reaches `connected`  
✅ ICE connection state reaches `completed`  
✅ DataChannel opens successfully  
✅ Test messages are exchanged  

If you see these indicators, your WebRTC connection is working across the internet! 