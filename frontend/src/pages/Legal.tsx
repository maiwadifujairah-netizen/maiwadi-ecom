import { useMeta } from '../hooks/useMeta';
import { useSite } from '../context/SiteContext';
import PageHeader from '../components/PageHeader';

// ponytail: plain-language summaries of how this site works; have them reviewed before treating them as legal text.
const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['What we collect', 'When you order, create an account or contact us, we collect your name, email, phone number and delivery address.'],
      ['How we use it', 'Only to process and deliver your orders, manage your account and reply to your messages. We do not sell your data.'],
      ['Payments', 'Online payments are processed securely by Razorpay. We never see or store your full card details.'],
      ['Cookies & storage', 'We use a sign-in cookie to keep you logged in and your browser storage to remember your cart.'],
      ['Your choices', 'Contact us at any time to update or delete your personal information.'],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: [
      ['Orders', 'All orders are subject to product availability. We will contact you if an item cannot be supplied.'],
      ['Prices', 'Prices are shown in UAE dirhams (AED) and may change without notice. The price at checkout applies to your order.'],
      ['Delivery', 'We deliver across Fujairah. Delivery times are estimates and may vary with demand and conditions.'],
      ['Payment', 'You can pay online or cash on delivery where offered.'],
      ['Water cans', 'Reusable water cans remain the property of MAI WADI unless agreed otherwise, and should be returned in good condition.'],
    ],
  },
} as const;

export default function Legal({ page }: { page: keyof typeof CONTENT }) {
  const c = CONTENT[page];
  const { settings: s } = useSite();
  useMeta(c.title);
  return (
    <>
      <PageHeader crumb={c.title} title={c.title} />
      <section className="container-x max-w-3xl pb-20">
        <div className="card space-y-7 p-6 sm:p-10">
          {c.sections.map(([h, t]) => (
            <div key={h}>
              <h2 className="text-xl font-bold">{h}</h2>
              <p className="mt-2 leading-relaxed text-muted">{t}</p>
            </div>
          ))}
          <p className="border-t border-slate-100 pt-6 text-sm text-muted">Questions? Call {s.mobile || s.phone || 'us'} or use our contact page.</p>
        </div>
      </section>
    </>
  );
}
