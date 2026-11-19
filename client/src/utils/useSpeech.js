import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Browser-native voice support (Web Speech API), no extra backend or cost.
 * - Speech-to-text: dictate answers like in a real spoken interview.
 * - Text-to-speech: hear each question read aloud.
 * Both degrade gracefully: `supported` flags let the UI hide controls in
 * browsers without the API (e.g. Firefox has no SpeechRecognition).
 */
const Recognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : undefined;

// Interviews are in English: use the browser's English variant (en-IN, en-GB...) when it has one
const defaultLang = () => {
  const l = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return /^en(-|$)/i.test(l) ? l : 'en-US';
};

export const useSpeechToText = ({ onText, lang = defaultLang() } = {}) => {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const onTextRef = useRef(onText);
  useEffect(() => { onTextRef.current = onText; }, [onText]);

  // stop() still delivers the last pending phrase; abort() discards it (used when sending)
  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const abort = useCallback(() => {
    recRef.current?.abort();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Recognition) return;
    setError('');
    const rec = new Recognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText.trim()) onTextRef.current?.(finalText.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Microphone permission was denied.');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setError('Voice input stopped. Please try again.');
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported: Boolean(Recognition), listening, start, stop, abort, error };
};

export const useTextToSpeech = () => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback((text) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [supported]);

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  return { supported, speaking, speak, cancel };
};
