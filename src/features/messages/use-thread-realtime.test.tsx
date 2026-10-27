import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useThreadRealtime } from "./use-thread-realtime";

const ticket = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/endpoints", () => ({ messagingApi: { realtimeTicket: ticket } }));

class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 0;
  onopen?: () => void;
  onclose?: () => void;
  onerror?: () => void;
  onmessage?: (event: { data: string }) => void;
  send = vi.fn();
  constructor(public url: string, public protocols: string[]) { FakeSocket.instances.push(this); }
  open() { this.readyState = 1; this.onopen?.(); }
  close() { this.readyState = 3; this.onclose?.(); }
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  ticket.mockResolvedValue({ ticket: "synthetic-one-use-ticket", expires_in: 45, websocket_url: "wss://api.caretekk.test/ws/threads/1/" });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); ticket.mockReset(); });

async function start(refresh = vi.fn()) {
  const hook = renderHook(() => useThreadRealtime(1, true, refresh));
  await act(async () => { await Promise.resolve(); });
  return { ...hook, refresh, socket: FakeSocket.instances[0] };
}

describe("chat delivery recovery", () => {
  it("authenticates with an ephemeral subprotocol without adding credentials to the URL", async () => {
    const { socket, result, refresh } = await start();
    expect(socket.url).not.toContain("ticket");
    expect(socket.protocols).toEqual(["caretekk.chat.v1", "caretekk.ticket.synthetic-one-use-ticket"]);
    act(() => socket.open());
    expect(result.current.liveConnected).toBe(true);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("refreshes on a message and immediately on visibility, focus and network recovery", async () => {
    const { socket, refresh } = await start();
    act(() => socket.open());
    refresh.mockClear();
    act(() => {
      socket.onmessage?.({ data: '{"type":"message"}' });
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("online"));
      window.dispatchEvent(new Event("focus"));
    });
    expect(refresh).toHaveBeenCalledTimes(4);
  });

  it("reconnects after connection loss with a newly requested ticket", async () => {
    const { socket, result } = await start();
    act(() => { socket.open(); socket.close(); });
    expect(result.current.realtimeUnavailable).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(ticket).toHaveBeenCalledTimes(2);
    expect(FakeSocket.instances).toHaveLength(2);
  });

  it("detects a half-open socket using heartbeat acknowledgements", async () => {
    const { socket, result } = await start();
    act(() => socket.open());
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(socket.send).toHaveBeenCalledWith('{"type":"ping"}');
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(socket.readyState).toBe(3);
    expect(result.current.liveConnected).toBe(false);
  });

  it("does not invalidate messages on a heartbeat, and stops after unmount", async () => {
    const { socket, refresh, unmount } = await start();
    act(() => socket.open());
    refresh.mockClear();
    act(() => socket.onmessage?.({ data: '{"type":"pong"}' }));
    expect(refresh).not.toHaveBeenCalled();
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(ticket).toHaveBeenCalledOnce();
    expect(socket.readyState).toBe(3);
  });

  it("keeps authentication failures in fallback mode without logging or reusing tickets", async () => {
    ticket.mockRejectedValue(new Error("unauthorized"));
    const { result, unmount } = await start();
    expect(result.current.realtimeUnavailable).toBe(true);
    expect(FakeSocket.instances).toHaveLength(0);
    unmount();
  });
});
