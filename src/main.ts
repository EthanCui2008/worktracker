import './style.css'

const PLAY_ICON = '<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
const PAUSE_ICON = '<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
const STOP_ICON = '<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>'

// ── Clock ──
function updateClock() {
  const now = new Date()
  const clock = document.getElementById('clock')!
  const clockDate = document.getElementById('clock-date')!

  clock.textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  clockDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

updateClock()
setInterval(updateClock, 1000)

// ── Timer Helpers ──
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatMinSec(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function setBtnState(btn: HTMLButtonElement, running: boolean, label: string, icon: string) {
  btn.innerHTML = `${icon} ${label}`
  btn.classList.toggle('running', running)
}

// ── Stop All Timers Helper ──
function stopWorkTimer() {
  if (!workRunning) return
  workElapsed += Date.now() - workStart
  workRunning = false
  setBtnState(workStartBtn, false, 'Start', PLAY_ICON)
  if (workInterval) clearInterval(workInterval)
  workCard.classList.remove('timer-card--active')
}

function stopBreakTimer() {
  if (!breakRunning) return
  breakElapsed += Date.now() - breakStart
  breakRunning = false
  setBtnState(breakStartBtn, false, 'Start', PLAY_ICON)
  if (breakInterval) clearInterval(breakInterval)
  breakCumulative += breakElapsed
  breakCumulativeEl.textContent = formatMinSec(breakCumulative)
  breakElapsed = 0
  breakDisplay.textContent = '00:00:00'
  breakCard.classList.remove('timer-card--active')
}

function stopStopwatch() {
  if (!swRunning) return
  const elapsed = Date.now() - swStart
  swRemaining = Math.max(0, swRemaining - elapsed)
  const breakUsed = TWENTY_MIN - swRemaining
  swCumulative += breakUsed
  swCumulativeEl.textContent = formatMinSec(swCumulative)
  swRunning = false
  setBtnState(swStartBtn, false, 'Start', PLAY_ICON)
  if (swInterval) clearInterval(swInterval)
  swRemaining = TWENTY_MIN
  swDisplay.textContent = formatMinSec(TWENTY_MIN)
  swDisplay.classList.remove('warning')
  updateProgressRing(1)
  swCard.classList.remove('timer-card--active')
}

function stopAllTimersExcept(except: 'work' | 'break' | 'stopwatch') {
  if (except !== 'work') stopWorkTimer()
  if (except !== 'break') stopBreakTimer()
  if (except !== 'stopwatch') stopStopwatch()
}

// ── Work Timer (count-up) ──
let workRunning = false
let workElapsed = 0
let workStart = 0
let workInterval: number | null = null

const workDisplay = document.getElementById('work-display')!
const workStartBtn = document.getElementById('work-start')! as HTMLButtonElement
const workCard = document.getElementById('timer-work')!

function updateWorkDisplay() {
  const elapsed = workRunning ? workElapsed + (Date.now() - workStart) : workElapsed
  workDisplay.textContent = formatTime(elapsed)
}

workStartBtn.addEventListener('click', () => {
  if (workRunning) {
    stopWorkTimer()
  } else {
    stopAllTimersExcept('work')
    workStart = Date.now()
    workRunning = true
    setBtnState(workStartBtn, true, 'Pause', PAUSE_ICON)
    workInterval = window.setInterval(updateWorkDisplay, 100)
    workCard.classList.add('timer-card--active')
  }
})

document.getElementById('work-reset')!.addEventListener('click', () => {
  workRunning = false
  workElapsed = 0
  if (workInterval) clearInterval(workInterval)
  setBtnState(workStartBtn, false, 'Start', PLAY_ICON)
  workDisplay.textContent = '00:00:00'
  workCard.classList.remove('timer-card--active')
})

// ── Break Timer (count-up with cumulative tracking) ──
let breakRunning = false
let breakElapsed = 0
let breakStart = 0
let breakInterval: number | null = null
let breakCumulative = 0

const breakDisplay = document.getElementById('break-display')!
const breakStartBtn = document.getElementById('break-start')! as HTMLButtonElement
const breakCumulativeEl = document.getElementById('break-cumulative')!
const breakCard = document.getElementById('timer-break')!

function updateBreakDisplay() {
  const elapsed = breakRunning ? breakElapsed + (Date.now() - breakStart) : breakElapsed
  breakDisplay.textContent = formatTime(elapsed)
}

breakStartBtn.addEventListener('click', () => {
  if (breakRunning) {
    stopBreakTimer()
  } else {
    stopAllTimersExcept('break')
    breakStart = Date.now()
    breakRunning = true
    setBtnState(breakStartBtn, true, 'Pause', PAUSE_ICON)
    breakInterval = window.setInterval(updateBreakDisplay, 100)
    breakCard.classList.add('timer-card--active')
  }
})

document.getElementById('break-reset')!.addEventListener('click', () => {
  breakRunning = false
  breakElapsed = 0
  breakCumulative = 0
  if (breakInterval) clearInterval(breakInterval)
  setBtnState(breakStartBtn, false, 'Start', PLAY_ICON)
  breakDisplay.textContent = '00:00:00'
  breakCumulativeEl.textContent = '00:00'
  breakCard.classList.remove('timer-card--active')
})

// ── 20-min Stopwatch (countdown) ──
const TWENTY_MIN = 20 * 60 * 1000
const CIRCUMFERENCE = 2 * Math.PI * 70
let swRunning = false
let swRemaining = TWENTY_MIN
let swStart = 0
let swInterval: number | null = null
let swCumulative = 0

const swDisplay = document.getElementById('stopwatch-display')!
const swStartBtn = document.getElementById('stopwatch-start')! as HTMLButtonElement
const swCumulativeEl = document.getElementById('stopwatch-cumulative')!
const swProgress = document.getElementById('stopwatch-progress')! as unknown as SVGCircleElement
const swCard = document.getElementById('timer-stopwatch')!

function updateProgressRing(fraction: number) {
  const offset = CIRCUMFERENCE * (1 - fraction)
  swProgress.style.strokeDashoffset = String(offset)
}

function updateStopwatchDisplay() {
  const elapsed = Date.now() - swStart
  const remaining = Math.max(0, swRemaining - elapsed)
  swDisplay.textContent = formatMinSec(remaining)
  updateProgressRing(remaining / TWENTY_MIN)

  if (remaining <= 5 * 60 * 1000) {
    swDisplay.classList.add('warning')
  } else {
    swDisplay.classList.remove('warning')
  }

  if (remaining <= 0) {
    swRunning = false
    setBtnState(swStartBtn, false, 'Start', PLAY_ICON)
    if (swInterval) clearInterval(swInterval)
    swCumulative += TWENTY_MIN
    swCumulativeEl.textContent = formatMinSec(swCumulative)
    swRemaining = TWENTY_MIN
    swDisplay.textContent = formatMinSec(TWENTY_MIN)
    swDisplay.classList.remove('warning')
    updateProgressRing(1)
    swCard.classList.remove('timer-card--active')
  }
}

swStartBtn.addEventListener('click', () => {
  if (swRunning) {
    stopStopwatch()
  } else {
    stopAllTimersExcept('stopwatch')
    swStart = Date.now()
    swRunning = true
    setBtnState(swStartBtn, true, 'Stop', STOP_ICON)
    swInterval = window.setInterval(updateStopwatchDisplay, 100)
    swCard.classList.add('timer-card--active')
  }
})

document.getElementById('stopwatch-reset')!.addEventListener('click', () => {
  swRunning = false
  swRemaining = TWENTY_MIN
  swCumulative = 0
  if (swInterval) clearInterval(swInterval)
  setBtnState(swStartBtn, false, 'Start', PLAY_ICON)
  swDisplay.textContent = formatMinSec(TWENTY_MIN)
  swDisplay.classList.remove('warning')
  swCumulativeEl.textContent = '00:00'
  updateProgressRing(1)
  swCard.classList.remove('timer-card--active')
})

// ── Noise Generator ──
let audioCtx: AudioContext | null = null
let noiseNodeL: AudioBufferSourceNode | null = null
let noiseNodeR: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null
let lowFilter: BiquadFilterNode | null = null
let highFilter: BiquadFilterNode | null = null
let merger: ChannelMergerNode | null = null
let noiseType: 'white' | 'pink' | 'brown' = 'white'
let noisePlaying = false
let analyser: AnalyserNode | null = null

const noiseToggle = document.getElementById('noise-toggle')! as HTMLButtonElement
const noiseLabel = document.getElementById('noise-label')!
const volumeSlider = document.getElementById('noise-volume')! as HTMLInputElement
const volumeLabel = document.getElementById('volume-label')!
const lowcutSlider = document.getElementById('noise-lowcut')! as HTMLInputElement
const lowcutLabel = document.getElementById('lowcut-label')!
const highcutSlider = document.getElementById('noise-highcut')! as HTMLInputElement
const highcutLabel = document.getElementById('highcut-label')!
const stereoSlider = document.getElementById('noise-stereo')! as HTMLInputElement
const stereoLabel = document.getElementById('stereo-label')!
const noiseBtns = document.querySelectorAll<HTMLButtonElement>('.noise-btn')
const waveformCanvas = document.getElementById('waveform-canvas')! as HTMLCanvasElement
const waveformCtx = waveformCanvas.getContext('2d')!

function generateNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * 4
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else {
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  }

  return buffer
}

function formatFreq(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)}k Hz`
  return `${hz} Hz`
}

function startNoise() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }

  stopNoiseNodes()

  const stereoWidth = parseInt(stereoSlider.value) / 100

  // Create filters
  lowFilter = audioCtx.createBiquadFilter()
  lowFilter.type = 'highpass'
  lowFilter.frequency.value = parseInt(lowcutSlider.value)

  highFilter = audioCtx.createBiquadFilter()
  highFilter.type = 'lowpass'
  highFilter.frequency.value = parseInt(highcutSlider.value)

  gainNode = audioCtx.createGain()
  gainNode.gain.value = parseInt(volumeSlider.value) / 100

  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256

  if (stereoWidth > 0) {
    // Stereo: two independent noise sources panned
    merger = audioCtx.createChannelMerger(2)

    const bufferL = generateNoiseBuffer(audioCtx, noiseType)
    const bufferR = generateNoiseBuffer(audioCtx, noiseType)

    noiseNodeL = audioCtx.createBufferSource()
    noiseNodeL.buffer = bufferL
    noiseNodeL.loop = true

    noiseNodeR = audioCtx.createBufferSource()
    noiseNodeR.buffer = bufferR
    noiseNodeR.loop = true

    const gainL = audioCtx.createGain()
    const gainR = audioCtx.createGain()
    gainL.gain.value = 1
    gainR.gain.value = 1

    // Mix: mono content + stereo difference
    const monoGain = 1 - stereoWidth
    const stereoGain = stereoWidth

    const monoMix = audioCtx.createGain()
    monoMix.gain.value = monoGain

    noiseNodeL.connect(gainL)
    noiseNodeR.connect(gainR)

    gainL.connect(merger, 0, 0)
    gainR.connect(merger, 0, 1)

    // Also mix mono into both channels
    const monoSource = audioCtx.createBufferSource()
    monoSource.buffer = bufferL
    monoSource.loop = true

    merger.connect(lowFilter)
    lowFilter.connect(highFilter)
    highFilter.connect(gainNode)
    gainNode.connect(analyser)
    analyser.connect(audioCtx.destination)

    noiseNodeL.start()
    noiseNodeR.start()
  } else {
    // Mono
    const buffer = generateNoiseBuffer(audioCtx, noiseType)
    noiseNodeL = audioCtx.createBufferSource()
    noiseNodeL.buffer = buffer
    noiseNodeL.loop = true

    noiseNodeL.connect(lowFilter)
    lowFilter.connect(highFilter)
    highFilter.connect(gainNode)
    gainNode.connect(analyser)
    analyser.connect(audioCtx.destination)

    noiseNodeL.start()
  }

  drawWaveform()
}

function stopNoiseNodes() {
  if (noiseNodeL) {
    try { noiseNodeL.stop() } catch { /* already stopped */ }
    noiseNodeL.disconnect()
    noiseNodeL = null
  }
  if (noiseNodeR) {
    try { noiseNodeR.stop() } catch { /* already stopped */ }
    noiseNodeR.disconnect()
    noiseNodeR = null
  }
  if (gainNode) { gainNode.disconnect(); gainNode = null }
  if (lowFilter) { lowFilter.disconnect(); lowFilter = null }
  if (highFilter) { highFilter.disconnect(); highFilter = null }
  if (merger) { merger.disconnect(); merger = null }
  if (analyser) { analyser.disconnect(); analyser = null }
}

let animFrameId: number | null = null

function drawWaveform() {
  if (!analyser || !noisePlaying) {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    clearCanvas()
    return
  }

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteTimeDomainData(dataArray)

  const width = waveformCanvas.width
  const height = waveformCanvas.height

  waveformCtx.fillStyle = 'var(--surface-hover, #f8f9fa)'
  waveformCtx.fillRect(0, 0, width, height)

  waveformCtx.lineWidth = 2
  waveformCtx.strokeStyle = 'var(--primary, #1a73e8)'
  waveformCtx.beginPath()

  const sliceWidth = width / bufferLength
  let x = 0

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0
    const y = (v * height) / 2

    if (i === 0) {
      waveformCtx.moveTo(x, y)
    } else {
      waveformCtx.lineTo(x, y)
    }
    x += sliceWidth
  }

  waveformCtx.lineTo(width, height / 2)
  waveformCtx.stroke()

  animFrameId = requestAnimationFrame(drawWaveform)
}

function clearCanvas() {
  const width = waveformCanvas.width
  const height = waveformCanvas.height
  waveformCtx.fillStyle = '#f8f9fa'
  waveformCtx.fillRect(0, 0, width, height)
  waveformCtx.strokeStyle = '#e0e0e0'
  waveformCtx.lineWidth = 1
  waveformCtx.beginPath()
  waveformCtx.moveTo(0, height / 2)
  waveformCtx.lineTo(width, height / 2)
  waveformCtx.stroke()
}

clearCanvas()

noiseToggle.addEventListener('click', () => {
  if (noisePlaying) {
    stopNoiseNodes()
    noisePlaying = false
    noiseLabel.textContent = 'Play'
    noiseToggle.classList.remove('running')
    if (animFrameId) cancelAnimationFrame(animFrameId)
    clearCanvas()
  } else {
    startNoise()
    noisePlaying = true
    noiseLabel.textContent = 'Stop'
    noiseToggle.classList.add('running')
  }
})

noiseBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    noiseType = btn.dataset.noise as 'white' | 'pink' | 'brown'
    noiseBtns.forEach(b => b.classList.toggle('active', b === btn))
    if (noisePlaying) {
      startNoise()
    }
  })
})

volumeSlider.addEventListener('input', () => {
  const val = parseInt(volumeSlider.value)
  volumeLabel.textContent = `${val}%`
  if (gainNode) {
    gainNode.gain.value = val / 100
  }
})

lowcutSlider.addEventListener('input', () => {
  const val = parseInt(lowcutSlider.value)
  lowcutLabel.textContent = formatFreq(val)
  if (lowFilter) {
    lowFilter.frequency.value = val
  }
})

highcutSlider.addEventListener('input', () => {
  const val = parseInt(highcutSlider.value)
  highcutLabel.textContent = formatFreq(val)
  if (highFilter) {
    highFilter.frequency.value = val
  }
})

stereoSlider.addEventListener('input', () => {
  const val = parseInt(stereoSlider.value)
  stereoLabel.textContent = `${val}%`
  if (noisePlaying) {
    startNoise()
  }
})
