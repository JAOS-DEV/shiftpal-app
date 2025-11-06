import { FirebaseError } from "firebase/app";

/**
 * Maps Firebase authentication error codes to user-friendly error messages
 */
export function getAuthErrorMessage(error: unknown): string {
  // Extract error code from various error formats
  let errorCode: string | undefined;

  // Handle FirebaseError instances (Firebase v9+)
  if (error instanceof FirebaseError) {
    errorCode = error.code;
  }
  // Handle errors with code property (fallback for other formats)
  else if (error && typeof error === "object" && "code" in error) {
    errorCode = String(error.code);
  }
  // Try to extract code from error message if it's a string
  else if (error instanceof Error && error.message) {
    const codeMatch = error.message.match(/auth\/([a-z-]+)/i);
    if (codeMatch) {
      errorCode = `auth/${codeMatch[1]}`;
    }
  }

  // Map error codes to user-friendly messages
  if (errorCode) {
    switch (errorCode) {
      // Authentication errors
      case "auth/invalid-credential":
        return "The email or password you entered is incorrect. Please check your credentials and try again.";
      case "auth/user-not-found":
        return "No account found with this email address. Please check your email or create a new account.";
      case "auth/wrong-password":
        return "The password you entered is incorrect. Please try again or reset your password.";
      case "auth/invalid-email":
        return "The email address you entered is not valid. Please check and try again.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support for assistance.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please sign in or use a different email.";
      case "auth/weak-password":
        return "The password is too weak. Please use at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many failed login attempts. Please try again later or reset your password.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Please contact support.";
      case "auth/network-request-failed":
        return "Network connection failed. Please check your internet connection and try again.";
      case "auth/invalid-verification-code":
        return "The verification code is invalid or has expired. Please request a new one.";
      case "auth/invalid-verification-id":
        return "The verification ID is invalid. Please try again.";
      case "auth/missing-email":
        return "Please enter your email address.";
      case "auth/missing-password":
        return "Please enter your password.";
      case "auth/quota-exceeded":
        return "Service temporarily unavailable. Please try again later.";
      default:
        // For unknown Firebase errors, provide a generic message
        return "An error occurred during authentication. Please try again.";
    }
  }

  // Handle standard Error objects (fallback if no code was found)
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown error types
  return "An unexpected error occurred. Please try again.";
}

