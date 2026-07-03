import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/services/whatsapp/whatsapp.service";

type SendWhatsAppPayload = {
  telefone?: unknown;
  mensagem?: unknown;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SendWhatsAppPayload;
    const telefone = asText(payload.telefone);
    const mensagem = asText(payload.mensagem);

    if (!telefone || !mensagem) {
      return NextResponse.json({ success: false, error: "Telefone e mensagem sao obrigatorios" }, { status: 400 });
    }

    const result = await sendWhatsAppMessage({ telefone, mensagem });
    return NextResponse.json(result);
  } catch (error) {
    console.error("WHATSAPP_SEND_ERROR", error);
    return NextResponse.json({ success: false, error: "Falha ao preparar envio de WhatsApp" }, { status: 500 });
  }
}
