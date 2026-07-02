import { NextResponse } from "next/server";
import { brokers, clients, folders } from "@/lib/data";

export async function GET() {
  const data = folders.map((folder) => ({
    ...folder,
    corretor: brokers.find((broker) => broker.id === folder.corretor_id)?.nome,
    cliente: clients.find((client) => client.id === folder.cliente_id)?.nome_cliente
  }));

  return NextResponse.json({ data });
}
