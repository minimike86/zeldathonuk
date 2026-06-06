import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTTS } from './useTTS';

class FakeUtterance {
  text: string;
  rate = 1; pitch = 1; volume = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function installSpeech({ autoEnd = true } = {}) {
  const voices = [{ lang: 'en-GB', name: 'Daniel' }];
  const synth = {
    getVoices: () => voices,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak: vi.fn((utt: FakeUtterance) => {
      if (autoEnd) utt.onend?.();
    }),
    cancel: vi.fn(),
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return synth;
}

describe('useTTS', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('reports supported and speaks to completion', async () => {
    const synth = installSpeech();
    const { result } = renderHook(() => useTTS());
    expect(result.current.supported).toBe(true);
    let res!: { spoken: boolean; cancelled: boolean };
    await act(async () => {
      res = await result.current.speak('hello world');
    });
    expect(synth.speak).toHaveBeenCalled();
    expect(res.spoken).toBe(true);
    expect(res.cancelled).toBe(false);
  });

  it('resolves immediately for empty text', async () => {
    installSpeech();
    const { result } = renderHook(() => useTTS());
    const res = await result.current.speak('   ');
    expect(res.spoken).toBe(false);
  });

  it('cancel resolves the outstanding utterance as cancelled', async () => {
    const synth = installSpeech({ autoEnd: false });
    const { result } = renderHook(() => useTTS());
    let p!: Promise<{ cancelled: boolean }>;
    act(() => {
      p = result.current.speak('a long sentence');
    });
    act(() => result.current.cancel());
    const res = await p;
    expect(res.cancelled).toBe(true);
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('errors resolve as cancelled (onerror path)', async () => {
    const voices = [{ lang: 'en-GB', name: 'Daniel' }];
    const synth = {
      getVoices: () => voices,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      speak: vi.fn((utt: FakeUtterance) => utt.onerror?.()),
      cancel: vi.fn(),
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const { result } = renderHook(() => useTTS());
    let res!: { spoken: boolean; cancelled: boolean };
    await act(async () => {
      res = await result.current.speak('boom');
    });
    expect(res.spoken).toBe(false);
    expect(res.cancelled).toBe(true);
  });
});
