import { getFirebase } from "@/lib/firebase";
import { Day, HistoryFilter, Shift } from "@/types/shift";
import { calculateDuration, formatDurationText } from "@/utils/timeUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

const SHIFTS_STORAGE_KEY = "shifts_data";
const DAYS_STORAGE_KEY = "days_data";

class ShiftService {
  private getFirestore() {
    const { firestore } = getFirebase();
    return firestore;
  }

  private getUserId() {
    const { auth } = getFirebase();
    return auth.currentUser?.uid;
  }

  /**
   * Get all shifts for a specific date
   */
  async getShiftsForDate(date: string): Promise<Shift[]> {
    try {
      const data = await AsyncStorage.getItem(SHIFTS_STORAGE_KEY);
      const allShifts: Record<string, Shift[]> = data ? JSON.parse(data) : {};
      return allShifts[date] || [];
    } catch (error) {
      console.error("Error getting shifts for date:", error);
      return [];
    }
  }

  /**
   * Add a new shift for a specific date
   */
  async addShift(
    date: string,
    startTime: string,
    endTime: string
  ): Promise<Shift> {
    const durationMinutes = calculateDuration(startTime, endTime);
    const durationText = formatDurationText(durationMinutes);

    const newShift: Shift = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      start: startTime,
      end: endTime,
      durationMinutes,
      durationText,
      createdAt: Date.now(),
    };

    try {
      const data = await AsyncStorage.getItem(SHIFTS_STORAGE_KEY);
      const allShifts: Record<string, Shift[]> = data ? JSON.parse(data) : {};

      if (!allShifts[date]) {
        allShifts[date] = [];
      }

      allShifts[date].push(newShift);
      await AsyncStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(allShifts));

