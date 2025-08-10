import { callsStore } from "./calls";
import { audioSession } from "./audio-session";

export type Segment = {
  id: string;
  speaker: string;
  timestamp: string; // e.g. 00:01:23
  text: string;
  selected?: boolean;
};

export type LiveSessionState = {
  connected: boolean;
  name: string;
  startedAt: string | null; // ISO or null if not started
  segments: Segment[];
  levelRMS?: number;
  levelPeak?: number;
  gated?: boolean;
  pendingText?: string;
  speaking?: boolean;
};

// Seed segments
const initialSegments: Segment[] = [
  {
    id: "s1",
    speaker: "Moderator",
    timestamp: "00:00:04",
    text:
      "Good evening and welcome to tonight's debate. Each candidate will offer an opening statement, and then we'll move through questions on the budget, housing, transportation, and public safety. Let's keep answers focused and respectful.",
  },
  {
    id: "s2",
    speaker: "Candidate A",
    timestamp: "00:00:22",
    text:
      "Thank you. Our city is at an inflection point. My plan prioritizes affordability and opportunity: we will accelerate housing near transit, reform outdated zoning, and invest in community safety that is both effective and accountable. This is about pragmatic leadership and measurable results.",
  },
  {
    id: "s3",
    speaker: "Candidate B",
    timestamp: "00:00:47",
    text:
      "I appreciate the chance to speak with you tonight. We need bold climate action, reliable transit, and a government that works for everyone, not just the well-connected. I will champion clean energy jobs, fix our roads, and make City Hall more transparent and responsive.",
  },
  {
    id: "s4",
    speaker: "Moderator",
    timestamp: "00:01:12",
    text:
      "Let's begin with the budget. The city faces a projected shortfall next year. What specific steps will you take to close the gap without undermining essential services like sanitation, public safety, and libraries?",
  },
  {
    id: "s5",
    speaker: "Candidate A",
    timestamp: "00:01:35",
    text:
      "We can balance the budget without deep service cuts by auditing no-bid contracts, consolidating duplicative programs, and renegotiating vendor rates. We'll also modernize procurement to reduce waste and invest in digital tools that save money over time.",
  },
  {
    id: "s6",
    speaker: "Candidate B",
    timestamp: "00:02:03",
    text:
      "My approach is to grow revenue fairly while prioritizing core services. We will close tax loopholes, expand the commercial tax base by streamlining permits for small businesses, and target federal infrastructure dollars to projects that unlock long-term savings.",
  },
  {
    id: "s7",
    speaker: "Moderator",
    timestamp: "00:02:28",
    text:
      "On transportation: commuters report longer travel times and inconsistent service. What investments will you make to improve reliability while reducing congestion and emissions?",
  },
  {
    id: "s8",
    speaker: "Candidate A",
    timestamp: "00:02:52",
    text:
      "We'll fund bus rapid transit corridors, upgrade signals for transit priority, and fix dangerous intersections. I will also expand secure bike networks and adopt a state-of-good-repair strategy for roads to reduce costly emergency repairs.",
  },
];

