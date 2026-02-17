
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Card, Badge, Input, Select, BigButton } from '../components/UI';

interface UserMgmtProps {
  users: User[];
  onSaveUser: (user: User) => Promise<void>;
  onBack: () => void;
}

const PERMISSION_GROUPS = [
  {
    title: 'Controle & Auditoria',
    perms: [
      { id: 'admin-pending', label: 'Pendências (Abast./Manut./Finan.)' },
      { id: 'admin-tracking', label: 'Rastreamento de Frota' },
      { id: 'admin-driver-live', label: 'Localização motoristas (tempo real)' },
      { id: 'admin-dashboard', label: 'Dashboard Global' },
      { id: 'admin-checklists', label: 'Checklist / Fotos de Inspeção' },
    ]
  },
  {
    title: 'Operacional & Lançamentos',
    perms: [
      { id: 'admin-create-route', label: 'Lançar Rota Manual (Motorista)' },
      { id: 'admin-fueling', label: 'Lançar Combustível' },
      { id: 'admin-agregado-freight', label: 'Lançar Frete Agregado' },
      { id: 'admin-tolls', label: 'Gestão de Pedágios' },
    ]
  },
  {
    title: 'Relatórios Financeiros',
    perms: [
      { id: 'admin-consolidated-finance', label: 'Faturamento e Lucro Geral' },
      { id: 'admin-vehicle-report', label: 'Desempenho por Veículo' },
      { id: 'admin-agregado-report', label: 'Relatório de Agregados' },
      { id: 'admin-activity-report', label: 'Relatório por Colaborador' },
      { id: 'admin-fixed-expenses', label: 'Gestão de Despesas Fixas' },
    ]
  },
  {
    title: 'Frota & Manutenção',
    perms: [
      { id: 'admin-maintenance-done', label: 'Manutenções feitas (adicionar / listar)' },
      { id: 'admin-preventive', label: 'Plano de Manutenção Preventiva' },
      { id: 'admin-maintenance-history', label: 'Histórico de Manutenções' },
      { id: 'vehicle-mgmt', label: 'Gestão de Veículos (Frota)' },
    ]
  },
  {
    title: 'Cadastros & Equipe',
    perms: [
      { id: 'admin-agregado-mgmt', label: 'Cadastrar Agregados' },
      { id: 'admin-customers', label: 'Gestão de Clientes' },
      { id: 'user-mgmt', label: 'Gestão de Equipe (Usuários)' },
    ]
  }
];

