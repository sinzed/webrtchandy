# WebRTC Signaling Process Guide

## Overview
This application implements a WebRTC peer-to-peer connection with manual signaling. The process involves two peers: an **offerer** (who initiates the connection) and an **answerer** (who responds to the offer).

## How Signaling Works

### 1. Offer Creation (Offerer)
The offerer creates a WebRTC offer containing:
- Session Description Protocol (SDP) information
- Media capabilities
- Network information

**Process:**
1. Create RTCPeerConnection
2. Create DataChannel
3. Generate offer with `createOffer()`
4. Set local description
5. Display offer JSON for manual transfer

### 2. Answer Creation (Answerer)
The answerer receives the offer and creates a response:
- Processes the received SDP
- Creates matching answer
- Sets both local and remote descriptions

**Process:**
1. Create RTCPeerConnection
2. Set remote description (from offer)
3. Generate answer with `createAnswer()`
4. Set local description
5. Display answer JSON for manual transfer

### 3. Connection Establishment
Once both peers have exchanged offers and answers:
- ICE candidates are exchanged
- DataChannel opens
- P2P connection is established

## Usage Instructions

### Step 1: Start the Answerer (Peer B)
```bash
npm run answerer
```
This will wait for an offer from the offerer.

### Step 2: Start the Offerer (Peer A)
```bash
npm run dev
```
This will:
1. Create an offer
2. Display the offer JSON
3. Wait for you to paste the answer

### Step 3: Exchange Signaling Data
1. **Copy the offer** from Peer A's console output
2. **Paste it** into Peer B's prompt
3. **Copy the answer** from Peer B's console output  
4. **Paste it** into Peer A's prompt

### Step 4: Connection Established
Once both peers have exchanged offers and answers:
- The DataChannel will open
- Both peers can send/receive data
- TCP proxy functionality becomes available

## Example Flow

```
Peer A (Offerer)                    Peer B (Answerer)
     |                                    |
     |-- Start offerer ------------------>|
     |-- Create offer ------------------->|
     |-- Display offer JSON ------------->|
     |                                    |
     |<-- Start answerer -----------------|
     |<-- Paste offer --------------------|
     |<-- Create answer ------------------|
     |<-- Display answer JSON ------------|
     |                                    |
     |-- Paste answer ------------------->|
     |-- Connection established --------->|
```

## Key Components

### PeerConnectionService
- Manages RTCPeerConnection lifecycle
- Handles offer/answer creation
- Manages DataChannel

### TcpProxyService  
- Handles TCP socket connections
- Manages data forwarding between WebRTC and TCP
- Handles connection events

### SignalingModule
- Manages manual signaling via console
- Handles offer/answer display and input
- Provides user interface for signaling

## Troubleshooting

### Common Issues:
1. **Invalid JSON**: Ensure you copy the entire offer/answer JSON
2. **Connection timeout**: Check network connectivity
3. **DataChannel not opening**: Verify both peers have exchanged offers/answers

### Debug Tips:
- Check console output for error messages
- Verify JSON format is valid
- Ensure both peers are running simultaneously 