// Rotating sample lines for continuous streaming
const POLITICAL_SAMPLE: { speaker: string; text: string }[] = [
  { speaker: "Moderator", text: "Housing costs have outpaced wages for years. Name two actions you would take in your first 100 days to meaningfully increase supply without displacing existing residents." },
  { speaker: "Candidate A", text: "Day one, I will sign an executive directive to fast-track projects near transit with clear affordability targets, and I will propose a by-right code update for missing-middle housing in designated corridors." },
  { speaker: "Candidate B", text: "I will launch a city–university design lab to convert underutilized commercial space into housing and establish a public land bank to activate vacant parcels for mixed-income developments." },
  { speaker: "Moderator", text: "Public safety remains a top concern. How will you reduce violent crime while ensuring civil liberties and community trust?" },
  { speaker: "Candidate A", text: "We'll focus on the small number of individuals driving violent offenses with precision policing and expand non-emergency response teams for mental health and substance use calls." },
  { speaker: "Candidate B", text: "We need a prevention-first strategy: youth jobs, after-school programs, and evidence-based violence interruption, paired with training and accountability for law enforcement." },
  { speaker: "Moderator", text: "Climate resilience: storms and heat waves are intensifying. What is your plan to protect vulnerable neighborhoods?" },
  { speaker: "Candidate A", text: "We'll accelerate cool roofs and tree canopy in heat islands, harden critical infrastructure, and elevate or retrofit homes in flood zones with federal support." },
  { speaker: "Candidate B", text: "I will create a resilience bond to finance green infrastructure—bioswales, permeable streets, and coastal wetlands—while setting ambitious emissions targets for city operations." },
  { speaker: "Moderator", text: "Education: test scores have declined post-pandemic. What will you do to improve outcomes?" },
  { speaker: "Candidate A", text: "We'll invest in high-dosage tutoring, expand early literacy programs, and partner with community organizations to provide wraparound services for students and families." },
  { speaker: "Candidate B", text: "Teachers need support and classrooms need resources. We'll reduce administrative burdens, expand apprenticeships with local employers, and provide universal aftercare." },
  { speaker: "Moderator", text: "Small business formation is slowing. How will you cut red tape while maintaining consumer protections?" },
  { speaker: "Candidate A", text: "We'll launch a one-stop digital permit portal with service-level guarantees and publish a plain-language code to reduce uncertainty for entrepreneurs." },
  { speaker: "Candidate B", text: "I'll implement a 72-hour permit review for low-risk businesses, waive first-year fees for startups in underserved neighborhoods, and expand main street grants." },
  { speaker: "Moderator", text: "Tax policy: would you adjust property taxes or introduce new fees to stabilize revenue?" },
  { speaker: "Candidate A", text: "No across-the-board hikes. We'll reassess ultra-high-value properties, close speculative loopholes, and ensure fairness without burdening working families." },
  { speaker: "Candidate B", text: "I'll create a progressive circuit breaker to protect seniors and low-income homeowners while modestly increasing rates on vacant luxury units to discourage warehousing." },
  { speaker: "Moderator", text: "Infrastructure: we've seen water main breaks and power outages. What's your plan?" },
  { speaker: "Candidate A", text: "A transparent capital plan prioritizing risk: replace failing mains, upgrade substations, and coordinate street openings across agencies to cut costs and delays." },
  { speaker: "Candidate B", text: "Public–private partnerships for grid modernization, citywide smart meters, and an open data dashboard so residents can track progress in real time." },
  { speaker: "Moderator", text: "Data privacy and technology: how will you harness AI while safeguarding rights?" },
  { speaker: "Candidate A", text: "We'll adopt an AI accountability framework: algorithmic impact assessments, procurement standards, and an ethics board with community representation." },
  { speaker: "Candidate B", text: "Open-source by default, privacy-by-design for all new systems, and strict limits on automated decision-making in sensitive services." },
  { speaker: "Moderator", text: "Homelessness: shelters are at capacity. What interventions will you scale?" },
  { speaker: "Candidate A", text: "Housing-first with supportive services, master leasing vacant buildings, and expanding street outreach teams with clinical staff." },
  { speaker: "Candidate B", text: "Right-to-counsel for tenants, rapid rehousing vouchers, and mental health stabilization centers that divert people from the criminal justice system." },
  { speaker: "Moderator", text: "Transit reliability has been uneven across neighborhoods. How will you ensure equity?" },
  { speaker: "Candidate A", text: "We'll prioritize bus lanes and signal priority in underserved areas first and tie capital investments to accessibility and on-time performance metrics." },
  { speaker: "Candidate B", text: "A universal fare discount for low-income riders, more frequent off-peak service, and safe, well-lit stations with working elevators." },
  { speaker: "Moderator", text: "Government transparency: what commitments will you make on your first day?" },
  { speaker: "Candidate A", text: "Publish all meeting calendars, release machine-readable budget data, and livestream procurement board decisions." },
  { speaker: "Candidate B", text: "Adopt an open contracts platform, strengthen whistleblower protections, and require department performance reports every quarter." },
];

let state: LiveSessionState = {
  connected: false,
  name: "Live Call",
  startedAt: null,
  segments: [],
  levelRMS: 0,
  levelPeak: 0,
  gated: false,
  pendingText: "",
  speaking: false,
};

