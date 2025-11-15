
// A rough approximation for WAV header size
const WAV_HEADER_LENGTH = 44;

/**
 * Parses a timestamp string (e.g., "MM:SS - MM:SS") into start and duration in seconds.
 */
export function parseTimestamp(timestamp: string): { start: number; duration: number } {
  const parts = timestamp.split(' - ');
  if (parts.length !== 2) return { start: 0, duration: 0 };

  const timeToSeconds = (time: string) => {
    const timeParts = time.split(':').map(Number);
    return timeParts[0] * 60 + timeParts[1];
  };

  const start = timeToSeconds(parts[0]);
  const end = timeToSeconds(parts[1]);
  const duration = end - start;

  return { start, duration };
}

/**
 * Creates a Blob representing a WAV audio clip from a segment of an AudioBuffer.
 */
export function createAudioClip(fullBuffer: AudioBuffer, timestamp: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            const { start, duration } = parseTimestamp(timestamp);
            if (duration <= 0) {
                return reject(new Error("Invalid timestamp duration"));
            }

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const frameCount = Math.floor(duration * fullBuffer.sampleRate);
            const newBuffer = audioContext.createBuffer(
                fullBuffer.numberOfChannels,
                frameCount,
                fullBuffer.sampleRate
            );

            for (let i = 0; i < fullBuffer.numberOfChannels; i++) {
                const channelData = fullBuffer.getChannelData(i);
                const newChannelData = newBuffer.getChannelData(i);
                newChannelData.set(channelData.subarray(
                    Math.floor(start * fullBuffer.sampleRate),
                    Math.floor((start + duration) * fullBuffer.sampleRate)
                ));
            }
            resolve(audioBufferToWav(newBuffer));
        } catch (error) {
            reject(error);
        }
    });
}


/**
 * Converts a base64 data URL to a Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Triggers a browser download for a given Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper functions for WAV encoding, adapted from public resources.
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + WAV_HEADER_LENGTH;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++; // next source sample
    }

    return new Blob([view], { type: "audio/wav" });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}
