import React, { useState, useRef } from 'react';
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
  const [fotoNota, setFotoNota] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setFotoNota(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!km || !valor || !fotoNota) return;

    const newFueling: Fueling = {
      id: crypto.randomUUID(),
      vehicleId: session.vehicleId,
      placa: session.placa,
      motoristaId: user.id,
      kmNoMomento: Number(km),
      valor: Number(valor),
      fotoNota,
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

          <Input label="KM no Momento" type="number" value={km} onChange={setKm} required placeholder="KM atual no painel" />
          <Input label="Valor Total (R$)" type="number" value={valor} onChange={setValor} required placeholder="Valor da nota" />
          
          <div className="space-y-2">
            <label className="block text-slate-400 text-sm font-medium uppercase tracking-wider">Foto da Nota Fiscal</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 rounded-xl min-h-[140px] text-center bg-slate-950/50 cursor-pointer hover:border-blue-700 transition-colors overflow-hidden"
            >
              {fotoNota ? (
                <div className="relative p-2">
                  <img src={fotoNota} alt="Nota fiscal" className="w-full h-40 object-contain rounded-lg bg-slate-900" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded">Trocar foto</span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-3xl block mb-2 pt-6">📸</span>
                  <span className="text-sm text-slate-500 block">Tire uma foto no celular ou anexe no computador</span>
                </>
              )}
            </div>
          </div>

          <BigButton type="submit" disabled={!km || !valor || !fotoNota}>
            ENVIAR PARA APROVAÇÃO
          </BigButton>
        </form>
      </Card>
    </div>
  );
};

export default FuelingForm;
