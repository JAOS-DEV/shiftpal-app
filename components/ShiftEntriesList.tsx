import { Shift } from "@/types/shift";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface ShiftEntriesListProps {
  shifts: Shift[];
  onRemoveShift: (shiftId: string) => void;
}

export function ShiftEntriesList({
  shifts,
  onRemoveShift,
}: ShiftEntriesListProps) {
  const handleRemoveShift = (shiftId: string, shiftInfo: string) => {
    Alert.alert(
      "Remove Shift",
      `Are you sure you want to remove this shift?\n${shiftInfo}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemoveShift(shiftId),
        },
      ]
    );
  };

  if (shifts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>
          Shifts for Today
        </ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No shifts added yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Add your first shift using the form above
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const data = useMemo(() => shifts, [shifts]);
  const keyExtractor = useCallback((item: Shift) => item.id, []);
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Shift>) => (
      <ShiftRow
        shift={item}
        index={index}
        onRemove={() =>
          handleRemoveShift(item.id, `${item.start} - ${item.end}`)
        }
      />
    ),
    [handleRemoveShift]
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Shifts for Today ({shifts.length})
      </ThemedText>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={5}
      />
    </ThemedView>
  );
}

interface ShiftRowProps {
  shift: Shift;
  index: number;
  onRemove: () => void;
}

const ShiftRow = React.memo(function ShiftRow({
  shift,
  index,
  onRemove,
}: ShiftRowProps) {
  return (
    <View style={styles.shiftRow}>
      <View style={styles.shiftInfo}>
        <View style={styles.timeContainer}>
          <ThemedText style={styles.timeText}>
            {shift.start} - {shift.end}
          </ThemedText>
          <ThemedText style={styles.shiftNumber}>#{index + 1}</ThemedText>
        </View>

        <View style={styles.durationContainer}>
          <ThemedText style={styles.durationText}>
            {shift.durationText}
          </ThemedText>
          {typeof shift.breakMinutes === "number" && shift.breakMinutes > 0 && (
            <ThemedText style={styles.breakText}>
              Breaks: {shift.breakMinutes}m
              {typeof shift.breakCount === "number"
                ? ` (${shift.breakCount})`
                : ""}
              {shift.includeBreaks ? " (included)" : " (excluded)"}
            </ThemedText>
          )}
          <ThemedText style={styles.minutesText}>
            ({shift.durationMinutes} min)
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
        accessibilityLabel="Remove shift"
      >
        <ThemedText style={styles.removeButtonText}>×</ThemedText>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
  },
  listContainer: {
    gap: 8,
  },
  shiftRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  shiftInfo: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  shiftNumber: {
    fontSize: 12,
    opacity: 0.6,
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#34C759",
  },
  minutesText: {
    fontSize: 12,
    opacity: 0.6,
  },
  breakText: {
    fontSize: 12,
    opacity: 0.6,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  removeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
