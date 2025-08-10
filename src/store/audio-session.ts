// Audio capture + simple chunked transcription using local Whisper
// Captures mic (and optionally system/tab audio) mixes to mono, downsamples to 16kHz, and emits periodic transcripts

import { localWhisper } from "@/audio/local-whisper";

export type AudioStartOptions = {
  mic?: boolean;
  system?: boolean; // capture current tab/system audio via getDisplayMedia
  chunkSec?: number; // seconds per transcription chunk (default 5)
  onText?: (text: string, source?: "mic" | "system" | "mix") => void;
};

function downsampleBuffer(buffer: Float32Array, inSampleRate: number, outSampleRate = 16000): Float32Array {
  if (outSampleRate === inSampleRate) return buffer;
  const sampleRateRatio = inSampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    // Simple average to avoid aliasing too much
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

class AudioSessionImpl {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sysStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mixNode: MediaStreamAudioDestinationNode | null = null;
  private onText: AudioStartOptions["onText"] | null = null;
  private chunkSec = 5;
  private buffer16k: Float32Array[] = [];
  private busy = false;
  private interval: number | null = null;

  async start(opts: AudioStartOptions = {}) {
    if (this.ctx) return; // already running

    this.chunkSec = Math.max(2, Math.floor(opts.chunkSec || 5));
    this.onText = opts.onText || null;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const sources: MediaStreamAudioSourceNode[] = [];

    if (opts.mic !== false) {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const micSrc = this.ctx.createMediaStreamSource(this.micStream);
      sources.push(micSrc);
    }

    if (opts.system) {
      try {
        // Note: user must choose a tab/window and enable "Share tab audio" in the picker
        this.sysStream = await (navigator.mediaDevices as any).getDisplayMedia({ audio: true, video: true });
        const sysSrc = this.ctx.createMediaStreamSource(this.sysStream);
        sources.push(sysSrc);
      } catch (e) {
        console.warn("System audio capture not granted", e);
      }
    }

    // Mix to mono via ChannelMerger/ChannelSplitter is overkill; average channels in processor
    this.processor = this.ctx.createScriptProcessor(4096, sources.length || 1, 1);

    sources.forEach((src) => src.connect(this.processor!));
    this.processor.connect(this.ctx.destination); // required in some browsers for 'audioprocess' to fire

    const inRate = this.ctx.sampleRate;

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer;
      const ch = input.numberOfChannels;
      const len = input.length;
      const mix = new Float32Array(len);
      // Sum/average channels across all inputs
      for (let c = 0; c < ch; c++) {
        const data = input.getChannelData(c);
        for (let i = 0; i < len; i++) {
          mix[i] += data[i] / ch;
        }
      }
      const mono16k = downsampleBuffer(mix, inRate, 16000);
      this.buffer16k.push(mono16k);
      // keep max ~30s of audio
      const totalSamples = this.buffer16k.reduce((acc, a) => acc + a.length, 0);
      const maxSamples = 16000 * 30;
      if (totalSamples > maxSamples) {
        // drop oldest chunks
        let toDrop = totalSamples - maxSamples;
        while (toDrop > 0 && this.buffer16k.length) {
          const first = this.buffer16k[0];
          if (first.length <= toDrop) {
            toDrop -= first.length;
            this.buffer16k.shift();
          } else {
            this.buffer16k[0] = first.subarray(toDrop);
            toDrop = 0;
          }
        }
      }
    };

    // Periodic transcription of the latest N seconds
    this.interval = window.setInterval(() => this.transcribeChunk(), this.chunkSec * 1000);

    // Warm up the model
    localWhisper.warmup();
  }

  private async transcribeChunk() {
    if (this.busy) return;
    const needed = 16000 * this.chunkSec;
    const concat = this.concatBuffer(Math.min(needed, this.totalLen()));
    if (!concat || concat.length < 16000 * Math.max(1, this.chunkSec - 1)) return; // need enough audio
    this.busy = true;
    try {
      const text = await localWhisper.transcribePCM(concat);
      if (text && this.onText) this.onText(text, "mix");
    } finally {
      this.busy = false;
    }
  }

  private totalLen() {
    return this.buffer16k.reduce((acc, a) => acc + a.length, 0);
  }

  private concatBuffer(samples: number): Float32Array | null {
    if (samples <= 0) return null;
    const out = new Float32Array(samples);
    let offset = 0;
    // Take from the end (most recent)
    let remaining = samples;
    for (let i = this.buffer16k.length - 1; i >= 0 && remaining > 0; i--) {
      const chunk = this.buffer16k[i];
      const take = Math.min(chunk.length, remaining);
      out.set(chunk.subarray(chunk.length - take), samples - remaining);
      remaining -= take;
    }
    return out;
  }

  stop() {
    try {
      if (this.interval) window.clearInterval(this.interval);
      this.interval = null;
      if (this.processor) {
        try { this.processor.disconnect(); } catch { }
        this.processor.onaudioprocess = null as any;
        this.processor = null;
      }
      if (this.ctx) {
        try { this.ctx.close(); } catch { }
        this.ctx = null;
      }
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
        this.micStream = null;
      }
      if (this.sysStream) {
        this.sysStream.getTracks().forEach((t) => t.stop());
        this.sysStream = null;
      }
      this.buffer16k = [];
      this.busy = false;
      this.onText = null;
    } catch {
      // noop
    }
  }
}

export const audioSession = new AudioSessionImpl();
