"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { profilesApi } from "@/lib/api/endpoints";
import { uploadToPresignedUrl } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { medicalRecordSummary, medicalRecordTitle } from "@/lib/ui/humanize";
import type { MedicalRecord } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";

export function RecordsClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [page, setPage] = useState(1);
  const records = useQuery({
    queryKey: ["medical-records", page],
    queryFn: () => profilesApi.medicalRecords({ page, page_size: 10 }),
  });
  const [recordId, setRecordId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !recordId) {
        throw new Error("Choose a record and file.");
      }
      const contentType = file.type || "application/octet-stream";
      const init = await profilesApi.initMedicalFileUpload(Number(recordId), {
        filename: file.name,
        content_type: contentType,
        size_bytes: file.size,
      });
      await uploadToPresignedUrl(init.upload_url, file, contentType);
      return init;
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["medical-records"] }),
  });

  const selectableRecords = useMemo(
    () =>
      records.data?.results.map((record) => ({
        value: String(record.id),
        label: `${medicalRecordTitle(record)} · ${formatDateTime(record.created_at)}`,
      })) ?? [],
    [records.data],
  );

  return (
    <Section title="Medical records" description="Review care notes and keep supporting files in one secure place.">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form
          className="grid gap-4 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            upload.mutate();
          }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <ShieldPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-[#1F2937]">Upload a supporting file</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Choose a record you can view and add a file from your device.</p>
            </div>
          </div>
          <ErrorMessage error={upload.error} context="recordUpload" />
          {upload.isSuccess ? <Notice title="File added" tone="success">Your file has been attached and your records are refreshing now.</Notice> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Medical record" hint="Choose the record you want to update.">
              <Select value={recordId} onChange={(event) => setRecordId(event.target.value)}>
                <option value="">Select a record</option>
                {selectableRecords.map((record) => (
                  <option key={record.value} value={record.value}>
                    {record.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Medical file">
              <Input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </Field>
          </div>
          <Button className="w-full sm:w-fit" type="submit" disabled={upload.isPending}>
            {upload.isPending ? "Uploading..." : "Upload file"}
          </Button>
        </form>

        <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6">
          <p className="font-heading text-xl font-semibold text-[#1F2937]">How records work</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              Your visible records and files stay organized here for follow-up care.
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              Your care team manages new record entries after consultations or follow-up.
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              File access is prepared only when you request a download.
            </div>
          </div>
          {userQuery.data?.role === "patient" ? (
            <Notice title="Record creation is managed by your care team" tone="neutral">
              You can view your records and add files to available entries. Your care team creates new records when needed.
            </Notice>
          ) : null}
        </div>
      </div>

      <DataList<MedicalRecord>
        data={records.data}
        error={records.error}
        isLoading={records.isLoading}
        errorContext="records"
        loadingLabel="Loading your records..."
        emptyTitle="No records yet"
        empty="Your records will appear here once they are available."
        emptyAction={
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#2563EB] px-4 text-sm font-extrabold text-white"
          >
            Return to upload tools
          </button>
        }
        onPrevious={records.data?.previous ? () => setPage((current) => Math.max(1, current - 1)) : undefined}
        onNext={records.data?.next ? () => setPage((current) => current + 1) : undefined}
        renderItem={(record) => (
          <article key={record.id} className="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div>
                <p className="font-heading text-xl font-semibold text-[#1F2937]">{medicalRecordTitle(record)}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {medicalRecordSummary(record, userQuery.data?.role)} · {formatDateTime(record.created_at)}
                </p>
                {record.notes ? <p className="mt-3 text-sm leading-7 text-slate-600">{record.notes}</p> : null}
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                {record.files.length} file{record.files.length === 1 ? "" : "s"}
              </span>
            </div>
            {record.files.length ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {record.files.map((fileItem) => (
                  <button
                    key={fileItem.id}
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#2563EB] transition hover:border-blue-200 hover:bg-[#EFF6FF]"
                    onClick={async () => {
                      const data = await profilesApi.medicalFileDownload(fileItem.id);
                      window.open(data.download_url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Download {fileItem.filename}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        )}
      />
    </Section>
  );
}