const UserManagement: React.FC<UserMgmtProps> = ({ users, onSaveUser, onBack }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<UserRole>(UserRole.MOTORISTA);
  const [senha, setSenha] = useState('');
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setNome(''); setEmail(''); setPerfil(UserRole.MOTORISTA); setSenha(''); setPermissoes([]); setEditingUser(null); setShowForm(false);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user); 
    setNome(user.nome); 
    setEmail(user.email); 
    setPerfil(user.perfil); 
    setSenha(user.senha || ''); 
    setPermissoes(user.permissoes || []); 
    setShowForm(true);
  };

  const togglePermission = (permId: string) => {
    setPermissoes(prev => prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]);
  };

  const selectAllPermissions = () => {
    const all = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.id));
    setPermissoes(all);
  };

  const clearAllPermissions = () => setPermissoes([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !senha) return alert('Nome e Senha são obrigatórios');
    setIsSaving(true);
    const userToSave: User = {
      id: editingUser?.id || crypto.randomUUID(),
      nome, 
      email, 
      senha, 
      perfil, 
      ativo: editingUser ? editingUser.ativo : true,
      permissoes: perfil === UserRole.CUSTOM_ADMIN ? permissoes : undefined
    };
    await onSaveUser(userToSave);
    setIsSaving(false);
    resetForm();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Gestão de Equipe</h2>
          <p className="text-slate-500 text-sm italic">Defina perfis e permissões de acesso</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowForm(!showForm)} 
            className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${showForm ? 'bg-red-900/40 text-red-400 border border-red-900/50' : 'bg-blue-700 text-white shadow-blue-900/20'}`}
          >
            {showForm ? 'Cancelar' : '+ Novo Colaborador'}
          </button>
          <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl font-bold border border-slate-700 transition-colors">Voltar</button>
        </div>
      </div>

      {showForm && (
        <Card className="border-blue-900/50 animate-slideDown shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Nome Completo" value={nome} onChange={setNome} required placeholder="Ex: Marcos Silva" />
              <Input label="E-mail / Login" value={email} onChange={setEmail} placeholder="marcos@prime.com" />
              <Select 
                label="Perfil de Acesso" 
                value={perfil} 
                onChange={(v) => setPerfil(v as UserRole)} 
                options={[
                  { label: 'Admin Total (Master)', value: UserRole.ADMIN },
                  { label: 'Admin Alternativo (Custom)', value: UserRole.CUSTOM_ADMIN },
                  { label: 'Motorista', value: UserRole.MOTORISTA },
                  { label: 'Ajudante', value: UserRole.AJUDANTE },
                ]} 
                required 
              />
              <Input label="Senha de Acesso" type="text" value={senha} onChange={setSenha} required placeholder="Mínimo 3 caracteres" />
            </div>

            {perfil === UserRole.CUSTOM_ADMIN && (
              <div className="space-y-6 animate-slideDown">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Permissões do Admin Alternativo</h3>
                  <div className="flex gap-3">
                    <button type="button" onClick={selectAllPermissions} className="text-[10px] font-black uppercase text-emerald-500 hover:underline">Selecionar Todas</button>
                    <button type="button" onClick={clearAllPermissions} className="text-[10px] font-black uppercase text-red-500 hover:underline">Limpar Todas</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PERMISSION_GROUPS.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.title}</h4>
                      <div className="space-y-2">
                        {group.perms.map(p => (
                          <label key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${permissoes.includes(p.id) ? 'bg-blue-900/20 border-blue-900/50 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500" 
                              checked={permissoes.includes(p.id)} 
                              onChange={() => togglePermission(p.id)} 
                            />
                            <span className="text-[11px] font-bold leading-tight">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800">
              <BigButton onClick={() => {}} variant="primary" disabled={isSaving}>
                {isSaving ? 'PROCESSANDO...' : editingUser ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR CADASTRO'}
              </BigButton>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.sort((a,b) => a.nome.localeCompare(b.nome)).map(u => (
          <Card key={u.id} className={`border-l-4 group hover:bg-slate-900/70 transition-all ${u.ativo ? 'border-l-blue-600' : 'border-l-red-900'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-black text-slate-100 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{u.nome}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{u.email || 'Sem email cadastrado'}</div>
              </div>
              <Badge status={u.ativo ? 'rodando' : 'rejeitado'}>{u.perfil}</Badge>
            </div>
            
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-4 flex justify-between items-center">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Senha:</span>
              <span className="font-mono text-sm text-slate-300 font-bold tracking-widest">{u.senha}</span>
            </div>

            {u.perfil === UserRole.CUSTOM_ADMIN && (
               <div className="mb-4">
                 <div className="text-[9px] text-slate-600 font-black uppercase mb-1">Acessos: {u.permissoes?.length || 0} módulos</div>
                 <div className="flex flex-wrap gap-1">
                    {u.permissoes?.slice(0, 3).map(p => (
                      <span key={p} className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-bold uppercase">
                        {PERMISSION_GROUPS.flatMap(g => g.perms).find(x => x.id === p)?.label.split(' ')[0] || p}
                      </span>
                    ))}
                    {(u.permissoes?.length || 0) > 3 && <span className="text-[8px] text-slate-600 font-bold">... +{u.permissoes!.length - 3}</span>}
                 </div>
               </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => handleEditClick(u)} className="flex-1 py-2.5 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Editar</button>
              <button 
                onClick={async () => await onSaveUser({...u, ativo: !u.ativo})} 
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${u.ativo ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40'}`}
              >
                {u.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
