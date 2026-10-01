import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';
import Logo from '../components/Logo';
import { Spinner } from '../components/States';

export default function Login({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  useMeta(isRegister ? 'Create account' : 'Sign in');
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const next = useSearchParams()[0].get('next') || '/account';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (isRegister && form.password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true);
    setError('');
    try {
      await (isRegister ? register(form) : login(form.email, form.password));
      navigate(next, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="container-x flex justify-center py-14">
      <div className="card w-full max-w-md p-8">
        <Logo className="mx-auto h-16" />
        <h1 className="mt-6 text-center text-2xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1 text-center text-sm text-muted">{isRegister ? 'Track your orders and check out faster.' : 'Sign in to view your orders.'}</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {isRegister && (
            <div><label htmlFor="name" className="label">Full name</label><input id="name" required minLength={2} className="input" value={form.name} onChange={set('name')} autoComplete="name" /></div>
          )}
          <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="email" /></div>
          {isRegister && (
            <div><label htmlFor="phone" className="label">Phone (optional)</label><input id="phone" type="tel" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" /></div>
          )}
          <div><label htmlFor="password" className="label">Password</label><input id="password" type="password" required minLength={isRegister ? 8 : 1} className="input" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} /></div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner className="size-4" />} {isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {isRegister ? <>Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-ocean">Sign in</Link></>
            : <>New here? <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-ocean">Create an account</Link></>}
        </p>
      </div>
    </div>
  );
}
