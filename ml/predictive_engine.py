from dataclasses import dataclass
from typing import Literal


def clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return round(max(minimum, min(maximum, value)))


@dataclass
class ClientFeatures:
    idade: int
    estado_civil: str
    renda_mensal: float
    mora_de_aluguel: bool
    mora_com_pais: bool
    fgts_disponivel: float
    valor_entrada: float
    dependentes: int
    score_credito: int
    valor_imovel_interesse: float


@dataclass
class BrokerFeatures:
    pastas_subidas: int
    leads_recebidos: int
    leads_respondidos: int
    tempo_medio_resposta: float
    followups: int
    visitas_agendadas: int
    visitas_realizadas: int
    propostas_enviadas: int
    ligacoes_realizadas: int
    plantoes: int
    frequencia_operacional: float
    vendas_historicas: int


def client_ipc(features: ClientFeatures) -> dict[str, int | str]:
    affordability = clamp((features.renda_mensal / max(features.valor_imovel_interesse * 0.01, 1)) * 34)
    down_payment = clamp(((features.valor_entrada + features.fgts_disponivel) / features.valor_imovel_interesse) * 260)
    credit = clamp((features.score_credito - 350) / 5)
    age_fit = 92 if 28 <= features.idade <= 40 else 72 if 23 <= features.idade <= 55 else 52
    urgency = 90 if features.mora_de_aluguel else 68 if features.mora_com_pais else 58
    dependents_fit = clamp(100 - features.dependentes * 8)

    ipc = clamp(
        affordability * 0.24
        + down_payment * 0.21
        + credit * 0.20
        + age_fit * 0.11
        + urgency * 0.12
        + dependents_fit * 0.06
        + (6 if features.estado_civil == "Casado" else 0)
    )
    approval = clamp(credit * 0.42 + affordability * 0.30 + down_payment * 0.22 + dependents_fit * 0.06)
    purchase = clamp(ipc * 0.64 + urgency * 0.16 + approval * 0.20)
    level: Literal["Lead quente", "Lead morno", "Lead frio"] = "Lead quente" if ipc >= 74 else "Lead morno" if ipc >= 55 else "Lead frio"

    return {
        "ipc_cliente": ipc,
        "chance_compra": purchase,
        "chance_aprovacao_bancaria": approval,
        "potencial_conversao": clamp((ipc + purchase + approval) / 3),
        "risco_reprovacao": clamp(100 - approval),
        "nivel_lead": level,
    }


def broker_ipc(features: BrokerFeatures) -> dict[str, int | str]:
    response_rate = 0 if features.leads_recebidos <= 0 else features.leads_respondidos / features.leads_recebidos * 100
    visit_rate = 0 if features.visitas_agendadas <= 0 else features.visitas_realizadas / features.visitas_agendadas * 100
    proposal_power = min(features.propostas_enviadas * 4, 100)
    productivity = min(features.pastas_subidas * 2.5 + features.ligacoes_realizadas * 0.25, 100)
    speed = clamp(100 - features.tempo_medio_resposta * 3)
    followup = min(features.followups * 1.4, 100)
    sales_history = min(features.vendas_historicas * 8, 100)

    ipc = clamp(
        productivity * 0.18
        + features.frequencia_operacional * 0.16
        + visit_rate * 0.14
        + followup * 0.12
        + speed * 0.15
        + proposal_power * 0.13
        + sales_history * 0.12
    )
    sale_30 = clamp(ipc * 0.52 + proposal_power * 0.22 + visit_rate * 0.18 + sales_history * 0.08)
    sale_90 = clamp(sale_30 + features.pastas_subidas * 0.8 + features.plantoes * 0.6)
    risk = clamp(100 - (ipc * 0.72 + response_rate * 0.18 + features.frequencia_operacional * 0.10))

    return {
        "ipc_corretor": ipc,
        "probabilidade_venda_30": sale_30,
        "probabilidade_venda_90": sale_90,
        "risco_baixa_performance": risk,
        "potencial_comercial": "Alto" if ipc >= 75 else "Médio" if ipc >= 55 else "Baixo",
    }


if __name__ == "__main__":
    sample = ClientFeatures(
        idade=34,
        estado_civil="Casado",
        renda_mensal=11800,
        mora_de_aluguel=True,
        mora_com_pais=False,
        fgts_disponivel=62000,
        valor_entrada=85000,
        dependentes=1,
        score_credito=782,
        valor_imovel_interesse=690000,
    )
    print(client_ipc(sample))