      return newShift;
    } catch (error) {
      console.error("Error adding shift:", error);
      throw error;
    }
  }

  /**
   * Remove a shift by ID
   */
  async removeShift(date: string, shiftId: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SHIFTS_STORAGE_KEY);
      const allShifts: Record<string, Shift[]> = data ? JSON.parse(data) : {};

      if (allShifts[date]) {
        allShifts[date] = allShifts[date].filter(
          (shift) => shift.id !== shiftId
        );
        await AsyncStorage.setItem(
          SHIFTS_STORAGE_KEY,
          JSON.stringify(allShifts)
        );
      }
    } catch (error) {
      console.error("Error removing shift:", error);
      throw error;
    }
  }

  /**
   * Calculate total duration for a date
   */
  calculateDayTotal(shifts: Shift[]): {
    totalMinutes: number;
    totalText: string;
  } {
    const totalMinutes = shifts.reduce(
      (sum, shift) => sum + shift.durationMinutes,
      0
    );
    return {
      totalMinutes,
      totalText: formatDurationText(totalMinutes),
    };
  }

  /**
   * Submit all shifts for a date (save to history)
   */
  async submitDay(date: string, shifts: Shift[]): Promise<Day> {
    const { totalMinutes, totalText } = this.calculateDayTotal(shifts);

    const day: Day = {
      id: date,
      date,
      shifts: [...shifts],
      totalMinutes,
      totalText,
      submittedAt: Date.now(),
    };

    try {
      // Save to local storage first (this should always work)
      const data = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
      const allDays: Record<string, Day> = data ? JSON.parse(data) : {};
      allDays[date] = day;
      await AsyncStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(allDays));

      // Clear shifts for this date since they're now submitted
      const shiftsData = await AsyncStorage.getItem(SHIFTS_STORAGE_KEY);
      const allShifts: Record<string, Shift[]> = shiftsData
        ? JSON.parse(shiftsData)
        : {};
      delete allShifts[date];
      await AsyncStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(allShifts));

      // Try to sync to Firebase, but don't fail if it doesn't work
      try {
        await this.syncToFirebase(day);
        console.log("Successfully synced to Firebase");
      } catch (firebaseError) {
        console.warn(
          "Firebase sync failed, but data saved locally:",
          firebaseError
        );
        // Don't throw error - data is still saved locally
      }

      return day;
    } catch (error) {
      console.error("Error submitting day:", error);
      throw error;
    }
  }

  /**
   * Get all submitted days with optional filtering
   */
  async getSubmittedDays(
    filter: HistoryFilter = { type: "all" }
  ): Promise<Day[]> {
    try {
      // Load from local storage first
      const data = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
      const localDays: Record<string, Day> = data ? JSON.parse(data) : {};

      // Try to load from Firebase, but don't fail if it doesn't work
      let firebaseDays: Day[] = [];
      try {
        firebaseDays = await this.loadFromFirebase();
      } catch (firebaseError) {
        console.warn(
          "Firebase load failed, using local data only:",
          firebaseError
        );
      }

      // Merge Firebase and local data, prioritizing Firebase for conflicts
      const allDays = { ...localDays };
      firebaseDays.forEach((day) => {
        allDays[day.date] = day;
      });

      let days = Object.values(allDays).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply filters
      if (filter.type === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        days = days.filter((day) => new Date(day.date) >= weekAgo);
      } else if (filter.type === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        days = days.filter((day) => new Date(day.date) >= monthAgo);
      } else if (
        filter.type === "custom" &&
        filter.startDate &&
        filter.endDate
      ) {
        days = days.filter(
          (day) => day.date >= filter.startDate! && day.date <= filter.endDate!
        );
      }

      return days;
    } catch (error) {
      console.error("Error getting submitted days:", error);
      return [];
    }
  }

  /**
   * Delete a submitted day from history
   */
  async deleteDay(date: string): Promise<void> {
    try {
      // Delete from local storage
      const data = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
      const allDays: Record<string, Day> = data ? JSON.parse(data) : {};
      delete allDays[date];
      await AsyncStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(allDays));

      // Try to delete from Firebase
      try {
        const userId = this.getUserId();
        if (userId) {
          const firestore = this.getFirestore();
          const dayRef = doc(firestore, "users", userId, "days", date);
          await deleteDoc(dayRef);
          console.log("Successfully deleted day from Firebase:", date);
        }
      } catch (firebaseError) {
        console.warn(
          "Firebase delete failed, but data deleted locally:",
          firebaseError
        );
      }

      console.log("Successfully deleted day:", date);
    } catch (error) {
      console.error("Error deleting day:", error);
      throw error;
    }
  }

  /**
   * Sync data to Firebase
   */
  private async syncToFirebase(day: Day): Promise<void> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        console.log("No user logged in, skipping Firebase sync");
        return;
      }

      const firestore = this.getFirestore();
      const userDaysRef = collection(firestore, "users", userId, "days");

      // Store the day document with the date as the document ID
      await setDoc(doc(userDaysRef, day.date), {
        ...day,
        userId,
        syncedAt: Date.now(),
      });

      console.log("Successfully synced day to Firebase:", day.date);
    } catch (error) {
      console.error("Error syncing to Firebase:", error);
      // Don't throw error - local storage is the primary storage
    }
  }

  /**
   * Load submitted days from Firebase
   */
  async loadFromFirebase(): Promise<Day[]> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        console.log("No user logged in, skipping Firebase load");
        return [];
      }

      const firestore = this.getFirestore();
      const userDaysRef = collection(firestore, "users", userId, "days");
      const q = query(userDaysRef, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);

      const days: Day[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        days.push({
          id: data.id || doc.id,
          date: data.date,
          shifts: data.shifts || [],
          totalMinutes: data.totalMinutes || 0,
          totalText: data.totalText || "0h 0m",
          submittedAt: data.submittedAt,
        });
      });

      return days;
    } catch (error) {
      console.error("Error loading from Firebase:", error);
      return [];
    }
  }
}

export const shiftService = new ShiftService();
