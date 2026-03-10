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

// ── Tab Switching ──
const tabs = document.querySelectorAll<HTMLButtonElement>('.tab')
const panels = document.querySelectorAll<HTMLDivElement>('.timer-panel')
const timerOrder = ['work', 'break', 'stopwatch']
let currentTimerIndex = 0

function switchToTimer(name: string) {
  currentTimerIndex = timerOrder.indexOf(name)
  tabs.forEach(t => t.classList.toggle('active', t.dataset.timer === name))
  panels.forEach(p => p.classList.toggle('active', p.id === `timer-${name}`))
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => switchToTimer(tab.dataset.timer!))
})

document.getElementById('switch-timer')!.addEventListener('click', () => {
  currentTimerIndex = (currentTimerIndex + 1) % timerOrder.length
  switchToTimer(timerOrder[currentTimerIndex])
})

// ── Work Timer (count-up) ──
let workRunning = false
let workElapsed = 0
let workStart = 0
let workInterval: number | null = null

const workDisplay = document.getElementById('work-display')!
const workStartBtn = document.getElementById('work-start')! as HTMLButtonElement

function updateWorkDisplay() {
  const elapsed = workRunning ? workElapsed + (Date.now() - workStart) : workElapsed
  workDisplay.textContent = formatTime(elapsed)
}

workStartBtn.addEventListener('click', () => {
  if (workRunning) {
    workElapsed += Date.now() - workStart
    workRunning = false
    setBtnState(workStartBtn, false, 'Start', PLAY_ICON)
    if (workInterval) clearInterval(workInterval)
  } else {
    workStart = Date.now()
    workRunning = true
    setBtnState(workStartBtn, true, 'Pause', PAUSE_ICON)
    workInterval = window.setInterval(updateWorkDisplay, 100)
  }
})

document.getElementById('work-reset')!.addEventListener('click', () => {
  workRunning = false
  workElapsed = 0
  if (workInterval) clearInterval(workInterval)
  setBtnState(workStartBtn, false, 'Start', PLAY_ICON)
  workDisplay.textContent = '00:00:00'
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

function updateBreakDisplay() {
  const elapsed = breakRunning ? breakElapsed + (Date.now() - breakStart) : breakElapsed
  breakDisplay.textContent = formatTime(elapsed)
}

breakStartBtn.addEventListener('click', () => {
  if (breakRunning) {
    breakElapsed += Date.now() - breakStart
    breakRunning = false
    setBtnState(breakStartBtn, false, 'Start', PLAY_ICON)
    if (breakInterval) clearInterval(breakInterval)
    breakCumulative += breakElapsed
    breakCumulativeEl.textContent = formatMinSec(breakCumulative)
    breakElapsed = 0
    breakDisplay.textContent = '00:00:00'
  } else {
    breakStart = Date.now()
    breakRunning = true
    setBtnState(breakStartBtn, true, 'Pause', PAUSE_ICON)
    breakInterval = window.setInterval(updateBreakDisplay, 100)
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
})

// ── 20-min Stopwatch (countdown) ──
const TWENTY_MIN = 20 * 60 * 1000
const CIRCUMFERENCE = 2 * Math.PI * 70 // matches r=70 in SVG
let swRunning = false
let swRemaining = TWENTY_MIN
let swStart = 0
let swInterval: number | null = null
let swCumulative = 0

const swDisplay = document.getElementById('stopwatch-display')!
const swStartBtn = document.getElementById('stopwatch-start')! as HTMLButtonElement
const swCumulativeEl = document.getElementById('stopwatch-cumulative')!
const swProgress = document.getElementById('stopwatch-progress')! as unknown as SVGCircleElement

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
  }
}

swStartBtn.addEventListener('click', () => {
  if (swRunning) {
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
  } else {
    swStart = Date.now()
    swRunning = true
    setBtnState(swStartBtn, true, 'Stop', STOP_ICON)
    swInterval = window.setInterval(updateStopwatchDisplay, 100)
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
})

// ── Noise Generator ──
let audioCtx: AudioContext | null = null
let noiseNode: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null
let noiseType: 'white' | 'pink' | 'brown' = 'white'
let noisePlaying = false

const noiseToggle = document.getElementById('noise-toggle')! as HTMLButtonElement
const noiseLabel = document.getElementById('noise-label')!
const volumeSlider = document.getElementById('noise-volume')! as HTMLInputElement
const volumeLabel = document.getElementById('volume-label')!
const noiseBtns = document.querySelectorAll<HTMLButtonElement>('.noise-btn')

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

function startNoise() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }

  stopNoiseNode()

  const buffer = generateNoiseBuffer(audioCtx, noiseType)
  noiseNode = audioCtx.createBufferSource()
  noiseNode.buffer = buffer
  noiseNode.loop = true

  gainNode = audioCtx.createGain()
  gainNode.gain.value = parseInt(volumeSlider.value) / 100

  noiseNode.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  noiseNode.start()
}

function stopNoiseNode() {
  if (noiseNode) {
    try { noiseNode.stop() } catch { /* already stopped */ }
    noiseNode.disconnect()
    noiseNode = null
  }
  if (gainNode) {
    gainNode.disconnect()
    gainNode = null
  }
}

noiseToggle.addEventListener('click', () => {
  if (noisePlaying) {
    stopNoiseNode()
    noisePlaying = false
    noiseLabel.textContent = 'Play'
    noiseToggle.classList.remove('running')
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
