// Audio capture + simple chunked transcription using local Whisper
// Captures mic (and optionally system/tab audio) mixes to mono, downsamples to 16kHz, and emits periodic transcripts

import { localWhisper } from "@/audio/local-whisper";

export type AudioStartOptions = {
  mic?: boolean;
  system?: boolean; // capture current tab/system audio via getDisplayMedia
  chunkSec?: number; // seconds per transcription chunk (default 5)
  onText?: (text: string, source?: "mic" | "system" | "mix") => void;
  onLevel?: (rms: number, peak: number, gated: boolean) => void; // live input meter callback
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
  private mixNode: MediaStreamAudioDestinationNode | null = null; // legacy, unused
  private mixGain: GainNode | null = null;
  private hp: BiquadFilterNode | null = null;
  private lp: BiquadFilterNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private onText: AudioStartOptions["onText"] | null = null;
  private onLevel: AudioStartOptions["onLevel"] | null = null;
  private chunkSec = 4;
  private buffer16k: Float32Array[] = [];
  private busy = false;
  private interval: number | null = null;
  private baselineRMS = 0.004;
  private baselinePeak = 0.02;
  private lastLevelAt = 0;

  async start(opts: AudioStartOptions = {}) {
    if (this.ctx) return; // already running

    this.chunkSec = Math.max(2, Math.floor(opts.chunkSec || 4));
    this.onText = opts.onText || null;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const sources: MediaStreamAudioSourceNode[] = [];

    if (opts.mic !== false) {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        } as any,
        video: false,
      });
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

    // Mix sources -> high-pass -> compressor -> processor (mono)
    this.mixGain = this.ctx.createGain();
    this.mixGain.gain.value = 1 / Math.max(1, sources.length);

    sources.forEach((src) => src.connect(this.mixGain!));

    this.hp = this.ctx.createBiquadFilter();
    this.hp.type = "highpass";
    this.hp.frequency.value = 120;
    this.hp.Q.value = 0.707;

    this.lp = this.ctx.createBiquadFilter();
    this.lp.type = "lowpass";
    this.lp.frequency.value = 6000;
    this.lp.Q.value = 0.707;

    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -24;
    this.comp.knee.value = 30;
    this.comp.ratio.value = 3;
    this.comp.attack.value = 0.003;
    this.comp.release.value = 0.25;

    this.processor = this.ctx.createScriptProcessor(2048, 2, 1);

    this.mixGain.connect(this.hp);
    this.hp.connect(this.lp);
    this.lp.connect(this.comp);
    this.comp.connect(this.processor);
    this.processor.connect(this.ctx.destination); // required in some browsers for 'audioprocess' to fire

    const inRate = this.ctx.sampleRate;
    // reset adaptive baselines
    this.baselineRMS = 0.004;
    this.baselinePeak = 0.02;
    this.lastLevelAt = 0;
    try {
      await this.ctx.resume();
      console.debug("AudioSession started", { sampleRate: inRate, inputs: sources.length });
    } catch (e) {
      console.warn("AudioContext resume failed", e);
    }

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
      // Frame-level RMS/peak for live meter (pre-downsample)
      let fsum = 0, fpeak = 0;
      for (let i = 0; i < len; i++) {
        const v = mix[i];
        fsum += v * v;
        const av = v < 0 ? -v : v;
        if (av > fpeak) fpeak = av;
      }
      const frameRMS = Math.sqrt(fsum / len);
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (!this.lastLevelAt || now - this.lastLevelAt > 100) {
        this.onLevel?.(frameRMS, fpeak, false);
        this.lastLevelAt = now;
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

    // Adaptive silence gate using RMS and Peak with baselines
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < concat.length; i++) {
      const v = concat[i];
      sum += v * v;
      const av = v < 0 ? -v : v;
      if (av > peak) peak = av;
    }
    const rms = Math.sqrt(sum / concat.length);

    const minRMS = 0.006;
    const minPeak = 0.03;
    const thrRMS = Math.max(minRMS, this.baselineRMS * 2.5);
    const thrPeak = Math.max(minPeak, this.baselinePeak * 2.0);

    const gated = rms < thrRMS && peak < thrPeak;
    if (gated) {
      // too quiet; update noise floor slowly, consume most of buffer and skip
      this.baselineRMS = this.baselineRMS * 0.95 + rms * 0.05;
      this.baselinePeak = this.baselinePeak * 0.95 + peak * 0.05;
      const keep = Math.floor(16000 * 0.5);
      this.buffer16k = [concat.subarray(Math.max(0, concat.length - keep))];
      this.onLevel?.(rms, peak, true);
      return;
    }

    this.busy = true;
    try {
      const text = await localWhisper.transcribePCM(concat);
      let cleaned = (text || "")
        .replace(/\[BLANK_AUDIO\]|<\|nospeech\|>/gi, "")
        .replace(/\s+/g, " ")
        .trim();
const words = cleaned ? cleaned.split(/\s+/).filter(Boolean) : [];
      const hasVowel = /[aeiouy]/i.test(cleaned);
      if (!cleaned || !hasVowel || (cleaned.length < 14 && words.length < 3)) {
        // Not confident enough; consume buffer tail and skip
        const keep = Math.floor(16000 * 0.5);
        this.buffer16k = [concat.subarray(Math.max(0, concat.length - keep))];
        console.debug("ASR skipped (short/low-confidence)", { len: concat.length, rms: Number(rms.toFixed(5)), text: cleaned });
      } else if (this.onText) {
        this.onText(cleaned, "mix");
        // Consume most of the buffer to avoid re-processing; keep 0.5s tail
        const keep = Math.floor(16000 * 0.5);
        this.buffer16k = [concat.subarray(Math.max(0, concat.length - keep))];
        console.debug("ASR accepted", { len: concat.length, rms: Number(rms.toFixed(5)), text: cleaned });
      }
    } catch (e) {
      console.warn("ASR failed", e);
    } finally {
      this.busy = false;
    }
  }

  private totalLen() {
    return this.buffer16k.reduce((acc, a) => acc + a.length, 0);
  }

  private concatBuffer(samples: number): Float32Array | null {
    if (samples <= 0) return null;
    const total = this.totalLen();
    const out = new Float32Array(samples);
    let offset = 0;
    let start = Math.max(0, total - samples);
    for (let i = 0; i < this.buffer16k.length; i++) {
      const chunk = this.buffer16k[i];
      if (start >= chunk.length) {
        start -= chunk.length;
        continue;
      }
      const part = chunk.subarray(start);
      out.set(part, offset);
      offset += part.length;
      start = 0;
      if (offset >= samples) break;
    }
    return out.subarray(0, samples);
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
      if (this.comp) { try { this.comp.disconnect(); } catch { } this.comp = null; }
      if (this.lp) { try { this.lp.disconnect(); } catch { } this.lp = null; }
      if (this.hp) { try { this.hp.disconnect(); } catch { } this.hp = null; }
      if (this.mixGain) { try { this.mixGain.disconnect(); } catch { } this.mixGain = null; }
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
