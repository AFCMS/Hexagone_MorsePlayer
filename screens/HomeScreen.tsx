import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Picker } from "@react-native-picker/picker";
import { Button } from "@react-navigation/elements";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useRandomWord } from "../hooks/useRandomWord";

import {
  firebaseMessagesAtom,
  playbackIsPlayingAtom,
  playbackMessageAtom,
  playbackMessageMorseAtom,
  playbackProgressAtom,
  selectedFirebaseMessageAtom,
  selectedFirebaseMessageIdAtom,
} from "../atoms/app";
import { currentUserAtom } from "../atoms/auth";
import { hasFeedbackBackendsEnabledAtom } from "../atoms/settings";
import { listenToMyMessages, logout } from "../backend/fire";

export function HomeScreen() {
  const hasFeedbackBackendsEnabled = useAtomValue(
    hasFeedbackBackendsEnabledAtom,
  );
  const currentUser = useAtomValue(currentUserAtom);

  const playbackIsPlaying = useAtomValue(playbackIsPlayingAtom);
  const messageText = useAtomValue(playbackMessageAtom);
  const messageTextMorse = useAtomValue(playbackMessageMorseAtom);
  const playbackProgress = useAtomValue(playbackProgressAtom);
  const setPlaybackMessage = useSetAtom(playbackMessageAtom);
  const randomWordState = useRandomWord(setPlaybackMessage);

  // Firebase messages state
  const [firebaseMessages, setFirebaseMessages] = useAtom(firebaseMessagesAtom);
  const selectedMessageId = useAtomValue(selectedFirebaseMessageIdAtom);
  const setSelectedMessageId = useSetAtom(selectedFirebaseMessageIdAtom);
  const selectedMessage = useAtomValue(selectedFirebaseMessageAtom);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  // Listen to messages when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setIsFirebaseLoading(false);
      return;
    }

    const unsubscribe = listenToMyMessages((msgs) => {
      setFirebaseMessages(msgs);
      setIsFirebaseLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, setFirebaseMessages]);

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    await logout();
  };

  /**
   * Play the selected Firebase message
   */
  const handlePlaySelectedMessage = () => {
    if (selectedMessage) {
      setPlaybackMessage(selectedMessage.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerButtons}>
        <View style={styles.headerRow}>
          <View style={styles.headerButton}>
            <Button screen="Config">Config</Button>
          </View>
          <View style={styles.headerButton}>
            <Button onPress={handleLogout} color="#cc0000">
              Logout
            </Button>
          </View>
        </View>
        <View style={styles.headerRow}>
          <View style={styles.headerButton}>
            <Button screen="SavedMessages">Saved</Button>
          </View>
          <View style={styles.headerButton}>
            <Button screen="History">History</Button>
          </View>
        </View>
      </View>

      {/* User email display */}
      {currentUser && (
        <Text style={styles.userEmail}>Logged in as: {currentUser.email}</Text>
      )}

      {/* Firebase message picker section */}
      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Select a saved message:</Text>
        {isFirebaseLoading ? (
          <Text style={styles.loadingText}>Loading messages...</Text>
        ) : firebaseMessages.length === 0 ? (
          <Text style={styles.emptyText}>
            No saved messages. Create some in Saved Messages!
          </Text>
        ) : (
          <>
            <View style={styles.pickerContainer}>
              <Picker<string | null>
                selectedValue={selectedMessageId}
                onValueChange={(value: string | null) =>
                  setSelectedMessageId(value)
                }
                enabled={!playbackIsPlaying}
                style={styles.picker}
              >
                <Picker.Item label="-- Select a message --" value={null} />
                {firebaseMessages.map((msg) => (
                  <Picker.Item key={msg.id} label={msg.name} value={msg.id} />
                ))}
              </Picker>
            </View>
            <View style={styles.playButtonsRow}>
              <View style={styles.playButtonWrapper}>
                <Button
                  disabled={
                    !selectedMessage ||
                    !hasFeedbackBackendsEnabled ||
                    playbackIsPlaying
                  }
                  onPress={handlePlaySelectedMessage}
                >
                  Play Selected
                </Button>
              </View>
              <View style={styles.playButtonWrapper}>
                <Button
                  disabled={randomWordState.isLoading || playbackIsPlaying}
                  onPress={randomWordState.playRandomWord}
                >
                  {randomWordState.isLoading ? "Loading…" : "Play Random Word"}
                </Button>
              </View>
            </View>
            {randomWordState.error ? (
              <Text style={styles.errorText}>{randomWordState.error}</Text>
            ) : null}
          </>
        )}
      </View>

      <Text>{messageText}</Text>
      <Text>{messageTextMorse}</Text>
      {playbackIsPlaying ? (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(playbackProgress * 100)}%`,
              },
            ]}
          />
        </View>
      ) : null}
      <Button
        disabled={!playbackIsPlaying}
        onPress={() => {
          setPlaybackMessage(null);
        }}
      >
        Stop
      </Button>

      <Text style={{ marginBottom: 20 }}>
        {hasFeedbackBackendsEnabled
          ? playbackIsPlaying
            ? "Playing…"
            : "Tap a title to play"
          : "Enable at least one backend"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 10,
  },
  pickerSection: {
    width: "90%",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginBottom: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  loadingText: {
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  progressContainer: {
    width: "90%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
    marginVertical: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
  },
  errorText: {
    color: "#c62828",
    marginTop: 8,
    textAlign: "center",
  },
  headerButtons: {
    width: "100%",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    flex: 1,
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  playButtonsRow: {
    gap: 10,
    marginTop: 10,
  },
  playButtonWrapper: {
    width: "100%",
  },
});
