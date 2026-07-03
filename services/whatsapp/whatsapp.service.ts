type SendWhatsAppMessageInput = {
  telefone: string;
  mensagem: string;
};

type SendWhatsAppMessageResult = {
  success: boolean;
  simulated: boolean;
};

export async function sendWhatsAppMessage({ telefone, mensagem }: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
  const dryRun = process.env.WHATSAPP_DRY_RUN !== "false";

  if (dryRun) {
    console.log("WHATSAPP_DRY_RUN_OK", { telefone, messageLength: mensagem.length });
    return {
      success: true,
      simulated: true
    };
  }

  console.log("WHATSAPP_DRY_RUN_OK", { telefone, messageLength: mensagem.length });
  return {
    success: true,
    simulated: true
  };
}
