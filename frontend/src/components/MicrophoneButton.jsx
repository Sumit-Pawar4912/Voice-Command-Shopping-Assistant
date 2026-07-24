import { FiMic, FiMicOff } from 'react-icons/fi'
import VoiceAnimation from './VoiceAnimation'

export default function MicrophoneButton({ isListening, isSupported, onClick }) {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <VoiceAnimation active={isListening} />
      <button
        onClick={onClick}
        disabled={!isSupported}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
        className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all duration-200
          ${isListening ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand-500 hover:bg-brand-600'}
          ${!isSupported ? 'cursor-not-allowed opacity-40' : 'hover:scale-105 active:scale-95'}`}
      >
        {isSupported ? (
          <FiMic className="text-white" size={26} />
        ) : (
          <FiMicOff className="text-white" size={26} />
        )}
      </button>
    </div>
  )
}
