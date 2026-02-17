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
    valor: e.valor
