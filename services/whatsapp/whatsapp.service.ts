type WhatsAppTemplateName =
  | "h_crm_rh_2"
  | "h_crm_segunda_tentativa"
  | "h_crm_convite_apresentacao"
  | "h_crm_lembrete_apresentacao"
  | "h_crm_confirmacao_presenca"
  | "h_crm_pos_apresentacao"
  | "h_crm_sem_resposta";

type WhatsAppTemplateField = "nome" | "dataApresentacao" | "horarioApresentacao";

type WhatsAppTemplateConfig = {
  templateName: WhatsAppTemplateName;
  label: string;
  funnelStage: string;
  parameterCount: number;
  status: "ativo" | "em_analise";
  requiredFields: WhatsAppTemplateField[];
};

type SendWhatsAppMessageInput = {
  telefone: string;
  mensagem: string;
  nome?: string;
  templateName?: string;
  dataApresentacao?: string;
  horarioApresentacao?: string;
};

type SendWhatsAppMessageResult = {
  success: boolean;
  simulated: boolean;
  provider?: "whatsapp_cloud_api";
  messageId?: string;
  to?: string;
  error?: string;
  templateName?: WhatsAppTemplateName;
  templateLabel?: string;
};

type WhatsAppCloudApiResponse = {
  messages?: Array<{
    id?: string;
  }>;
  error?: {
    message?: string;
  };
};

type WhatsAppTemplatePayload = {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: "body";
    parameters: Array<{
      type: "text";
      text: string;
    }>;
  }>;
};

export const whatsappTemplates: Record<WhatsAppTemplateName, WhatsAppTemplateConfig> = {
  h_crm_rh_2: {
    templateName: "h_crm_rh_2",
    label: "Primeiro contato",
    funnelStage: "Novo candidato",
    parameterCount: 1,
    status: "ativo",
    requiredFields: ["nome"]
  },
  h_crm_segunda_tentativa: {
    templateName: "h_crm_segunda_tentativa",
    label: "Segunda tentativa",
    funnelStage: "Sem resposta",
    parameterCount: 1,
    status: "em_analise",
    requiredFields: ["nome"]
  },
  h_crm_convite_apresentacao: {
    templateName: "h_crm_convite_apresentacao",
    label: "Convite para apresentacao",
    funnelStage: "Confirmou interesse",
    parameterCount: 3,
    status: "em_analise",
    requiredFields: ["nome", "dataApresentacao", "horarioApresentacao"]
  },
  h_crm_lembrete_apresentacao: {
    templateName: "h_crm_lembrete_apresentacao",
    label: "Lembrete da apresentacao",
    funnelStage: "Apresentacao agendada",
    parameterCount: 2,
    status: "em_analise",
    requiredFields: ["nome", "horarioApresentacao"]
  },
  h_crm_confirmacao_presenca: {
    templateName: "h_crm_confirmacao_presenca",
    label: "Confirmacao de presenca",
    funnelStage: "Apresentacao agendada",
    parameterCount: 3,
    status: "em_analise",
    requiredFields: ["nome", "dataApresentacao", "horarioApresentacao"]
  },
  h_crm_pos_apresentacao: {
    templateName: "h_crm_pos_apresentacao",
    label: "Pos-apresentacao",
    funnelStage: "Compareceu",
    parameterCount: 1,
    status: "em_analise",
    requiredFields: ["nome"]
  },
  h_crm_sem_resposta: {
    templateName: "h_crm_sem_resposta",
    label: "Sem resposta",
    funnelStage: "Sem resposta",
    parameterCount: 1,
    status: "em_analise",
    requiredFields: ["nome"]
  }
};

function normalizeWhatsAppPhone(telefone: string) {
  const digits = telefone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function getAllowedTemplate(templateName: string) {
  return whatsappTemplates[templateName as WhatsAppTemplateName];
}

function buildTemplatePayload(
  template: WhatsAppTemplateConfig,
  templateLanguage: string,
  values: Record<WhatsAppTemplateField, string>
): WhatsAppTemplatePayload {
  return {
    name: template.templateName,
    language: {
      code: templateLanguage
    },
    components: [
      {
        type: "body",
        parameters: template.requiredFields.map((field) => ({
          type: "text",
          text: values[field]
        }))
      }
    ]
  };
}

export async function sendWhatsAppMessage({
  telefone,
  mensagem,
  nome,
  templateName,
  dataApresentacao,
  horarioApresentacao
}: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
  const dryRun = process.env.WHATSAPP_DRY_RUN !== "false";
  const normalizedPhone = normalizeWhatsAppPhone(telefone);
  const selectedTemplateName = templateName || process.env.WHATSAPP_TEMPLATE_NAME || "h_crm_rh_2";
  const template = getAllowedTemplate(selectedTemplateName);
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR";
  const templateValues: Record<WhatsAppTemplateField, string> = {
    nome: nome?.trim() || "candidato",
    dataApresentacao: dataApresentacao?.trim() || "data da apresentacao",
    horarioApresentacao: horarioApresentacao?.trim() || "14:00"
  };

  if (!template) {
    return {
      success: false,
      simulated: dryRun,
      provider: "whatsapp_cloud_api",
      error: "Modelo de WhatsApp nao permitido."
    };
  }

  if (template.status === "em_analise") {
    return {
      success: false,
      simulated: dryRun,
      provider: "whatsapp_cloud_api",
      templateName: template.templateName,
      templateLabel: template.label,
      error: "Este modelo ainda nao esta ativo na Meta."
    };
  }

  if (dryRun) {
    console.log("WHATSAPP_DRY_RUN_OK", { to: normalizedPhone, messageLength: mensagem.length, templateName: template.templateName });
    return {
      success: true,
      simulated: true,
      templateName: template.templateName,
      templateLabel: template.label
    };
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION;

  if (!accessToken || !phoneNumberId || !apiVersion) {
    console.error("WHATSAPP_SEND_ERROR", {
      reason: "missing_config",
      hasAccessToken: Boolean(accessToken),
      hasPhoneNumberId: Boolean(phoneNumberId),
      hasApiVersion: Boolean(apiVersion)
    });
    return {
      success: false,
      simulated: false,
      provider: "whatsapp_cloud_api",
      templateName: template.templateName,
      templateLabel: template.label,
      error: "Configuracao do WhatsApp incompleta"
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "template",
        template: buildTemplatePayload(template, templateLanguage, templateValues)
      })
    });

    const body = (await response.json()) as WhatsAppCloudApiResponse;

    if (!response.ok) {
      const errorMessage = body.error?.message || `Erro HTTP ${response.status}`;
      console.error("WHATSAPP_SEND_ERROR", { status: response.status, error: errorMessage, to: normalizedPhone, templateName: template.templateName });
      return {
        success: false,
        simulated: false,
        provider: "whatsapp_cloud_api",
        templateName: template.templateName,
        templateLabel: template.label,
        error: errorMessage
      };
    }

    const messageId = body.messages?.[0]?.id;
    console.log("WHATSAPP_SEND_OK", { to: normalizedPhone, hasMessageId: Boolean(messageId), templateName: template.templateName });
    return {
      success: true,
      simulated: false,
      provider: "whatsapp_cloud_api",
      messageId,
      to: normalizedPhone,
      templateName: template.templateName,
      templateLabel: template.label
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao enviar WhatsApp";
    console.error("WHATSAPP_SEND_ERROR", { error: errorMessage, to: normalizedPhone, templateName: template.templateName });
    return {
      success: false,
      simulated: false,
      provider: "whatsapp_cloud_api",
      templateName: template.templateName,
      templateLabel: template.label,
      error: errorMessage
    };
  }
}
