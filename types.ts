
export interface MemoryItem {
  id: string;
  topic: string;
  dateAdded: string; // ISO date string
}

export interface Revision {
    memoryId: string;
    topic: string;
    revisionDate: string; // ISO date string
    revisionNumber: number; // 1, 2, or 3
}
