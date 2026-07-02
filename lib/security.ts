export function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "(**) *****-****";
  return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`;
}

export function lgpdNotice() {
  return {
    cpf: "CPF mascarado no frontend; valor completo restrito ao backend com criptografia em repouso.",
    roles: ["ADMIN", "GESTOR", "CORRETOR", "CLIENTE"],
    controls: ["RLS Supabase", "auditoria de acesso", "hash para busca", "criptografia pgcrypto"]
  };
}
