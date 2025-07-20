//an enum for granularity of time 0-4 days-seconds
export enum TimeGranularity {
    DAYS = 1,
    HOURS = 2,
    MINUTES = 3,
    SECONDS = 4,
  }
  
// Function to format a duration in milliseconds to a human-readable string
export function formatDuration(
    milliseconds: number,
    granularity: TimeGranularity = TimeGranularity.SECONDS
): string {
    if (milliseconds < 0) {
        return `${formatDuration(-milliseconds, granularity)} ago`;
    }

    // Constants for time units
    const MS_PER_SECOND = 1000;
    const MS_PER_MINUTE = MS_PER_SECOND * 60;
    const MS_PER_HOUR = MS_PER_MINUTE * 60;
    const MS_PER_DAY = MS_PER_HOUR * 24;

    // Calculate time components
    const days = Math.floor(milliseconds / MS_PER_DAY);
    milliseconds %= MS_PER_DAY;

    const hours = Math.floor(milliseconds / MS_PER_HOUR);
    milliseconds %= MS_PER_HOUR;

    const minutes = Math.floor(milliseconds / MS_PER_MINUTE);
    milliseconds %= MS_PER_MINUTE;

    const seconds = Math.floor(milliseconds / MS_PER_SECOND);

    // Build components based on granularity
    const components: string[] = [];

    if (days > 0) components.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) components.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0) components.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    if (seconds > 0 || components.length === 0) {
        // Always include seconds if no other components exist
        components.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
    }

    // Limit components to the specified granularity
    return components.slice(0, granularity).join(", ");
}