import type { Timestamp } from "firebase-admin/firestore";

export interface Media {
  id: string;
  actionId: string;
  teamId: string;
  url: string;
  uploadedBy: string;
  createdAt: Timestamp;
}
