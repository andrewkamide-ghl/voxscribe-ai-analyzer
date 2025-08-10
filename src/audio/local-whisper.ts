// On-device Whisper ASR using @huggingface/transformers
// Lightweight wrapper that lazily loads the ASR pipeline and exposes a simple PCM interface

let _transcriberPromise: Promise<any> | null = null;

// Encode Float32 PCM at 16kHz into a WAV Blob (16-bit PCM)
function floatTo16BitPCM(input: Float32Array) {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return view;
}

function writeWAVHeader(bytes: number, sampleRate = 16000, numChannels = 1) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  function writeString(v: string, offset: number) {
    for (let i = 0; i < v.length; i++) view.setUint8(offset + i, v.charCodeAt(i));
  }

  writeString("RIFF", 0);
  view.setUint32(4, 36 + bytes, true);
  writeString("WAVE", 8);
  writeString("fmt ", 12);
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString("data", 36);
  view.setUint32(40, bytes, true);
  return view;
}

function encodeWavBlob(samples: Float32Array, sampleRate = 16000) {
  const pcm16 = floatTo16BitPCM(samples);
  const header = writeWAVHeader(pcm16.byteLength, sampleRate, 1);
  const blob = new Blob([header, pcm16], { type: "audio/wav" });
  return blob;
}

async function getTranscriber() {
  if (!_transcriberPromise) {
    _transcriberPromise = (async () => {
      const { pipeline } = await import("@huggingface/transformers");
      // Prefer WebGPU when available, fallback to CPU
      const device = ("gpu" in navigator || (navigator as any).gpu) ? "webgpu" : "cpu";
      const transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny.en",
        { device }
      );
      return transcriber;
    })();
  }
  return _transcriberPromise;
}

export const localWhisper = {
  // Accept Float32Array at 16kHz mono. Returns recognized text (may be empty)
  async transcribePCM(samples16k: Float32Array) {
    if (!samples16k || samples16k.length === 0) return "";
    try {
      const transcriber = await getTranscriber();
      // Easiest path: provide a Blob URL that the pipeline can fetch/decode
      const wav = encodeWavBlob(samples16k, 16000);
      const url = URL.createObjectURL(wav);
      const out = await transcriber(url);
      URL.revokeObjectURL(url);
      const text = (out && (out.text || out["text"])) || "";
      return typeof text === "string" ? text.trim() : "";
    } catch (e) {
      console.warn("localWhisper.transcribePCM failed", e);
      return "";
    }
  },
  // Warm the model
  async warmup() {
    try {
      await getTranscriber();
    } catch {
      // noop
    }
  },
};
