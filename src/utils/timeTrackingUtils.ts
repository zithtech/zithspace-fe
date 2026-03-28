import { TimeTrackingEntry } from "@/services/timeTracking.service";

/**
 * Calculates the net duration of a set of time tracking entries,
 * grouping entries that were started simultaneously (e.g. multiple tickets for one session).
 * 
 * @param entries List of time tracking entries
 * @param sessionWindowMs Time window (ms) to group "simultaneous" start times (default 5s)
 * @param nowMs Optional current time in ms (defaults to new Date().getTime())
 * @returns Total net duration in seconds
 */
export const calculateNetDuration = (entries: TimeTrackingEntry[], sessionWindowMs: number = 5000, nowMs?: number): number => {
  if (!entries || entries.length === 0) return 0;
  const now = nowMs || new Date().getTime();

  // Sort by startTime to identify simultaneous groups
  const sorted = [...entries].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  let totalNetSeconds = 0;
  const processedIds = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (processedIds.has(entry.id)) continue;

    const group = [entry];
    processedIds.add(entry.id);
    const baseStart = new Date(entry.startTime).getTime();

    // Find "simultaneous" neighbors
    for (let j = i + 1; j < sorted.length; j++) {
      const other = sorted[j];
      const otherStart = new Date(other.startTime).getTime();
      
      if (Math.abs(otherStart - baseStart) < sessionWindowMs) {
        group.push(other);
        processedIds.add(other.id);
      } else {
        break; // Sorted, so no more neighbors in window
      }
    }

    // Contribution from this "session" group:
    // 1. Max of recorded durations
    const maxRecorded = Math.max(...group.map(e => e.duration || 0));
    totalNetSeconds += maxRecorded;

    // 2. Add Live time ONLY ONCE if any entry in the group is RUNNING
    // We take the max live duration if multiple are running in the same group
    const runningEntries = group.filter(e => e.status === 'RUNNING' && e.logs && e.logs.length > 0);
    if (runningEntries.length > 0) {
      let maxLiveSeconds = 0;
      
      runningEntries.forEach(re => {
        const lastLog = [...(re.logs || [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        if (lastLog && (lastLog.action === 'STARTED' || lastLog.action === 'RESUMED')) {
          const start = new Date(lastLog.createdAt).getTime();
          const live = Math.max(0, Math.floor((now - start) / 1000));
          if (live > maxLiveSeconds) maxLiveSeconds = live;
        }
      });
      
      totalNetSeconds += maxLiveSeconds;
    }
  }

  return totalNetSeconds;
};
