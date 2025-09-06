import { useTheme } from "@/providers/ThemeProvider";
import { Day, HistoryFilter, Submission } from "@/types/shift";
import { formatDateDisplay } from "@/utils/timeUtils";
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
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface HistoryListProps {
  days: Day[];
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  onDeleteDay: (date: string) => void;
  onDeleteSubmission?: (date: string, submissionId: string) => void;
}

export function HistoryList({
  days,
  filter,
  onFilterChange,
  onDeleteDay,
  onDeleteSubmission,
}: HistoryListProps) {
  const { colors } = useTheme();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDayExpansion = (dayId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  const handleDeleteDay = (date: string) => {
    const day = days.find((d) => d.date === date);
    if (!day) return;

    const message = `Are you sure you want to delete the entry for ${formatDateDisplay(
      date
    )}?\n\nThis will permanently remove ${day.submissions.length} submission${
      day.submissions.length === 1 ? "" : "s"
    } totaling ${day.totalText}.`;

    if (Platform.OS === "web") {
      if (confirm(message)) {
        onDeleteDay(date);
      }
    } else {
      Alert.alert("Delete Day", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteDay(date),
        },
      ]);
    }
  };

  const getFilterButtonStyle = (filterType: HistoryFilter["type"]) => [
    styles.filterButton,
    { backgroundColor: colors.card, borderColor: colors.border },
    filter.type === filterType && [
      styles.activeFilterButton,
      { backgroundColor: colors.primary, borderColor: colors.primary },
    ],
  ];

  const getFilterTextStyle = (filterType: HistoryFilter["type"]) => [
    styles.filterButtonText,
    { color: colors.text },
    filter.type === filterType && [
      styles.activeFilterButtonText,
      { color: "white" },
    ],
  ];

  if (days.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>
          History
        </ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No submitted days yet
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Submit your first day's shifts to see them here
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        History ({days.length} days)
      </ThemedText>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={getFilterButtonStyle("week")}
          onPress={() => onFilterChange({ type: "week" })}
        >
          <ThemedText style={getFilterTextStyle("week")}>Week</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={getFilterButtonStyle("month")}
          onPress={() => onFilterChange({ type: "month" })}
        >
          <ThemedText style={getFilterTextStyle("month")}>Month</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={getFilterButtonStyle("all")}
          onPress={() => onFilterChange({ type: "all" })}
        >
          <ThemedText style={getFilterTextStyle("all")}>All Time</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {days.map((day) => (
          <DayRow
            key={day.id}
            day={day}
            isExpanded={expandedDays.has(day.id)}
            onToggle={() => toggleDayExpansion(day.id)}
            onDelete={() => handleDeleteDay(day.date)}
            onDeleteSubmission={onDeleteSubmission}
          />
        ))}
      </View>
    </ThemedView>
  );
}

interface DayRowProps {
  day: Day;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDeleteSubmission?: (date: string, submissionId: string) => void;
}

function DayRow({
  day,
  isExpanded,
  onToggle,
  onDelete,
  onDeleteSubmission,
}: DayRowProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const actionsRef = useRef<any>(null);

  const computeMenuPosition = (items: number) => {
    const { width: screenW, height: screenH } = Dimensions.get("window");
    const MENU_WIDTH = 200;
    const EST_ITEM_HEIGHT = 44;
    const MENU_HEIGHT = items * EST_ITEM_HEIGHT + 8; // + vertical padding

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

    return { top, left, width: MENU_WIDTH } as const;
  };

  return (
    <View
      style={[
        styles.dayRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={onToggle}
        accessibilityLabel={`Toggle details for ${formatDateDisplay(day.date)}`}
      >
        <View style={styles.dayInfo}>
          <ThemedText style={styles.dayDate}>
            {formatDateDisplay(day.date)}
          </ThemedText>
          <ThemedText
            style={[styles.daySubtext, { color: colors.textSecondary }]}
          >
            {day.date}
          </ThemedText>
        </View>

        <View style={styles.dayTotals}>
          <ThemedText style={[styles.dayTotalText, { color: colors.success }]}>
            {day.totalText}
          </ThemedText>
          <ThemedText
            style={[styles.dayTotalMinutes, { color: colors.textSecondary }]}
          >
            ({day.totalMinutes} min)
          </ThemedText>
        </View>

        <View style={styles.dayActions}>
          <TouchableOpacity
            ref={actionsRef}
            style={styles.actionsTrigger}
            onPress={(e) => {
              e.stopPropagation();
              actionsRef.current?.measureInWindow?.(
                (x: number, y: number, w: number, h: number) => {
                  setAnchor({ x, y, w, h });
                  setMenuVisible(true);
                }
              );
            }}
            accessibilityLabel={`Open actions for ${formatDateDisplay(
              day.date
            )}`}
          >
            <ThemedText
              style={[styles.actionsTriggerText, { color: colors.primary }]}
            >
              Actions
            </ThemedText>
          </TouchableOpacity>

          <ThemedText
            style={[styles.expandIcon, { color: colors.textSecondary }]}
          >
            {isExpanded ? "▼" : "▶"}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View
          style={[
            styles.shiftsContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <ThemedText
            style={[styles.submissionCount, { color: colors.textSecondary }]}
          >
            {day.submissions.length} submission
            {day.submissions.length === 1 ? "" : "s"}
          </ThemedText>

          {day.submissions.map((submission) => (
            <SubmissionBlock
              key={submission.id}
              date={day.date}
              submission={submission}
              onDeleteSubmission={onDeleteSubmission}
            />
          ))}

          <View
            style={[
              styles.submissionTotalRow,
              { borderTopColor: colors.border },
            ]}
          >
            <ThemedText
              style={[
                styles.submissionTotalLabel,
                { color: colors.textSecondary },
              ]}
            >
              Day Total:
            </ThemedText>
            <ThemedText
              style={[styles.submissionTotalValue, { color: colors.text }]}
            >
              {day.totalText} ({day.totalMinutes} min)
            </ThemedText>
          </View>
          {(() => {
            const allShifts =
              day.submissions?.flatMap((s) => s.shifts || []) || [];
            const total = allShifts.reduce(
              (sum, s) =>
                sum + (typeof s.breakMinutes === "number" ? s.breakMinutes : 0),
              0
            );
            if (!total) return null;
            const included = allShifts.reduce(
              (sum, s) =>
                sum +
                (s.includeBreaks
                  ? typeof s.breakMinutes === "number"
                    ? s.breakMinutes
                    : 0
                  : 0),
              0
            );
            const excluded = total - included;
            const count = allShifts.reduce(
              (sum, s) =>
                sum + (typeof s.breakCount === "number" ? s.breakCount : 0),
              0
            );
            return (
              <ThemedText
                style={[
                  styles.breakSummaryText,
                  { color: colors.textSecondary },
                ]}
              >
                Breaks: {total}m{count ? ` (${count})` : ""}
                {included ? ` • included ${included}m` : ""}
                {excluded ? ` • excluded ${excluded}m` : ""}
              </ThemedText>
            );
          })()}
        </View>
      )}

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
                ...computeMenuPosition(2),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onToggle();
              }}
            >
              <ThemedText style={[styles.menuItemText, { color: colors.text }]}>
                {isExpanded ? "Collapse" : "Expand"}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onDelete();
              }}
            >
              <ThemedText
                style={[
                  styles.menuItemTextDestructive,
                  { color: colors.error },
                ]}
              >
                Delete Day
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

