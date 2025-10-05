import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/providers/ThemeProvider";
import { Submission } from "@/types/shift";
import { formatDateDisplay } from "@/utils/timeUtils";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

interface SubmissionBlockProps {
  date: string;
  submission: Submission;
  onDeleteSubmission?: (date: string, submissionId: string) => void;
}

export const SubmissionBlock: React.FC<SubmissionBlockProps> = ({
  date,
  submission,
  onDeleteSubmission,
}) => {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const actionsRef = useRef<View>(null);

  const computeMenuPosition = (items: number): { top: number; left: number; width: number } => {
    const { width: screenW, height: screenH } = Dimensions.get("window");
    const MENU_WIDTH = 200;
    const EST_ITEM_HEIGHT = 44;
    const MENU_HEIGHT = items * EST_ITEM_HEIGHT + 8;

    const ax = anchor?.x ?? 0;
    const ay = anchor?.y ?? 0;
    const aw = anchor?.w ?? 0;
    const ah = anchor?.h ?? 0;

    let left = ax + aw - MENU_WIDTH;
    left = Math.max(8, Math.min(left, screenW - MENU_WIDTH - 8));

    const belowTop = ay + ah + 6;
    const aboveTop = ay - MENU_HEIGHT - 6;
    const top =
      screenH - belowTop >= MENU_HEIGHT ? belowTop : Math.max(8, aboveTop);

    return { top, left, width: MENU_WIDTH };
  };

  const handleDelete = (): void => {
    if (!onDeleteSubmission) return;

    const message = `Delete this submission from ${formatDateDisplay(date)}?`;
    if (Platform.OS === "web") {
      if (confirm(message)) {
        try {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          ).catch(() => {});
        } catch {}
        onDeleteSubmission(date, submission.id);
      }
    } else {
      Alert.alert("Delete Submission", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              ).catch(() => {});
            } catch {}
            onDeleteSubmission(date, submission.id);
          },
        },
      ]);
    }
  };

  return (
    <View
      style={[styles.submissionBlock, { borderColor: colors.textSecondary }]}
    >
      <View style={styles.submissionHeader}>
        <ThemedText
          style={[styles.submittedAt, { color: colors.textSecondary }]}
        >
          Submitted at{" "}
          {new Date(submission.submittedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </ThemedText>

        <TouchableOpacity
          ref={actionsRef}
          style={styles.actionsTrigger}
          onPress={() => {
            actionsRef.current?.measureInWindow?.(
              (x: number, y: number, w: number, h: number) => {
                setAnchor({ x, y, w, h });
                setMenuVisible(true);
              }
            );
          }}
          accessibilityLabel="Open actions menu"
        >
          <ThemedText
            style={[styles.actionsTriggerText, { color: colors.primary }]}
          >
            Actions
          </ThemedText>
        </TouchableOpacity>
      </View>

      {submission.shifts.map((shift) => (
        <View
          key={shift.id}
          style={[
            styles.shiftBlock,
            { borderBottomColor: colors.textSecondary, borderBottomWidth: 2 },
          ]}
        >
          <View style={styles.shiftRow}>
            <ThemedText style={[styles.shiftTime, { color: colors.text }]}>
              {shift.start} - {shift.end}
            </ThemedText>
            <ThemedText
              style={[styles.shiftDuration, { color: colors.textSecondary }]}
            >
              {shift.durationText} ({shift.durationMinutes} min)
            </ThemedText>
          </View>

          {typeof shift.includeBreaks === "boolean" && (
            <ThemedText
              style={[
                styles.shiftBreakSummary,
                { color: colors.textSecondary },
              ]}
            >
              Breaks:{" "}
              {typeof shift.breakMinutes === "number" ? shift.breakMinutes : 0}m
              {typeof shift.breakCount === "number" && shift.breakCount > 0
                ? ` (${shift.breakCount})`
                : ""}
              {shift.includeBreaks ? " (included)" : " (excluded)"}
            </ThemedText>
          )}

          {Array.isArray(shift.breaks) && shift.breaks.length > 0 ? (
            <View
              style={[
                styles.breaksDetailContainer,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <ThemedText
                style={[styles.breaksTitle, { color: colors.textSecondary }]}
              >
                Breaks
              </ThemedText>
              {shift.breaks.map((b, i) => (
                <View
                  key={i}
                  style={[
                    styles.breakDetailRow,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <View style={styles.breakDetailHeader}>
                    <ThemedText
                      style={[
                        styles.breakDetailIndex,
                        { color: colors.textSecondary },
                      ]}
                    >
                      #{i + 1}
                    </ThemedText>
                    <ThemedText
                      style={[styles.breakDetailTime, { color: colors.text }]}
                    >
                      {new Date(b.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(b.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </ThemedText>
                    <View style={styles.breakDurationChip}>
                      <ThemedText style={styles.breakDurationChipText}>
                        {b.durationMinutes}m
                      </ThemedText>
                    </View>
                  </View>
                  {b.note ? (
                    <View
                      style={[
                        styles.breakNoteBox,
                        { borderColor: colors.border },
                      ]}
                    >
                      <ThemedText
                        style={[styles.breakDetailNote, { color: colors.text }]}
                      >
                        <ThemedText style={styles.breakDetailNoteLabel}>
                          Note:{" "}
                        </ThemedText>
                        {b.note}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}

      <View style={styles.submissionFooter}>
        <ThemedText
          style={[styles.submissionTotalLabel, { color: colors.textSecondary }]}
        >
          Total:
        </ThemedText>
        <ThemedText
          style={[styles.submissionTotalValue, { color: colors.text }]}
        >
          {submission.totalText} ({submission.totalMinutes} min)
        </ThemedText>

        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          >
            <View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  position: "absolute",
                  ...computeMenuPosition(3),
                },
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                }}
              >
                <ThemedText
                  style={[styles.menuItemText, { color: colors.text }]}
                >
                  Edit
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                }}
              >
                <ThemedText
                  style={[styles.menuItemText, { color: colors.text }]}
                >
                  Duplicate
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  handleDelete();
                }}
              >
                <ThemedText
                  style={[
                    styles.menuItemTextDestructive,
                    { color: colors.error },
                  ]}
                >
                  Delete
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  submissionBlock: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  submissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  submittedAt: {
    fontSize: 12,
  },
  actionsTrigger: {},
  actionsTriggerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  shiftBlock: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  shiftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  shiftTime: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  shiftDuration: {
    fontSize: 12,
    opacity: 0.7,
  },
  shiftBreakSummary: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  breaksDetailContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: "100%",
  },
  breaksTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  breakDetailRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  breakDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    flexWrap: "wrap",
  },
  breakDetailIndex: {
    fontSize: 11,
  },
  breakDetailTime: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  breakDurationChip: {
    backgroundColor: "#F0F0F5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "center",
    marginTop: 2,
  },
  breakDurationChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  breakDetailNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  breakDetailNoteLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  breakNoteBox: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  submissionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  submissionTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  submissionTotalValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuContainer: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    paddingVertical: 8,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
  },
  menuItemTextDestructive: {
    fontSize: 14,
    fontWeight: "600",
  },
});

