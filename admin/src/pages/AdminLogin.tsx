import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage, SITE_URL } from '../services/api';
import Logo from '../components/Logo';
import { Spinner } from '../components/States';
import GoogleButton, { googleEnabled } from '../components/GoogleButton';

export default function AdminLogin() {
  const { user, login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user?.role === 'admin') return <Navigate to="/" replace />;

  // `credential` set = Google; the server only signs in existing admins via Google, the role check below is a second guard
  async function submit(e?: FormEvent, credential?: string) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await (credential ? loginWithGoogle(credential) : login(email, password));
      if (u.role !== 'admin') {
        await logout();
        throw new Error('This account does not have admin access.');
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error && !('isAxiosError' in err) ? err.message : errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-mist via-white to-mist p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-deep/10 ring-1 ring-slate-100">
        <Logo className="mx-auto h-20" />
        <h1 className="mt-6 text-center text-xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-center text-sm text-muted">Sign in to manage your store</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label htmlFor="password" className="label">Password</label><input id="password" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="size-4" /> : <Lock className="size-4" />} Sign in</button>
        </form>
        {googleEnabled && <>
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>
        {busy ? <p className="flex min-h-11 items-center justify-center gap-2 text-sm text-muted" role="status"><Spinner className="size-4" /> Signing in…</p>
          : <GoogleButton text="continue_with" onCredential={(c) => submit(undefined, c)} />}
        </>}
        <a href={SITE_URL} className="mt-6 block text-center text-sm text-muted hover:text-ocean">← Back to website</a>
      </div>
    </div>
  );
}
