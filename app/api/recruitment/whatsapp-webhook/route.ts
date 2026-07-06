import { NextRequest, NextResponse } from "next/server";

import { saveContactHistory } from "@/services/recruitment/history.service";
import type { ContactHistoryItem } from "@/lib/recruitment-types";

type WhatsAppStatusEvent = {
  id?: unknown;
  status?: unknown;
  timestamp?: unknown;
  recipient_id?: unknown;
  errors?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function collectStatusEvents(payload: unknown): WhatsAppStatusEvent[] {
  if (!isRecord(payload)) return [];

  return getArray(payload.entry).flatMap((entry) => {
    if (!isRecord(entry)) return [];

    return getArray(entry.changes).flatMap((change) => {
      if (!isRecord(change)) return [];
      const value = isRecord(change.value) ? change.value : undefined;
      return getArray(value?.statuses).filter(isRecord) as WhatsAppStatusEvent[];
    });
  });
}

function toEventDate(timestamp?: string) {
  const seconds = Number(timestamp);
  if (Number.isFinite(seconds) && seconds > 0) {
    return new Date(seconds * 1000).toISOString();
  }

  return new Date().toISOString();
}

function statusToHistoryItem(statusEvent: WhatsAppStatusEvent, payload: unknown): ContactHistoryItem {
  const messageId = getString(statusEvent.id);
  const status = getString(statusEvent.status) || "unknown";
  const recipientId = getString(statusEvent.recipient_id) || "desconhecido";
  const timestamp = getString(statusEvent.timestamp);
  const eventDate = toEventDate(timestamp);

  return {
    nome: "Status WhatsApp",
    telefone: recipientId,
    fonte: "WhatsApp Webhook",
    data_envio: eventDate,
    data_apresentacao: "-",
    status: "whatsapp_status",
    mensagem: `Status WhatsApp recebido: ${status}`,
    data: eventDate,
    origem: "WhatsApp Webhook",
    messageId,
    raw: {
      messageId,
      status,
      recipientId,
      timestamp,
      errors: statusEvent.errors,
      payload
    }
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    console.log("WHATSAPP_WEBHOOK_VERIFIED");
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("WHATSAPP_WEBHOOK_ERROR", { message: "Invalid JSON payload" });
    return NextResponse.json({ success: false, error: "Payload invalido" }, { status: 400 });
  }

  const statusEvents = collectStatusEvents(payload);
  const historyItems = statusEvents.map((statusEvent) => {
    const messageId = getString(statusEvent.id);
    const status = getString(statusEvent.status);
    const recipientId = getString(statusEvent.recipient_id);

    console.log("WHATSAPP_WEBHOOK_STATUS_RECEIVED", {
      messageId,
      status,
      recipientId
    });

    return statusToHistoryItem(statusEvent, payload);
  });

  if (historyItems.length === 0) {
    return NextResponse.json({ success: true, received: 0, saved: true });
  }

  try {
    await saveContactHistory(historyItems);
    return NextResponse.json({ success: true, received: historyItems.length, saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("WHATSAPP_WEBHOOK_ERROR", { message });
    return NextResponse.json({ success: true, received: historyItems.length, saved: false });
  }
}
