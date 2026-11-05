import { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { Spinner } from './States';
import { useSite } from '../context/SiteContext';
import { useUI } from '../context/UIContext';
import { api, errorMessage } from '../services/api';
import { ORDER_STATUSES, type Order } from '../types';

// Forward-only delivery flow (Cancelled has its own action); 'Shipped' = old name of Out for Delivery
export const FLOW = ORDER_STATUSES.filter((s) => s !== 'Cancelled');
export const step = (s: string) => FLOW.indexOf((s === 'Shipped' ? 'Out for Delivery' : s) as (typeof FLOW)[number]);
/** The one status an order can move to next, or null when it is Delivered / Cancelled. */
export const nextStatus = (s: string) => (step(s) >= 0 && step(s) < FLOW.length - 1 ? FLOW[step(s) + 1] : null);

type DialogProps = { order: Order; onClose: () => void; onSaved: (saved: Order) => void; onConflict?: () => void }; // onConflict: reload after the server rejects an action

/** Sends one order action. The screen only changes once the backend returns the saved order. */
function useOrderAction({ onSaved, onConflict }: Pick<DialogProps, 'onSaved' | 'onConflict'>) {
  const { toast } = useUI();
  const [busy, setBusy] = useState(false);
  async function run(req: () => Promise<{ data: Order }>, done: string) {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await req();
      toast(done);
      onSaved(data);
    } catch (e) {
      // The server rejected it: 409 = lost a race; 400 is usually a stale screen (someone already moved the order).
      // Either way, show the reason and reload the saved order so the screen matches the database again.
      const rejected = axios.isAxiosError(e) && e.response;
      toast(rejected && e.response!.status === 409 ? `${errorMessage(e)} Showing the latest order data.` : errorMessage(e), 'error');
      if (rejected) onConflict?.();
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

/** Confirm a move to the next status, with an optional note. Never touches payment. */
export function StatusChangeDialog({ order, status, ...props }: DialogProps & { status: string }) {
  const [note, setNote] = useState('');
  const { busy, run } = useOrderAction(props);
  return (
    <Modal title={`Update order ${order.orderNumber}?`} onClose={() => !busy && props.onClose()}>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge status={order.status} /> <span className="text-muted">→</span> <StatusBadge status={status} />
      </p>
      <label htmlFor="status-note" className="label mt-4">Note (optional)</label>
      <input id="status-note" className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called customer to confirm" autoFocus />
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-outline btn-sm" disabled={busy} onClick={props.onClose}>Keep as is</button>
        <button className="btn-primary btn-sm" disabled={busy} onClick={() => run(() => api.patch<Order>(`/orders/${order._id}`, { status, note }), `Order marked ${status}`)}>
          {busy && <Spinner className="size-4" />} Mark {status}
        </button>
      </div>
    </Modal>
  );
}

/** Cancel with a required reason; Out for Delivery orders also need an explicit acknowledgement. */
export function CancelOrderDialog({ order, ...props }: DialogProps) {
  const { money } = useSite();
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const { busy, run } = useOrderAction(props);
  const outForDelivery = step(order.status) === step('Out for Delivery');
  return (
    <Modal title={`Cancel order ${order.orderNumber}?`} onClose={() => !busy && props.onClose()}>
      <dl className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-mist p-4 text-sm">
        <div><dt className="text-muted">Order</dt><dd className="font-semibold">{order.orderNumber}</dd></div>
        <div><dt className="text-muted">Total</dt><dd className="font-semibold">{money(order.total)}</dd></div>
      </dl>
      <label htmlFor="cancel-reason" className="label">Cancellation reason</label>
      <textarea id="cancel-reason" className="input" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer asked to cancel" autoFocus />
      {outForDelivery && (
        <label className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <input type="checkbox" className="mt-0.5 accent-ocean" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          This order is out for delivery. I confirm the delivery team has been told and the goods are coming back.
        </label>
      )}
      <p className="mt-3 text-xs text-muted">Stock is returned to inventory{order.paymentStatus === 'pending' ? ' and the payment is marked Cancelled' : ''}. This can't be undone.</p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-outline btn-sm" disabled={busy} onClick={props.onClose}>Keep order</button>
        <button className="btn-danger btn-sm" disabled={busy || reason.trim().length < 3 || (outForDelivery && !ack)}
          onClick={() => run(() => api.post<Order>(`/orders/${order._id}/cancel`, { reason }), 'Order cancelled')}>
          {busy && <Spinner className="size-4" />} Cancel order
        </button>
      </div>
    </Modal>
  );
}
