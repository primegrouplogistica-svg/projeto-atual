import React, { useState, useMemo } from 'react';
import { AgregadoFreight } from '../types';
import { Card, Input, Select } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDateBr, parseDateLocal } from '../utils/date';

interface AdminAgregadoReportProps {
  freights: AgregadoFreight[];
  onBack: () => void;
}

const AdminAgregadoReport: React.FC<AdminAgregadoReportProps> = ({ freights, onBack }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlaca, setSelectedPlaca] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const placaOptions = useMemo(() => {
    const plates = Array.from(new Set(freights.map(f => f.placa))).sort();
    return plates.map(p => ({ label: p, value: p }));
  }, [freights]);

  const filtered = useMemo(() => {
    const start = startDate ? parseDateLocal(startDate) : null;
    const end = endDate ? parseDateLocal(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return freights.filter(f => {
      const date = parseDateLocal(f.data);
      const matchesDate = (!start || date >= start) && (!end || date <= end);
      const matchesPlaca = !selectedPlaca || f.placa === selectedPlaca;
      return matchesDate && matchesPlaca;
    });
  }, [freights, startDate, endDate, selectedPlaca]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, curr) => {
      const vFrete = Number(curr.valorFrete || 0);
      const vPago = Number(curr.valorAgregado || 0);
      return {
        frete: Number(acc.frete) + vFrete,
        pago: Number(acc.pago) + vPago,
        saldo: Number(acc.saldo) + (vFrete - vPago)
      };
    }, { frete: 0, pago: 0, saldo: 0 });
  }, [filtered]);

  const chartByAgregado = useMemo(() => {
    const byName: Record<string, { receita: number; custo: number; lucro: number }> = {};
    filtered.forEach(f => {
      const nome = f.nomeAgregado || 'Sem nome';
      if (!byName[nome]) byName[nome] = { receita: 0, custo: 0, lucro: 0 };
      const vFrete = Number(f.valorFrete || 0);
      const vPago = Number(f.valorAgregado || 0);
      byName[nome].receita += vFrete;
      byName[nome].custo += vPago;
      byName[nome].lucro += vFrete - vPago;
    });
    return Object.entries(byName).map(([nome, d]) => ({
      nome,
      receita: Math.round(d.receita * 100) / 100,
      custo: Math.round(d.custo * 100) / 100,
      lucro: Math.round(d.lucro * 100) / 100,
    })).sort((a, b) => b.lucro - a.lucro);
  }, [filtered]);

  const resumoPorAgregado = useMemo(() => {
    const byKey: Record<string, { nome: string; placa: string; totalAPagar: number }> = {};
    filtered.forEach(f => {
      const nome = f.nomeAgregado || 'Sem nome';
      const placa = f.placa || '—';
      const key = `${nome}|${placa}`;
      if (!byKey[key]) byKey[key] = { nome, placa, totalAPagar: 0 };
      byKey[key].totalAPagar += Number(f.valorAgregado || 0);
    });
    return Object.entries(byKey)
      .map(([key, d]) => ({ key, ...d, totalAPagar: Math.round(d.totalAPagar * 100) / 100 }))
      .sort((a, b) => b.totalAPagar - a.totalAPagar);
  }, [filtered]);

  const freightsPorPlaca = useMemo(() => {
    if (!selectedPlaca) return [];
    return filtered.filter(f => f.placa === selectedPlaca);
  }, [filtered, selectedPlaca]);

  const resumoPlacaSelecionada = useMemo(() => {
    if (freightsPorPlaca.length === 0) return null;
    const nome = freightsPorPlaca[0].nomeAgregado || 'Sem nome';
    const placa = freightsPorPlaca[0].placa || selectedPlaca;
    const totalAPagar = freightsPorPlaca.reduce((s, f) => s + Number(f.valorAgregado || 0), 0);
    return { nome, placa, totalAPagar: Math.round(totalAPagar * 100) / 100 };
  }, [freightsPorPlaca, selectedPlaca]);

  const copyResumoWhatsApp = (item: { nome: string; placa: string; totalAPagar: number }, key: string) => {
    const periodo = startDate && endDate
      ? `${startDate} a ${endDate}`
      : startDate
        ? `a partir de ${startDate}`
        : endDate
          ? `até ${endDate}`
          : 'todo o período';
    const linhas = filtered.filter(f =>
      (f.nomeAgregado || 'Sem nome') === item.nome &&
      (f.placa || '—') === item.placa
    );
    let msg = `📋 *Resumo - ${item.nome}*\nPlaca: ${item.placa}\nPeríodo: ${periodo}\n\n`;
    linhas.forEach(f => {
      const data = formatDateBr(f.data);
      const oc = f.oc || '—';
      const rota = f.rota || '—';
      const cliente = f.clienteNome || '—';
      const valor = Number(f.valorAgregado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      msg += `• ${data} | Cliente ${cliente} | OC ${oc} | Rota ${rota} → R$ ${valor}\n`;
    });
    msg += `\n*Total a pagar:* R$ ${item.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n_Prime Group_`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const copyResumoDetalhadoWhatsApp = () => {
    if (!resumoPlacaSelecionada) return;
    const periodo = startDate && endDate
      ? `${startDate} a ${endDate}`
      : startDate
        ? `a partir de ${startDate}`
        : endDate
          ? `até ${endDate}`
          : 'todo o período';
    let msg = `📋 *Resumo - ${resumoPlacaSelecionada.nome}*\nPlaca: ${resumoPlacaSelecionada.placa}\nPeríodo: ${periodo}\n\n`;
    freightsPorPlaca.forEach(f => {
      const data = formatDateBr(f.data);
      const oc = f.oc || '—';
      const rota = f.rota || '—';
      const valor = Number(f.valorAgregado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      msg += `• ${data} | OC ${oc} | Rota ${rota} → R$ ${valor}\n`;
    });
    msg += `\n*Total a pagar: R$ ${resumoPlacaSelecionada.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n_Prime Group_`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedKey(`detalhe-${selectedPlaca}`);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-3xl font-black uppercase text-white">Relatório de Agregados</h2>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 text-xs uppercase text-white">Voltar</button>
      </div>

      <Card className="no-print bg-slate-900/40 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="Data Início" type="date" value={startDate} onChange={setStartDate} />
          <Input label="Data Fim" type="date" value={endDate} onChange={setEndDate} />
          <Select label="Filtrar Placa" value={selectedPlaca} onChange={setSelectedPlaca} options={[{ label: '— Todas —', value: '' }, ...placaOptions]} />
        </div>
      </Card>

      <Card className="border-teal-900/40 bg-teal-950/20">
        <h3 className="text-sm font-black uppercase tracking-widest mb-1 text-teal-400">Resumo por placa</h3>
        <p className="text-[10px] text-slate-500 mb-4">Selecione uma placa no filtro acima para ver o total a pagar, dias, OC e destino. Clique em &quot;Copiar para WhatsApp&quot; para enviar o resumo detalhado.</p>
        {!selectedPlaca ? (
          <p className="text-slate-500 text-sm py-4">Selecione uma placa em &quot;Filtrar Placa&quot; acima para ver o resumo (dias, OC, destino e valor a pagar).</p>
        ) : resumoPlacaSelecionada ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase">Agregado:</span>
                  <span className="ml-2 text-white font-black">{resumoPlacaSelecionada.nome}</span>
                  <span className="ml-2 font-mono text-blue-400 font-bold">{resumoPlacaSelecionada.placa}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-black text-lg">R$ {resumoPlacaSelecionada.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar</span>
                  <button
                    type="button"
                    onClick={copyResumoDetalhadoWhatsApp}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    {copiedKey === `detalhe-${selectedPlaca}` ? 'Copiado!' : 'Copiar para WhatsApp'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">OC</th>
                      <th className="p-3">Destino</th>
                      <th className="p-3 text-right">Valor a pagar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freightsPorPlaca.map(f => (
                      <tr key={f.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-slate-300">{formatDateBr(f.data)}</td>
                        <td className="p-3 font-bold text-slate-200">{f.oc || '—'}</td>
                        <td className="p-3 text-slate-400">{f.destino || '—'}</td>
                        <td className="p-3 text-right font-black text-red-400">R$ {Number(f.valorAgregado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
        ) : (
          <p className="text-slate-500 text-sm py-4">Nenhum frete no período para esta placa.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center bg-slate-900/50 border-slate-800">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Faturamento Bruto</div>
          <div className="text-2xl font-black text-emerald-400">R$ {totals.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className="text-center bg-slate-900/50 border-slate-800">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Custo (Pagto Agregado)</div>
          <div className="text-2xl font-black text-red-400">R$ {totals.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
        <Card className={`text-center ${totals.saldo >= 0 ? 'bg-emerald-900/10 border-emerald-900/40' : 'bg-red-900/10 border-red-900/40'}`}>
          <div className="text-[10px] font-black uppercase mb-1 tracking-widest">Saldo Real (Margem)</div>
          <div className={`text-2xl font-black ${totals.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </Card>
      </div>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Lucro por agregado</h3>
        {chartByAgregado.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByAgregado} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nome" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Lucro']}
                  labelFormatter={(label) => `Agregado: ${label}`}
                />
                <Bar dataKey="lucro" name="Lucro" radius={[4, 4, 0, 0]}>
                  {chartByAgregado.map((_, i) => (
                    <Cell key={i} fill={chartByAgregado[i].lucro >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período para exibir gráfico.</div>
        )}
      </Card>

      <Card className="border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-white">Receita x Custo por agregado</h3>
        {chartByAgregado.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByAgregado} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nome" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name]}
                  labelFormatter={(label) => `Agregado: ${label}`}
                />
                <Bar dataKey="receita" name="Receita (fretes)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" name="Custo (pago agregado)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Nenhum dado no período para exibir gráfico.</div>
        )}
      </Card>
      
      <Card className="border-slate-800 bg-teal-950/20 border-teal-900/30">
        <h3 className="text-sm font-black uppercase tracking-widest mb-2 text-teal-400">Resumo para WhatsApp — clique no nome ou na placa</h3>
        <p className="text-[10px] text-slate-500 mb-4">Ao clicar, o texto com o total a pagar é copiado. Cole no WhatsApp e envie.</p>
        <div className="space-y-2">
          {resumoPorAgregado.length === 0 ? (
            <div className="text-slate-500 text-sm py-4 text-center">Nenhum dado no período.</div>
          ) : (
            resumoPorAgregado.map((item) => (
              <div
                key={item.key}
                className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-900/50 transition-all"
              >
                <button
                  type="button"
                  onClick={() => copyResumoWhatsApp(item, item.key)}
                  className="text-sm font-bold text-white hover:text-teal-400 transition-colors text-left"
                >
                  {item.nome}
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => copyResumoWhatsApp(item, item.key)}
                  className="text-xs font-mono font-bold text-blue-400 hover:text-teal-400 transition-colors"
                >
                  {item.placa}
                </button>
                <span className="text-slate-500 text-xs ml-auto font-black">R$ {item.totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar</span>
                {copiedKey === item.key && <span className="text-[10px] font-bold text-emerald-500 uppercase">Copiado!</span>}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border-slate-800 bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Agregado / Placa</th>
                <th className="p-4 text-right">Frete Bruto</th>
                <th className="p-4 text-right">Valor Pago</th>
                <th className="p-4 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const saldo = Number(f.valorFrete || 0) - Number(f.valorAgregado || 0);
                return (
                  <tr key={f.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-xs font-mono text-slate-400">{formatDateBr(f.data)}</td>
                    <td className="p-4">
                      {(() => {
                        const item = resumoPorAgregado.find(r => r.nome === (f.nomeAgregado || 'Sem nome') && r.placa === (f.placa || '—'));
                        const key = item ? item.key : `${f.nomeAgregado}|${f.placa}`;
                        const msgItem = item ?? { nome: f.nomeAgregado || 'Sem nome', placa: f.placa || '—', totalAPagar: Number(f.valorAgregado || 0) };
                        return (
                          <div className="flex flex-col gap-0.5">
                            <button type="button" onClick={() => copyResumoWhatsApp(msgItem, key)} className="text-xs font-bold text-slate-200 hover:text-teal-400 text-left transition-colors">
                              {f.nomeAgregado}
                            </button>
                            <button type="button" onClick={() => copyResumoWhatsApp(msgItem, key)} className="text-[10px] font-mono text-blue-500 font-bold hover:text-teal-400 text-left transition-colors">
                              {f.placa}
                            </button>
                            {copiedKey === key && <span className="text-[9px] text-emerald-500 font-bold">Copiado!</span>}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right text-xs text-emerald-400 font-bold">R$ {Number(f.valorFrete || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right text-xs text-red-400 font-bold">R$ {Number(f.valorAgregado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className={`p-4 text-right text-xs font-black ${saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminAgregadoReport;
