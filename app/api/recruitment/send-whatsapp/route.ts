import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/services/whatsapp/whatsapp.service";

type SendWhatsAppPayload = {
  telefone?: unknown;
  mensagem?: unknown;
  nome?: unknown;
  templateName?: unknown;
  dataApresentacao?: unknown;
  horarioApresentacao?: unknown;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SendWhatsAppPayload;
    const telefone = asText(payload.telefone);
    const mensagem = asText(payload.mensagem);
    const nome = asText(payload.nome) || "candidato";
    const templateName = asText(payload.templateName);
    const dataApresentacao = asText(payload.dataApresentacao);
    const horarioApresentacao = asText(payload.horarioApresentacao);

    if (!telefone || !mensagem) {
      return NextResponse.json({ success: false, error: "Telefone e mensagem sao obrigatorios" }, { status: 400 });
    }

    const result = await sendWhatsAppMessage({
      telefone,
      mensagem,
      nome,
      templateName: templateName || undefined,
      dataApresentacao: dataApresentacao || undefined,
      horarioApresentacao: horarioApresentacao || undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("WHATSAPP_SEND_ERROR", error);
    return NextResponse.json({ success: false, error: "Falha ao preparar envio de WhatsApp" }, { status: 500 });
  }
}