const listeners = new Set<(s: LiveSessionState) => void>();
let timer: number | null = null;
let evalTimer: number | null = null;
let sampleIndex = 0;
let currentMode: 'demo' | 'real' | null = null;

// snapshots for level evaluation
let lastRMS = 0;
let lastPeak = 0;
let lastGated = false;
let lastLevelAt = 0;
// smoothed meters and stable speech state
let smRMS = 0;
let smPeak = 0;
let speakingStable = false;
let speechOnSince = 0;
let speechOffSince = 0;

// Utterance grouping configuration
const SILENCE_MS = 1800; // end-of-speech silence window (more deliberate end)
const MAX_UTTER_MS = 30000; // force finalize after this duration (30s)
const INACTIVITY_FINALIZE_MS = 1800; // minimum inactivity before considering finalize
const MIN_CHARS = 18; // guardrail: avoid tiny segments
const MIN_WORDS = 4;
const SILENCE_RMS = 0.006;
const SILENCE_PEAK = 0.03;

// Hysteresis thresholds and holds for stable speech detection
const SPEECH_RMS_ON = 0.012;
const SPEECH_RMS_OFF = 0.008;
const SPEECH_PEAK_ON = 0.06;
const SPEECH_PEAK_OFF = 0.035;
const SPEECH_ON_HOLD_MS = 150;
const SPEECH_OFF_HOLD_MS = 900; // more stable OFF hold
const FINALIZE_ARM_MS = 350; // debounce before finalizing once conditions met
// Fallback finalization thresholds
const LONG_SILENCE_MS = 2600;
const LONG_INACTIVITY_MS = 3500;

type PendingUtterance = {
  speaker: string;
  text: string;
  startedAt: number;
  lastTextAt: number;
  avgOnTextMs?: number;
};

let pending: PendingUtterance | null = null;
let lastVoiceAt = 0;
let finalizeArmedAt = 0;

function overlapAppend(a: string, b: string): string {
  const A = (a || "").trim();
  const B = (b || "").trim();
  if (!A) return B;
  if (!B) return A;
  if (B.startsWith(A)) return B; // B is a superset of A
  if (A.endsWith(B)) return A;   // B already included

  const aLow = A.toLowerCase();
  const bLow = B.toLowerCase();
  const maxOverlap = Math.min(60, A.length, B.length);
  for (let k = maxOverlap; k >= 6; k--) {
    if (aLow.slice(-k) === bLow.slice(0, k)) {
      return A + B.slice(k);
    }
  }
  return A + (A.endsWith(" ") || B.startsWith(" ") ? "" : " ") + B; // default append with space
}

function finalizePending(force = false, reason?: string) {
  if (!pending) return;
  const text = pending.text.trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const shouldKeep = words.length >= MIN_WORDS || text.length >= MIN_CHARS;
  if (!force && !shouldKeep) {
    console.debug("Finalize dropped (too small, silence)", { reason, len: text.length, words: words.length });
    pending = null;
    lastVoiceAt = 0;
    return;
  }
  if (force && !(words.length >= 2 || text.length >= 8)) {
    console.debug("Finalize dropped (too small, forced)", { reason, len: text.length, words: words.length });
    pending = null;
    lastVoiceAt = 0;
    return;
  }
  console.debug("Finalize utterance", { reason, force, len: text.length, words: words.length });
  const seg = {
    id: `s-${Date.now()}`,
    speaker: pending.speaker,
    timestamp: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
    text,
  } as Segment;
  state = { ...state, segments: [...state.segments, seg], pendingText: "" };
  pending = null;
  lastVoiceAt = 0;
  notify();
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {}
  });
}

