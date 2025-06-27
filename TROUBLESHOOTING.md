# WebRTC Connection Troubleshooting Guide

## Why "Waiting for data channel connection..." appears

This message appears after signaling is complete, but before the actual WebRTC connection is established. This is normal behavior. Here's what's happening:

### Connection States to Monitor

1. **Connection State**: `new` → `connecting` → `connected`
2. **ICE Connection State**: `new` → `checking` → `connected` → `completed`
3. **DataChannel State**: `connecting` → `open`

### Common Reasons for Connection Delays

1. **NAT Traversal**: WebRTC needs to traverse NAT/firewalls
2. **ICE Candidate Exchange**: Peers need to exchange network information
3. **Network Configuration**: Corporate networks, VPNs, or firewalls may block P2P connections

## Debugging Steps

### Step 1: Check Connection States
Run the updated code and watch for these log messages:
```
Connection state: new
ICE connection state: new
ICE connection state: checking
Connection state: connecting
ICE connection state: connected
Connection state: connected
✅ DataChannel opened! Connection established.
```

### Step 2: Test with Simple Messages
Use the test connection script:
```bash
# Terminal 1 (Offerer)
npm run test:connection

# Terminal 2 (Answerer)  
npm run answerer
```

This will send a test message when connected.

### Step 3: Check Network Configuration

#### If you're behind NAT/Firewall:
- WebRTC may fail to establish direct connection
- Consider using STUN/TURN servers

#### If you're on corporate network:
- Corporate firewalls often block P2P connections
- Try from different network (mobile hotspot)

### Step 4: Add STUN Servers (Optional)
If connections are failing, you can add STUN servers to help with NAT traversal:

```typescript
const peerService = new PeerConnectionService({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
});
```

## Expected Timeline

1. **0-5 seconds**: ICE gathering and candidate exchange
2. **5-30 seconds**: Connection establishment (varies by network)
3. **30+ seconds**: May indicate network issues

## Quick Test

To verify everything is working:

1. **Start answerer first**:
   ```bash
   npm run answerer
   ```

2. **Start offerer**:
   ```bash
   npm run test:connection
   ```

3. **Exchange offers/answers** as prompted

4. **Look for success message**:
   ```
   ✅ DataChannel opened! Connection established.
   Sending test message...
   ```

5. **Check both terminals** for received messages

## If Still Not Connecting

1. **Check firewall settings**
2. **Try different network** (mobile hotspot)
3. **Verify both peers are running simultaneously**
4. **Check for any error messages in console**
5. **Ensure you copied the complete JSON** (not truncated)

## Common Error Messages

- `"ICE connection state: failed"` - Network connectivity issues
- `"Connection state: failed"` - Signaling or network problems  
- `"DataChannel error"` - DataChannel creation failed
- `"Invalid control message"` - JSON parsing error in signaling

## Network Requirements

For WebRTC to work:
- Both peers need internet connectivity
- No restrictive firewalls blocking UDP traffic
- NAT that allows hole punching (most home routers do) 