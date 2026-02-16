import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Button } from "@react-navigation/elements";
import { useAtom, useAtomValue } from "jotai";

import { firebaseHistoryAtom } from "../atoms/app";
import { currentUserAtom } from "../atoms/auth";
import {
  listenToMyHistory,
  deleteHistoryEntry,
  deleteAllHistory,
  type FirebaseHistory,
} from "../backend/fire";

/**
 * Props for the HistoryItem component
 */
interface HistoryItemProps {
  readonly item: FirebaseHistory;
  readonly onDelete: (id: string) => void;
}

/**
 * Format a Firebase Timestamp to a human-readable date string
 * @param timestamp Firebase Timestamp object
 * @returns Formatted date string
 */
function formatTimestamp(timestamp: FirebaseHistory["timestamp"]): string {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Unknown date";
  }

  const date = timestamp.toDate();
  return date.toLocaleString();
}

/**
 * Individual history item component with delete functionality
 */
function HistoryItem(props: HistoryItemProps) {
  return (
    <View style={styles.historyItem}>
      <View style={styles.historyContent}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyText}>{props.item.text}</Text>
          <Text style={styles.historyTimestamp}>
            {formatTimestamp(props.item.timestamp)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.deleteButton}
            onPress={() => props.onDelete(props.item.id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Screen for viewing and managing playback history
 */
export function HistoryScreen() {
  const [history, setHistory] = useAtom(firebaseHistoryAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to history when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setError("Not authenticated");
      setIsLoading(false);
      return;
    }

    const unsubscribe = listenToMyHistory((entries) => {
      setHistory(entries);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, setHistory]);

  /**
   * Delete a single history entry with confirmation
   */
  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this history entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHistoryEntry(id);
            } catch (err) {
              Alert.alert("Error", "Failed to delete history entry");
            }
          },
        },
      ],
    );
  };

  /**
   * Delete all history entries with confirmation
   */
  const handleDeleteAll = () => {
    if (history.length === 0) return;

    Alert.alert(
      "Clear All History",
      "Are you sure you want to delete all history entries? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAllHistory();
            } catch (err) {
              Alert.alert("Error", "Failed to clear history");
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with clear all button */}
      <View style={styles.headerSection}>
        <Text style={styles.listTitle}>
          Playback History ({history.length})
        </Text>
        {history.length > 0 && (
          <Button onPress={handleDeleteAll} color="#f44336">
            Clear All
          </Button>
        )}
      </View>

      {/* History list */}
      <View style={styles.listContainer}>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>
            No history yet. Play a message to see it here!
          </Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HistoryItem item={item} onDelete={handleDelete} />
            )}
            style={styles.list}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    color: "#c62828",
    fontSize: 16,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  list: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  historyContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyInfo: {
    flex: 1,
    marginRight: 10,
  },
  historyText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyTimestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
