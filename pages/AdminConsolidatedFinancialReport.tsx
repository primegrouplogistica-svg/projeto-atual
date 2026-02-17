import React, { useState, useMemo } from 'react';
import { DailyRoute, RouteDeparture, Fueling, MaintenanceRequest, Toll, AgregadoFreight, FixedExpense, FuelingStatus, MaintenanceStatus, FinanceiroStatus, User, UserRole } from '../types';
import { Card } from '../components/UI';

type TipoFiltro = 'todos' | 'entradas' | 'saidas';
type PapelEquipeFiltro = 'todos' | 'motorista' | 'ajudante';

interface Movimento {
  id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  motoristaId?: string;
  ajudanteId?: string;
  motoristaNome?: string;
  ajudanteNome?: string;
  placa?: string;
  /** Cliente/empresa (entradas): clienteNome em viagem/diário, nomeAgregado em agregado */
  empresa?: string;
  /** Só preenchido nas saídas de equipe: indica se o valor é pago ao motorista ou ao ajudante */
  papelEquipe?: 'motorista' | 'ajudante';
}

interface AdminConsolidatedFinancialReportProps {
  dailyRoutes: DailyRoute[];
  routes: RouteDeparture[];
  fuelings: Fueling[];
  maintenances: MaintenanceRequest[];
  tolls: Toll[];
  agregadoFreights: AgregadoFreight[];
  fixedExpenses: FixedExpense[];
  users: User[];
  onBack: () => void;
  onDeleteMovement?: (movimento: Movimento) => void;
}

