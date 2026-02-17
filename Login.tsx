import React, { useState } from 'react';
import { User, UserSession, Fueling, FuelingStatus } from '../types';
import { Card, Input, BigButton } from '../components/UI';

interface FuelingFormProps {
  session: UserSession;
  user: User;
  onSubmit: (fueling: Fueling) => void;
  onBack: () => void;
}

const FuelingForm: React.FC<FuelingFormProps> = ({ session, user, onSubmit, onBack }) => {
  const [km, setKm] = useState('');
  const [valor, setValor] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!km || !valor) return;

    const newFueling: Fueling = {
      id: crypto.randomUUID(),
      vehicleId: session.vehicleId,
      placa: session.placa,
      motoristaId: user.id,
      kmNoMomento: Number(km),
      valor: Number(valor),
      fotoNota: '',
      status: FuelingStatus.PENDENTE,
      createdAt: new Date().toISOString()
    };

    onSubmit(newFueling);
  };

  return (
    <div className="max-w-xl mx-auto py-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Registrar Abastecimento</h2>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-200">Cancelar</button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500 uppercase">Placa selecionada</span>
            <span className="font-mono text-lg text-blue-400 font-bold">{session.placa}</span>
          </div>

          <Input
            label="KM no Momento"
            type="number"
            value={km}
            onChange={setKm}
            required
            placeholder="KM atual no painel"
          />

          <Input
            label="Valor Total (R$)"
            type="number"
            value={valor}
            onChange={setValor}
            required
            placeholder="Valor da nota"
          />

          <BigButton
            type="button"
            onClick={() => handleSubmit()}
            disabled={!km || !valor}
          >
            ENVIAR PARA APROVAÇÃO
          </BigButton>
        </form>
      </Card>
    </div>
  );
};

export default FuelingForm;
