import React, { useState, useRef } from 'react';
import { User, UserSession, DailyRoute, Customer, FinanceiroStatus } from '../types';
import { Card, Input, BigButton, Select } from '../components/UI';

interface DriverDailyRouteProps {
  session: UserSession;
  user: User;
  customers: Customer[];
  onSubmit: (route: DailyRoute) => void;
  onBack: () => void;
}

const DriverDailyRoute: React.FC<DriverDailyRouteProps> = ({ session, user, customers, onSubmit, onBack }) => {
  const [clienteId, setClienteId] = useState('');
  const [destino, setDestino] = useState('');
  const [oc, setOc] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSetterRef = useRef<((url: string) => void) | null>(null);

  const openCamera = (setter: (url: string) => void) => {
    pendingSetterRef.current = setter;
    fileInputRef.current?.click();
  };

  const handlePhotoCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      pendingSetterRef.current?.(dataUrl);
      pendingSetterRef.current = null;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Níveis Separados (Marcador X)
  const [nivelOleo, setNivelOleo] = useState<'no_nivel' | 'abaixo_do_nivel' | null>(null);
  const [nivelAgua, setNivelAgua] = useState<'no_nivel' | 'abaixo_do_nivel' | null>(null);

  // Avaria nova — default "Não"; se "Sim", exibe campo descrição + foto
  const [avariaNova, setAvariaNova] = useState<boolean>(false);
  const [avariaDescricao, setAvariaDescricao] = useState('');
  const [avariaFoto, setAvariaFoto] = useState<string | null>(null);

  const canSubmit = !!(clienteId && destino && oc);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;

    const cliente = customers.find(c => c.id === clienteId);

    const newDailyRoute: DailyRoute = {
      id: crypto.randomUUID(),
      motoristaId: user.id,
      vehicleId: session.vehicleId,
      placa: session.placa,
      clienteId,
      clienteNome: cliente?.nome,
      destino,
      oc,
      valorFrete: 0,
      valorMotorista: 0,
      valorAjudante: 0,
      statusFinanceiro: FinanceiroStatus.PENDENTE,
      ...(nivelOleo && { nivelOleo }),
      ...(nivelAgua && { nivelAgua }),
      createdAt: new Date().toISOString(),
      ...(avariaNova && {
        avariaNova: true,
        avariaDescricao: avariaDescricao.trim() || undefined,
        avariaFoto: avariaFoto || undefined
      })
    };

    onSubmit(newDailyRoute);
  };

  const PhotoSlot = ({ label, value, onCapture, onClear }: { label: string; value: string | null; onCapture: () => void; onClear: () => void }) => (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all overflow-hidden min-h-[100px] ${value ? 'border-emerald-600 bg-emerald-950/10' : 'border-slate-800 hover:border-blue-700 bg-slate-950 cursor-pointer'}`}
    >
      {value ? (
        <>
          <img src={value} alt={label} className="w-full h-full min-h-[100px] object-cover pointer-events-none" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-black uppercase text-white drop-shadow-lg">{label}</span>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={(ev) => { ev.stopPropagation(); onCapture(); }} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded">Refazer</button>
              <button type="button" onClick={(ev) => { ev.stopPropagation(); onClear(); }} className="bg-red-900/80 hover:bg-red-800 text-red-200 text-[10px] font-bold px-2 py-1 rounded">Remover</button>
            </div>
          </div>
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900 shadow" title="Foto OK" />
        </>
      ) : (
        <div onClick={onCapture} className="flex flex-col items-center justify-center p-3 w-full h-full min-h-[100px] cursor-pointer">
          <div className="text-2xl mb-1">📸</div>
          <div className="text-[9px] font-black uppercase text-center leading-tight text-slate-500">Tirar foto · {label}</div>
          <div className="text-[8px] text-slate-600 mt-0.5">Toque para abrir a câmera</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Definir Rota do Dia</h2>
          <p className="text-slate-500 text-sm">Inspeção e destino para {session.placa}</p>
        </div>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-200">Cancelar</button>
      </div>

      <Card className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados da Rota */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">Destino da Operação</h3>
            
            <Select 
              label="CLIENTE" 
              value={clienteId} 
              onChange={setClienteId} 
              options={customers.filter(c => c.ativo).map(c => ({ label: c.nome, value: c.id }))}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="DESTINO" 
                value={destino} 
                onChange={setDestino} 
                required 
                placeholder="Ex: Barueri / SP" 
              />
              <Input 
                label="OC (Ordem de Carga)" 
                value={oc} 
                onChange={setOc} 
                required 
                placeholder="Ex: OC-4582" 
              />
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCaptured}
            aria-hidden
          />

          {/* Avaria nova */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">Avaria nova</h3>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setAvariaNova(false); setAvariaDescricao(''); setAvariaFoto(null); }}
                className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${!avariaNova ? 'border-emerald-600 bg-emerald-950/20 text-emerald-400' : 'border-slate-800 bg-slate-950 text-slate-500'}`}
              >
                <span className="font-bold text-[10px] uppercase">Não</span>
                {!avariaNova && <span className="text-lg font-black">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => setAvariaNova(true)}
                className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${avariaNova ? 'border-amber-600 bg-amber-950/20 text-amber-400' : 'border-slate-800 bg-slate-950 text-slate-500'}`}
              >
                <span className="font-bold text-[10px] uppercase">Sim</span>
                {avariaNova && <span className="text-lg font-black">✓</span>}
              </button>
            </div>
            {avariaNova && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <Input
                  label="Qual avaria?"
                  value={avariaDescricao}
                  onChange={setAvariaDescricao}
                  placeholder="Descreva a avaria (ex: amassado lateral esquerda)"
                />
                <div>
                  <label className="block text-slate-400 text-[10px] font-black mb-1.5 uppercase tracking-wider">Foto da avaria</label>
                  <PhotoSlot
                    label="Foto da avaria"
                    value={avariaFoto}
                    onCapture={() => openCamera(setAvariaFoto)}
                    onClear={() => setAvariaFoto(null)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Níveis Técnicos Separados (opcional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Nível de Óleo */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">Nível de Óleo do Motor (opcional)</h3>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setNivelOleo('no_nivel')}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${nivelOleo === 'no_nivel' ? 'border-blue-600 bg-blue-900/20 text-blue-400' : 'border-slate-800 bg-slate-950 text-slate-500'}`}
                >
                  <span className="font-bold text-[10px] uppercase">No Nível</span>
                  <span className="text-lg font-black">{nivelOleo === 'no_nivel' ? 'X' : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNivelOleo('abaixo_do_nivel')}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${nivelOleo === 'abaixo_do_nivel' ? 'border-red-600 bg-red-900/20 text-red-400' : 'border-slate-800 bg-slate-950 text-slate-500'}`}
                >
                  <span className="font-bold text-[10px] uppercase">Abaixo do Nível</span>
                  <span className="text-lg font-black">{nivelOleo === 'abaixo_do_nivel' ? 'X' : ''}</span>
                </button>
              </div>
            </div>

            {/* Nível de Água */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest border-b border-slate-800 pb-2">Nível de Água (Arrefecimento) (opcional)</h3>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setNivelAgua('no_nivel')}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${nivelAgua === 'no_nivel' ? 'border-blue-600 bg-blue-900/20 text-blue-400' : 'border-slate-800 bg-slate-950 text-slate-500'}`}
                >
                  <span className="font-bold text-[10px] uppercase">No Nível</span>
                  <span className="text-lg font-black">{nivelAgua === 'no_nivel' ? 'X' : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNivelAgua('abaixo_do_nivel')}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${nivelAgua === 'abaixo_do_nivel' ? 'border-red-600 bg-red-900/20 text-red-400' : 'border-slate-800 bg-slate-950 text-slate-500'}`}
                >
                  <span className="font-bold text-[10px] uppercase">Abaixo do Nível</span>
                  <span className="text-lg font-black">{nivelAgua === 'abaixo_do_nivel' ? 'X' : ''}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-slate-500 text-center mb-4">Preencha cliente, destino e OC. Fotos e níveis são opcionais.</p>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!canSubmit}
              className={`relative w-full p-6 text-sm font-black uppercase tracking-widest rounded-2xl border-b-4 flex flex-col items-center justify-center gap-4 transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${canSubmit ? 'bg-blue-700 hover:bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-100'}`}
            >
              INICIAR ROTA
            </button>
          </div>
        </form>
      </Card>
    </div>
