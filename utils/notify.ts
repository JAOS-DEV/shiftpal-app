import Toast from "react-native-toast-message";

export type NotifyOptions = {
  position?: "top" | "bottom";
  visibilityTime?: number;
};

function show(
  type: "success" | "error" | "info" | "warning",
  text1: string,
  text2?: string,
  options?: NotifyOptions
) {
  Toast.show({
    type,
    text1,
    ...(text2 ? { text2 } : {}),
    position: options?.position ?? "bottom",
    visibilityTime: options?.visibilityTime,
  });
}

function success(text1: string, text2?: string, options?: NotifyOptions) {
  show("success", text1, text2, options);
}

function error(text1: string, text2?: string, options?: NotifyOptions) {
  show("error", text1, text2, options);
}

function info(text1: string, text2?: string, options?: NotifyOptions) {
  show("info", text1, text2, options);
}

function warn(text1: string, text2?: string, options?: NotifyOptions) {
  show("warning", text1, text2, options);
}

export const notify = { show, success, error, info, warn };
