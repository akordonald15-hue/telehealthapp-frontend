"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { profilesApi } from "@/lib/api/endpoints";
import { uploadToPresignedUrl } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/use-auth";
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

  return (
    <Section
      title="Medical records"
      description="Doctors create records in the backend. File uploads use the backend presigned URL flow."
    >
      <form
        className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          upload.mutate();
        }}
      >
        <ErrorMessage error={upload.error} />
        {upload.isSuccess ? <Notice title={`Upload registered as file #${upload.data.file_id}`} tone="success" /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Record ID">
            <Input value={recordId} onChange={(event) => setRecordId(event.target.value)} type="number" min={1} />
          </Field>
          <Field label="Medical file">
            <Input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </Field>
        </div>
        <Button className="w-fit" type="submit" disabled={upload.isPending}>
          {upload.isPending ? "Uploading..." : "Upload file"}
        </Button>
      </form>

      <DataList<MedicalRecord>
        data={records.data}
        error={records.error}
        isLoading={records.isLoading}
        empty="No medical records returned."
        onPrevious={records.data?.previous ? () => setPage((current) => Math.max(1, current - 1)) : undefined}
        onNext={records.data?.next ? () => setPage((current) => current + 1) : undefined}
        renderItem={(record) => (
          <article key={record.id} className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-950">Record #{record.id}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Patient #{record.patient} · Doctor {record.doctor ? `#${record.doctor}` : "not assigned"} ·{" "}
                  {formatDateTime(record.created_at)}
                </p>
                {record.notes ? <p className="mt-2 text-sm text-zinc-600">{record.notes}</p> : null}
              </div>
              <span className="text-sm text-zinc-500">{record.files.length} files</span>
            </div>
            {record.files.length ? (
              <div className="mt-3 grid gap-2">
                {record.files.map((fileItem) => (
                  <button
                    key={fileItem.id}
                    className="w-fit text-sm font-semibold text-emerald-800"
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
      {userQuery.data?.role === "patient" ? (
        <Notice title="Record creation is backend-restricted">
          Patients can view their records and upload files to accessible records, but only doctors or admins can create
          medical records.
        </Notice>
      ) : null}
    </Section>
  );
}
