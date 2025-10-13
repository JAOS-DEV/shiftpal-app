import { getFirebase } from "@/lib/firebase";
import {
  Day,
  HistoryFilter,
  RunningTimer,
  Shift,
  Submission,
} from "@/types/shift";
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
const TIMER_STORAGE_KEY = "running_timer";

class ShiftService {
  private getFirestore() {
    const { firestore } = getFirebase();
    return firestore;
  }

  // Timer helpers
  async getRunningTimer(): Promise<RunningTimer | null> {
    try {
      const data = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
      return data ? (JSON.parse(data) as RunningTimer) : null;
    } catch {
      return null;
    }
  }

  async startTimer(date: string): Promise<RunningTimer> {
    const timer: RunningTimer = {
      id: Date.now().toString(36),
      date,
      startedAt: Date.now(),
      status: "running",
      pauses: [],
      lastUpdatedAt: Date.now(),
    };
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
    return timer;
  }

  async pauseTimer(): Promise<RunningTimer | null> {
    const timer = await this.getRunningTimer();
    if (!timer || timer.status !== "running") return timer;
    timer.status = "paused";
    timer.pauses.push({ start: Date.now() });
    timer.lastUpdatedAt = Date.now();
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
    return timer;
  }

  async resumeTimer(): Promise<RunningTimer | null> {
    const timer = await this.getRunningTimer();
    if (!timer || timer.status !== "paused") return timer;
    const last = timer.pauses[timer.pauses.length - 1];
    if (last && !last.end) last.end = Date.now();
    timer.status = "running";
    timer.lastUpdatedAt = Date.now();
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
    return timer;
  }

  /**
   * Undo the last break if currently paused with an open pause interval.
   * Removes the last pause entry and resumes the timer.
   */
  async undoLastBreak(): Promise<RunningTimer | null> {
    const timer = await this.getRunningTimer();
    if (!timer) return null;
    const last = timer.pauses[timer.pauses.length - 1];
    if (timer.status === "paused" && last && !last.end) {
      timer.pauses.pop();
      timer.status = "running";
      timer.lastUpdatedAt = Date.now();
      await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
      return timer;
    }
    return timer;
  }

  /**
   * Set or update a note on the current open break (if paused).
   */
  async setCurrentBreakNote(note: string): Promise<RunningTimer | null> {
    const timer = await this.getRunningTimer();
    if (!timer || timer.status !== "paused") return timer;
    const last = timer.pauses[timer.pauses.length - 1];
    if (last && !last.end) {
      last.note = note;
      timer.lastUpdatedAt = Date.now();
      await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
    }
    return timer;
  }

  private computeBreakMinutes(timer: RunningTimer, now: number): number {
    return timer.pauses.reduce((sum, p) => {
      const end = p.end ?? (timer.status === "paused" ? now : p.start);
      const ms = Math.max(0, (end ?? now) - p.start);
      return sum + Math.floor(ms / 60000);
    }, 0);
  }

  async stopTimer(includeBreaks: boolean = false): Promise<Shift | null> {
    const timer = await this.getRunningTimer();
    if (!timer) return null;
    const now = Date.now();
    // close open pause if any
    const last = timer.pauses[timer.pauses.length - 1];
    if (timer.status === "paused" && last && !last.end) last.end = now;

    const breakMinutes = this.computeBreakMinutes(timer, now);
    // Build detailed break entries for the shift
    const breaksDetailed = timer.pauses
      .filter((p) => p.end && p.start && p.end > p.start)
      .map((p) => {
        const durationMinutes = Math.floor(
          ((p.end as number) - p.start) / 60000
        );
        return {
          start: p.start,
          end: p.end as number,
          durationMinutes,
          note: p.note,
        };
      });
    const grossMinutes = Math.floor((now - timer.startedAt) / 60000);
    const totalMinutes = includeBreaks
      ? grossMinutes
      : grossMinutes - breakMinutes;
    if (totalMinutes <= 0) {
      await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
      return null;
    }

    const startDate = new Date(timer.startedAt);
    const endDate = new Date(now);
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
    const end = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

    const newShift: Shift = {
      id: now.toString(36),
      start,
      end,
      durationMinutes: totalMinutes,
      durationText: formatDurationText(totalMinutes),
      createdAt: now,
      breakMinutes,
      breakCount: timer.pauses.length,
      includeBreaks,
      breaks: breaksDetailed,
    };

    // Save under SHIFTS_STORAGE_KEY for the timer date
    const data = await AsyncStorage.getItem(SHIFTS_STORAGE_KEY);
    const allShifts: Record<string, Shift[]> = data ? JSON.parse(data) : {};
    if (!allShifts[timer.date]) allShifts[timer.date] = [];
    allShifts[timer.date].push(newShift);
    await AsyncStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(allShifts));

    await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
    return newShift;
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
    endTime: string,
    note?: string
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
      ...(note && { note }),
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
   * Submit shifts for a date as a new submission (append to the day)
   */
  async submitDay(date: string, shifts: Shift[]): Promise<Day> {
    const { totalMinutes, totalText } = this.calculateDayTotal(shifts);

    const newSubmission: Submission = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      shifts: [...shifts],
      totalMinutes,
      totalText,
      submittedAt: Date.now(),
    };

