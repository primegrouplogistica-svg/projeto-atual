
import React, { useState } from 'react';
import { User } from '../types';
import { Card, Input, BigButton, Logo } from '../components/UI';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  syncStatus: string;
  syncError?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const inputUser = username.trim().toLowerCase();
      const inputPass = password.trim();

      if (!users.length) {
        setError('Nenhum usuário carregado. Aguarde ou verifique a conexão.');
        setIsLoading(false);
        return;
      }

      const user = users.find(u => {
        const uNome = (u.nome ?? '').trim().toLowerCase();
        const uEmail = (u.email ?? '').trim().toLowerCase();
        return (uNome === inputUser || uEmail === inputUser) && u.ativo;
      });

      if (user) {
        const senhaSalva = (user.senha ?? '').trim();
        if (senhaSalva === inputPass) {
          onLogin(user);
        } else {
          setError('Senha incorreta.');
        }
      } else {
        setError('Usuário não encontrado ou inativo.');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto py-12 animate-fadeIn">
      <div className="text-center mb-10">
        <Logo size="lg" />
        <p className="text-slate-400 mt-4 font-medium uppercase text-[10px] tracking-widest">Sistema de Gestão de Frotas</p>
      </div>

      <Card className="border-slate-800 shadow-2xl shadow-blue-900/5">
        <form onSubmit={handleLoginAttempt} className="space-y-5">
          <Input 
            label="Usuário ou E-mail" 
            type="text" 
            value={username} 
            onChange={setUsername} 
            required 
            placeholder="Seu nome ou e-mail"
          />
          
          <Input 
            label="Senha" 
            type="password" 
            value={password} 
            onChange={setPassword} 
            required 
            placeholder="••••••••"
          />

          {error && (
            <div className="bg-red-900/20 border border-red-900/30 p-3 rounded-lg text-red-500 text-[10px] font-black uppercase text-center">
              {error}
            </div>
          )}

          <div className="pt-2">
            <BigButton 
              type="submit"
              onClick={() => {}} 
              variant="primary" 
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? 'VERIFICANDO...' : 'ENTRAR NO SISTEMA'}
            </BigButton>
          </div>
        </form>
      </Card>
      
      <div className="mt-12 text-center">
        <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em]">PRIME GROUP &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Login;
