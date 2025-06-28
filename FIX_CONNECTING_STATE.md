# Fix WebRTC "Connecting" State Issue

## Problem
Your WebRTC connection gets stuck in "connecting" state when trying to connect across different PCs on the internet.

## Root Cause Analysis
From your logs, I can see:
- ✅ ICE gathering is working (host and srflx candidates found)
- ❌ No TURN (relay) candidates are being generated
- ⏳ Connection stays in "checking" state indefinitely

This indicates that TURN servers are not accessible, which is required for internet connectivity when direct P2P fails.

## Immediate Solutions

### 1. Test TURN Server Connectivity
First, check if TURN servers are accessible:

```bash
npm run test:turn
```

**Expected output:**
```
✅ TURN candidate found: [some IP address]
✅ TURN servers are accessible!
```

**If you see:**
```
❌ No TURN candidates found - TURN servers may be blocked
```

Then TURN servers are blocked by your network.

### 2. Enhanced Internet Test
Use the improved internet connectivity test:

```bash
# PC 1 (Offerer)
npm run test:internet

# PC 2 (Answerer)
npm run answerer
```

This test includes:
- 45-second timeout with detailed diagnostics
- Better error messages
- Connection state monitoring

### 3. Network Troubleshooting Steps

#### Step A: Test with Mobile Hotspot
1. Connect one PC to mobile hotspot
2. Keep other PC on current network
3. Try connection again

#### Step B: Check Firewall Settings
```bash
# On Linux, check if ports are blocked
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :3478
```

#### Step C: Test Network Restrictions
```bash
# Test if you can reach TURN servers
curl -v telnet://openrelay.metered.ca:80
curl -v telnet://openrelay.metered.ca:443
```

### 4. Alternative TURN Servers

If current TURN servers don't work, try these alternatives:

#### Option A: Use Different TURN Servers
Edit `src/services/PeerConnectionService.ts` and replace TURN servers with:

```typescript
// Alternative TURN servers
{
  urls: 'turn:global.turn.twilio.com:3478?transport=udp',
  username: 'your_twilio_username',
  credential: 'your_twilio_password'
},
{
  urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
  username: 'your_twilio_username',
  credential: 'your_twilio_password'
}
```

#### Option B: Self-hosted TURN Server
Set up your own TURN server using coturn:

```bash
# Install coturn
sudo apt-get install coturn

# Configure and run
sudo turnserver -a -o -v -n -u username:password -p 3478
```

### 5. Force TURN-only Mode

If you want to force TURN relay (slower but more reliable):

```typescript
// In PeerConnectionService.ts, change iceTransportPolicy
iceTransportPolicy: 'relay'  // Instead of 'all'
```

## Quick Fix Checklist

- [ ] Run `npm run test:turn` to check TURN accessibility
- [ ] Try mobile hotspot on one peer
- [ ] Check firewall/antivirus settings
- [ ] Test from different network locations
- [ ] Verify both peers are on different networks
- [ ] Check if corporate firewall blocks WebRTC

## Expected Success Indicators

When working correctly, you should see:
```
🧊 ICE Candidate: relay tcp [TURN_SERVER_IP]
🧊 ICE connection state: connected
🔗 Connection state: connected
✅ DataChannel opened!
```

## If Still Not Working

1. **Use VPN**: Connect both peers to same VPN
2. **Different Networks**: Ensure peers are on completely different networks
3. **Corporate Network**: Try from home networks instead
4. **Alternative TURN**: Use paid TURN services like Twilio

## Debug Commands

```bash
# Test TURN servers
npm run test:turn

# Test full internet connectivity
npm run test:internet

# Test SOCKS5 proxy
npm run socks5:server  # PC 1
npm run socks5:remote  # PC 2
```

The key is ensuring TURN servers are accessible. If they're blocked, you'll need to either:
1. Configure your network to allow TURN traffic
2. Use alternative TURN servers
3. Set up your own TURN server 