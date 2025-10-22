import { ThemedText } from "@/components/ThemedText";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { Day } from "@/types/shift";
import { formatDate } from "@/utils/formatUtils";
import { formatDateDisplay } from "@/utils/timeUtils";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./DayRow.styles";
import { SubmissionBlock } from "./SubmissionBlock";

interface DayRowProps {
  day: Day;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDeleteSubmission?: (date: string, submissionId: string) => void;
  onSubmissionUpdated?: () => void;
}

export const DayRow: React.FC<DayRowProps> = ({
  day,
  isExpanded,
  onToggle,
  onDelete,
  onDeleteSubmission,
  onSubmissionUpdated,
}) => {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const actionsRef = useRef<View>(null);

  const computeMenuPosition = (
    items: number
  ): { top: number; left: number; width: number } => {
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

  const computeBreaksSummary = (): React.ReactElement | null => {
    const allShifts = day.submissions?.flatMap((s) => s.shifts || []) || [];
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
      (sum, s) => sum + (typeof s.breakCount === "number" ? s.breakCount : 0),
      0
    );
    return (
      <ThemedText
        style={[styles.breakSummaryText, { color: colors.textSecondary }]}
      >
        Breaks: {total}m{count ? ` (${count})` : ""}
        {included ? ` • included ${included}m` : ""}
        {excluded ? ` • excluded ${excluded}m` : ""}
      </ThemedText>
    );
  };

  return (
    <View
      style={[
        styles.dayCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={onToggle}
        accessibilityLabel={`Toggle details for ${formatDateDisplay(day.date)}`}
      >
        <View style={styles.dayHeaderContent}>
          <View style={styles.daySummary}>
            <ThemedText style={[styles.dayDate, { color: colors.text }]}>
              {formatDateDisplay(day.date)}
            </ThemedText>
            <ThemedText
              style={[styles.daySubtext, { color: colors.textSecondary }]}
            >
              {formatDate(day.date, settings)}
            </ThemedText>
          </View>
          <View style={styles.dayTotal}>
            <ThemedText
              style={[styles.dayTotalLabel, { color: colors.textSecondary }]}
            >
              Total
            </ThemedText>
            <ThemedText
              style={[styles.dayTotalValue, { color: colors.primary }]}
            >
              {day.totalText}
            </ThemedText>
          </View>
        </View>
        <ThemedText
          style={[styles.expandIcon, { color: colors.textSecondary }]}
        >
          {isExpanded ? "▼" : "▶"}
        </ThemedText>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <View style={styles.shiftsContainer}>
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
                onSubmissionUpdated={onSubmissionUpdated}
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
            {computeBreaksSummary()}
          </View>

          <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              ref={actionsRef}
              style={[styles.actionsBtn, { borderColor: colors.border }]}
              onPress={() => {
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
                style={[styles.actionsBtnText, { color: colors.primary }]}
              >
                Actions
              </ThemedText>
            </TouchableOpacity>
          </View>
        </>
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
};
