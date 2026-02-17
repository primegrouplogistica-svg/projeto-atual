/**
 * Mapeamento entre nomes do banco (snake_case) e do app (camelCase).
 * O Supabase usa snake_case; o TypeScript usa camelCase.
 */

export function mapUserFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    senha: row.senha,
    perfil: row.perfil,
    ativo: row.ativo ?? true,
    permissoes: row.permissoes ?? []
  };
}

export function mapUserToDb(u: any) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    senha: u.senha ?? null,
    perfil: u.perfil,
    ativo: u.ativo ?? true,
    permissoes: u.permissoes ?? []
  };
}

export function mapVehicleFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    placa: row.placa,
    modelo: row.modelo,
    kmAtual: row.km_atual ?? 0,
    status: row.status,
    preventiveTasks: row.preventive_tasks ?? [],
    proximaManutencaoKm: row.proxima_manutencao_km,
    ultimaRevisaoData: row.ultima_revisao_data,
    trackerId: row.tracker_id,
    lastLat: row.last_lat,
    lastLng: row.last_lng,
    isOnline: row.is_online ?? false
  };
}

export function mapVehicleToDb(v: any) {
  return {
    id: v.id,
    placa: v.placa,
    modelo: v.modelo,
    km_atual: v.kmAtual ?? 0,
    status: v.status,
    preventive_tasks: v.preventiveTasks ?? [],
    proxima_manutencao_km: v.proximaManutencaoKm ?? null,
    ultima_revisao_data: v.ultimaRevisaoData ?? null,
    tracker_id: v.trackerId ?? null,
    last_lat: v.lastLat ?? null,
    last_lng: v.lastLng ?? null,
    is_online: v.isOnline ?? false
  };
}

export function mapCustomerFromDb(row: any) {
  if (!row) return null;
  return { id: row.id, nome: row.nome, cnpj: row.cnpj, ativo: row.ativo ?? true };
}
export function mapCustomerToDb(c: any) {
  return { id: c.id, nome: c.nome, cnpj: c.cnpj ?? null, ativo: c.ativo ?? true };
}

export function mapAgregadoFromDb(row: any) {
  if (!row) return null;
  return { id: row.id, nome: row.nome, placa: row.placa, ativo: row.ativo ?? true };
}
export function mapAgregadoToDb(a: any) {
  return { id: a.id, nome: a.nome, placa: a.placa, ativo: a.ativo ?? true };
}

export function mapFixedExpenseFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    categoria: row.categoria,
    descricao: row.descricao,
    valor: Number(row.valor),
    dataCompetencia: row.data_competencia,
    diaVencimento: row.dia_vencimento != null ? Number(row.dia_vencimento) : undefined,
    createdAt: row.created_at
  };
}
export function mapFixedExpenseToDb(e: any) {
  return {
    id: e.id,
    categoria: e.categoria,
    descricao: e.descricao,
    valor: e.valor,
    data_competencia: e.dataCompetencia,
    dia_vencimento: e.diaVencimento != null ? e.diaVencimento : null,
    created_at: e.createdAt
  };
}

export function mapFuelingFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    placa: row.placa,
    motoristaId: row.motorista_id,
    kmNoMomento: row.km_no_momento,
    valor: Number(row.valor),
    fotoNota: row.foto_nota,
    status: row.status,
    motivoRejeicao: row.motivo_rejeicao,
    adminAprovadorId: row.admin_aprovador_id,
    createdAt: row.created_at,
    approvedAt: row.approved_at
  };
}
export function mapFuelingToDb(f: any) {
  return {
    id: f.id,
    vehicle_id: f.vehicleId,
    placa: f.placa,
    motorista_id: f.motoristaId,
    km_no_momento: f.kmNoMomento,
    valor: f.valor,
    foto_nota: f.fotoNota,
    status: f.status,
    motivo_rejeicao: f.motivoRejeicao ?? null,
    admin_aprovador_id: f.adminAprovadorId ?? null,
    created_at: f.createdAt,
    approved_at: f.approvedAt ?? null
  };
}

export function mapMaintenanceFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    placa: row.placa,
    motoristaId: row.motorista_id,
    tipo: row.tipo,
    descricao: row.descricao,
    kmNoMomento: row.km_no_momento,
    foto: row.foto,
    status: row.status,
    adminResponsavelId: row.admin_responsavel_id,
    assumedAt: row.assumed_at,
    startedAt: row.started_at,
    doneAt: row.done_at,
    oficina: row.oficina,
    valor: row.valor != null ? Number(row.valor) : undefined,
    notaFoto: row.nota_foto,
    observacaoAdmin: row.observacao_admin,
    createdAt: row.created_at
  };
}
export function mapMaintenanceToDb(m: any) {
  return {
    id: m.id,
    vehicle_id: m.vehicleId,
    placa: m.placa,
    motorista_id: m.motoristaId,
    tipo: m.tipo,
    descricao: m.descricao,
    km_no_momento: m.kmNoMomento,
    foto: m.foto,
    status: m.status,
    admin_responsavel_id: m.adminResponsavelId ?? null,
    assumed_at: m.assumedAt ?? null,
    started_at: m.startedAt ?? null,
    done_at: m.doneAt ?? null,
    oficina: m.oficina ?? null,
    valor: m.valor ?? null,
    nota_foto: m.notaFoto ?? null,
    observacao_admin: m.observacaoAdmin ?? null,
    created_at: m.createdAt
  };
}