function startTimer() {
  if (timer || currentMode !== 'demo') return;
  timer = window.setInterval(() => {
    const line = POLITICAL_SAMPLE[sampleIndex % POLITICAL_SAMPLE.length];
    sampleIndex = (sampleIndex + 1) % POLITICAL_SAMPLE.length;
    state = {
      ...state,
      segments: [
        ...state.segments,
        {
          id: `s-${Date.now()}`,
          speaker: line.speaker,
          timestamp: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
          text: line.text,
        },
      ],
    };
    notify();
  }, 2500);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startEvalTimer() {
  if (evalTimer || currentMode !== 'real') return;
  evalTimer = window.setInterval(evaluatePending, 200);
}

function stopEvalTimer() {
  if (evalTimer) {
    clearInterval(evalTimer);
    evalTimer = null;
  }
}

// Evaluate pending utterance based on timers and last known levels
function evaluatePending() {
  if (!pending) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const dur = now - pending.startedAt;
  if (dur >= MAX_UTTER_MS) {
    finalizePending(true, "max_duration_tick");
    finalizeArmedAt = 0;
    return;
  }
  const sinceLastText = now - pending.lastTextAt;
  const inactivityMs = Math.max(
    INACTIVITY_FINALIZE_MS,
    pending.avgOnTextMs ? Math.min(INACTIVITY_FINALIZE_MS * 2.5, pending.avgOnTextMs * 3) : INACTIVITY_FINALIZE_MS
  );
  const silenceOk = !speakingStable && lastVoiceAt && now - lastVoiceAt >= SILENCE_MS;
  const inactivityOk = !speakingStable && sinceLastText >= inactivityMs;

  if (silenceOk && inactivityOk) {
    if (!finalizeArmedAt) finalizeArmedAt = now;
    else if (now - finalizeArmedAt >= FINALIZE_ARM_MS) {
      finalizePending(false, "armed_both_tick");
      finalizeArmedAt = 0;
    }
  } else {
    // Fallback paths when conditions individually persist
    if (!speakingStable && lastVoiceAt && now - lastVoiceAt >= LONG_SILENCE_MS) {
      finalizePending(false, "fallback_long_silence_tick");
    } else if (sinceLastText >= LONG_INACTIVITY_MS) {
      finalizePending(false, "fallback_long_inactivity_tick");
    }
    finalizeArmedAt = 0;
  }
}

export const liveSession = {
  getState(): LiveSessionState {
    return state;
  },
  subscribe(listener: (s: LiveSessionState) => void) {
    listeners.add(listener);
    try { listener(state); } catch {}
    return () => {
      listeners.delete(listener);
    };
  },
connect(name = "Live Call", options?: { mode?: 'demo' | 'real'; systemAudio?: boolean; reset?: boolean }) {
  stopTimer();
  stopEvalTimer();
  try { audioSession.stop(); } catch {}
  currentMode = options?.mode ?? 'real';
  sampleIndex = 0;

// reset transient state for fresh utterance detection
pending = null;
lastVoiceAt = 0;
finalizeArmedAt = 0;

  const nowIso = new Date().toISOString();
  const reset = !!options?.reset;
  state = reset
    ? { connected: true, name, startedAt: nowIso, segments: [], levelRMS: 0, levelPeak: 0, gated: false, pendingText: "", speaking: false }
    : {
        ...state,
        connected: true,
        name,
        startedAt: state.startedAt || nowIso,
        levelRMS: 0,
        levelPeak: 0,
        gated: false,
        pendingText: state.pendingText || "",
        speaking: false,
      };
  callsStore.startLive(name);

  if (currentMode === 'demo') {
    startTimer();
  } else {
    audioSession.start({
      mic: true,
      system: !!options?.systemAudio,
      chunkSec: 2,
      onText: (text) => {
        const t = (text || "").trim();
        if (!t) return;
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (!pending) {
          pending = { speaker: "You", text: t, startedAt: now, lastTextAt: now, avgOnTextMs: undefined };
        } else {
          const next = overlapAppend(pending.text, t);
          if (next !== pending.text) {
            const delta = now - pending.lastTextAt;
            pending.text = next;
            pending.avgOnTextMs = pending.avgOnTextMs ? (pending.avgOnTextMs * 0.7 + delta * 0.3) : delta;
            pending.lastTextAt = now;
          }
        }
        state = { ...state, pendingText: (pending?.text || "") };
        notify();
      },
      onLevel: (rms, peak, gated) => {
        // smooth meters
        smRMS = smRMS ? smRMS * 0.8 + rms * 0.2 : rms;
        smPeak = smPeak ? smPeak * 0.8 + peak * 0.2 : peak;
        state = { ...state, levelRMS: smRMS, levelPeak: smPeak, gated: !!gated, speaking: speakingStable };
        notify();
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        // snapshot latest raw levels
        lastRMS = rms;
        lastPeak = peak;
        lastGated = !!gated;
        lastLevelAt = now;

        // Hysteresis-based speaking detection with impulse guard
        const ratio = smPeak / (smRMS + 1e-6);
        const isImpulse = ratio > 12 && smRMS < SILENCE_RMS * 1.1;
        const aboveOn = (smRMS >= SPEECH_RMS_ON) || ((smPeak >= SPEECH_PEAK_ON) && smRMS >= SILENCE_RMS);
        const belowOff = (smRMS <= SPEECH_RMS_OFF) && (smPeak <= SPEECH_PEAK_OFF);
        if (!isImpulse) {
          if (aboveOn) {
            if (!speechOnSince) speechOnSince = now;
            speechOffSince = 0;
            if (!speakingStable && now - speechOnSince >= SPEECH_ON_HOLD_MS) {
              speakingStable = true;
            }
          } else if (belowOff) {
            if (!speechOffSince) speechOffSince = now;
            speechOnSince = 0;
            if (speakingStable && now - speechOffSince >= SPEECH_OFF_HOLD_MS) {
              speakingStable = false;
            }
          } // else keep holds
        }

        if (speakingStable && !isImpulse) {
          lastVoiceAt = now;
        }

        if (pending) {
          const dur = now - pending.startedAt;
          if (dur >= MAX_UTTER_MS) {
            finalizePending(true, "max_duration");
            finalizeArmedAt = 0;
            return;
          }
          const sinceLastText = now - pending.lastTextAt;
          const inactivityMs = Math.max(
            INACTIVITY_FINALIZE_MS,
            pending.avgOnTextMs ? Math.min(INACTIVITY_FINALIZE_MS * 2.5, pending.avgOnTextMs * 3) : INACTIVITY_FINALIZE_MS
          );
          const silenceOk = !speakingStable && lastVoiceAt && now - lastVoiceAt >= SILENCE_MS;
          const inactivityOk = !speakingStable && sinceLastText >= inactivityMs;

          if (silenceOk && inactivityOk) {
            if (!finalizeArmedAt) finalizeArmedAt = now;
            else if (now - finalizeArmedAt >= FINALIZE_ARM_MS) {
              finalizePending(false, "armed_both");
              finalizeArmedAt = 0;
            }
          } else {
            // Fallback: finalize on long silence OR long inactivity
            if (!speakingStable && lastVoiceAt && now - lastVoiceAt >= LONG_SILENCE_MS) {
              finalizePending(false, "fallback_long_silence");
            } else if (sinceLastText >= LONG_INACTIVITY_MS) {
              finalizePending(false, "fallback_long_inactivity");
            }
            finalizeArmedAt = 0;
          }
        }
      },
    });
  }
  startEvalTimer();
  notify();
},
disconnect() {
  // Finalize any pending utterance before stopping
  finalizePending(true, "disconnect");
  state = { ...state, connected: false, pendingText: "", speaking: false };
  callsStore.endLive();
  stopTimer();
  stopEvalTimer();
  try { audioSession.stop(); } catch {}
  notify();
},
  toggleSelect(id: string) {
    state = {
      ...state,
      segments: state.segments.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
    };
    notify();
  },
  clearSelection() {
    state = {
      ...state,
      segments: state.segments.map((s) => ({ ...s, selected: false })),
    };
    notify();
  },
  clearTranscript() {
    pending = null;
    lastVoiceAt = 0;
    state = { ...state, segments: [], pendingText: "" };
    notify();
  },
renameSpeaker(from: string, to: string) {
  state = {
    ...state,
    segments: state.segments.map((s) => (s.speaker === from ? { ...s, speaker: to } : s)),
  };
  notify();
},
addSegment(speaker: string, text: string) {
  const t = (text || "").trim();
  if (!t) return;
  state = {
    ...state,
    segments: [
      ...state.segments,
      {
        id: `s-${Date.now()}`,
        speaker,
        timestamp: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
        text: t,
      },
    ],
  };
  notify();
},
};
