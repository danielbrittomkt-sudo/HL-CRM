import { NextRequest, NextResponse } from "next/server";
import { normalizePhone } from "@/lib/recruitment-mappers";
import { candidateExistsByPhone, saveCandidates } from "@/services/recruitment/candidates.service";
import type { RecruitmentCandidate } from "@/lib/recruitment-types";

type SheetImportPayload = {
  nome?: unknown;
  telefone?: unknown;
  email?: unknown;
  fonte?: unknown;
  observacao?: unknown;
};

const requiredFieldsError = "Nome, telefone e fonte são obrigatórios";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const importSecret = process.env.SHEET_IMPORT_SECRET;
  const requestSecret = request.headers.get("x-import-secret");

  if (!importSecret || requestSecret !== importSecret) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as SheetImportPayload;
    const nome = asText(payload.nome);
    const telefone = normalizePhone(asText(payload.telefone));
    const email = asText(payload.email);
    const fonte = asText(payload.fonte);

    if (!nome || !telefone || !fonte) {
      return NextResponse.json({ success: false, error: requiredFieldsError }, { status: 400 });
    }

    const duplicated = await candidateExistsByPhone(telefone);
    if (duplicated) {
      console.log("SHEET_IMPORT_DUPLICATED", { telefone });
      return NextResponse.json({ success: true, duplicated: true });
    }

    const candidate: RecruitmentCandidate = {
      nome,
      telefone,
      email,
      cidade: "",
      cargo: "",
      fonte,
      status: "Valido"
    };

    await saveCandidates([candidate]);
    console.log("SHEET_IMPORT_OK", { telefone });
    return NextResponse.json({ success: true, duplicated: false });
  } catch (error) {
    console.error("SHEET_IMPORT_ERROR", error);
    return NextResponse.json({ success: false, error: "Falha ao importar candidato" }, { status: 500 });
  }
}
