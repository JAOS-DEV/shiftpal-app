export function getFirebase() {
  return {
    auth: { currentUser: undefined },
    firestore: {},
  } as any;
}

export async function logAnalyticsEvent() {
  return;
}
