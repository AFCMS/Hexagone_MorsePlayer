import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
  initializeAuth,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  where,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  writeBatch,
} from "firebase/firestore";

import { firebaseConfig } from "./config";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = initializeAuth(app, {});

/**
 * Firebase message document interface
 */
export interface FirebaseMessage {
  readonly id: string;
  readonly uid: string;
  readonly name: string;
  readonly message: string;
}

/**
 * Firebase history document interface
 */
export interface FirebaseHistory {
  readonly id: string;
  readonly uid: string;
  readonly text: string;
  readonly timestamp: Timestamp;
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  readonly success: boolean;
  readonly user?: User;
  readonly error?: string;
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Sign in with email and password
 * @param email User's email address
 * @param password User's password
 * @returns AuthResult with success status and user or error message
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: credential.user };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getAuthErrorMessage(authError.code),
    };
  }
}

/**
 * Register a new user with email and password
 * @param email User's email address
 * @param password User's password
 * @returns AuthResult with success status and user or error message
 */
export async function registerWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { success: true, user: credential.user };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getAuthErrorMessage(authError.code),
    };
  }
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please login instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "An error occurred. Please try again.";
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(
  callback: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Create a new message in Firestore
 */
export async function createMessage(
  name: string,
  message: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  await addDoc(collection(db, "messages"), {
    uid: user.uid,
    name,
    message,
  });
}

/**
 * Listen to current user's messages in real-time
 * @param callback Function called with updated messages array
 * @returns Unsubscribe function
 */
export function listenToMyMessages(
  callback: (messages: FirebaseMessage[]) => void,
): Unsubscribe {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const q = query(
    collection(db, "messages"),
    where("uid", "==", user.uid),
    orderBy("name", "asc"),
  );

  return onSnapshot(q, (snapshot) => {
    const messages: FirebaseMessage[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FirebaseMessage, "id">),
    }));
    callback(messages);
  });
}

/**
 * Update a message's content
 */
export async function updateMessage(
  messageId: string,
  newMessage: string,
): Promise<void> {
  const ref = doc(db, "messages", messageId);

  await updateDoc(ref, {
    message: newMessage,
  });
}

/**
 * Update a message's name
 */
export async function updateMessageName(
  messageId: string,
  newName: string,
): Promise<void> {
  const ref = doc(db, "messages", messageId);

  await updateDoc(ref, {
    name: newName,
  });
}

/**
 * Delete a message from Firestore
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const ref = doc(db, "messages", messageId);

  await deleteDoc(ref);
}

// ---- History CRUD ----

/**
 * Add a played text to the user's history
 * @param text The text that was played
 */
export async function addHistory(text: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  await addDoc(collection(db, "history"), {
    uid: user.uid,
    text,
    timestamp: serverTimestamp(),
  });
}

/**
 * Listen to current user's history in real-time, ordered by most recent first
 * @param callback Function called with updated history array
 * @returns Unsubscribe function
 */
export function listenToMyHistory(
  callback: (history: FirebaseHistory[]) => void,
): Unsubscribe {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const q = query(
    collection(db, "history"),
    where("uid", "==", user.uid),
    orderBy("timestamp", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    const history: FirebaseHistory[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FirebaseHistory, "id">),
    }));
    callback(history);
  });
}

/**
 * Delete a single history entry from Firestore
 * @param historyId The ID of the history entry to delete
 */
export async function deleteHistoryEntry(historyId: string): Promise<void> {
  const ref = doc(db, "history", historyId);
  await deleteDoc(ref);
}

/**
 * Delete all history entries for the current user
 */
export async function deleteAllHistory(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const q = query(collection(db, "history"), where("uid", "==", user.uid));

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        unsubscribe();
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        try {
          await batch.commit();
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}