export function mapDailyRouteFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    motoristaId: row.motorista_id,
    ajudanteId: row.ajudante_id,
    ajudanteNome: row.ajudante_nome,
    vehicleId: row.vehicle_id,
    placa: row.placa,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    destino: row.destino,
    oc: row.oc,
    valorFrete: row.valor_frete != null ? Number(row.valor_frete) : undefined,
    valorMotorista: row.valor_motorista != null ? Number(row.valor_motorista) : undefined,
    valorAjudante: row.valor_ajudante != null ? Number(row.valor_ajudante) : undefined,
    statusFinanceiro: row.status_financeiro,
    adminFinanceiroId: row.admin_financeiro_id,
    createdAt: row.created_at,
    fotoFrente: row.foto_frente,
    fotoLateralEsquerda: row.foto_lateral_esquerda,
    fotoLateralDireita: row.foto_lateral_direita,
    fotoTraseira: row.foto_traseira,
    nivelOleo: row.nivel_oleo,
    nivelAgua: row.nivel_agua,
    avariaNova: row.avaria_nova === true,
    avariaDescricao: row.avaria_descricao ?? undefined,
    avariaFoto: row.avaria_foto ?? undefined
  };
}
export function mapDailyRouteToDb(r: any) {
  return {
    id: r.id,
    motorista_id: r.motoristaId,
    ajudante_id: r.ajudanteId ?? null,
    ajudante_nome: r.ajudanteNome ?? null,
    vehicle_id: r.vehicleId,
    placa: r.placa,
    cliente_id: r.clienteId,
    cliente_nome: r.clienteNome ?? null,
    destino: r.destino,
    oc: r.oc,
    valor_frete: r.valorFrete ?? 0,
    valor_motorista: r.valorMotorista ?? 0,
    valor_ajudante: r.valorAjudante ?? 0,
    status_financeiro: r.statusFinanceiro ?? null,
    admin_financeiro_id: r.adminFinanceiroId ?? null,
    created_at: r.createdAt,
    foto_frente: r.fotoFrente ?? null,
    foto_lateral_esquerda: r.fotoLateralEsquerda ?? null,
    foto_lateral_direita: r.fotoLateralDireita ?? null,
    foto_traseira: r.fotoTraseira ?? null,
    nivel_oleo: r.nivelOleo ?? null,
    nivel_agua: r.nivelAgua ?? null,
    avaria_nova: r.avariaNova === true ? true : null,
    avaria_descricao: r.avariaDescricao ?? null,
    avaria_foto: r.avariaFoto ?? null
  };
}

export function mapRouteDepartureFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    placa: row.placa,
    motoristaId: row.motorista_id,
    ajudanteId: row.ajudante_id,
    ajudanteNome: row.ajudante_nome,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    destino: row.destino,
    oc: row.oc,
    valorFrete: row.valor_frete != null ? Number(row.valor_frete) : undefined,
    valorMotorista: row.valor_motorista != null ? Number(row.valor_motorista) : undefined,
    valorAjudante: row.valor_ajudante != null ? Number(row.valor_ajudante) : undefined,
    statusFinanceiro: row.status_financeiro,
    adminFinanceiroId: row.admin_financeiro_id,
    observacao: row.observacao,
    status: row.status,
    createdAt: row.created_at,
    finishedAt: row.finished_at
  };
}
export function mapRouteDepartureToDb(r: any) {
  return {
    id: r.id,
    vehicle_id: r.vehicleId,
    placa: r.placa,
    motorista_id: r.motoristaId,
    ajudante_id: r.ajudanteId,
    ajudante_nome: r.ajudanteNome ?? null,
    cliente_id: r.clienteId,
    cliente_nome: r.clienteNome ?? null,
    destino: r.destino,
    oc: r.oc,
    valor_frete: r.valorFrete ?? 0,
    valor_motorista: r.valorMotorista ?? 0,
    valor_ajudante: r.valorAjudante ?? 0,
    status_financeiro: r.statusFinanceiro ?? null,
    admin_financeiro_id: r.adminFinanceiroId ?? null,
    observacao: r.observacao ?? null,
    status: r.status,
    created_at: r.createdAt,
    finished_at: r.finishedAt ?? null
  };
}

export function mapAgregadoFreightFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    agregadoId: row.agregado_id,
    nomeAgregado: row.nome_agregado,
    placa: row.placa,
    valorFrete: Number(row.valor_frete),
    valorAgregado: Number(row.valor_agregado),
    oc: row.oc,
    data: row.data,
    createdAt: row.created_at
  };
}
export function mapAgregadoFreightToDb(f: any) {
  return {
    id: f.id,
    agregado_id: f.agregadoId,
    nome_agregado: f.nomeAgregado,
    placa: f.placa,
    valor_frete: f.valorFrete,
    valor_agregado: f.valorAgregado,
    oc: f.oc,
    data: f.data,
    created_at: f.createdAt
  };
}

export function mapTollFromDb(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    placa: row.placa,
    valor: Number(row.valor),
    data: row.data,
    createdAt: row.created_at
  };
}
export function mapTollToDb(t: any) {
  return {
    id: t.id,
    vehicle_id: t.vehicleId,
    placa: t.placa,
    valor: t.valor,
    data: t.data,
    created_at: t.createdAt
  };
}