const AdminConsolidatedFinancialReport: React.FC<AdminConsolidatedFinancialReportProps> = ({
  dailyRoutes, routes, fuelings, maintenances, tolls, agregadoFreights, fixedExpenses, users, onBack, onDeleteMovement
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('todos');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroMotoristaId, setFiltroMotoristaId] = useState<string>('');
  const [filtroAjudanteId, setFiltroAjudanteId] = useState<string>('');
  const [filtroPapelEquipe, setFiltroPapelEquipe] = useState<PapelEquipeFiltro>('todos');
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [exportFeedback, setExportFeedback] = useState<'planilha' | 'whatsapp' | null>(null);
  const [copiadoPessoa, setCopiadoPessoa] = useState<string | null>(null);
  const [copiadoCategoria, setCopiadoCategoria] = useState<string | null>(null);
  const [copiadoReceita, setCopiadoReceita] = useState<string | null>(null);

  const safeNum = (v: any) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const { summary, movimentos } = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filterDate = (d: string) => {
      if (!start || !end) return true;
      const date = new Date(d);
      return date >= start && date <= end;
    };

    const list: Movimento[] = [];

    // ——— ENTRADAS ———
    routes
      .filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO && filterDate(r.createdAt))
      .forEach(r => {
        const v = safeNum(r.valorFrete);
        if (v > 0) {
          const motoristaNome = users.find(u => u.id === r.motoristaId)?.nome ?? '';
          const ajudanteNome = r.ajudanteNome ?? users.find(u => u.id === r.ajudanteId)?.nome ?? '';
          list.push({ id: `route-${r.id}`, data: r.createdAt, tipo: 'entrada', categoria: 'Frete viagem', descricao: `${r.destino || 'Viagem'} — OC ${r.oc} — ${r.placa}`, valor: v, motoristaId: r.motoristaId, ajudanteId: r.ajudanteId, motoristaNome: motoristaNome || undefined, ajudanteNome: ajudanteNome || undefined, placa: r.placa, empresa: r.clienteNome || undefined });
        }
      });
    dailyRoutes
      .filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO && filterDate(r.createdAt))
      .forEach(r => {
        const v = safeNum(r.valorFrete);
        if (v > 0) {
          const motoristaNome = users.find(u => u.id === r.motoristaId)?.nome ?? '';
          const ajudanteNome = r.ajudanteNome ?? users.find(u => u.id === r.ajudanteId)?.nome ?? '';
          list.push({ id: `daily-${r.id}`, data: r.createdAt, tipo: 'entrada', categoria: 'Frete diário', descricao: `${r.destino || 'Diário'} — OC ${r.oc} — ${r.placa}`, valor: v, motoristaId: r.motoristaId, ajudanteId: r.ajudanteId, motoristaNome: motoristaNome || undefined, ajudanteNome: ajudanteNome || undefined, placa: r.placa, empresa: r.clienteNome || undefined });
        }
      });
    agregadoFreights
      .filter(r => filterDate(r.data))
      .forEach(r => {
        const v = safeNum(r.valorFrete);
        if (v > 0) list.push({ id: `agr-${r.id}`, data: r.data, tipo: 'entrada', categoria: 'Frete agregado', descricao: `${r.nomeAgregado} — OC ${r.oc} — ${r.placa}`, valor: v, placa: r.placa, empresa: r.nomeAgregado || 'Agregado' });
      });

    // ——— SAÍDAS ———
    fuelings
      .filter(f => f.status === FuelingStatus.APROVADO && filterDate(f.createdAt))
      .forEach(f => {
        const motoristaNome = users.find(u => u.id === f.motoristaId)?.nome ?? '';
        list.push({ id: `fuel-${f.id}`, data: f.createdAt, tipo: 'saida', categoria: 'Combustível', descricao: `${f.placa} — ${f.kmNoMomento} km`, valor: safeNum(f.valor), motoristaId: f.motoristaId, motoristaNome: motoristaNome || undefined, placa: f.placa });
      });
    maintenances
      .filter(m => m.status === MaintenanceStatus.FEITA && filterDate(m.createdAt))
      .forEach(m => {
        const motoristaNome = users.find(u => u.id === m.motoristaId)?.nome ?? '';
        list.push({ id: `maint-${m.id}`, data: m.createdAt, tipo: 'saida', categoria: 'Manutenção', descricao: `${m.placa} — ${m.descricao}`, valor: safeNum(m.valor), motoristaId: m.motoristaId, motoristaNome: motoristaNome || undefined, placa: m.placa });
      });
    tolls
      .filter(t => filterDate(t.data))
      .forEach(t => list.push({ id: `toll-${t.id}`, data: t.data, tipo: 'saida', categoria: 'Pedágio', descricao: t.placa, valor: safeNum(t.valor), placa: t.placa }));

    routes
      .filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO && filterDate(r.createdAt))
      .forEach(r => {
        const vm = safeNum(r.valorMotorista), va = safeNum(r.valorAjudante);
        const motoristaNome = users.find(u => u.id === r.motoristaId)?.nome ?? '';
        const ajudanteNome = r.ajudanteNome ?? users.find(u => u.id === r.ajudanteId)?.nome ?? '';
        const descBase = `${r.destino} OC ${r.oc}`;
        if (vm > 0) list.push({ id: `route-motorista-${r.id}`, data: r.createdAt, tipo: 'saida', categoria: 'Equipe (Motorista)', descricao: `Motorista — ${descBase}`, valor: vm, motoristaId: r.motoristaId, motoristaNome: motoristaNome || undefined, papelEquipe: 'motorista', placa: r.placa });
        if (va > 0) list.push({ id: `route-ajudante-${r.id}`, data: r.createdAt, tipo: 'saida', categoria: 'Equipe (Ajudante)', descricao: `Ajudante — ${descBase}`, valor: va, ajudanteId: r.ajudanteId, ajudanteNome: ajudanteNome || undefined, papelEquipe: 'ajudante', placa: r.placa });
      });
    dailyRoutes
      .filter(r => r.statusFinanceiro === FinanceiroStatus.APROVADO && filterDate(r.createdAt))
      .forEach(r => {
        const vm = safeNum(r.valorMotorista), va = safeNum(r.valorAjudante);
        const motoristaNome = users.find(u => u.id === r.motoristaId)?.nome ?? '';
        const ajudanteNome = r.ajudanteNome ?? users.find(u => u.id === r.ajudanteId)?.nome ?? '';
        const descBase = `${r.destino} OC ${r.oc}`;
        if (vm > 0) list.push({ id: `daily-motorista-${r.id}`, data: r.createdAt, tipo: 'saida', categoria: 'Equipe (Motorista)', descricao: `Motorista — ${descBase}`, valor: vm, motoristaId: r.motoristaId, motoristaNome: motoristaNome || undefined, papelEquipe: 'motorista', placa: r.placa });
        if (va > 0) list.push({ id: `daily-ajudante-${r.id}`, data: r.createdAt, tipo: 'saida', categoria: 'Equipe (Ajudante)', descricao: `Ajudante — ${descBase}`, valor: va, ajudanteId: r.ajudanteId, ajudanteNome: ajudanteNome || undefined, papelEquipe: 'ajudante', placa: r.placa });
      });
    agregadoFreights
      .filter(r => filterDate(r.data))
      .forEach(r => {
        const v = safeNum(r.valorAgregado);
        if (v > 0) list.push({ id: `agr-p-${r.id}`, data: r.data, tipo: 'saida', categoria: 'Agregados', descricao: `${r.nomeAgregado} — OC ${r.oc}`, valor: v, placa: r.placa });
      });
    fixedExpenses
      .filter(e => filterDate((e.dataCompetencia || e.createdAt.slice(0, 7)) + '-01'))
      .forEach(e => list.push({ id: `fix-${e.id}`, data: (e.dataCompetencia || e.createdAt.slice(0, 7)) + '-01', tipo: 'saida', categoria: 'Despesa fixa', descricao: `${e.categoria}: ${e.descricao}`, valor: safeNum(e.valor) }));

    const totalRevenue = list.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
    const totalExpense = list.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);

    list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return {
      summary: { totalRevenue, totalExpense },
      movimentos: list,
    };
  }, [dailyRoutes, routes, fuelings, maintenances, tolls, agregadoFreights, fixedExpenses, users, startDate, endDate]);

  const motoristaOptions = useMemo(() => {
    return users.filter(u => u.perfil === UserRole.MOTORISTA).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [users]);

  const ajudanteOptions = useMemo(() => {
    return users.filter(u => u.perfil === UserRole.AJUDANTE).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [users]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set(movimentos.map(m => m.categoria));
    return Array.from(set).sort();
  }, [movimentos]);

  const placasDisponiveis = useMemo(() => {
    const set = new Set(movimentos.map(m => m.placa).filter((p): p is string => !!p?.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [movimentos]);

  const movimentosFiltrados = useMemo(() => {
    let list = movimentos;
    if (filtroTipo === 'entradas') list = list.filter(m => m.tipo === 'entrada');
    else if (filtroTipo === 'saidas') list = list.filter(m => m.tipo === 'saida');
    if (filtroMotoristaId) list = list.filter(m => m.motoristaId === filtroMotoristaId);
    if (filtroAjudanteId) list = list.filter(m => m.ajudanteId === filtroAjudanteId);
    if (filtroPapelEquipe === 'motorista') list = list.filter(m => m.papelEquipe !== 'ajudante');
    else if (filtroPapelEquipe === 'ajudante') list = list.filter(m => m.papelEquipe !== 'motorista');
    if (filtroPlaca) list = list.filter(m => m.placa === filtroPlaca);
    if (filtroCategoria) list = list.filter(m => m.categoria === filtroCategoria);
    if (buscaTexto.trim()) {
      const q = buscaTexto.trim().toLowerCase();
      list = list.filter(m =>
        m.categoria.toLowerCase().includes(q) ||
        m.descricao.toLowerCase().includes(q) ||
        (m.motoristaNome?.toLowerCase().includes(q) ?? false) ||
        (m.ajudanteNome?.toLowerCase().includes(q) ?? false) ||
        (m.placa?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [movimentos, filtroTipo, filtroMotoristaId, filtroAjudanteId, filtroPapelEquipe, filtroPlaca, filtroCategoria, buscaTexto]);

  const lucroAgregados = useMemo(() => {
    const receitaAgreg = movimentos.filter(m => m.tipo === 'entrada' && m.categoria === 'Frete agregado').reduce((s, m) => s + m.valor, 0);
    const custoAgreg = movimentos.filter(m => m.tipo === 'saida' && m.categoria === 'Agregados').reduce((s, m) => s + m.valor, 0);
    return {
      receita: Math.round(receitaAgreg * 100) / 100,
      custo: Math.round(custoAgreg * 100) / 100,
      lucro: Math.round((receitaAgreg - custoAgreg) * 100) / 100,
    };
  }, [movimentos]);

  const resumoReceitas = useMemo(() => {
    const entradas = movimentos.filter(m => m.tipo === 'entrada');
    const entradasSemAgregado = entradas.filter(m => m.categoria !== 'Frete agregado');
    const porEmpresa = new Map<string, number>();
    const porPlaca = new Map<string, number>();
    entradasSemAgregado.forEach(m => {
      const emp = m.empresa?.trim() || '(Sem empresa)';
      porEmpresa.set(emp, (porEmpresa.get(emp) ?? 0) + m.valor);
      const pla = m.placa?.trim() || '(Sem placa)';
      porPlaca.set(pla, (porPlaca.get(pla) ?? 0) + m.valor);
    });
    const listaEmpresas = Array.from(porEmpresa.entries())
      .map(([empresa, valor]) => ({ empresa, valor: Math.round(valor * 100) / 100 }))
      .sort((a, b) => b.valor - a.valor);
    const listaPlacas = Array.from(porPlaca.entries())
      .map(([placa, valor]) => ({ placa, valor: Math.round(valor * 100) / 100 }))
      .sort((a, b) => b.valor - a.valor);
    const total = entradas.reduce((s, m) => s + m.valor, 0);
    return { listaEmpresas, listaPlacas, total: Math.round(total * 100) / 100 };
  }, [movimentos]);

  const resumoDespesas = useMemo(() => {
    const saidas = movimentos.filter(m => m.tipo === 'saida');
    const byCat = new Map<string, number>();
    saidas.forEach(m => {
      const key = m.categoria;
      byCat.set(key, (byCat.get(key) ?? 0) + m.valor);
    });
    const equipeTotal = (byCat.get('Equipe (Motorista)') ?? 0) + (byCat.get('Equipe (Ajudante)') ?? 0);
    const ordem: { label: string; key: string }[] = [
      { label: 'Pedágio', key: 'Pedágio' },
      { label: 'Combustível', key: 'Combustível' },
      { label: 'Manutenção', key: 'Manutenção' },
      { label: 'Equipe (motorista e ajudante)', key: '__equipe__' },
      { label: 'Despesa fixa e parcelada', key: 'Despesa fixa' },
      { label: 'Agregados', key: 'Agregados' },
    ];
    const lista: { categoria: string; valor: number }[] = [];
    ordem.forEach(({ label, key }) => {
      const v = key === '__equipe__' ? equipeTotal : (byCat.get(key) ?? 0);
      if (v > 0) lista.push({ categoria: label, valor: Math.round(v * 100) / 100 });
    });
    const rest = Array.from(byCat.entries()).filter(([c]) => !['Equipe (Motorista)', 'Equipe (Ajudante)', ...ordem.map(o => o.key)].includes(c));
    rest.forEach(([cat, v]) => lista.push({ categoria: cat, valor: Math.round(v * 100) / 100 }));
    const total = lista.reduce((s, i) => s + i.valor, 0);
    return { itens: lista, total: Math.round(total * 100) / 100 };
  }, [movimentos]);

  const { listaMotoristas, listaAjudantes } = useMemo(() => {
    const motoristasMap = new Map<string, { nome: string; valor: number }>();
    const ajudantesMap = new Map<string, { nome: string; valor: number }>();
    movimentos.forEach(m => {
      if ((m.papelEquipe === 'motorista' || m.categoria === 'Equipe (Motorista)') && m.motoristaId && m.valor > 0) {
        const nome = m.motoristaNome ?? users.find(u => u.id === m.motoristaId)?.nome ?? 'Motorista';
        const prev = motoristasMap.get(m.motoristaId);
        motoristasMap.set(m.motoristaId, { nome, valor: (prev?.valor ?? 0) + m.valor });
      }
      if ((m.papelEquipe === 'ajudante' || m.categoria === 'Equipe (Ajudante)') && m.ajudanteId && m.valor > 0) {
        const nome = m.ajudanteNome ?? users.find(u => u.id === m.ajudanteId)?.nome ?? 'Ajudante';
        const prev = ajudantesMap.get(m.ajudanteId);
        ajudantesMap.set(m.ajudanteId, { nome, valor: (prev?.valor ?? 0) + m.valor });
      }
    });
    const listaMotoristas = Array.from(motoristasMap.entries()).map(([id, { nome, valor }]) => ({ id, nome, valor: Math.round(valor * 100) / 100 })).sort((a, b) => b.valor - a.valor);
    const listaAjudantes = Array.from(ajudantesMap.entries()).map(([id, { nome, valor }]) => ({ id, nome, valor: Math.round(valor * 100) / 100 })).sort((a, b) => b.valor - a.valor);
    return { listaMotoristas, listaAjudantes };
  }, [movimentos, users]);

  const profit = Number(summary.totalRevenue) - Number(summary.totalExpense);

  const formatDataExport = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatValor = (v: number, tipo: 'entrada' | 'saida') => `${tipo === 'entrada' ? '+' : '-'} R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const escapeCsv = (val: string) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const exportarPlanilha = () => {
    const cols = ['Data', 'Tipo', 'Categoria', 'Placa', 'Motorista', 'Ajudante', 'Descrição', 'Valor'];
    const rows = movimentosFiltrados.map(m => [
      formatDataExport(m.data),
      m.tipo === 'entrada' ? 'Entrada' : 'Saída',
      m.categoria,
      m.placa ?? '',
      m.motoristaNome ?? '',
      m.ajudanteNome ?? '',
      m.descricao,
      (m.tipo === 'entrada' ? m.valor : -m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);
    const csv = [cols.map(escapeCsv).join(';'), ...rows.map(r => r.map(escapeCsv).join(';'))].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faturamento_${startDate || 'inicio'}_${endDate || 'fim'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportFeedback('planilha');
    setTimeout(() => setExportFeedback(null), 2000);
  };

  const categoriasParaFiltro = (label: string): string[] => {
    if (label === 'Equipe (motorista e ajudante)') return ['Equipe (Motorista)', 'Equipe (Ajudante)'];
    if (label === 'Despesa fixa e parcelada') return ['Despesa fixa'];
    return [label];
  };

  const copiarRelatorioReceitaEmpresa = async (empresa: string, valorTotal: number) => {
    const linhas = movimentos.filter(m => m.tipo === 'entrada' && m.categoria !== 'Frete agregado' && (m.empresa?.trim() || '(Sem empresa)') === empresa);
    linhas.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : 'Todo o período';
    let text = `📋 *Receitas - ${empresa}*\n`;
    text += `Período: ${periodo}\n\n`;
    linhas.forEach(m => {
      text += `${formatDataExport(m.data)} | ${m.placa ?? '-'} | ${m.categoria} | R$ ${m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    });
    text += `\n*Total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiadoReceita('empresa-' + empresa);
      setTimeout(() => setCopiadoReceita(null), 2500);
    } catch (_) {}
  };

  const copiarRelatorioReceitaPlaca = async (placa: string, valorTotal: number) => {
    const linhas = movimentos.filter(m => m.tipo === 'entrada' && m.categoria !== 'Frete agregado' && (m.placa?.trim() || '(Sem placa)') === placa);
    linhas.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : 'Todo o período';
    let text = `📋 *Receitas - Placa ${placa}*\n`;
    text += `Período: ${periodo}\n\n`;
    linhas.forEach(m => {
      text += `${formatDataExport(m.data)} | ${m.categoria} | ${m.descricao} | R$ ${m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    });
    text += `\n*Total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiadoReceita('placa-' + placa);
      setTimeout(() => setCopiadoReceita(null), 2500);
    } catch (_) {}
  };

  const copiarRelatorioLucroAgregados = async () => {
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : 'Todo o período';
    let text = `📋 *Lucro dos Agregados*\n`;
    text += `Período: ${periodo}\n\n`;
    text += `Receita: R$ ${lucroAgregados.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `Custo: R$ ${lucroAgregados.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `*Lucro: R$ ${lucroAgregados.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiadoReceita('agregados');
      setTimeout(() => setCopiadoReceita(null), 2500);
    } catch (_) {}
  };

  const copiarRelatorioCategoria = async (categoriaLabel: string, valorTotal: number) => {
    const cats = categoriasParaFiltro(categoriaLabel);
    const linhas = movimentos.filter(m => m.tipo === 'saida' && cats.includes(m.categoria));
    linhas.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : 'Todo o período';
    let text = `📋 *Relatório - ${categoriaLabel}*\n`;
    text += `Período: ${periodo}\n\n`;
    linhas.forEach(m => {
      text += `${formatDataExport(m.data)} | ${m.placa ?? '-'} | R$ ${m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    });
    text += `\n*Total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiadoCategoria(categoriaLabel);
      setTimeout(() => setCopiadoCategoria(null), 2500);
    } catch (_) {}
  };

  const copiarRelatorioPessoa = async (tipo: 'motorista' | 'ajudante', id: string, nome: string, valorTotal: number) => {
    const linhas = movimentos.filter(m => {
      if (m.tipo !== 'saida') return false;
      if (tipo === 'motorista') return (m.papelEquipe === 'motorista' || m.categoria === 'Equipe (Motorista)') && m.motoristaId === id;
      return (m.papelEquipe === 'ajudante' || m.categoria === 'Equipe (Ajudante)') && m.ajudanteId === id;
    });
    linhas.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : 'Todo o período';
    const titulo = tipo === 'motorista' ? 'Motorista' : 'Ajudante';
    let text = `📋 *Relatório - ${nome} (${titulo})*\n`;
    text += `Período: ${periodo}\n\n`;
    linhas.forEach(m => {
      text += `${formatDataExport(m.data)} | ${m.placa ?? '-'} | R$ ${m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    });
    text += `\n*Total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiadoPessoa(tipo + id);
      setTimeout(() => setCopiadoPessoa(null), 2500);
    } catch (_) {}
  };

  const copiarParaWhatsApp = async () => {
    const periodo = startDate && endDate ? `${startDate} a ${endDate}` : 'Todo o período';
    const totalEntradas = movimentosFiltrados.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
    const totalSaidas = movimentosFiltrados.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
    const lucro = totalEntradas - totalSaidas;
    let text = `📊 *Faturamento consolidado*\n${periodo}\n`;
    text += `_${movimentosFiltrados.length} movimento(s)_\n\n`;
    movimentosFiltrados.slice(0, 80).forEach(m => {
      text += `${formatDataExport(m.data)} | ${m.tipo === 'entrada' ? '✅' : '❌'} ${m.categoria} | ${formatValor(m.valor, m.tipo)}\n`;
      if (m.motoristaNome || m.ajudanteNome) text += `   ${[m.motoristaNome, m.ajudanteNome].filter(Boolean).join(' / ')}\n`;
    });
    if (movimentosFiltrados.length > 80) text += `\n... e mais ${movimentosFiltrados.length - 80} movimento(s).\n`;
    text += `\n💰 Entradas: R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `💸 Saídas: R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    text += `📈 Lucro: R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    try {
      await navigator.clipboard.writeText(text);
      setExportFeedback('whatsapp');
      setTimeout(() => setExportFeedback(null), 2000);
    } catch {
      setExportFeedback(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-3xl font-black uppercase text-white">Consolidado Financeiro</h2>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs uppercase text-white">Voltar</button>
      </div>

      <Card className="no-print bg-slate-900/40 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
  <label className="text-xs font-bold uppercase text-slate-400">Data Inicial</label>
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
  />
</div>

<div className="space-y-2">
  <label className="text-xs font-bold uppercase text-slate-400">Data Final</label>
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
  />
</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center bg-emerald-900/10 border-emerald-900/40">
          <div className="text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-widest">Entradas (Receitas)</div>
          <div className="text-3xl font-black text-white">R$ {summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="text-center bg-red-900/10 border-red-900/40">
          <div className="text-[10px] font-black text-red-500 uppercase mb-1 tracking-widest">Saídas (Despesas Gerais)</div>
          <div className="text-3xl font-black text-white">R$ {summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className={`text-center shadow-2xl ${profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
          <div className="text-[10px] font-black uppercase mb-1 tracking-widest">Lucro Real Líquido</div>
          <div className={`text-4xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className={`text-center bg-teal-900/10 border-teal-900/40 ${lucroAgregados.lucro >= 0 ? '' : 'border-red-900/40'}`}>
          <div className="text-[10px] font-black text-teal-500 uppercase mb-1 tracking-widest">Lucro dos Agregados</div>
          <div className={`text-2xl font-black ${lucroAgregados.lucro >= 0 ? 'text-teal-400' : 'text-red-400'}`}>R$ {lucroAgregados.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="text-[9px] text-slate-500 mt-1">Receita R$ {lucroAgregados.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Custo R$ {lucroAgregados.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Resumo das receitas (período)</h3>
        <p className="text-slate-500 text-xs mb-4">Clique em cada empresa, placa ou lucro agregados para copiar o resumo daquela receita para o WhatsApp.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Por empresa (cliente)</h4>
            {resumoReceitas.listaEmpresas.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma receita no período.</p>
            ) : (
              <ul className="space-y-2">
                {resumoReceitas.listaEmpresas.map(({ empresa, valor }) => (
                  <li key={empresa}>
                    <button
                      type="button"
                      onClick={() => copiarRelatorioReceitaEmpresa(empresa, valor)}
                      className="w-full flex justify-between items-center py-2 border-b border-slate-800/50 gap-2 rounded-lg hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <span className="text-slate-200 font-medium truncate">{empresa}</span>
                      <span className="text-emerald-400 font-black tabular-nums shrink-0">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      {copiadoReceita === 'empresa-' + empresa && <span className="text-[10px] text-emerald-500 font-bold shrink-0">Copiado!</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-3">Por placa</h4>
            {resumoReceitas.listaPlacas.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma receita no período.</p>
            ) : (
              <ul className="space-y-2">
                {resumoReceitas.listaPlacas.map(({ placa, valor }) => (
                  <li key={placa}>
                    <button
                      type="button"
                      onClick={() => copiarRelatorioReceitaPlaca(placa, valor)}
                      className="w-full flex justify-between items-center py-2 border-b border-slate-800/50 gap-2 rounded-lg hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <span className="text-slate-200 font-medium truncate">{placa}</span>
                      <span className="text-teal-400 font-black tabular-nums shrink-0">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      {copiadoReceita === 'placa-' + placa && <span className="text-[10px] text-emerald-500 font-bold shrink-0">Copiado!</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={copiarRelatorioLucroAgregados}
            className="w-full flex justify-between items-center py-2 rounded-lg hover:bg-slate-800/50 transition-colors text-left"
          >
            <span className="text-slate-400 font-bold uppercase text-sm">Lucro agregados</span>
            <span className={`font-black tabular-nums shrink-0 ${lucroAgregados.lucro >= 0 ? 'text-teal-400' : 'text-red-400'}`}>R$ {lucroAgregados.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            {copiadoReceita === 'agregados' && <span className="text-[10px] text-emerald-500 font-bold shrink-0">Copiado!</span>}
          </button>
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-black uppercase text-sm">Total receitas</span>
            <span className="text-emerald-400 font-black text-lg tabular-nums">R$ {resumoReceitas.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </Card>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Resumo das despesas (período)</h3>
        <p className="text-slate-500 text-xs mb-4">Clique na categoria para copiar relatório (datas, placas e valores) para o WhatsApp.</p>
        {resumoDespesas.itens.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhuma despesa no período.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumoDespesas.itens.map(({ categoria, valor }) => (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => copiarRelatorioCategoria(categoria, valor)}
                  className="flex justify-between items-center py-3 px-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-600 hover:bg-slate-900/50 transition-all text-left gap-2"
                >
                  <span className="text-slate-300 font-medium text-sm truncate">{categoria}</span>
                  <span className="text-red-400 font-black tabular-nums shrink-0">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  {copiadoCategoria === categoria && <span className="text-[10px] text-emerald-500 font-bold shrink-0">Copiado!</span>}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-black uppercase text-sm">Total despesas</span>
              <span className="text-red-400 font-black text-lg tabular-nums">R$ {resumoDespesas.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </>
        )}
      </Card>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Valores por pessoa (período selecionado)</h3>
        <p className="text-slate-500 text-xs mb-4">Clique no nome para copiar relatório (datas, placas e valores) para o WhatsApp.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Motoristas</h4>
            {listaMotoristas.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhum valor no período.</p>
            ) : (
              <ul className="space-y-2">
                {listaMotoristas.map(({ id, nome, valor }) => (
                  <li key={id} className="flex justify-between items-center py-2 border-b border-slate-800/50 gap-2">
                    <button
                      type="button"
                      onClick={() => copiarRelatorioPessoa('motorista', id, nome, valor)}
                      className="text-slate-200 font-medium hover:text-blue-400 text-left flex-1 min-w-0 truncate transition-colors"
                    >
                      {nome}
                    </button>
                    <span className="text-emerald-400 font-black tabular-nums shrink-0">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    {copiadoPessoa === 'motorista' + id && <span className="text-[10px] text-emerald-500 font-bold shrink-0">Copiado!</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3">Ajudantes</h4>
            {listaAjudantes.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhum valor no período.</p>
            ) : (
              <ul className="space-y-2">
                {listaAjudantes.map(({ id, nome, valor }) => (
                  <li key={id} className="flex justify-between items-center py-2 border-b border-slate-800/50 gap-2">
                    <button
                      type="button"
                      onClick={() => copiarRelatorioPessoa('ajudante', id, nome, valor)}
                      className="text-slate-200 font-medium hover:text-amber-400 text-left flex-1 min-w-0 truncate transition-colors"
                    >
                      {nome}
                    </button>
                    <span className="text-amber-400 font-black tabular-nums shrink-0">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    {copiadoPessoa === 'ajudante' + id && <span className="text-[10px] text-emerald-500 font-bold shrink-0">Copiado!</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* Filtros da lista */}
      <Card className="no-print bg-slate-900/40 border-slate-800">
        <div className="text-xs font-bold uppercase text-slate-400 mb-3">Filtrar movimentos</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as TipoFiltro)}
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="todos">Todos (entradas e saídas)</option>
              <option value="entradas">Só entradas</option>
              <option value="saidas">Só saídas</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Motorista</label>
            <select
              value={filtroMotoristaId}
              onChange={(e) => setFiltroMotoristaId(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Todos</option>
              {motoristaOptions.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Ajudante</label>
            <select
              value={filtroAjudanteId}
              onChange={(e) => setFiltroAjudanteId(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Todos</option>
              {ajudanteOptions.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Ver valores de</label>
            <select
              value={filtroPapelEquipe}
              onChange={(e) => setFiltroPapelEquipe(e.target.value as PapelEquipeFiltro)}
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="todos">Todos (motorista e ajudante)</option>
              <option value="motorista">Só motorista</option>
              <option value="ajudante">Só ajudante</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Placa</label>
            <select
              value={filtroPlaca}
              onChange={(e) => setFiltroPlaca(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Todas</option>
              {placasDisponiveis.map(placa => (
                <option key={placa} value={placa}>{placa}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Todas</option>
              {categoriasDisponiveis.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400">Buscar (categoria, descrição ou nome)</label>
            <input
              type="text"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Ex: combustível, OC 123, nome..."
              className="w-full bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500"
            />
          </div>
        </div>
      </Card>

      {/* Lista de entradas e saídas */}
      <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-xs font-bold uppercase text-slate-400">
            Movimentos ({movimentosFiltrados.length}) — use o período acima para definir o intervalo de datas
          </div>
          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={exportarPlanilha}
              disabled={movimentosFiltrados.length === 0}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl font-bold border border-slate-600 text-xs uppercase text-white flex items-center gap-2"
            >
              📥 Exportar planilha
            </button>
            <button
              type="button"
              onClick={copiarParaWhatsApp}
              disabled={movimentosFiltrados.length === 0}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl font-bold border border-emerald-600 text-xs uppercase text-white flex items-center gap-2"
            >
              {exportFeedback === 'whatsapp' ? '✓ Copiado!' : '📋 Copiar para WhatsApp'}
            </button>
            {exportFeedback === 'planilha' && <span className="text-xs text-emerald-400 font-bold">Planilha baixada.</span>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400 uppercase tracking-wider text-[10px] font-black">
                <th className="py-3 px-2">Data</th>
                <th className="py-3 px-2">Tipo</th>
                <th className="py-3 px-2">Categoria</th>
                <th className="py-3 px-2">Placa</th>
                <th className="py-3 px-2">Motorista</th>
                <th className="py-3 px-2">Ajudante</th>
                <th className="py-3 px-2">Descrição</th>
                <th className="py-3 px-2 text-right">Valor</th>
                {onDeleteMovement && <th className="py-3 px-2 w-16 text-center no-print">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {movimentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteMovement ? 9 : 8} className="py-8 text-center text-slate-500">
                    Nenhum movimento no período. Ajuste as datas ou os filtros.
                  </td>
                </tr>
              ) : (
                movimentosFiltrados.map((m) => (
                  <tr key={m.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2.5 px-2 text-slate-300 whitespace-nowrap">
                      {new Date(m.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={m.tipo === 'entrada' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-300">{m.categoria}</td>
                    <td className="py-2.5 px-2 text-slate-300 whitespace-nowrap">{m.placa ?? '—'}</td>
                    <td className="py-2.5 px-2 text-slate-300 max-w-[120px] truncate" title={m.motoristaNome ?? ''}>{m.motoristaNome ?? '—'}</td>
                    <td className="py-2.5 px-2 text-slate-300 max-w-[120px] truncate" title={m.ajudanteNome ?? ''}>{m.ajudanteNome ?? '—'}</td>
                    <td className="py-2.5 px-2 text-slate-300 max-w-[200px] truncate" title={m.descricao}>{m.descricao}</td>
                    <td className={`py-2.5 px-2 text-right font-bold whitespace-nowrap ${m.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.tipo === 'entrada' ? '+' : '-'} R$ {m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    {onDeleteMovement && (
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Excluir este movimento?\n${m.categoria} — ${m.descricao}\nValor: R$ ${m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)) {
                              onDeleteMovement(m);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1.5 rounded-lg transition-colors no-print"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminConsolidatedFinancialReport;
