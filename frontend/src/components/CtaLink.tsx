import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isExternal } from '../utils/format';

/** Admin-configured button link: internal paths use the router, http(s) URLs open in a new tab. */
export default function CtaLink({ to, className, children }: { to: string; className: string; children: ReactNode }) {
  return isExternal(to)
    ? <a href={to} target="_blank" rel="noopener" className={className}>{children}</a>
    : <Link to={to} className={className}>{children}</Link>;
}
