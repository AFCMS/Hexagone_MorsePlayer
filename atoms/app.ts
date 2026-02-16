import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";

import { textToMorse } from "../utils/morse_utils";
import type { FirebaseMessage, FirebaseHistory } from "../backend/fire";

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

/**
 * Stores the list of messages fetched from Firebase
 */
export const firebaseMessagesAtom = atom<FirebaseMessage[]>([]);

/**
 * Currently selected Firebase message ID for playback
 */
const initialSelectedId: string | null = null;
export const selectedFirebaseMessageIdAtom = atom(initialSelectedId);

/**
 * Derived atom to get the currently selected Firebase message
 */
export const selectedFirebaseMessageAtom = atom<FirebaseMessage | null>(
  (get) => {
    const messages = get(firebaseMessagesAtom);
    const selectedId = get(selectedFirebaseMessageIdAtom);
    if (!selectedId) return null;
    return messages.find((m) => m.id === selectedId) ?? null;
  },
);

/**
 * Stores the list of history entries fetched from Firebase
 */
export const firebaseHistoryAtom = atom<FirebaseHistory[]>([]);
