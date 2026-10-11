import { ArrowRight, BookOpen, BriefcaseBusiness, Scale, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return <main className="public-page">
    <nav className="public-nav"><Link to="/" className="public-brand"><Scale size={22} /> LegalIt</Link><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link className="btn btn-primary" to="/login">Open LegalIt</Link></div></nav>
    <section className="public-hero"><div><span className="auth-eyebrow"><ShieldCheck size={14} /> Legal work, clearly organized</span><h1>One secure legal workspace for clients and advocates.</h1><p>Manage matters, consultations, documents, deadlines, messages, verified lawyer discovery, and source-backed Indian legal research.</p><div className="public-actions"><Link className="btn btn-primary" to="/login">Create an account <ArrowRight size={17} /></Link><Link className="btn btn-secondary" to="/login">Sign in</Link></div></div><div className="public-feature-grid"><article><Users /><h2>For clients</h2><p>Find verified professionals, submit a matter, share documents, and follow updates.</p></article><article><BriefcaseBusiness /><h2>For advocates</h2><p>Manage clients, cases, private notes, tasks, appointments, and requests.</p></article><article><BookOpen /><h2>Legal research</h2><p>Search indexed sources and receive answers whose citations are checked against retrieved records.</p></article></div></section>
    <footer className="public-footer">Legal information on LegalIt is informational and does not replace advice from a qualified advocate.</footer>
  </main>;
}

export function PrivacyPage() {
  return <PolicyPage title="Privacy policy"><p>LegalIt stores account, case, consultation, document, and activity information needed to provide the service. Access is limited by role and case membership. Uploaded files are stored privately and served only through authenticated endpoints.</p><p>Local installations are controlled by their operator. Operators must configure retention, backups, legal basis, incident handling, and contact information before serving real users.</p></PolicyPage>;
}

export function TermsPage() {
  return <PolicyPage title="Terms of use"><p>Use LegalIt only for lawful legal-service and information workflows. Do not upload material you are not authorized to process.</p><p>AI and search results are informational. Verify applicable law, source currency, and professional obligations before relying on a result.</p></PolicyPage>;
}

function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="policy-page"><Link to="/" className="public-brand"><Scale size={22} /> LegalIt</Link><article><h1>{title}</h1>{children}<Link to="/">Return home</Link></article></main>;
}
