/*
TrackerVisualizer.jsx
Single-file React component that implements:
 - Pattern editor (Schism Tracker style grid)
 - Channel/instrument list
 - Track visualization (waveform-like simplified view)
 - Brutalist / BIOS inspired UI using Tailwind classes

How to use:


Notes:
 - This is a UI-first demo: audio output is simulated (cursor + simple oscillator preview code is included but can be removed).
 - Styling uses Tailwind utility classes; tweak the `bg-...` classes to tune the brutalist palette.
 - Uses inline canvas and SVG for visualization. No external audio libraries required.

*/
import lamejs from "lamejs";
import React, { useEffect, useRef, useState } from 'react';

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function freqToNoteName(freq) {
  if (!freq || freq <= 0) return "--";
  const A4 = 440;
  const semitones = Math.round(12 * Math.log2(freq / A4));
  const midi = 69 + semitones;
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

/* -------------------- ADD THESE TWO -------------------- */
function AudioLengthVisualizer({ audioCtxRef, sourceRef, analyserRef, playing }) {
  const [progress, setProgress] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const rafRef = React.useRef();

  React.useEffect(() => {
    if (!playing || !audioCtxRef.current || !sourceRef.current) {
      cancelAnimationFrame(rafRef.current);
      setProgress(0);
      setCurrentTime(0);
      return;
    }

    const ctx = audioCtxRef.current;
    const src = sourceRef.current;

    // We assume sourceRef.current.buffer is an AudioBuffer
    const total = src.buffer?.duration || 0;
    setDuration(total);

    const update = () => {
      if (!ctx || ctx.state !== "running") return;
      const elapsed = ctx.currentTime - (src.startTime || 0);
      setCurrentTime(Math.min(elapsed, total));
      setProgress(total ? Math.min(elapsed / total, 1) : 0);
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, audioCtxRef, sourceRef]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs font-mono text-[#888] mb-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div
    className="h-full bg-[#7fffd4] transition-all duration-100 cursor-pointer"
    style={{ width: `${progress * 100}%` }}
    onClick={(e) => {
      if (!audioCtxRef.current || !sourceRef.current || !sourceRef.current.buffer) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = clickX / rect.width;
      const newTime = newProgress * sourceRef.current.buffer.duration;

      seekToTime(newTime); // call the function we will define
    }}
  />
      
    </div>
  );
 function seekToTime(timeInSeconds) {
const audioCtx = audioCtxRef.current;
    const oldSource = sourceRef.current; // use sourceRef instead of oscRef
    if (!audioCtx || !oldSource || !oldSource.buffer) return;

    try { oldSource.stop(); } catch(e){}

    const newSource = audioCtx.createBufferSource();
   newSource.buffer = oldSource.buffer;
    newSource.startTime = audioCtx.currentTime - timeInSeconds; // store starting time

    const newAnalyser = audioCtx.createAnalyser();
    newAnalyser.fftSize = 2048;

    newSource.connect(newAnalyser);
    newAnalyser.connect(audioCtx.destination);

    // update refs
    sourceRef.current = newSource;      // update sourceRef
    analyserRef.current = newAnalyser;  // update analyserRef

    newSource.start(0, timeInSeconds);
  };
}

function AsciiCircleVisualizer({ analyserRef, playing }) {
  const [face, setFace] = React.useState("(・‿・)");
  const rafRef = React.useRef();

  // 30 ASCII moods from chill → chaos
const asciiFaces = [
  // 0–9: calm & relaxed
  "(·‿·)", "(・‿・)", "(-‿-)", "(￣‿￣)", "(^‿^)", "(^‿-)", "(o‿o)", "(◕‿◕)", "(＾‿＾)", "(＾▽＾)",
  // 10–19: playful & alert
  "(•‿•)", "(¬‿¬)", "(^▽^)", "(・▽・)", "(>‿<)", "(⊙‿⊙)", "(°‿°)", "(ʘ‿ʘ)", "(⊙ᴗ⊙)", "(☆‿☆)",
  // 20–29: surprised / active
  "(°o°)", "(⊙o⊙)", "(☉_☉)", "(⊙_☉)", "(◎_◎;)", "(°□°)", "(ᵔoᵔ)", "(◉_◉;)", "(⊙﹏⊙)", "(ʘoʘ)",
  // 30–39: expressive / intense
  "(╯°□°）╯", "(╮°-°)╭", "(งಠ_ಠ)ง", "(ง •̀_•́)ง", "(ಠ‿ಠ)", "(ಠ⌣ಠ)", "(ಥ‿ಥ)", "(ಥ﹏ಥ)", "(ಥ_ʖಥ)", "(☠‿☠)",
  // 40–49: angry / chaotic / energy burst
  "(ノಠ益ಠ)ノ", "(ノಠ益ಠ)ノ彡┻━┻", "(>_<)", "(≧▽≦)", "(≧︿≦)", "(>﹏<)", "(⌐■_■)", "(ಠ益ಠ)", "(ಠ╭╮ಠ)", "(ノ｀Д´)ノ",
  // 50–59: transcendent / funky / meme energy
  "(⊂◉‿◉⊃)", "(☯‿☯)", "(☉‿☉✿)", "(ノ◕ヮ◕)ノ*:･ﾟ✧", "(ノ◕‿◕)ノ", "(✧◡✧)", "(☆▽☆)", "(⌒‿⌒)", "(◕‿◕✿)", "¯\\(°_o)/¯",
];

  React.useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      setFace("(・‿・)");
      return;
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let smooth = 0; // smoothed average to reduce jitter

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      // simple smoothing
      smooth = smooth * 0.8 + avg * 0.2;

      const level = Math.min(
        asciiFaces.length - 1,
        Math.floor((smooth / 255) * asciiFaces.length)
      );
      setFace(asciiFaces[level]);

      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, analyserRef]);

  return (
    <div className="font-mono text-[#00ff99] text-base flex items-center justify-center h-full select-none transition-all duration-200">
      <pre className="leading-tight">{face}</pre>
    </div>
  );

}

function PatternGridVisualizer({
  analyserRef,
  playing,
}) {
  const [grid, setGrid] = React.useState([]);
  const containerRef = React.useRef(null);
  const rafRef = React.useRef();

  const CHANNELS = 8;
  const ROWS = 64;

  const smoothFreqs = React.useRef(Array(CHANNELS).fill(0)).current;
  // initialize grid
  React.useEffect(() => {
    setGrid(
      Array.from({ length: ROWS }, () =>
        Array.from({ length: CHANNELS }, () => "···")
      )
    );
  }, []);

  // dynamic scroll + reaction to music
  React.useEffect(() => {
    if (!playing || !analyserRef.current) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const newGrid = Array.from({ length: ROWS }, () =>
      Array.from({ length: CHANNELS }, () => "···")
    );

    let cursor = 0;

    const loop = () => {
      analyser.getByteFrequencyData(data);

      // Map frequency spectrum into channels
      const bandsPerChan = Math.floor(data.length / CHANNELS);
const newRow = [];

for (let c = 0; c < CHANNELS; c++) {
  const slice = data.slice(c * bandsPerChan, (c + 1) * bandsPerChan);
  
  // Find peak bin
  let peakIdx = 0;
  let peakVal = 0;
  slice.forEach((v, i) => {
    if (v > peakVal) {
      peakVal = v;
      peakIdx = i;
    }
  });

  // Convert FFT bin to frequency
  
const audioCtx = analyser.context || audioCtxRef.current;
const binFreq = peakIdx * (audioCtx.sampleRate / analyser.fftSize);

// smooth frequency to reduce jitter
smoothFreqs[c] = (smoothFreqs[c] || 0) * 0.7 + binFreq * 0.3;

  // Show note only if amplitude is above threshold
  const note = peakVal < 10 ? "--" : freqToNoteName(binFreq);
  newRow.push(note);
}

newGrid[cursor] = newRow;
setGrid([...newGrid]);

      cursor = (cursor + 1) % ROWS;
      if (containerRef.current) {
        containerRef.current.scrollTop =
          (cursor / ROWS) * containerRef.current.scrollHeight;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, analyserRef]);

  return (
    <div
      ref={containerRef}
      className="border border-[#0f0f0f] bg-[#020202] rounded-sm font-mono text-xs text-[#00ff99] overflow-y-hidden max-h-[280px]"
    >
      {grid.map((row, r) => (
        <div
          key={r}
          className={`flex border-b border-[#0a0a0a] ${
            r === grid.length - 1
              ? "text-[#00ffaa] bg-[#002a1a]"
              : ""
          }`}
        >
          <div className="w-10 text-right pr-2 text-[#00ff99aa]">
            {r.toString().padStart(3, "0")}
          </div>
          {row.map((cell, c) => (
            <div
              key={c}
              className="flex-1 px-1 border-l border-[#002b1e] text-center"
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}



/* -------------------- END ADDITION -------------------- */



export default function TrackerVisualizer() {
  const CHANNELS = 8;
  const ROWS = 64;

  // Generate empty pattern (channels x rows)
  const makePattern = () => Array.from({ length: CHANNELS }, () => Array.from({ length: ROWS }, () => ({ note: "--", instr: "--", vol: "--" })));

  const [pattern, setPattern] = useState(makePattern);
  const [playing, setPlaying] = useState(false);
  const [cursorRow, setCursorRow] = useState(0);
  const [bpm, setBpm] = useState(125);
  const [selectedChan, setSelectedChan] = useState(0);
  const [tempoMs, setTempoMs] = useState(125);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const rafRef = useRef(null);
  const lastTickRef = useRef(performance.now());
  const analyserRef = useRef(null);
  useEffect(() => {
    setTempoMs(Math.round((60_000 / bpm) / 4)); // quarter-step per row approximation
  }, [bpm]);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch(e){}
        oscRef.current = null;
      }
      return;
    }

    // Initialize audio context when starting
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    lastTickRef.current = performance.now();

    const tick = (t) => {
      const elapsed = t - lastTickRef.current;
      if (elapsed >= tempoMs) {
        // move cursor
        setCursorRow(r => (r + 1) % ROWS);
        lastTickRef.current = t;

        // play simple click/osc for active notes in the row
        playRow(cursorRow);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, tempoMs]);

  const playRow = (row) => {
    if (!audioCtxRef.current) return;
    // Simple per-channel tone based on channel index — just for demo
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 110 + (selectedChan * 30);
    gain.gain.value = 0.05; // low volume
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  };

  const togglePlay = async () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    setPlaying(p => !p);
  };

  const editCell = (chan, row) => {
    const newPattern = pattern.map(c => c.slice());
    const cell = { ...newPattern[chan][row] };
    // simple demo editing: cycle note placeholder
    const options = ['C-4', 'D-4', 'E-4', 'F-4', 'G-4', '--'];
    const idx = options.indexOf(cell.note) >= 0 ? (options.indexOf(cell.note) + 1) % options.length : 0;
    cell.note = options[idx];
    newPattern[chan][row] = cell;
    setPattern(newPattern);
  };

  // Canvas visualization for waveform-like per-channel bar
  const visRef = useRef(null);
  useEffect(() => {
    const canvas = visRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth * devicePixelRatio;
    const h = canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.clearRect(0,0,w,h);

    // brutalist grid + bars
    const pad = 8 * devicePixelRatio;
    const barH = (h - pad*2) / CHANNELS;
    for (let c=0;c<CHANNELS;c++){
      const x = pad;
      const y = pad + c*barH + 4*devicePixelRatio;
      // compute intensity from how many non-empty notes in channel
      const active = pattern[c].reduce((acc,cell)=> acc + (cell.note !== '--' ? 1 : 0),0);
      const ratio = active / ROWS;
      // background block
      ctx.fillStyle = '#0b0b0b';
      ctx.fillRect(x, y, w - pad*2, barH - 6*devicePixelRatio);
      // active bar
      ctx.fillStyle = '#7fffd4';
      ctx.fillRect(x+4*devicePixelRatio, y+4*devicePixelRatio, Math.max(2, (w - pad*2 - 8*devicePixelRatio) * ratio), barH - 14*devicePixelRatio);

      // channel label
      ctx.fillStyle = '#cfcfcf';
      ctx.font = `${12*devicePixelRatio}px monospace`;
      ctx.fillText(`CH ${String(c).padStart(2,'0')}  ${active} notes`, x + 6*devicePixelRatio, y + 12*devicePixelRatio);
    }
  }, [pattern]);

  // keyboard navigation: arrow keys to move cursor
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowDown') setCursorRow(r => Math.min(ROWS-1, r+1));
      if (e.key === 'ArrowUp') setCursorRow(r => Math.max(0, r-1));
      if (e.key === 'ArrowRight') setSelectedChan(c => Math.min(CHANNELS-1, c+1));
      if (e.key === 'ArrowLeft') setSelectedChan(c => Math.max(0, c-1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

// Render the current pattern into an OfflineAudioContext and return an AudioBuffer
async function renderToBuffer(pattern, bpm, secondsLimit = 120) {
  // estimate length from pattern rows and bpm: row length = quarter note / 4
  const rows = pattern[0].length;
  const rowDur = (60 / bpm) / 4;
  const estimatedSeconds = Math.min(secondsLimit, rows * rowDur + 1);
  const sampleRate = 44100;
  const channels = 2;
  const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(channels, Math.ceil(sampleRate * estimatedSeconds), sampleRate);

  const master = offlineCtx.createGain();
  master.gain.value = 0.9;
  master.connect(offlineCtx.destination);

  // For each channel and row, schedule a short note when the cell has a note
  for (let ci = 0; ci < pattern.length; ci++) {
    const chan = pattern[ci];
    for (let ri = 0; ri < chan.length; ri++) {
      const cell = chan[ri];
      if (!cell || cell.note === '--') continue;

      const t = ri * rowDur;
      // very simple mapping of note -> frequency (demo). Replace with proper note->freq mapping if you have one.
      // if cell.note like 'C-4', you can parse and map — here we use channel-based pitch for simplicity
      const freq = 110 + ci * 30;

      const osc = offlineCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const env = offlineCtx.createGain();
      env.gain.value = 0;
      osc.connect(env).connect(master);

      // simple ADSR-ish envelope
      const noteDur = 0.12; // seconds
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.12, t + 0.005);
      env.gain.linearRampToValueAtTime(0.03, t + noteDur * 0.5);
      env.gain.linearRampToValueAtTime(0, t + noteDur);

      osc.start(t);
      osc.stop(t + noteDur + 0.02);
    }
  }

  const rendered = await offlineCtx.startRendering();
  return rendered;
}

// Convert AudioBuffer -> WAV Blob
function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const interleaved = (() => {
    const length = buffer.length * numOfChan;
    const result = new Float32Array(length);
    let offset = 0;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numOfChan; ch++) {
        result[offset++] = buffer.getChannelData(ch)[i];
      }
    }
    return result;
  })();

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChan * bytesPerSample;
  const bufferLength = 44 + interleaved.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + interleaved.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // audio format 1=PCM
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, interleaved.length * bytesPerSample, true);

  // write PCM samples
  let offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    // clamp
    let s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// Convert WAV Blob -> MP3 Blob using lamejs
async function wavBlobToMp3Blob(wavBlob) {
  // read WAV as ArrayBuffer
  const arrayBuffer = await wavBlob.arrayBuffer();
  const view = new DataView(arrayBuffer);

  // read WAV header (simple)
  function readInt(offset, bytes, littleEndian = true) {
    if (bytes === 2) return view.getInt16(offset, littleEndian);
    if (bytes === 4) return view.getInt32(offset, littleEndian);
    return 0;
  }
  // assume stereo or mono 16-bit PCM
  const numChannels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);
  const dataOffset = 44;
  const samples = new Int16Array(arrayBuffer, dataOffset);

  // If interleaved stereo, split into two arrays for encoder
  let left, right;
  if (numChannels === 2) {
    left = new Int16Array(samples.length / 2);
    right = new Int16Array(samples.length / 2);
    for (let i = 0, j = 0; i < samples.length; i += 2, j++) {
      left[j] = samples[i];
      right[j] = samples[i + 1];
    }
  } else {
    left = samples;
    right = samples;
  }

  const mp3enc = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const chunkSize = 1152;
  const mp3Data = [];

  for (let i = 0; i < left.length; i += chunkSize) {
    const leftChunk = left.subarray(i, i + chunkSize);
    const rightChunk = right.subarray(i, i + chunkSize);
    const mp3buf = numChannels === 2
      ? mp3enc.encodeBuffer(leftChunk, rightChunk)
      : mp3enc.encodeBuffer(leftChunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }
  const end = mp3enc.flush();
  if (end.length > 0) mp3Data.push(end);

  return new Blob(mp3Data, { type: 'audio/mpeg' });
}

// Helper to download a blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Load a file (WAV, MP3, OGG, etc.) into an AudioBuffer
async function importAudioFile(file) {
  if (!file) return null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.error("Error decoding audio file:", err);
    return null;
  }
}


// Example: visualize or preview the imported sound
async function previewAudioBuffer(audioBuffer) {
  if (!audioBuffer) return;

  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  const audioCtx = audioCtxRef.current;
  if (audioCtx.state === "suspended") await audioCtx.resume();

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  oscRef.current = source;
  
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  source.start();
  analyserRef.current = analyser;

  // wait 50ms for React to render the canvas
  setIsPlaying(true);
  source.onended = () => setIsPlaying(false);
  setTimeout(() => startVisualizer(analyser), 50);
}

function startVisualizer(analyser = analyserRef.current) {
  const canvas = visRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth * dpr;
  const height = canvas.clientHeight * dpr;
  canvas.width = width;
  canvas.height = height;

  const fontSize = 12 * dpr;
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const charWidth = fontSize * 0.6; // tighten horizontal step
  const cols = Math.floor(width / charWidth);
  const rows = Math.floor(height / fontSize);
  const step = Math.floor(bufferLength / cols);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    // subtle trail fade
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#00ff66";

    for (let x = 0; x < cols; x++) {
      const value = dataArray[x * step];
      const barHeight = Math.floor((value / 255) * rows);

      for (let y = 0; y < rows; y++) {
        // Top row of each bar = @
        // Below = filled with #
        const char =
          y > rows - barHeight
            ? (y === rows - barHeight + 1 ? "@" : "#")
            : " ";
        ctx.fillText(char, x * charWidth + charWidth / 2, y * fontSize);
      }
    }
  }

  draw();
}

async function renderToVideo() {
  const canvas = visRef.current;
  if (!canvas) {
    alert("No canvas to record!");
    return;
  }

  const buffer = await renderToBuffer(pattern, bpm, 180);
  const wavBlob = audioBufferToWav(buffer);
  const arrayBuffer = await wavBlob.arrayBuffer();

  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const dest = ctx.createMediaStreamDestination();
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(dest);
  source.connect(ctx.destination);

  const stream = canvas.captureStream(60);
  const combined = new MediaStream([
    ...stream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(combined, { mimeType: mime });

  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tracker_render.webm";
    a.click();
    URL.revokeObjectURL(url);
  };

  recorder.start();
  source.start();

  console.log("Rendering to video...");
  await ctx.resume();

  await new Promise((res) => {
    source.onended = res;
  });

  recorder.stop();
  console.log("Render complete.");
}

  
  return (
    <div className="min-h-screen p-6 bg-[#0a0a0a] text-[#cfcfcf] font-sans">
      <div className="max-w-full mx-auto grid grid-cols-12 gap-4">
        {/* Left: tracker / pattern editor */}
        <div className="col-span-8 p-4 rounded-md border border-[#202020] bg-[#070707] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-mono">TRACKER VISUALIZER</h1>
            <div className="flex gap-2 items-center">
              <button onClick={togglePlay} className="px-3 py-1 border border-[#333] rounded-sm font-mono text-sm">{playing ? 'STOP' : 'PLAY'}</button>
              <label className="font-mono text-sm">BPM<input value={bpm} onChange={e=>setBpm(Number(e.target.value)||1)} className="ml-2 w-20 bg-transparent border border-[#222] p-1 text-right"/></label>
            </div>
          </div>
          <div className="controls space-x-2 mt-4">

  {/* IMPORT */}
  <label className="px-3 py-1 border border-[#333] rounded-sm font-mono text-sm cursor-pointer">
    IMPORT AUDIO
    <input
      type="file"
      accept="audio/*"
      style={{ display: "none" }}
    onChange={async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const buffer = await importAudioFile(file);
  if (!buffer) {
    alert(`Failed to load "${file.name}". See console for details.`);
    return;
  }

  // Resume AudioContext before starting
  if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();

  previewAudioBuffer(buffer);
  alert(`Loaded: ${file.name}`);
}}


    />
  </label>

  {/* EXPORTS */}
  <button
    onClick={async () => {
      const buffer = await renderToBuffer(pattern, bpm, 180);
      const wavBlob = audioBufferToWav(buffer);
      downloadBlob(wavBlob, "tracker_export.wav");
    }}
    className="px-3 py-1 border border-[#333] rounded-sm font-mono text-sm"
  >
    EXPORT WAV
  </button>

  <button
    onClick={async () => {
      const buffer = await renderToBuffer(pattern, bpm, 180);
      const wavBlob = audioBufferToWav(buffer);
      const mp3Blob = await wavBlobToMp3Blob(wavBlob);
      downloadBlob(mp3Blob, "tracker_export.mp3");
    }}
    className="px-3 py-1 border border-[#333] rounded-sm font-mono text-sm ml-2"
  >
    EXPORT MP3
  </button>
 
  


</div>

          <div className="grid grid-cols-8 gap-1 bg-[#050505] p-2 rounded-sm">
            {/* channels header */}
            {Array.from({length: CHANNELS}).map((_,ci)=> (
              <div key={ci} className={`p-1 text-xs font-mono border-r border-[#111] ${ci===selectedChan ? 'bg-[#0f1720]' : ''}`}>CH {ci}</div>
            ))}
          </div>

          {/* HEX CONSOLE VISUALIZER */}
<div className="relative h-[420px] mt-2 border border-[#111] bg-[#020202] rounded-sm overflow-hidden">
  <HexConsoleVisualizer analyserRef={analyserRef} playing={isPlaying} />
</div>

{/* PATTERN GRID (tracker-like) — placed under hex console */}
<div className="mt-2">
  <PatternGridVisualizer
  analyserRef={analyserRef}
  playing={isPlaying}
/>
</div>

        </div>

        {/* Right: instruments + visualization */}
        <div className="col-span-4 flex flex-col gap-4">
         {/* INSTRUMENTS PANEL */}
<div className="p-4 rounded-md border border-[#222] bg-[#060606] flex flex-col gap-4">
  
  {/* --- TOP HALF: AUDIO LENGTH + VISUALIZER --- */}
  <div className="flex flex-col items-center justify-center text-center border-b border-[#111] pb-3">
    <h2 className="font-mono text-sm mb-1 text-[#7fffd4]">AUDIO LENGTH</h2>
    <div className="font-mono text-xs text-[#9a9a9a]">
      {isPlaying ? "Playing..." : "Idle"}
    </div>
    <AudioLengthVisualizer
  audioCtxRef={audioCtxRef}
  sourceRef={oscRef}       // pass oscRef here
  analyserRef={analyserRef} // if you need analyserRef inside
  playing={isPlaying}
/>

  </div>

  {/* --- BOTTOM HALF: INSTRUMENTS + ASCII CIRCLE --- */}
  <div className="grid grid-cols-2 gap-2">
    {/* Instruments list (left) */}
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          onClick={() => setSelectedChan(i)}
          className={`p-2 rounded-sm cursor-pointer font-mono text-sm border ${
            selectedChan === i
              ? "border-[#7fffd4] bg-[#071214]"
              : "border-[#111]"
          }`}
        >
          <div>Inst {i}</div>
          <div className="text-[11px] text-[#8a8a8a]">saw / demo</div>
        </div>
      ))}
    </div>

    {/* ASCII Circle (right) */}
    <AsciiCircleVisualizer analyserRef={analyserRef} playing={isPlaying} />
  </div>
</div>


          <div className="p-4 rounded-md border border-[#222] bg-[#060606] flex-1 flex flex-col">
            <h2 className="font-mono text-sm mb-2">TRACK VISUALIZATION</h2>
            <div className="flex-1">
              <canvas ref={visRef} className="w-full h-40 rounded-sm border border-[#111]" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-mono">Cursor Row: {cursorRow}</div>
              <div className="text-xs font-mono">Selected CH: {selectedChan}</div>
            </div>
          </div>

          <div className="p-3 rounded-md border border-[#222] bg-[#060606]">
            <div className="font-mono text-sm mb-2">EXPORT / HELP</div>
            <button
  onClick={renderToVideo}
  className="px-3 py-1 mt-2 border border-[#333] rounded-sm font-mono text-sm w-full"
>
  EXPORT MP4 (VIDEO)
</button>
            <div className="text-[12px] text-[#9a9a9a] font-mono">rawr add you track by import button and look at visual.</div>
          </div>
        </div>

      </div>

      <footer className="mt-6 text-[12px] font-mono text-[#6a6a6a]">
        made by sw1tch... sorry for shitcode
      </footer>
    </div>
  );
  function HexConsoleVisualizer({ analyserRef, playing }) {
  const [lines, setLines] = React.useState([]);
  const containerRef = React.useRef(null);
  const rafRef = React.useRef();

  React.useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const bands = [
      { name: "BASS", range: [0, 64] },
      { name: "MID", range: [65, 256] },
      { name: "HIGH", range: [257, 1024] },
    ];

    const loop = () => {
      analyser.getByteFrequencyData(dataArray);

      const energy = (arr, [start, end]) => {
        let sum = 0;
        for (let i = start; i < end && i < arr.length; i++) sum += arr[i];
        return sum / (end - start);
      };

      const bandData = bands.map(b => {
        const val = energy(dataArray, b.range);
        const level = Math.floor((val / 255) * 15);
        const hex = level.toString(16).toUpperCase().padStart(2, "0");
        const bar = "█".repeat(Math.floor(level / 3)) + " ".repeat(5 - Math.floor(level / 3));
        return `[${b.name}] ${hex} ${bar}`;
      });

      const avgVolume = Math.round(
        dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      );
      const volumeMeter = "■".repeat(Math.floor((avgVolume / 255) * 8)).padEnd(8, "·");

      const time = new Date().toISOString().split("T")[1].split("Z")[0];
      const newLine = `[${time}] ${bandData.join("  ")}   VOL:${volumeMeter}`;

      setLines(prev => {
        const next = [...prev, newLine];
        return next.slice(-80); // keep last 80 lines
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, analyserRef]);

  // autoscroll
  React.useEffect(() => {
    if (containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden font-mono text-[11px] leading-tight p-2 text-[#00ff99]"
      style={{
        whiteSpace: "pre",
        overflowY: "auto",
        fontFamily: "monospace",
        backgroundColor: "#020202",
      }}
    >
      {lines.map((line, i) => (
        <div
    key={i}
    className={`transition-all duration-700 ${
      i > lines.length - 4 ? "opacity-100" : "opacity-50"
    }`}
    style={{
      // recent lines glow a bit brighter and shift color slightly
      color: i === lines.length - 1
        ? '#00ffaa' // active, bright mint
        : i > lines.length - 4
        ? '#00ff99' // near-recent lines
        : '#008866', // old faded ones
      textShadow:
        i === lines.length - 1
          ? '0 0 4px #00ffaa, 0 0 8px #00ffaa'
          : '0 0 2px #006644',
      filter: i === lines.length - 1 ? 'brightness(1.3)' : 'none',
    }}
  >
    {line}
        </div>
      ))}
    </div>
  );
}


    /* function HexConsoleVisualizer({ analyserRef, playing }) {
    const [lines, setLines] = React.useState([]);
  const containerRef = React.useRef(null);
  const rafRef = React.useRef();

  React.useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const loop = () => {
      analyser.getByteFrequencyData(dataArray);

      // Convert energy into hex-like string
      const chunk = Array.from(dataArray.slice(0, 32))
        .map(v => (Math.floor((v / 255) * 15)).toString(16).toUpperCase())
        .join(" ");

      const time = new Date().toISOString().split("T")[1].split("Z")[0];
      const newLine = `[${time}]  ${chunk}`;

      setLines(prev => {
        const next = [...prev, newLine];
        // keep recent 60 lines
        return next.slice(-60);
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, analyserRef]);

  // auto-scroll
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden font-mono text-[11px] leading-tight p-2 text-[#00ff99]"
      style={{
        whiteSpace: "pre",
        overflowY: "auto",
        fontFamily: "monospace",
        backgroundColor: "#020202",
      }}
    >
      {lines.map((line, i) => (
        <div key={i} className="opacity-90">{line}</div>
      ))}
    </div>
  );
} */

}
