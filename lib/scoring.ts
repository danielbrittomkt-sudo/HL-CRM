import type { Broker, BrokerAnalysis, Client, ClientAnalysis, LeadLevel } from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const ratio = (part: number, total: number) => (total <= 0 ? 0 : part / total);

export function analyzeBroker(broker: Broker): BrokerAnalysis {
  const responseRate = ratio(broker.leads_respondidos, broker.leads_recebidos) * 100;
  const visitRate = ratio(broker.visitas_realizadas, broker.visitas_agendadas) * 100;
  const proposalPower = Math.min(broker.propostas_enviadas * 4, 100);
  const productivity = Math.min((broker.pastas_subidas * 2.5 + broker.ligacoes_realizadas * 0.25), 100);
  const speed = clamp(100 - broker.tempo_medio_resposta * 3);
  const followup = Math.min(broker.followups * 1.4, 100);
  const consistency = broker.frequencia_operacional;
  const salesHistory = Math.min(broker.vendas_historicas * 8, 100);

  const ipc = clamp(
    productivity * 0.18 +
      consistency * 0.16 +
      visitRate * 0.14 +
      followup * 0.12 +
      speed * 0.15 +
      proposalPower * 0.13 +
      salesHistory * 0.12
  );

  const venda30 = clamp(ipc * 0.52 + proposalPower * 0.22 + visitRate * 0.18 + salesHistory * 0.08);
  const venda90 = clamp(venda30 + broker.pastas_subidas * 0.8 + broker.plantoes * 0.6);
  const riscoBaixaPerformance = clamp(100 - (ipc * 0.72 + responseRate * 0.18 + consistency * 0.1));
  const potencial = ipc >= 75 ? "Alto" : ipc >= 55 ? "Médio" : "Baixo";

  return {
    ipc,
    venda30,
    venda90,
    riscoBaixaPerformance,
    potencial,
    comparacaoHistorica:
      broker.pastas_subidas >= 20
        ? "Acima do padrão histórico para primeiros ciclos comerciais."
        : "Abaixo da curva ideal de volume operacional."
  };
}

export function analyzeClient(client: Client): ClientAnalysis {
  const affordability = clamp((client.renda_mensal / Math.max(client.valor_imovel_interesse * 0.01, 1)) * 34);
  const downPayment = clamp(((client.valor_entrada + client.fgts_disponivel) / client.valor_imovel_interesse) * 260);
  const credit = clamp((client.score_credito - 350) / 5);
  const ageFit = client.idade >= 28 && client.idade <= 40 ? 92 : client.idade >= 23 && client.idade <= 55 ? 72 : 52;
  const urgency = client.mora_de_aluguel ? 90 : client.mora_com_pais ? 68 : 58;
  const dependentsFit = clamp(100 - client.dependentes * 8);

  const ipc = clamp(
    affordability * 0.24 +
      downPayment * 0.21 +
      credit * 0.2 +
      ageFit * 0.11 +
      urgency * 0.12 +
      dependentsFit * 0.06 +
      (client.estado_civil === "Casado" ? 6 : 0)
  );

  const chanceAprovacao = clamp(credit * 0.42 + affordability * 0.3 + downPayment * 0.22 + dependentsFit * 0.06);
  const chanceCompra = clamp(ipc * 0.64 + urgency * 0.16 + chanceAprovacao * 0.2);
  const potencialConversao = clamp((chanceCompra + chanceAprovacao + ipc) / 3);
  const nivelLead: LeadLevel = ipc >= 74 ? "Lead quente" : ipc >= 55 ? "Lead morno" : "Lead frio";
  const perfilComprador = client.mora_de_aluguel
    ? "Alta dor de moradia e boa tração para visita"
    : client.fgts_disponivel + client.valor_entrada > client.valor_imovel_interesse * 0.12
      ? "Capital inicial relevante para negociação"
      : "Precisa de nutrição financeira";

  return {
    ipc,
    chanceCompra,
    chanceAprovacao,
    potencialConversao,
    perfilComprador,
    nivelLead,
    riscoReprovacao: clamp(100 - chanceAprovacao)
  };
}
