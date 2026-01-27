import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { textToMorse } from "../utils/morse_utils";

export const hasCameraPermission = atom<boolean>(false);

export const rearCameraTorchOnAtom = atom<boolean>(false);

export const playbackMessageAtom = atomWithReset<string | null>(null);

// Transmission progress from 0 to 1 for the current playback.
export const playbackProgressAtom = atom<number>(0);

export const playbackMessageMorseAtom = atom<string | null>((get) => {
  const message = get(playbackMessageAtom);
  if (!message) return null;

  return textToMorse(message);
});

export const playbackIsPlayingAtom = atom<boolean>(
  (get) => get(playbackMessageAtom) !== null,
);
