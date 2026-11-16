"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingApi } from "@/lib/api/endpoints";
import type { Thread, UserRole } from "@/lib/types/backend";

export function SessionControls({ thread, role }: { thread: Thread; role?: UserRole }) {
  const client = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 15000); return () => window.clearInterval(timer); }, []);
  const action = useMutation({
    mutationFn: (name: "ready" | "request-early" | "agree-early" | "start") => messagingApi.sessionAction(thread.id, name),
    onSuccess: () => client.invalidateQueries({ queryKey: ["threads"] }),
  });
  if (!thread.appointment || !thread.session_controls || thread.consultation_started_at || !["patient", "doctor"].includes(role ?? "")) return null;
  const early = Date.parse(thread.appointment.scheduled_at) > now;
  const submit = (name: "ready" | "request-early" | "agree-early" | "start") => {
    if (name === "agree-early" && !window.confirm("Do you agree to begin your clinical consultation now, before its scheduled time? This agreement expires after five minutes.")) return;
    action.mutate(name);
  };
  return <div className="border-b border-slate-200 bg-white px-4 py-3 text-sm sm:px-6">
    <p>Messages do not start your consultation timer. Patient readiness and an explicit doctor start are required.</p>
    {role === "patient" && !early ? <button disabled={action.isPending} onClick={() => submit("ready")} className="mt-2 rounded border px-3 py-2">I am ready for my consultation</button> : null}
    {role === "patient" && early && thread.session_controls.early_requested ? <button disabled={action.isPending} onClick={() => submit("agree-early")} className="mt-2 rounded border px-3 py-2">Agree to requested early start</button> : null}
    {role === "doctor" && early && !thread.session_controls.early_requested ? <button disabled={action.isPending} onClick={() => submit("request-early")} className="mt-2 rounded border px-3 py-2">Request patient agreement to start early</button> : null}
    {role === "doctor" ? <button disabled={action.isPending || !thread.session_controls.patient_ready} onClick={() => submit("start")} className="mt-2 rounded border px-3 py-2">Start clinical consultation</button> : null}
    {thread.session_controls.patient_ready ? <p>Patient readiness recorded; valid for five minutes.</p> : null}
    {action.error ? <p role="alert">The session action was not accepted. Refresh and confirm the appointment time and patient readiness.</p> : null}
  </div>;
}
