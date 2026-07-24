import { useCallback, useEffect, useRef, useState } from 'react'

const LANGUAGE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
}

/**
 * Thin wrapper around the browser's Web Speech API (SpeechRecognition).
 * Provides real-time transcript updates, listening state, and error handling
 * for browsers where speech recognition is unavailable.
 */
export function useSpeechRecognition() {
  const [isSupported] = useState(
    () => typeof window !== 'undefined' &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState('en')

  const recognitionRef = useRef(null)
  const onFinalResultRef = useRef(null)

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i]
        if (chunk.isFinal) {
          finalText += chunk[0].transcript
        } else {
          interimText += chunk[0].transcript
        }
      }
      if (finalText) {
        setTranscript(finalText.trim())
        onFinalResultRef.current?.(finalText.trim())
      }
      setInterimTranscript(interimText)
    }

    recognition.onerror = (event) => {
      setError(event.error === 'no-speech' ? 'Speech not recognized. Please try again.' : event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
    }
  }, [isSupported])

  const startListening = useCallback(
    (onFinalResult, lang = language) => {
      if (!recognitionRef.current) {
        setError('Speech recognition is not supported in this browser.')
        return
      }
      setError(null)
      setTranscript('')
      setInterimTranscript('')
      onFinalResultRef.current = onFinalResult
      recognitionRef.current.lang = LANGUAGE_MAP[lang] || 'en-IN'
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        // start() throws if already started - ignore, recognition is already running.
      }
    },
    [language]
  )

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return {
    isSupported, isListening, transcript, interimTranscript, error, language,
    setLanguage, startListening, stopListening,
  }
}
