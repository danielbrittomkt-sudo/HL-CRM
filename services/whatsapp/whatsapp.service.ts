type SendWhatsAppMessageInput = {
  telefone: string;
  mensagem: string;
};

type SendWhatsAppMessageResult = {
  success: boolean;
  simulated: boolean;
  provider?: "whatsapp_cloud_api";
  messageId?: string;
  to?: string;
  error?: string;
};

type WhatsAppCloudApiResponse = {
  messages?: Array<{
    id?: string;
  }>;
  error?: {
    message?: string;
  };
};

function normalizeWhatsAppPhone(telefone: string) {
  const digits = telefone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export async function sendWhatsAppMessage({ telefone, mensagem }: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
  const dryRun = process.env.WHATSAPP_DRY_RUN !== "false";
  const normalizedPhone = normalizeWhatsAppPhone(telefone);

  if (dryRun) {
    console.log("WHATSAPP_DRY_RUN_OK", { to: normalizedPhone, messageLength: mensagem.length });
    return {
      success: true,
      simulated: true
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
      error: "Configuração do WhatsApp incompleta"
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
        type: "text",
        text: {
          body: mensagem
        }
      })
    });

    const body = (await response.json()) as WhatsAppCloudApiResponse;

    if (!response.ok) {
      const errorMessage = body.error?.message || `Erro HTTP ${response.status}`;
      console.error("WHATSAPP_SEND_ERROR", { status: response.status, error: errorMessage, to: normalizedPhone });
      return {
        success: false,
        simulated: false,
        provider: "whatsapp_cloud_api",
        error: errorMessage
      };
    }

    const messageId = body.messages?.[0]?.id;
    console.log("WHATSAPP_SEND_OK", { to: normalizedPhone, hasMessageId: Boolean(messageId) });
    return {
      success: true,
      simulated: false,
      provider: "whatsapp_cloud_api",
      messageId,
      to: normalizedPhone
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao enviar WhatsApp";
    console.error("WHATSAPP_SEND_ERROR", { error: errorMessage, to: normalizedPhone });
    return {
      success: false,
      simulated: false,
      provider: "whatsapp_cloud_api",
      error: errorMessage
    };
  }
}
