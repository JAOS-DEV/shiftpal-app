import { useTheme } from "@/providers/ThemeProvider";
import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[{ backgroundColor: colors.surface }, style]}
      {...otherProps}
    />
  );
}
