"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEmptyDayRecord,
  getDayStatus,
  isDayEditable,
  type DayStatus,
} from "@/lib/day";
import { ensureDayRecord, loadDayRecord, saveDayRecord } from "@/lib/storage";
import type { DayRecord } from "@/types/canvas";

type UseDayRecordResult = {
  day: DayRecord | null;
  status: DayStatus;
  editable: boolean;
  loading: boolean;
  saveDay: (nextDay: DayRecord) => void;
  resetDay: () => void;
  importDay: (importedDay: DayRecord) => void;
};

export function useDayRecord(dateKey: string): UseDayRecordResult {
  const [day, setDay] = useState<DayRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const status = useMemo(() => getDayStatus(dateKey), [dateKey]);
  const editable = useMemo(() => isDayEditable(dateKey, day), [dateKey, day]);

  useEffect(() => {
    setLoading(true);

    if (status === "future") {
      setDay(null);
      setLoading(false);
      return;
    }

    if (status === "today") {
      setDay(ensureDayRecord(dateKey));
      setLoading(false);
      return;
    }

    setDay(loadDayRecord(dateKey));
    setLoading(false);
  }, [dateKey, status]);

  const saveDay = useCallback(
    (nextDay: DayRecord) => {
      if (!isDayEditable(dateKey, day)) {
        return;
      }

      const updatedDay = {
        ...nextDay,
        date: dateKey,
        updatedAt: new Date().toISOString(),
      };

      saveDayRecord(updatedDay);
      setDay(updatedDay);
    },
    [dateKey, day],
  );

  const resetDay = useCallback(() => {
    if (!isDayEditable(dateKey, day)) {
      return;
    }

    const emptyDay = createEmptyDayRecord(dateKey);
    saveDayRecord(emptyDay);
    setDay(emptyDay);
  }, [dateKey, day]);

  const importDay = useCallback(
    (importedDay: DayRecord) => {
      if (importedDay.date === dateKey) {
        setDay(importedDay);
      }
    },
    [dateKey],
  );

  return {
    day,
    status,
    editable,
    loading,
    saveDay,
    resetDay,
    importDay,
  };
}
