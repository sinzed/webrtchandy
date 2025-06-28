import wrtc from 'wrtc';

export class MediaTrackService {
  
  /**
   * Adds fake audio and video tracks to make SDP more browser-like
   */
  static addFakeMediaTracks(pc: wrtc.RTCPeerConnection): void {
    try {
      // Add fake audio track
      this.addFakeAudioTrack(pc);
      
      // Add fake video track  
      this.addFakeVideoTrack(pc);
      
      console.log('✅ Added fake audio and video tracks for browser-like SDP');
    } catch (error) {
      console.log('⚠️  Could not add fake media tracks:', error);
      console.log('   This is normal if wrtc version doesn\'t support nonstandard APIs');
    }
  }
  
  /**
   * Adds a fake audio track using wrtc's nonstandard API
   */
  private static addFakeAudioTrack(pc: wrtc.RTCPeerConnection): void {
    try {
      // Try to use wrtc's nonstandard API for audio
      const { nonstandard } = require('wrtc');
      
      if (nonstandard && nonstandard.RTCAudioSource) {
        const audioSource = new nonstandard.RTCAudioSource();
        const audioTrack = audioSource.createTrack();
        
        // Create a fake MediaStream for the audio track
        const audioStream = new wrtc.MediaStream([audioTrack]);
        
        // Add the track to the peer connection
        pc.addTrack(audioTrack, audioStream);
        
        console.log('🎵 Added fake audio track');
      } else {
        console.log('⚠️  RTCAudioSource not available in this wrtc version');
      }
    } catch (error) {
      console.log('⚠️  Could not add fake audio track:', error.message);
    }
  }
  
  /**
   * Adds a fake video track using wrtc's nonstandard API
   */
  private static addFakeVideoTrack(pc: wrtc.RTCPeerConnection): void {
    try {
      // Try to use wrtc's nonstandard API for video
      const { nonstandard } = require('wrtc');
      
      if (nonstandard && nonstandard.RTCVideoSource) {
        const videoSource = new nonstandard.RTCVideoSource();
        const videoTrack = videoSource.createTrack();
        
        // Create a fake MediaStream for the video track
        const videoStream = new wrtc.MediaStream([videoTrack]);
        
        // Add the track to the peer connection
        pc.addTrack(videoTrack, videoStream);
        
        console.log('📹 Added fake video track');
      } else {
        console.log('⚠️  RTCVideoSource not available in this wrtc version');
      }
    } catch (error) {
      console.log('⚠️  Could not add fake video track:', error.message);
    }
  }
  
  /**
   * Alternative method: Create fake tracks using a different approach
   */
  static addFakeTracksAlternative(pc: wrtc.RTCPeerConnection): void {
    try {
      // Create a simple fake audio track using a different method
      const fakeAudioTrack = {
        kind: 'audio',
        id: 'fake-audio-track',
        enabled: true,
        muted: true,
        readyState: 'live' as any,
        onended: null,
        onmute: null,
        onunmute: null
      };
      
      // Create a simple fake video track
      const fakeVideoTrack = {
        kind: 'video', 
        id: 'fake-video-track',
        enabled: true,
        muted: true,
        readyState: 'live' as any,
        onended: null,
        onmute: null,
        onunmute: null
      };
      
      // Try to add them (this might not work with all wrtc versions)
      try {
        pc.addTrack(fakeAudioTrack as any, new wrtc.MediaStream());
        pc.addTrack(fakeVideoTrack as any, new wrtc.MediaStream());
        console.log('✅ Added alternative fake tracks');
      } catch (error) {
        console.log('⚠️  Alternative method failed:', error.message);
      }
      
    } catch (error) {
      console.log('⚠️  Alternative fake track method failed:', error.message);
    }
  }
  
  /**
   * Check if wrtc supports nonstandard media APIs
   */
  static checkMediaSupport(): void {
    try {
      const { nonstandard } = require('wrtc');
      
      console.log('🔍 wrtc Media Support Check:');
      console.log('   RTCAudioSource available:', !!nonstandard?.RTCAudioSource);
      console.log('   RTCVideoSource available:', !!nonstandard?.RTCVideoSource);
      console.log('   MediaStream available:', !!wrtc.MediaStream);
      console.log('   RTCPeerConnection available:', !!wrtc.RTCPeerConnection);
      
      if (nonstandard?.RTCAudioSource && nonstandard?.RTCVideoSource) {
        console.log('✅ wrtc supports fake media tracks');
      } else {
        console.log('⚠️  wrtc does not support fake media tracks');
        console.log('   This is normal for some wrtc versions');
      }
    } catch (error) {
      console.log('❌ Could not check wrtc media support:', error.message);
    }
  }
} 