interface SubmissionBlockProps {
  date: string;
  submission: Submission;
  onDeleteSubmission?: (date: string, submissionId: string) => void;
}

function SubmissionBlock({
  date,
  submission,
  onDeleteSubmission,
}: SubmissionBlockProps) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const actionsRef = useRef<any>(null);

  const computeMenuPosition = (items: number) => {
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

    return { top, left, width: MENU_WIDTH } as const;
  };

  const handleDelete = () => {
    if (!onDeleteSubmission) return;

    const message = `Delete this submission from ${formatDateDisplay(date)}?`;
    if (Platform.OS === "web") {
      if (confirm(message)) onDeleteSubmission(date, submission.id);
    } else {
      Alert.alert("Delete Submission", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteSubmission(date, submission.id),
        },
      ]);
    }
  };

  return (
    <View style={[styles.submissionBlock, { borderColor: colors.border }]}>
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
          style={[styles.shiftRow, { borderBottomColor: colors.border }]}
        >
          <ThemedText style={[styles.shiftTime, { color: colors.text }]}>
            {shift.start} - {shift.end}
          </ThemedText>
          <ThemedText
            style={[styles.shiftDuration, { color: colors.textSecondary }]}
          >
            {shift.durationText} ({shift.durationMinutes} min)
          </ThemedText>
          {typeof shift.includeBreaks === "boolean" && (
            <ThemedText
              style={[styles.shiftDuration, { color: colors.textSecondary }]}
            >
              Breaks:{" "}
              {typeof shift.breakMinutes === "number" ? shift.breakMinutes : 0}m
              {typeof shift.breakCount === "number" && shift.breakCount > 0
                ? ` (${shift.breakCount})`
                : ""}
              {shift.includeBreaks ? " (included)" : " (excluded)"}
            </ThemedText>
          )}
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
}

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
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterButton: {
    // Dynamic colors applied via style prop
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterButtonText: {
    // Dynamic colors applied via style prop
  },
  listContainer: {
    gap: 8,
  },
  dayRow: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    // Dynamic colors applied via style prop
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  daySubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
  dayTotals: {
    alignItems: "flex-end",
    marginRight: 12,
  },
  dayTotalText: {
    fontSize: 16,
    fontWeight: "700",
    // Dynamic colors applied via style prop
  },
  dayTotalMinutes: {
    fontSize: 12,
    opacity: 0.6,
  },
  expandIcon: {
    fontSize: 12,
    opacity: 0.6,
  },
  shiftsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    // Dynamic colors applied via style prop
  },
  submissionCount: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  submissionBlock: {
    borderWidth: 1,
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
  shiftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    // Dynamic colors applied via style prop
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
  submissionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  submissionActions: {
    flexDirection: "row",
    gap: 8,
  },
  placeholderButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
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
  submissionTotalRow: {
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submissionTotalLabel: {
    fontSize: 12,
  },
  submissionTotalValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  breakSummaryText: {
    fontSize: 12,
    marginTop: 4,
  },
  dayActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "white",
  },
});
