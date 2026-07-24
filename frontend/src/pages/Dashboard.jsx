import { useState } from 'react'
import { useShopping } from '../context/ShoppingContext'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import MicrophoneButton from '../components/MicrophoneButton'
import ShoppingList from '../components/ShoppingList'
import Suggestions from '../components/Suggestions'
import SearchBar from '../components/SearchBar'
import RecentCommands from '../components/RecentCommands'
import Loader from '../components/Loader'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
]

export default function Dashboard() {
  const { runVoiceCommand, loadingLabel } = useShopping()
  const {
    isSupported, isListening, transcript, interimTranscript, error,
    language, setLanguage, startListening, stopListening,
  } = useSpeechRecognition()
  const [manualText, setManualText] = useState('')

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
      return
    }
    startListening((finalText) => {
      runVoiceCommand(finalText, language)
    }, language)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualText.trim()) return
    runVoiceCommand(manualText.trim(), language)
    setManualText('')
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      {/* Voice control panel */}
      <section className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white/60 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                language === lang.code
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <MicrophoneButton isListening={isListening} isSupported={isSupported} onClick={handleMicClick} />

        <p className="min-h-[1.5rem] text-sm font-medium text-slate-600 dark:text-slate-300">
          {isListening ? 'Listening...' : 'Tap the mic and speak a command'}
        </p>

        {(transcript || interimTranscript) && (
          <p className="max-w-md rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            "{transcript || interimTranscript}"
          </p>
        )}

        {!isSupported && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Voice recognition isn't supported in this browser. Try Chrome, or type your command below.
          </p>
        )}
        {error && <p className="text-xs text-rose-500">{error}</p>}

        {loadingLabel && <Loader label={loadingLabel} />}

        <form onSubmit={handleManualSubmit} className="mt-2 flex w-full max-w-md gap-2">
          <input
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder='Or type a command, e.g. "Add two bottles of water"'
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Send
          </button>
        </form>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ShoppingList />
          <SearchBar />
        </div>
        <div className="flex flex-col gap-6">
          <Suggestions />
          <RecentCommands />
        </div>
      </div>
    </main>
  )
}
