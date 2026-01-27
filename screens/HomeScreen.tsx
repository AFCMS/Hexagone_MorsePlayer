import { StyleSheet, Text, View } from "react-native";

import { Button } from "@react-navigation/elements";
import { useAtomValue, useSetAtom } from "jotai";

import ListMessages from "../components/ListMessages";
import { useRandomWord } from "../hooks/useRandomWord";

import { hasFeedbackBackendsEnabledAtom } from "../atoms/settings";
import {
  playbackIsPlayingAtom,
  playbackMessageAtom,
  playbackMessageMorseAtom,
  playbackProgressAtom,
} from "../atoms/app";

export function HomeScreen() {
  const hasFeedbackBackendsEnabled = useAtomValue(
    hasFeedbackBackendsEnabledAtom,
  );

  const playbackIsPlaying = useAtomValue(playbackIsPlayingAtom);
  const messageText = useAtomValue(playbackMessageAtom);
  const messageTextMorse = useAtomValue(playbackMessageMorseAtom);
  const playbackProgress = useAtomValue(playbackProgressAtom);
  const setPlaybackMessage = useSetAtom(playbackMessageAtom);
  const randomWordState = useRandomWord(setPlaybackMessage);

  return (
    <View style={styles.container}>
      <Button screen="Config">Config</Button>
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
      <Button
        disabled={randomWordState.isLoading}
        onPress={randomWordState.playRandomWord}
      >
        {randomWordState.isLoading ? "Loading…" : "Play random word"}
      </Button>
      {randomWordState.error ? (
        <Text style={styles.errorText}>{randomWordState.error}</Text>
      ) : null}
      <ListMessages />

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
});
