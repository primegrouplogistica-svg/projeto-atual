import React, { useMemo, useState } from 'react';
import { Agregado, AgregadoSaida, ApprovalStatus, User } from '../types';
import { Card, Input, Select, BigButton } from '../components/UI';
import { todayLocalDateInput } from '../utils/date';

interface AgregadoSaidaFormProps {
  currentUser: User;
  agregados: Agregado[];
  onSubmit: (saida: AgregadoSaida) => void;
  onBack: () => void;
}

const AgregadoSaidaForm: React.FC<AgregadoSaidaFormProps> = ({ currentUser, agregados, onSubmit, onBack }) => {
  const [oc, setOc] = useState('');
  const [destino, setDestino] = useState('');
  const agregadoAtual = useMemo(
    () => agregados.find(a => a.id === currentUser.agregadoId),
    [agregados, currentUser.agregadoId]
  );
  const placa = agregadoAtual?.placa?.toUpperCase() || '';
  const [data, setData] = useState(todayLocalDateInput());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oc || !destino || !placa || !data) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    const newSaida: AgregadoSaida = {
      id: crypto.randomUUID(),
      placa,
      oc: oc.trim(),
      destino: destino.trim(),
      data,
      status: ApprovalStatus.PENDENTE,
      createdById: currentUser.id,
      createdByNome: currentUser.nome,
      createdAt: new Date().toISOString()
    };
    onSubmit(newSaida);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lançar Saída</h2>
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
              label="Data da Saída"
              type="date"
              value={data}
              onChange={setData}
              required
            />
            <Input
              label="OC (Ordem de Carga)"
              value={oc}
              onChange={setOc}
              required
              placeholder="Ex: OC-8855"
            />
            <Input
              label="Destino"
              value={destino}
              onChange={setDestino}
              required
              placeholder="Ex: CD Curitiba"
            />
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5 uppercase tracking-wider">Placa</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-blue-400 font-mono font-bold tracking-widest">
                {placa || '—'}
              </div>
            </div>
          </div>

          <BigButton type="submit" onClick={() => {}} disabled={!oc || !destino || !placa || !data || !agregadoAtual}>
            ENVIAR PARA APROVAÇÃO
          </BigButton>
        </form>
      </Card>
    </div>
  );
};

export default AgregadoSaidaForm;