    try {
      // Load current days
      const data = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
      const allDays: Record<string, Day> = data ? JSON.parse(data) : {};

      // Initialize or append submission
      const existingDay = allDays[date];
      let updatedDay: Day;
      if (existingDay) {
        const submissions = Array.isArray((existingDay as any).submissions)
          ? [...(existingDay as any).submissions]
          : // Backward compatibility for any old local data
            [
              {
                id: existingDay.submittedAt?.toString() || "legacy",
                shifts: (existingDay as any).shifts || [],
                totalMinutes: existingDay.totalMinutes || 0,
                totalText: existingDay.totalText || "0m",
                submittedAt: existingDay.submittedAt || Date.now(),
              } as Submission,
            ];

        const newSubmissions = [newSubmission, ...submissions]; // newest first
        const dayTotalMinutes = newSubmissions.reduce(
          (sum, s) => sum + s.totalMinutes,
          0
        );

        updatedDay = {
          id: date,
          date,
          submissions: newSubmissions,
          totalMinutes: dayTotalMinutes,
          totalText: formatDurationText(dayTotalMinutes),
          submittedAt: newSubmission.submittedAt,
        };
      } else {
        updatedDay = {
          id: date,
          date,
          submissions: [newSubmission],
          totalMinutes,
          totalText,
          submittedAt: newSubmission.submittedAt,
        };
      }

      allDays[date] = updatedDay;
      await AsyncStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(allDays));

      // Clear shifts for this date since they're now submitted
      const shiftsData = await AsyncStorage.getItem(SHIFTS_STORAGE_KEY);
      const allShifts: Record<string, Shift[]> = shiftsData
        ? JSON.parse(shiftsData)
        : {};
      delete allShifts[date];
      await AsyncStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(allShifts));

      // Best-effort sync to Firebase
      try {
        await this.syncToFirebase(updatedDay);
        console.log("Successfully synced to Firebase");
      } catch (firebaseError) {
        console.warn(
          "Firebase sync failed, but data saved locally:",
          firebaseError
        );
      }

      return updatedDay;
    } catch (error) {
      console.error("Error submitting day:", error);
      throw error;
    }
  }

  /**
   * Get all submitted days with optional filtering
   */
  async getSubmittedDays(
    filter: HistoryFilter = { type: "all" },
    settings?: any
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
        // Get the user's week start day setting
        const weekStartDay =
          settings?.payRules?.payPeriod?.startDay || "Monday";

        // Map day names to numbers (0=Sunday, 1=Monday, etc.)
        const dayMap: Record<string, number> = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };

        const startDayNum = dayMap[weekStartDay] ?? 1; // Default to Monday
        const now = new Date();
        const currentDayNum = now.getDay();

        // Calculate days since the start of the current week
        const daysSinceWeekStart = (currentDayNum - startDayNum + 7) % 7;

        // Calculate the start of the current week
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysSinceWeekStart);
        weekStart.setHours(0, 0, 0, 0);

        // Calculate the end of the current week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        days = days.filter((day) => {
          const dayDate = new Date(day.date + "T00:00:00");
          return dayDate >= weekStart && dayDate <= weekEnd;
        });
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

      return days.map((d) => this.ensureDayHasSubmissions(d));
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
   * Delete a single submission within a day
   */
  async deleteSubmission(date: string, submissionId: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
      const allDays: Record<string, Day> = data ? JSON.parse(data) : {};
      const day = allDays[date];
      if (!day) return;

      const safeDay = this.ensureDayHasSubmissions(day);
      const remaining = safeDay.submissions.filter(
        (s) => s.id !== submissionId
      );

      if (remaining.length === 0) {
        delete allDays[date];
      } else {
        const totalMinutes = remaining.reduce(
          (sum, s) => sum + s.totalMinutes,
          0
        );
        allDays[date] = {
          id: date,
          date,
          submissions: remaining,
          totalMinutes,
          totalText: formatDurationText(totalMinutes),
          submittedAt: remaining[0]?.submittedAt,
        };
      }

      await AsyncStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(allDays));

      // Try to sync to Firebase
      try {
        const updated = allDays[date];
        if (updated) {
          await this.syncToFirebase(updated);
        } else {
          // If day was deleted entirely, reuse deleteDay's Firebase logic
          const userId = this.getUserId();
          if (userId) {
            const firestore = this.getFirestore();
            const dayRef = doc(firestore, "users", userId, "days", date);
            await deleteDoc(dayRef);
          }
        }
      } catch (firebaseError) {
        console.warn("Firebase submission delete sync failed:", firebaseError);
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
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
        const dayFromDb: any = {
          id: data.id || doc.id,
          date: data.date,
          submissions: data.submissions || [],
          totalMinutes: data.totalMinutes || 0,
          totalText: data.totalText || "0h 0m",
          submittedAt: data.submittedAt,
        };
        days.push(this.ensureDayHasSubmissions(dayFromDb));
      });

      return days;
    } catch (error) {
      console.error("Error loading from Firebase:", error);
      return [];
    }
  }

  private ensureDayHasSubmissions(day: any): Day {
    // Convert any legacy shape {shifts[]} into {submissions[]}
    if (Array.isArray(day.submissions)) {
      return day as Day;
    }

    const shifts: Shift[] = Array.isArray(day.shifts) ? day.shifts : [];
    const { totalMinutes, totalText } = this.calculateDayTotal(shifts);
    const fallbackSubmission: Submission = {
      id: day.submittedAt?.toString() || "legacy",
      shifts,
      totalMinutes,
      totalText,
      submittedAt: day.submittedAt || Date.now(),
    };

    return {
      id: day.id,
      date: day.date,
      submissions: shifts.length ? [fallbackSubmission] : [],
      totalMinutes: day.totalMinutes ?? totalMinutes,
      totalText: day.totalText ?? totalText,
      submittedAt: day.submittedAt,
    };
  }
}

export const shiftService = new ShiftService();
