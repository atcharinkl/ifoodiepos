import { useRef, useCallback } from 'react'

export function useNotificationSound() {
  const audioCtx = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioCtx.current
  }, [])

  // เสียง beep สั้นๆ 2 ครั้ง สำหรับออเดอร์ใหม่
  const playNewOrder = useCallback(() => {
    try {
      const ctx = getCtx()
      const playBeep = (startTime: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15)
        osc.start(startTime)
        osc.stop(startTime + 0.15)
      }
      playBeep(ctx.currentTime)
      playBeep(ctx.currentTime + 0.2)
    } catch (e) {}
  }, [getCtx])

  // เสียงสูงขึ้น สำหรับลูกค้าขอชำระ
  const playPaymentRequest = useCallback(() => {
    try {
      const ctx = getCtx()
      const playBeep = (startTime: number, freq: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)
        osc.start(startTime)
        osc.stop(startTime + 0.2)
      }
      playBeep(ctx.currentTime, 660)
      playBeep(ctx.currentTime + 0.25, 880)
      playBeep(ctx.currentTime + 0.5, 1100)
    } catch (e) {}
  }, [getCtx])

  return { playNewOrder, playPaymentRequest }
}
