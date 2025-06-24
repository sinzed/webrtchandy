let localStream;
let peerConnection;
const config = {
    iceServers: [
        { urls: 'stun:2.189.68.115:443' },
        // { urls: 'stun:stun.l.google.com:19302' },
        // { urls: 'stun:stun1.l.google.com:19302' },
        // { urls: 'stun:stun2.l.google.com:19302' },
        // { urls: 'stun:stun3.l.google.com:19302' },
        // { urls: 'stun:stun4.l.google.com:19302' },
        // { urls: 'stun:stun.ekiga.net' },
        // { urls: 'stun:stun.ideasip.com' },
        // { urls: 'stun:stun.schlund.de' },
        // { urls: 'stun:stun.stunprotocol.org:3478' },
        // { urls: 'stun:stun.voiparound.com' },
        // { urls: 'stun:stun.voipbuster.com' },
        // { urls: 'stun:stun.voipstunt.com' },
        // { urls: 'stun:stun.voxgratia.org' }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all'
};

// Utility to detect which client (A or B) based on HTML elements
const isClientA = document.getElementById('startCamera') !== null;

// Add connection state monitoring
function setupConnectionMonitoring(pc) {
    const statusElement = document.getElementById('status');

    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        statusElement.textContent = `Status: ${pc.connectionState}`;

        if (pc.connectionState === 'connected') {
            console.log('✅ P2P connection established successfully!');
            statusElement.style.background = '#d4edda';
            statusElement.style.color = '#155724';
        } else if (pc.connectionState === 'failed') {
            console.log('❌ Connection failed - may need TURN server');
            statusElement.style.background = '#f8d7da';
            statusElement.style.color = '#721c24';
        } else if (pc.connectionState === 'connecting') {
            statusElement.style.background = '#fff3cd';
            statusElement.style.color = '#856404';
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        statusElement.textContent = `Status: ${pc.connectionState} (ICE: ${pc.iceConnectionState})`;
    };

    pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState);
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('ICE candidate:', event.candidate.type, event.candidate.protocol);
        }
    };
}

if (isClientA) {
    // Client A (Offerer)
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    let remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;
    document.getElementById('startCamera').onclick = async () => {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    };

    document.getElementById('createOffer').onclick = async () => {
        peerConnection = new RTCPeerConnection(config);
        setupConnectionMonitoring(peerConnection);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
        };
        peerConnection.onicecandidate = (event) => {
            if (event.candidate === null) {
                document.getElementById('offer').value = JSON.stringify(peerConnection.localDescription);
            }
        };
        await peerConnection.setLocalDescription(await peerConnection.createOffer());
    };

    document.getElementById('setAnswer').onclick = async () => {
        const answer = document.getElementById('answer').value;
        if (!answer) return alert('Paste answer from Client B!');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
    };
} else {
    // Client B (Answerer)
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    let remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    document.getElementById('setOffer').onclick = async () => {
        const offer = document.getElementById('offer').value;
        if (!offer) return alert('Paste offer from Client A!');
        peerConnection = new RTCPeerConnection(config);
        setupConnectionMonitoring(peerConnection);
        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
        };
        peerConnection.onicecandidate = (event) => {
            if (event.candidate === null) {
                document.getElementById('answer').value = JSON.stringify(peerConnection.localDescription);
            }
        };
        await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
        // Get local media and add tracks
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    };

    document.getElementById('createAnswer').onclick = async () => {
        await peerConnection.setLocalDescription(await peerConnection.createAnswer());
    };
}

// Download utility for textareas
function downloadTextareaContent(textareaId, filename) {
    const text = document.getElementById(textareaId).value;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Attach download handlers for both clients
window.addEventListener('DOMContentLoaded', () => {
    const offerBtn = document.getElementById('downloadOffer');
    const answerBtn = document.getElementById('downloadAnswer');
    if (offerBtn) {
        offerBtn.onclick = () => downloadTextareaContent('offer', 'offer.txt');
    }
    if (answerBtn) {
        answerBtn.onclick = () => downloadTextareaContent('answer', 'answer.txt');
    }
    const muteBtn = document.getElementById('muteMic');
    if (muteBtn) {
        let micMuted = false;
        muteBtn.onclick = () => {
            if (localStream && localStream.getAudioTracks().length > 0) {
                micMuted = !micMuted;
                localStream.getAudioTracks().forEach(track => track.enabled = !micMuted);
                muteBtn.textContent = micMuted ? 'Unmute Microphone' : 'Mute Microphone';
            } else {
                alert('Microphone not started yet!');
            }
        };
    }
}); 