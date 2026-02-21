import React, { useMemo, useState } from 'react';
import { ApprovalStatus, Agregado, Ticket, User, UserRole } from '../types';
import { Card, Input, Select, BigButton } from '../components/UI';
import { todayLocalDateInput } from '../utils/date';

interface AgregadoTicketFormProps {
  currentUser: User;
  agregados: Agregado[];
  users: User[];
  onSubmit: (ticket: Ticket) => void;
  onBack: () => void;
}

const AgregadoTicketForm: React.FC<AgregadoTicketFormProps> = ({ currentUser, agregados, users, onSubmit, onBack }) => {
  const [numeroTicket, setNumeroTicket] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [oc, setOc] = useState('');
  const [motivo, setMotivo] = useState('');
  const agregadoAtual = useMemo(
    () => agregados.find(a => a.id === currentUser.agregadoId),
    [agregados, currentUser.agregadoId]
  );
  const placa = agregadoAtual?.placa?.toUpperCase() || '';
  const [motoristaId, setMotoristaId] = useState('');
  const [data, setData] = useState(todayLocalDateInput());

  const motoristasOptions = useMemo(() => {
    return users
      .filter(u => u.perfil === UserRole.MOTORISTA)
      .map(u => ({ label: u.nome, value: u.id }));
  }, [users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroTicket || !oc || !motivo || !placa || !motoristaId || !data) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    const motoristaNome = users.find(u => u.id === motoristaId)?.nome ?? '';
    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      numeroTicket: numeroTicket.trim(),
      notaFiscal: notaFiscal.trim() || undefined,
      oc: oc.trim(),
      motivo: motivo.trim(),
      placa,
      motoristaId,
      motoristaNome: motoristaNome || undefined,
      data,
      status: ApprovalStatus.PENDENTE,
      createdById: currentUser.id,
      createdByNome: currentUser.nome,
      createdAt: new Date().toISOString()
    };
    onSubmit(newTicket);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lançar Ticket</h2>
          <p className="text-slate-500 text-sm">Envio para aprovação do admin</p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold border border-slate-700 transition-colors">
          Cancelar
        </button>
      </div>

      <Card className="border-indigo-900/30">
        <form onSubmit={handleSubmit} className="space-y-6">
          {!agregadoAtual && (
            <div className="bg-red-900/20 border border-red-900/40 p-3 rounded-lg text-red-400 text-[10px] font-black uppercase text-center">
              Seu usuário não está vinculado a um agregado. Peça ao admin para vincular no cadastro de equipe.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data do Ticket"
              type="date"
              value={data}
              onChange={setData}
              required
            />
            <Input
              label="Número do Ticket"
              value={numeroTicket}
              onChange={setNumeroTicket}
              required
              placeholder="Ex: TCK-10293"
            />
            <Input
              label="Nota Fiscal"
              value={notaFiscal}
              onChange={setNotaFiscal}
              placeholder="Ex: NF-12345"
            />
            <Input
              label="OC (Ordem de Carga)"
              value={oc}
              onChange={setOc}
              required
              placeholder="Ex: OC-8855"
            />
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5 uppercase tracking-wider">Placa</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-blue-400 font-mono font-bold tracking-widest">
                {placa || '—'}
              </div>
            </div>
            <Select
              label="Motorista"
              value={motoristaId}
              onChange={setMotoristaId}
              options={motoristasOptions}
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-medium mb-1.5 uppercase tracking-wider">Motivo / Descrição</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-50 min-h-[120px] focus:border-blue-500 outline-none transition-all"
              placeholder="Descreva o motivo do ticket..."
              required
            />
          </div>

          <BigButton type="submit" onClick={() => {}} disabled={!numeroTicket || !oc || !motivo || !placa || !motoristaId || !data || !agregadoAtual}>
            ENVIAR PARA APROVAÇÃO
          </BigButton>
        </form>
      </Card>
    </div>
  );
};

export default AgregadoTicketForm;
