import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Thread } from "@/lib/types/backend";
import { SessionControls } from "./session-controls";

const { action }=vi.hoisted(()=>({action:vi.fn().mockResolvedValue({})}));
vi.mock("@/lib/api/endpoints",()=>({messagingApi:{sessionAction:action}}));
afterEach(()=>vi.clearAllMocks());
const thread={id:1,appointment:{id:1,status:"confirmed",scheduled_at:"2099-11-17T11:00:00Z"},session_controls:{early_requested:false,patient_ready:false}} as Thread;
function show(t:Thread,role:"doctor"|"patient") {return render(<QueryClientProvider client={new QueryClient({defaultOptions:{mutations:{retry:false}}})}><SessionControls thread={t} role={role}/></QueryClientProvider>);}

it("does not permit a doctor start without patient readiness",()=>{
 show(thread,"doctor");
 expect(screen.getByRole("button",{name:"Start clinical consultation"})).toBeDisabled();
 expect(action).not.toHaveBeenCalled();
});
it("requires an explicit confirmation before patient early-start agreement",async()=>{
 vi.spyOn(window,"confirm").mockReturnValue(false);
 show({...thread,session_controls:{early_requested:true,patient_ready:false}},"patient");
 fireEvent.click(screen.getByRole("button",{name:"Agree to requested early start"}));
 expect(action).not.toHaveBeenCalled();
});
it("sends only the explicit readiness action at the scheduled time",async()=>{
 show({...thread,appointment:{...thread.appointment!,scheduled_at:"2020-01-01T11:00:00Z"}},"patient");
 fireEvent.click(screen.getByRole("button",{name:"I am ready for my consultation"}));
 await waitFor(()=>expect(action).toHaveBeenCalledWith(1,"ready"));
});
