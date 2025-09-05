import { Shift } from "@/types/shift";
import React from "react";
import { Alert, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface SubmitButtonProps {
  shifts: Shift[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function SubmitButton({
  shifts,
  onSubmit,
  isSubmitting = false,
}: SubmitButtonProps) {
  console.log("SubmitButton: Component rendered with props:", {
    shiftsLength: shifts.length,
    isSubmitting,
    onSubmit: typeof onSubmit,
  });

  const totalMinutes = shifts.reduce(
    (sum, shift) => sum + shift.durationMinutes,
    0
  );

  const handleSubmit = () => {
    console.log("SubmitButton: handleSubmit called");
    console.log("SubmitButton: Platform =", Platform.OS);
    console.log("SubmitButton: shifts.length =", shifts.length);
    console.log("SubmitButton: isSubmitting =", isSubmitting);

    if (shifts.length === 0) {
      if (Platform.OS === "web") {
        alert("No Shifts\n\nPlease add at least one shift before submitting.");
      } else {
        Alert.alert(
          "No Shifts",
          "Please add at least one shift before submitting."
        );
      }
      return;
    }

    console.log("SubmitButton: Showing confirmation dialog");

    if (Platform.OS === "web") {
      // Use browser's native confirm dialog for web
      const message = `Are you sure you want to submit ${shifts.length} shift${
        shifts.length > 1 ? "s" : ""
      } totaling ${Math.floor(totalMinutes / 60)}h ${
        totalMinutes % 60
      }m?\n\nThis will save your shifts to history.`;

      if (confirm(message)) {
        console.log(
          "SubmitButton: User confirmed submission, calling onSubmit"
        );
        onSubmit();
      } else {
        console.log("SubmitButton: User cancelled submission");
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert(
        "Submit Day's Shifts",
        `Are you sure you want to submit ${shifts.length} shift${
          shifts.length > 1 ? "s" : ""
        } totaling ${Math.floor(totalMinutes / 60)}h ${
          totalMinutes % 60
        }m?\n\nThis will save your shifts to history.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Submit",
            onPress: () => {
              console.log(
                "SubmitButton: User confirmed submission, calling onSubmit"
              );
              onSubmit();
            },
          },
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={[
          styles.submitButton,
          shifts.length === 0 && styles.disabledButton,
          isSubmitting && styles.submittingButton,
        ]}
        onPress={() => {
          console.log("SubmitButton: TouchableOpacity onPress called");
          console.log(
            "SubmitButton: Button disabled?",
            shifts.length === 0 || isSubmitting
          );
          handleSubmit();
        }}
        disabled={shifts.length === 0 || isSubmitting}
        accessibilityLabel="Submit day's shifts"
        // Add web-specific props
        {...(Platform.OS === "web" && {
          onMouseDown: () => console.log("SubmitButton: onMouseDown called"),
          onMouseUp: () => console.log("SubmitButton: onMouseUp called"),
          onMouseEnter: () => console.log("SubmitButton: onMouseEnter called"),
          onMouseLeave: () => console.log("SubmitButton: onMouseLeave called"),
        })}
      >
        <ThemedText
          style={[
            styles.submitButtonText,
            shifts.length === 0 && styles.disabledButtonText,
            isSubmitting && styles.submittingButtonText,
          ]}
        >
          {isSubmitting ? "Submitting..." : "Submit Day's Shifts"}
        </ThemedText>
      </TouchableOpacity>

      {shifts.length > 0 && (
        <ThemedText style={styles.submitNote}>
          This will save {shifts.length} shift{shifts.length > 1 ? "s" : ""} to
          your history
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: "#34C759",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    // Use boxShadow for web compatibility
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    // Keep shadow properties for React Native
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Web-specific styles
    ...(Platform.OS === "web" && {
      cursor: "pointer",
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
    }),
  },
  disabledButton: {
    backgroundColor: "#E5E5EA",
    boxShadow: "none",
    shadowOpacity: 0,
    elevation: 0,
  },
  submittingButton: {
    backgroundColor: "#FF9500",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  disabledButtonText: {
    color: "#999",
  },
  submittingButtonText: {
    color: "white",
  },
  submitNote: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.6,
  },
});
