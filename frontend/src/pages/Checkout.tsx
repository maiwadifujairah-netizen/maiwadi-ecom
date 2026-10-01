import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, Lock } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { useFetch } from '../hooks/useFetch';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../services/api';
import { Img, Spinner } from '../components/States';
import { EMAIL_RE } from './Contact';
import type { Order } from '../types';

type Form = { name: string; email: string; phone: string; line1: string; line2: string; area: string; city: string; state: string; postalCode: string; notes: string };
type PaymentInit = { keyId: string; razorpayOrderId: string; amount: number; currency: string };

type RazorpayFailure = { error?: { description?: string } };
declare global { interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (event: 'payment.failed', cb: (r: RazorpayFailure) => void) => void } } }

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function Checkout() {
  useMeta('Checkout');
  const { items, subtotal, clear } = useCart();
  const { money, settings } = useSite();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: payCfg } = useFetch<{ methods: ('cod' | 'razorpay')[] }>('/orders/payment-config');
  const [method, setMethod] = useState<'cod' | 'razorpay'>('cod');
  const [form, setForm] = useState<Form>({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', line1: '', line2: '', area: '', city: '', state: '', postalCode: '', notes: '' });
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  // One id per visit to checkout: re-submitting (double click, retry after a closed payment window,
  // switching to cash on delivery) reuses the same order on the server instead of creating another.
  const [checkoutId] = useState(() => crypto.randomUUID());
  const [paymentPending, setPaymentPending] = useState(false);

  if (!items.length && !busy) return <Navigate to="/cart" replace />;

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Partial<Form> = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!/^[+\d][\d\s-]{6,19}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
    if (form.line1.trim().length < 3) e.line1 = 'Enter your delivery address';
    if (form.city.trim().length < 2) e.city = 'Enter your city';
    if (form.state.trim().length < 2) e.state = 'Enter your emirate / state';
    if (form.postalCode.trim() && !/^[A-Za-z\d\s-]{3,12}$/.test(form.postalCode.trim())) e.postalCode = 'Enter a valid postal code';
    setErrors(e);
    return !Object.keys(e).length;
  }

  const done = (order: Order) => {
    clear();
    navigate(`/order-confirmation/${order.orderNumber}`, { state: { order }, replace: true });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setServerError('');
    try {
      const { data } = await api.post<{ order: Order; payment: PaymentInit | null }>('/orders', {
        checkoutId,
        customer: { name: form.name, email: form.email, phone: form.phone },
        address: { line1: form.line1, line2: form.line2, area: form.area, city: form.city, state: form.state, postalCode: form.postalCode, notes: form.notes },
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: method,
      });
      if (!data.payment) return done(data.order);

      if (!(await loadRazorpay()) || !window.Razorpay) throw new Error('Could not load the payment window. Please try again.');
      const rzp = new window.Razorpay({
        key: data.payment.keyId,
        order_id: data.payment.razorpayOrderId,
        amount: data.payment.amount,
        currency: data.payment.currency,
        name: settings.siteName,
        description: `Order ${data.order.orderNumber}`,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#078FC4' },
        timeout: 900, // seconds; well inside the server's 30-minute stock hold
        handler: async (resp: Record<string, string>) => {
          try {
            const r = await api.post<{ order: Order }>(`/orders/${data.order._id}/verify-payment`, resp);
            done(r.data.order);
          } catch (err) {
            setServerError(`${errorMessage(err)} Order ${data.order.orderNumber}.`);
            setPaymentPending(true);
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setServerError(`Payment was not completed and you have not been charged. Try again, or choose cash on delivery to keep order ${data.order.orderNumber}.`);
            setPaymentPending(true);
            setBusy(false);
          },
        },
      });
      // Razorpay keeps its window open so the customer can retry with another method; show why it failed
      rzp.on('payment.failed', (r) => setServerError(`Payment failed: ${r.error?.description || 'declined'}. You can retry in the payment window.`));
      rzp.open();
    } catch (err) {
      setServerError(err instanceof Error && !('isAxiosError' in err) ? err.message : errorMessage(err));
      setBusy(false);
    }
  }

  const input = (k: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} className="input" value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} {...props} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  const methods = payCfg?.methods ?? ['cod'];
  const total = subtotal + settings.deliveryFee;

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="text-4xl font-bold">Checkout</h1>
      {!user && <p className="mt-2 text-sm text-muted">Have an account? <Link to="/login?next=/checkout" className="font-semibold text-ocean">Sign in</Link> to track your orders.</p>}
      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <fieldset className="card grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <legend className="sr-only">Contact details</legend>
            <h2 className="text-lg font-semibold sm:col-span-2">Contact details</h2>
            <div className="sm:col-span-2">{input('name', 'Full name', { autoComplete: 'name' })}</div>
            {input('email', 'Email', { type: 'email', autoComplete: 'email' })}
            {input('phone', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '05X XXX XXXX' })}
          </fieldset>
          <fieldset className="card grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <legend className="sr-only">Delivery address</legend>
            <h2 className="text-lg font-semibold sm:col-span-2">Delivery address</h2>
            <div className="sm:col-span-2">{input('line1', 'Building / villa & street', { autoComplete: 'address-line1' })}</div>
            <div className="sm:col-span-2">{input('line2', 'Apartment, floor, landmark (optional)', { autoComplete: 'address-line2' })}</div>
            {input('area', 'Area (optional)')}
            {input('city', 'City', { autoComplete: 'address-level2' })}
            {input('state', 'Emirate / State', { autoComplete: 'address-level1' })}
            {input('postalCode', 'Postal code (optional)', { autoComplete: 'postal-code', inputMode: 'text' })}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="label">Delivery notes (optional)</label>
              <textarea id="notes" rows={3} className="input" value={form.notes} onChange={set('notes')} placeholder="Preferred delivery time, gate code…" />
            </div>
          </fieldset>
          <fieldset className="card p-6 sm:p-8">
            <legend className="sr-only">Payment method</legend>
            <h2 className="text-lg font-semibold">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {methods.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${method === m ? 'border-ocean bg-mist' : 'border-slate-100 hover:border-ocean/40'}`}>
                  <input type="radio" name="method" className="accent-ocean" checked={method === m} onChange={() => setMethod(m)} />
                  {m === 'cod' ? <Banknote className="size-5 text-ocean" /> : <CreditCard className="size-5 text-ocean" />}
                  <span className="text-sm font-semibold">{m === 'cod' ? 'Cash on delivery' : 'Pay online (Razorpay)'}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="h-fit rounded-3xl bg-mist p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3 text-sm">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-white"><Img src={i.image} alt="" className="size-full object-contain p-1 mix-blend-multiply" /></div>
                <span className="flex-1">{i.name} <span className="text-muted">× {i.quantity}</span></span>
                <span className="font-semibold">{money(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-ocean/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{settings.deliveryFee > 0 ? money(settings.deliveryFee) : 'Free'}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="font-display text-xl font-bold text-deep">{money(total)}</dd></div>
          </dl>
          {serverError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
          <button type="submit" className="btn-primary mt-6 w-full py-4" disabled={busy}>
            {busy ? <><Spinner className="size-4" /> {method === 'razorpay' ? 'Processing payment…' : 'Placing order…'}</>
              : <><Lock className="size-4" /> {method === 'razorpay' ? (paymentPending ? 'Retry payment' : 'Pay now') : 'Place order'}</>}
          </button>
          <p className="mt-3 text-center text-xs text-muted">Final prices and stock are confirmed when you place the order.</p>
        </aside>
      </form>
    </div>
  );
}
