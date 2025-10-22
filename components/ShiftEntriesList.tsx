import { useTheme } from "@/providers/ThemeProvider";
import { Shift } from "@/types/shift";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  FlatList,
  ListRenderItemInfo,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./ShiftEntriesList.styles";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface ShiftEntriesListProps {
  shifts: Shift[];
  onRemoveShift: (shiftId: string) => void;
  // When embedded in a parent ScrollView, disable FlatList to avoid nested VirtualizedList warning
  embedded?: boolean;
}

export function ShiftEntriesList({
  shifts,
  onRemoveShift,
  embedded = false,
}: ShiftEntriesListProps): React.JSX.Element {
  const { colors } = useTheme();

  // All hooks must be called before any early returns to maintain consistent hook order
  const data = useMemo(() => shifts, [shifts]);
  const keyExtractor = useCallback((item: Shift) => item.id, []);

  const handleRemoveShift = useCallback(
    (shiftId: string, shiftInfo: string) => {
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
    },
    [onRemoveShift]
  );

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

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Shifts for Today ({shifts.length})
      </ThemedText>

      {embedded ? (
        <View style={styles.listContainer}>
          {data.map((item, index) => (
            <View key={item.id}>
              <ShiftRow
                shift={item}
                index={index}
                onRemove={() =>
                  handleRemoveShift(item.id, `${item.start} - ${item.end}`)
                }
              />
              {index < data.length - 1 ? (
                <View style={styles.separator} />
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
          windowSize={5}
        />
      )}
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
  const { colors } = useTheme();

  const breakText = useMemo(() => {
    if (typeof shift.breakMinutes !== "number" || shift.breakMinutes <= 0) {
      return null;
    }

    const countText =
      typeof shift.breakCount === "number" ? ` (${shift.breakCount})` : "";
    const includedText = shift.includeBreaks ? " (included)" : " (excluded)";

    return `Breaks: ${shift.breakMinutes}m${countText}${includedText}`;
  }, [shift.breakMinutes, shift.breakCount, shift.includeBreaks]);

  return (
    <View
      style={[
        styles.shiftRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.shiftInfo}>
        <View style={styles.timeContainer}>
          <ThemedText style={[styles.timeText, { color: colors.text }]}>
            {shift.start} - {shift.end}
          </ThemedText>
          <ThemedText
            style={[
              styles.shiftNumber,
              { backgroundColor: colors.border, color: colors.textSecondary },
            ]}
          >
            #{index + 1}
          </ThemedText>
        </View>

        <View style={styles.durationContainer}>
          <ThemedText style={[styles.durationText, { color: colors.success }]}>
            {shift.durationText}
          </ThemedText>
          {breakText && (
            <ThemedText
              style={[styles.breakText, { color: colors.textSecondary }]}
            >
              {breakText}
            </ThemedText>
          )}
          <ThemedText
            style={[styles.minutesText, { color: colors.textSecondary }]}
          >
            ({shift.durationMinutes} min)
          </ThemedText>
        </View>

        {shift.note && (
          <View
            style={[styles.noteContainer, { borderTopColor: colors.border }]}
          >
            <ThemedText
              style={[styles.noteText, { color: colors.textSecondary }]}
            >
              <ThemedText style={[styles.noteLabel, { color: colors.text }]}>
                Note:{" "}
              </ThemedText>
              {shift.note}
            </ThemedText>
          </View>
        )}
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
