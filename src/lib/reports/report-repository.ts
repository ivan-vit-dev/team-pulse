import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminFirestore } from "@/lib/firebase/admin";
import type {
  Report,
  ReportContentType,
  ReportReason,
  ReportResolutionAction,
} from "@/lib/types/report";

const reportsCollection = adminFirestore.collection("reports");

export interface CreateReportInput {
  contentType: ReportContentType;
  contentId: string;
  teamId: string;
  reporterUid: string;
  reason: ReportReason;
  details: string | null;
}

/**
 * If this same user already has a pending report open against this exact
 * piece of content, returns that report's id instead of creating a
 * duplicate — same idea as createInvite's existing-pending short-circuit.
 */
export async function createReport(input: CreateReportInput): Promise<string> {
  const existing = await reportsCollection
    .where("contentType", "==", input.contentType)
    .where("contentId", "==", input.contentId)
    .where("reporterUid", "==", input.reporterUid)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!existing.empty) {
    return existing.docs[0]!.id;
  }

  const ref = reportsCollection.doc();
  await ref.set({
    ...input,
    status: "pending",
    resolvedByUid: null,
    resolvedAt: null,
    resolutionAction: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getReport(reportId: string): Promise<Report | null> {
  const snapshot = await reportsCollection.doc(reportId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as Report;
}

export async function listReportsForTeam(teamId: string): Promise<Report[]> {
  const snapshot = await reportsCollection.where("teamId", "==", teamId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Report);
}

export async function resolveReport(
  reportId: string,
  resolvedByUid: string,
  resolutionAction: ReportResolutionAction,
): Promise<void> {
  await reportsCollection.doc(reportId).set(
    {
      status: "resolved",
      resolvedByUid,
      resolvedAt: FieldValue.serverTimestamp(),
      resolutionAction,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function dismissReport(reportId: string, resolvedByUid: string): Promise<void> {
  await reportsCollection.doc(reportId).set(
    {
      status: "dismissed",
      resolvedByUid,
      resolvedAt: FieldValue.serverTimestamp(),
      resolutionAction: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
