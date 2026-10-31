import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BookOpen, BriefcaseBusiness, Settings, Award, Plus, Trash2, Save, Download, Upload, ShieldCheck, LayoutDashboard, RefreshCw, LogOut, Copy, FileText, Pencil, X} from 'lucide-react';
import { supabase, supabaseConfigError, supabaseProjectHost } from './supabaseClient.js';
import { describeSupabaseError, describeLoginError } from './supabaseErrors.js';
import { KEY, getEhoData } from './ehoData.js';

import BrandLogo from './BrandLogo.jsx';

function useMountedRef() {
 const ref = useRef(true);
 useEffect(() => { ref.current = true; return () => { ref.current = false; }; }, []);
 return ref;
}

function AuthShell({title, children, onSubmit}) {
 const body = <><BrandLogo size={84} className="auth-logo" /><h1>{title}</h1>{children}</>;
 return <div className="admin-auth-wrap">{onSubmit
  ? <form className="admin-auth-card" onSubmit={onSubmit} noValidate={false}>{body}</form>
  : <div className="admin-auth-card">{body}</div>}</div>;
}

function ProblemBox({problem}) {
 if (!problem) return null;
 return <div className="admin-error" role="alert"><p>{problem.message}</p>{problem.detail && <code className="admin-diag">Technical detail (shown only in development): {problem.detail}</code>}</div>;
}

/*
 * AdminGate — sign-in + administrator authorization for /admin.
 *
 * status values:
 *   unconfigured  → .env.local is missing / wrong
 *   loading       → waiting for Supabase to restore a saved login
 *   signed-out    → show the sign-in form
 *   checking      → signed in, asking the database is_eho_admin()
 *   authorized    → show the admin studio
 *   denied        → signed in, but this user is NOT in public.eho_admins
 *   error         → the check itself failed (network, missing SQL function, permissions…) — can be retried
 *
 * Why this is safe from the old "sometimes the admin page doesn't show / sometimes access denied" bugs:
 *   - only ONE source of auth events (onAuthStateChange, which also reports the initial session) — no duplicate checks;
 *   - every check gets a sequence number, so a slow old answer can never overwrite a newer one;
 *   - token refreshes / tab re-focus for the same user do NOT re-run the check or unmount the admin studio;
 *   - a failed check is shown as a retryable error, not silently as "access denied";
 *   - no state updates after the component unmounts (works with React Strict Mode).
 */
function AdminGate(){
 const mounted = useMountedRef();
 const [auth, setAuth] = useState(() => ({status: supabase ? 'loading' : 'unconfigured', session: null, problem: null}));
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const [copied, setCopied] = useState(false);
 const checkSeq = useRef(0);          // increases on every authorization check
 const verifiedUser = useRef(null);   // user id whose authorization result is already known
 const statusRef = useRef(auth.status);
 useEffect(() => { statusRef.current = auth.status; }, [auth.status]);

 const verifyAdmin = useCallback(async (session) => {
  const seq = ++checkSeq.current;
  const userId = session.user.id;
  setAuth({status: 'checking', session, problem: null});
  let next;
  try {
   const {data, error: rpcError} = await supabase.rpc('is_eho_admin');
   if (rpcError) next = {status: 'error', problem: describeSupabaseError(rpcError, 'administrator check')};
   else if (data === true) next = {status: 'authorized', problem: null};
   else if (data === false || data === null) next = {status: 'denied', problem: null};
   else next = {status: 'error', problem: {message: 'The database function is_eho_admin() returned an unexpected value. It must return true/false — run supabase/fix_admin_access.sql in the Supabase SQL Editor.', detail: import.meta.env.DEV ? `Received: ${JSON.stringify(data)}` : ''}};
  } catch (err) {
   next = {status: 'error', problem: describeSupabaseError(err, 'administrator check')};
  }
  if (!mounted.current || seq !== checkSeq.current) return; // a newer check or sign-out happened meanwhile
  if (next.status === 'error') console.error('[EHO admin] Administrator check failed:', next.problem.detail || next.problem.message);
  verifiedUser.current = next.status === 'error' ? null : userId;
  setAuth({status: next.status, session, problem: next.problem});
 }, [mounted]);

 const handleSession = useCallback((session) => {
  if (!mounted.current) return;
  if (!session) {
   checkSeq.current++; verifiedUser.current = null;
   setAuth({status: 'signed-out', session: null, problem: null});
   return;
  }
  if (verifiedUser.current === session.user.id) {
   // Same user (token refresh, tab re-focus…): keep the current screen, just store the fresh session.
   setAuth(prev => ({...prev, session}));
   return;
  }
  verifyAdmin(session);
 }, [mounted, verifyAdmin]);

 useEffect(() => {
  if (!supabase) return undefined;
  let active = true;
  // onAuthStateChange fires INITIAL_SESSION right away, so a separate getSession() call is not needed.
  const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
   // Supabase recommends not calling other Supabase methods inside this callback — defer the work.
   setTimeout(() => { if (active) handleSession(session); }, 0);
  });
  // Safety net: if the saved session could not be restored within 8 s, ask once more instead of loading forever.
  const fallback = setTimeout(async () => {
   if (!active || statusRef.current !== 'loading') return;
   try {
    const {data, error: sessionError} = await supabase.auth.getSession();
    if (!active) return;
    if (sessionError) setAuth({status: 'signed-out', session: null, problem: describeSupabaseError(sessionError, 'session restore')});
    else handleSession(data.session);
   } catch (err) {
    if (active) setAuth({status: 'signed-out', session: null, problem: describeSupabaseError(err, 'session restore')});
   }
  }, 8000);
  return () => { active = false; clearTimeout(fallback); subscription.unsubscribe(); };
 }, [handleSession]);

 const login = async (e) => {
  e.preventDefault();
  if (!supabase) return;
  setBusy(true); setError('');
  try {
   const {error: signInError} = await supabase.auth.signInWithPassword({email: email.trim(), password});
   if (signInError) { if (mounted.current) setError(describeLoginError(signInError)); }
   else if (mounted.current) setPassword('');
   // On success, onAuthStateChange (SIGNED_IN) runs the administrator check automatically.
  } catch (err) {
   if (mounted.current) setError(describeLoginError(err));
  } finally {
   if (mounted.current) setBusy(false);
  }
 };

 const signOut = async () => {
  setBusy(true);
  try {
   const {error: outError} = await supabase.auth.signOut();
   if (outError) await supabase.auth.signOut({scope: 'local'}); // still clear this browser if the server call failed
  } catch {
   try { await supabase.auth.signOut({scope: 'local'}); } catch (err) { console.error('[EHO admin] Sign-out failed:', err); }
  } finally {
   checkSeq.current++; verifiedUser.current = null;
   if (mounted.current) { setBusy(false); setAuth({status: 'signed-out', session: null, problem: null}); }
  }
 };

 const retry = () => { if (auth.session) { verifiedUser.current = null; verifyAdmin(auth.session); } };

 const copyId = async () => {
  try { await navigator.clipboard.writeText(auth.session?.user?.id || ''); setCopied(true); setTimeout(() => { if (mounted.current) setCopied(false); }, 2000); }
  catch { /* clipboard blocked — the ID is still visible on screen */ }
 };

 if (auth.status === 'unconfigured') return <AuthShell title="Admin sign-in setup">
  <p>The admin area needs your Supabase project keys before sign-in can work.</p>
  <div className="admin-error" role="alert"><p><b>Problem:</b> {supabaseConfigError || 'Supabase client could not be created.'}</p></div>
  <ol className="admin-steps">
   <li>Copy <code>.env.example</code> to a new file named <code>.env.local</code> in the project folder.</li>
   <li>Paste your <b>Project URL</b> and <b>anon / publishable key</b> from Supabase → Project Settings → API.</li>
   <li>Stop the dev server (Ctrl + C) and run <code>npm run dev</code> again.</li>
  </ol>
  <button className="admin-primary" type="button" onClick={() => window.open('/SUPABASE_SETUP.md', '_blank', 'noopener')}>Setup instructions</button>
 </AuthShell>;

 if (auth.status === 'loading') return <AuthShell title="Loading…"><p>Restoring your session.</p></AuthShell>;

 if (auth.status === 'signed-out') return <AuthShell title="Admin sign in" onSubmit={login}>
  <p>Authorised EHO administrators only.</p>
  <label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
  <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
  {error && <div className="admin-error" role="alert"><p>{error}</p></div>}
  {!error && <ProblemBox problem={auth.problem} />}
  <button className="admin-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
 </AuthShell>;

 if (auth.status === 'checking') return <AuthShell title="Checking administrator access…"><p>Signed in as {auth.session?.user?.email}. Confirming permissions with the database.</p></AuthShell>;

 if (auth.status === 'denied') return <AuthShell title="Administrator access required">
  <p>You are signed in as <b>{auth.session?.user?.email}</b>, but this account is not in the EHO administrator list (<code>public.eho_admins</code>).</p>
  <div className="admin-warning"><b>How to fix (project owner)</b>
   <p>In Supabase → SQL Editor of project <code>{supabaseProjectHost}</code>, run <code>supabase/grant_admin.sql</code> (put your admin email in it), or this line:</p>
   <code className="admin-diag">insert into public.eho_admins (user_id) values ('{auth.session?.user?.id}') on conflict (user_id) do nothing;</code>
   <p>Make sure this is the same Supabase project your <code>.env.local</code> points to.</p>
  </div>
  <div className="admin-form-actions">
   <button className="admin-primary" type="button" onClick={retry} disabled={busy}><RefreshCw size={15} /> Check again</button>
   <button className="admin-btn" type="button" onClick={copyId}><Copy size={15} /> {copied ? 'Copied' : 'Copy user ID'}</button>
   <button className="admin-btn" type="button" onClick={signOut} disabled={busy}><LogOut size={15} /> Sign out</button>
  </div>
 </AuthShell>;

 if (auth.status === 'error') return <AuthShell title="Could not verify administrator access">
  <p>Signed in as <b>{auth.session?.user?.email}</b>. The permission check did not complete, so access was not granted.</p>
  <ProblemBox problem={auth.problem} />
  {import.meta.env.DEV && <p className="admin-help">Connected Supabase project: <code>{supabaseProjectHost}</code></p>}
  <div className="admin-form-actions">
   <button className="admin-primary" type="button" onClick={retry} disabled={busy}><RefreshCw size={15} /> Try again</button>
   <button className="admin-btn" type="button" onClick={signOut} disabled={busy}><LogOut size={15} /> Sign out</button>
  </div>
 </AuthShell>;

 return <><div className="admin-auth-bar"><span>Signed in as {auth.session.user.email}</span><button className="admin-btn" onClick={signOut} disabled={busy}><LogOut size={15} /> Sign out</button></div><AdminWorkspace supabase={supabase}/></>;
}

const todayLocal=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const problemText=(p)=>p.message+(p.detail?` [${p.detail}]`:'');

function CertificateManager({supabase}){
 const mounted=useMountedRef();
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNoticeState]=useState(null),[query,setQuery]=useState(''),[status,setStatus]=useState('all'),[revoke,setRevoke]=useState(null);
 const [editing,setEditing]=useState(null),[editForm,setEditForm]=useState(null);
 const [signatureSettings,setSignatureSettings]=useState({mode:'typed',image_data_url:'',font_style:'script'}),[signatureBusy,setSignatureBusy]=useState(false),[signatureNotice,setSignatureNotice]=useState('');
 const [form,setForm]=useState({recipient_name:'',certificate_title:'Certificate of Achievement',program_name:'',issue_date:todayLocal(),completion_date:'',issuer_name:'EHO — Ethical Hacking Organizations',signatory_name:'',grade:'',duration:'',details:''});
 const setNotice=(text,type='success')=>setNoticeState(text?{text,type}:null);
 const load=useCallback(async()=>{setLoading(true);try{const {data,error}=await supabase.from('eho_certificates').select('certificate_id,recipient_name,certificate_title,program_name,issue_date,completion_date,issuer_name,signatory_name,grade,details,status,created_at,revoked_at,revocation_reason').order('created_at',{ascending:false}).limit(500);if(!mounted.current)return;if(error){console.error('[EHO admin] Loading certificates failed:',error);setNoticeState({type:'error',text:'Could not load certificates. '+problemText(describeSupabaseError(error,'certificate list'))});}else setRows(data||[]);}catch(err){console.error('[EHO admin] Loading certificates failed:',err);if(mounted.current)setNoticeState({type:'error',text:'Could not load certificates. '+problemText(describeSupabaseError(err,'certificate list'))});}finally{if(mounted.current)setLoading(false)}},[supabase,mounted]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{let alive=true;(async()=>{const {data,error}=await supabase.from('eho_certificate_signature_settings').select('mode,image_data_url,font_style').eq('id',true).maybeSingle();if(!alive)return;if(error){console.warn('[EHO admin] Signature settings are not available yet:',error.message);return;}if(data)setSignatureSettings({mode:data.mode||'typed',image_data_url:data.image_data_url||'',font_style:data.font_style||'script'});})();return()=>{alive=false}},[supabase]);
 const saveSignatureSettings=async()=>{setSignatureBusy(true);setSignatureNotice('');try{const {error}=await supabase.rpc('save_eho_certificate_signature_settings',{p_mode:signatureSettings.mode,p_image_data_url:signatureSettings.mode==='image'?signatureSettings.image_data_url:null,p_font_style:signatureSettings.font_style});if(error)throw error;setSignatureNotice('Signature settings saved. They will be used on newly printed certificates.');}catch(err){console.error('[EHO admin] Signature settings save failed:',err);setSignatureNotice('Could not save signature settings. Apply the signature migration in Supabase SQL Editor, then retry. '+(err.message||''));}finally{setSignatureBusy(false)}};
 const handleSignatureFile=async(e)=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setSignatureNotice('Please upload a PNG, JPG or WebP signature image.');return;}if(file.size>500*1024){setSignatureNotice('Signature image must be 500 KB or smaller.');return;}const reader=new FileReader();reader.onload=()=>setSignatureSettings(s=>({...s,mode:'image',image_data_url:String(reader.result)}));reader.onerror=()=>setSignatureNotice('Could not read that image.');reader.readAsDataURL(file)};
 const filtered=rows.filter(r=>(status==='all'||r.status===status)&&`${r.certificate_id} ${r.recipient_name} ${r.program_name}`.toLowerCase().includes(query.toLowerCase()));
 const issue=async(e)=>{e.preventDefault();setBusy(true);setNotice('');const payload={p_recipient_name:form.recipient_name.trim(),p_certificate_title:form.certificate_title.trim(),p_program_name:form.program_name.trim(),p_issue_date:form.issue_date,p_completion_date:form.completion_date||null,p_issuer_name:form.issuer_name.trim(),p_signatory_name:form.signatory_name.trim()||null,p_grade:form.grade.trim()||null,p_details:[form.duration.trim()?'Internship Duration: '+form.duration.trim():'',form.details.trim()].filter(Boolean).join('\n\n')||null};try{const {data,error}=await supabase.rpc('issue_eho_certificate',payload);if(!mounted.current)return;if(error){console.error('[EHO admin] Certificate issuance failed:',error);setNotice('Issuance failed: '+problemText(describeSupabaseError(error,'certificate issuance')),'error');return;}setNotice(`Certificate issued: ${data}`);setForm(f=>({...f,recipient_name:'',program_name:'',completion_date:'',signatory_name:'',grade:'',duration:'',details:''}));await load();}catch(err){console.error('[EHO admin] Certificate issuance failed:',err);if(mounted.current)setNotice('Issuance failed: '+problemText(describeSupabaseError(err,'certificate issuance')),'error');}finally{if(mounted.current)setBusy(false)}};
 const startEdit=(r)=>{setEditing(r.certificate_id);setEditForm({recipient_name:r.recipient_name||'',certificate_title:r.certificate_title||'Certificate of Achievement',program_name:r.program_name||'',issue_date:r.issue_date||todayLocal(),completion_date:r.completion_date||'',issuer_name:r.issuer_name||'EHO — Ethical Hacking Organizations',signatory_name:r.signatory_name||'',grade:r.grade||'',details:r.details||''});setNotice('');};
 const saveEdit=async(e)=>{e.preventDefault();if(!editing||!editForm)return;setBusy(true);setNotice('');try{const {data,error}=await supabase.rpc('update_eho_certificate',{p_certificate_id:editing,p_recipient_name:editForm.recipient_name.trim(),p_certificate_title:editForm.certificate_title.trim(),p_program_name:editForm.program_name.trim(),p_issue_date:editForm.issue_date,p_completion_date:editForm.completion_date||null,p_issuer_name:editForm.issuer_name.trim(),p_signatory_name:editForm.signatory_name.trim()||null,p_grade:editForm.grade.trim()||null,p_details:editForm.details.trim()||null});if(error)throw error;if(data!==true)throw new Error('The database did not confirm the certificate update.');setEditing(null);setEditForm(null);setNotice('Certificate updated. Its original ID, QR verification link and status were preserved.');await load();}catch(err){console.error('[EHO admin] Certificate update failed:',err);if(mounted.current)setNotice('Update failed: '+problemText(describeSupabaseError(err,'certificate update')),'error');}finally{if(mounted.current)setBusy(false)}};
 const revokeCertificate=async()=>{if(!revoke)return;if(revoke.reason.trim().length<5){setNotice('Please enter a revocation reason of at least 5 characters.','error');return;}setBusy(true);try{const {error}=await supabase.rpc('revoke_eho_certificate',{p_certificate_id:revoke.id,p_reason:revoke.reason.trim()});if(!mounted.current)return;if(error){console.error('[EHO admin] Revocation failed:',error);setNotice('Revocation failed: '+problemText(describeSupabaseError(error,'certificate revocation')),'error');return;}setRevoke(null);setNotice('Certificate revoked. Public verification will now show the revoked status.');await load();}catch(err){console.error('[EHO admin] Revocation failed:',err);if(mounted.current)setNotice('Revocation failed: '+problemText(describeSupabaseError(err,'certificate revocation')),'error');}finally{if(mounted.current)setBusy(false)}};
 const certificateHtml=(r)=>{const verifyUrl=`${window.location.origin}/verify/${encodeURIComponent(r.certificate_id)}`;return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(r.certificate_id)} — EHO Certificate</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Georgia,serif;color:#14213d;margin:0}.cert{min-height:180mm;border:8px double #b99a43;padding:22mm 18mm;text-align:center;position:relative}.logo{width:30mm;height:30mm;display:block;margin:0 auto 6px}.brand{font:700 17px Arial;letter-spacing:5px;color:#9c7a23}.kicker{font:12px Arial;letter-spacing:4px;margin-top:20px}.title{font-size:38px;margin:18px 0}.name{font-size:32px;color:#9c7a23;border-bottom:1px solid #c7b16f;display:inline-block;padding:0 28px 8px}.text{font-size:16px;line-height:1.7}.meta{font:12px Arial;margin-top:25px;display:flex;justify-content:space-between;text-align:left}.id{font:12px Arial;margin-top:18px}.qr{position:absolute;right:12mm;bottom:12mm;width:28mm;height:28mm}.note{font:10px Arial;margin-top:18px;color:#666;white-space:pre-wrap}.signature-image{display:block;max-width:42mm;max-height:18mm;object-fit:contain;margin:0 0 2px auto}.signature-script{font-family:'Segoe Script','Brush Script MT','Snell Roundhand',cursive;font-style:italic;font-size:27px;line-height:1.15;color:#172b49;text-align:right;margin:0 0 3px}@media print{button{display:none}}</style></head><body><div class="cert"><img class="logo" alt="EHO logo" src="${window.location.origin}/eho-logo.png"><div class="brand">EHO</div><div class="kicker">ETHICAL HACKING ORGANIZATIONS</div><h1 class="title">${escapeHtml(r.certificate_title||'Certificate')}</h1><p class="text">This certificate is presented to</p><div class="name">${escapeHtml(r.recipient_name)}</div><p class="text">in recognition of achievement in <b>${escapeHtml(r.program_name)}</b>${r.completion_date?`<br>Achievement Date: ${escapeHtml(r.completion_date)}`:''}.</p><div class="meta"><div>Certificate Date: ${escapeHtml(r.issue_date)}<br>Issuer: ${escapeHtml(r.issuer_name||'EHO')}</div><div>${r.signatory_name?(signatureSettings.mode==='image'&&signatureSettings.image_data_url?`<img class="signature-image" alt="Authorized signature" src="${signatureSettings.image_data_url}">`:`<div class="signature-script" style="${signatureSettings.font_style==='italic'?'font-family:Georgia,serif;font-style:italic;':'font-family:Segoe Script,Brush Script MT,cursive;font-style:italic;'}">${escapeHtml(r.signatory_name)}</div>`)+`Authorized signatory: ${escapeHtml(r.signatory_name)}`:''}${r.grade?`<br>Grade/score: ${escapeHtml(r.grade)}`:''}</div></div>${r.details?`<div class="note">${escapeHtml(r.details)}</div>`:''}<div class="id">Certificate ID: <b>${escapeHtml(r.certificate_id)}</b></div><img class="qr" alt="QR code for certificate verification" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&amp;data=${encodeURIComponent(verifyUrl)}"><div class="note">Scan the QR code or verify at ${escapeHtml(verifyUrl)}. Authenticity is determined by the official EHO verification record.</div></div><script>window.onload=()=>window.print()</script></body></html>`};
 const downloadCertificate=(r)=>{const w=window.open('','_blank');if(!w){setNotice('Allow pop-ups to print/download the certificate.','error');return;}w.document.write(certificateHtml(r));w.document.close()};
 return <div className="certificate-workspace">
  <div className="admin-stats"><div><span>Total certificates</span><b>{rows.length}</b><small>database records</small></div><div><span>Active</span><b>{rows.filter(r=>r.status==='issued').length}</b><small>currently valid</small></div><div><span>Revoked</span><b>{rows.filter(r=>r.status==='revoked').length}</b><small>retained for audit</small></div></div>
  {notice&&<div className={'admin-notice'+(notice.type==='error'?' is-error':'')} role={notice.type==='error'?'alert':'status'}>{notice.text}</div>}
  <div className="admin-panel-card"><h2>Issue a certificate</h2><p className="admin-help">A unique certificate ID is generated by a database function. Use the browser print dialog to save a printable certificate as PDF.</p><form onSubmit={issue}><div className="admin-form">
   <label>Recipient full name *<input required maxLength="160" value={form.recipient_name} onChange={e=>setForm({...form,recipient_name:e.target.value})}/></label>
   <label>Certificate title *<input required maxLength="180" value={form.certificate_title} onChange={e=>setForm({...form,certificate_title:e.target.value})}/></label>
   <label className="full">Course / internship / achievement *<input required maxLength="180" value={form.program_name} onChange={e=>setForm({...form,program_name:e.target.value})}/></label>
   <label>Certificate Date *<input type="date" required value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})}/><small className="admin-help">Choose any valid calendar date.</small></label>
   <label>Achievement Date<input type="date" value={form.completion_date} onChange={e=>setForm({...form,completion_date:e.target.value})}/><small className="admin-help">Optional. May be before, on, or after the Certificate Date.</small></label>
   <label>Issuing organization *<input required maxLength="180" value={form.issuer_name} onChange={e=>setForm({...form,issuer_name:e.target.value})}/></label>
   <label>Authorized signatory<input maxLength="160" value={form.signatory_name} onChange={e=>setForm({...form,signatory_name:e.target.value})}/></label>
   <label>Grade / score (optional)<input maxLength="80" value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})}/></label>\n   <label>Internship / program duration<input maxLength="80" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="3 Months"/></label>
   <label className="full">Additional details (optional)<textarea rows="2" maxLength="1000" value={form.details} onChange={e=>setForm({...form,details:e.target.value})}/></label>
  </div><div className="admin-form-actions"><button className="admin-primary" disabled={busy}>{busy?'Issuing…':'Issue certificate'}</button></div></form></div>
  <div className="admin-panel-card"><h2>Authorized signature</h2><p className="admin-help">Set the manager's signature once. This changes only the signature shown on printed certificates; the certificate layout, IDs and QR verification remain unchanged.</p><div className="admin-form"><label>Signature type<select value={signatureSettings.mode} onChange={e=>setSignatureSettings(s=>({...s,mode:e.target.value}))}><option value="typed">Stylish name (script font)</option><option value="image">Upload signature image</option></select></label>{signatureSettings.mode==='image'?<label>Signature image (PNG/JPG/WebP, max 500 KB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleSignatureFile}/></label>:<label>Font style<select value={signatureSettings.font_style} onChange={e=>setSignatureSettings(s=>({...s,font_style:e.target.value}))}><option value="script">Handwritten script</option><option value="italic">Elegant italic</option></select></label>}</div>{signatureSettings.mode==='image'&&signatureSettings.image_data_url&&<div className="admin-row"><img src={signatureSettings.image_data_url} alt="Signature preview" style={{maxWidth:220,maxHeight:90,objectFit:'contain'}}/><button type="button" className="icon-btn danger" onClick={()=>setSignatureSettings(s=>({...s,image_data_url:''}))}>Remove image</button></div>}{signatureNotice&&<div className="admin-notice" role="status">{signatureNotice}</div>}<div className="admin-form-actions"><button type="button" className="admin-primary" disabled={signatureBusy||(signatureSettings.mode==='image'&&!signatureSettings.image_data_url)} onClick={saveSignatureSettings}>{signatureBusy?'Saving…':'Save signature settings'}</button></div></div>
  <div className="admin-panel-card"><h2>Certificate records</h2><div className="certificate-filters"><input aria-label="Search certificates" placeholder="Search ID, recipient or program" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="issued">Active</option><option value="revoked">Revoked</option></select></div>
  {loading?<p>Loading certificate records…</p>:filtered.length===0?<p className="admin-help">No certificate records match this filter.</p>:filtered.map(r=><div className="admin-row cert-row" key={r.certificate_id}><div><b>{r.recipient_name}</b><small>{r.certificate_id} · {r.program_name} · Certificate Date: {r.issue_date}</small>{r.status==='revoked'&&<small>Revoked: {r.revocation_reason||'Reason not available'}</small>}</div><span className={'admin-pill '+(r.status==='issued'?'green':'')}>{r.status}</span><button className="icon-btn" onClick={()=>startEdit(r)}><Pencil size={14}/> Edit</button><button className="icon-btn" onClick={()=>downloadCertificate(r)}>Print / PDF</button>{r.status==='issued'&&<button className="icon-btn danger" onClick={()=>setRevoke({id:r.certificate_id,reason:''})}>Revoke</button>}</div>)}
  </div>
  {editing&&editForm&&<div className="admin-modal-backdrop"><form className="admin-modal" onSubmit={saveEdit}><div className="admin-toolbar"><h2>Edit issued certificate</h2><button type="button" className="icon-btn" aria-label="Close editor" onClick={()=>{setEditing(null);setEditForm(null)}}><X size={16}/></button></div><p>Correct the existing record for <b>{editing}</b>. The Certificate ID, QR link, issue status and revocation history cannot be changed here.</p><div className="admin-form"><label>Recipient full name *<input required maxLength="160" value={editForm.recipient_name} onChange={e=>setEditForm({...editForm,recipient_name:e.target.value})}/></label><label>Certificate title *<input required maxLength="180" value={editForm.certificate_title} onChange={e=>setEditForm({...editForm,certificate_title:e.target.value})}/></label><label className="full">Course / internship / achievement *<input required maxLength="180" value={editForm.program_name} onChange={e=>setEditForm({...editForm,program_name:e.target.value})}/></label><label>Certificate Date *<input type="date" required value={editForm.issue_date} onChange={e=>setEditForm({...editForm,issue_date:e.target.value})}/></label><label>Achievement Date<input type="date" value={editForm.completion_date} onChange={e=>setEditForm({...editForm,completion_date:e.target.value})}/></label><label>Issuing organization *<input required maxLength="180" value={editForm.issuer_name} onChange={e=>setEditForm({...editForm,issuer_name:e.target.value})}/></label><label>Authorized signatory<input maxLength="160" value={editForm.signatory_name} onChange={e=>setEditForm({...editForm,signatory_name:e.target.value})}/></label><label>Grade / score<input maxLength="80" value={editForm.grade} onChange={e=>setEditForm({...editForm,grade:e.target.value})}/></label><label className="full">Additional details / duration<textarea rows="3" maxLength="1000" value={editForm.details} onChange={e=>setEditForm({...editForm,details:e.target.value})}/></label></div><div className="admin-form-actions"><button className="admin-primary" disabled={busy}>{busy?'Saving…':'Save certificate changes'}</button><button type="button" className="admin-btn" disabled={busy} onClick={()=>{setEditing(null);setEditForm(null)}}>Cancel</button></div></form></div>}
  {revoke&&<div className="admin-modal-backdrop"><form className="admin-modal" onSubmit={e=>{e.preventDefault();revokeCertificate()}}><h2>Revoke certificate</h2><p>Certificate <b>{revoke.id}</b> will remain in the database but will no longer be valid.</p><label>Revocation reason *<textarea required minLength="5" maxLength="1000" value={revoke.reason} onChange={e=>setRevoke({...revoke,reason:e.target.value})}/></label><div className="admin-form-actions"><button className="admin-primary" disabled={busy}>Confirm revocation</button><button type="button" className="admin-btn" disabled={busy} onClick={()=>setRevoke(null)}>Cancel</button></div></form></div>}
 </div>
}

function OfferLetterManager({supabase}){
 const mounted=useMountedRef();
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null),[query,setQuery]=useState('');
 const [form,setForm]=useState({recipient_name:'',program_name:'Cybersecurity Internship Program',participation:'Cybersecurity project-based internship',duration:'3 Months',start_date:'',end_date:'',issue_date:todayLocal(),issuer_name:'EHO — Ethical Hacking Organizations',signatory_name:'',details:''});
 const load=useCallback(async()=>{setLoading(true);const {data,error}=await supabase.from('eho_offer_letters').select('offer_letter_id,recipient_name,program_name,participation,duration,start_date,end_date,issue_date,issuer_name,signatory_name,details,created_at').order('created_at',{ascending:false}).limit(500);if(!mounted.current)return;if(error){console.error('[EHO admin] Offer letters load failed:',error);setNotice({type:'error',text:'Offer letter storage is not ready. Apply the supplied Supabase migration, then refresh. '+problemText(describeSupabaseError(error,'offer letter list'))});}else setRows(data||[]);setLoading(false)},[supabase,mounted]);
 useEffect(()=>{load()},[load]);
 const issue=async(e)=>{e.preventDefault();if(form.end_date<form.start_date){setNotice({type:'error',text:'End date cannot be earlier than start date.'});return;}setBusy(true);setNotice(null);try{const {data,error}=await supabase.rpc('issue_eho_offer_letter',{p_recipient_name:form.recipient_name.trim(),p_program_name:form.program_name.trim(),p_participation:form.participation.trim(),p_duration:form.duration.trim(),p_start_date:form.start_date,p_end_date:form.end_date,p_issue_date:form.issue_date,p_issuer_name:form.issuer_name.trim(),p_signatory_name:form.signatory_name.trim()||null,p_details:form.details.trim()||null});if(error)throw error;setNotice({type:'success',text:'Offer letter created: '+data});setForm(f=>({...f,recipient_name:'',participation:'Cybersecurity project-based internship',details:''}));await load()}catch(err){console.error('[EHO admin] Offer letter issue failed:',err);setNotice({type:'error',text:'Could not create offer letter. '+problemText(describeSupabaseError(err,'offer letter issuance'))})}finally{if(mounted.current)setBusy(false)}};
 const printLetter=r=>{const w=window.open('','_blank');if(!w){setNotice({type:'error',text:'Allow pop-ups to print the offer letter.'});return;}const esc=escapeHtml;const html='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(r.offer_letter_id)+'</title><style>@page{size:A4;margin:18mm}body{font-family:Arial;color:#202b3f}.page{min-height:250mm;border:2px solid #c4a45c;padding:18mm;position:relative}.head{display:flex;gap:16px;align-items:center;border-bottom:3px solid #b28c3f;padding-bottom:14px}.head img{width:64px}.brand{font-size:22px;letter-spacing:4px;font-weight:bold;color:#17304f}.org{font-size:10px;letter-spacing:2px;color:#9b7836}.kicker{margin-top:34px;color:#9b7836;letter-spacing:3px;font-size:11px}.title{font:bold 34px Georgia;color:#172b49}.meta{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0;font-size:11px}.body{font-size:14px;line-height:1.9;margin-top:26px}.name{font:bold 24px Georgia;color:#9a742d}.box{background:#faf7ef;border-left:4px solid #b28c3f;padding:16px;line-height:1.9;margin:22px 0}.details{white-space:pre-wrap;font-size:12px}.sign{margin-top:46px;border-top:1px solid #888;width:220px;padding-top:8px;font-size:11px}.foot{position:absolute;bottom:12mm;left:18mm;right:18mm;border-top:1px solid #ddd;padding-top:8px;font-size:9px;color:#777;display:flex;justify-content:space-between}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><main class="page"><header class="head"><img src="'+location.origin+'/eho-logo.png"><div><div class="brand">EHO</div><div class="org">ETHICAL HACKING ORGANIZATIONS</div></div></header><div class="kicker">OFFICIAL COMMUNICATION</div><h1 class="title">Internship Offer Letter</h1><div class="meta"><span><b>Reference:</b> '+esc(r.offer_letter_id)+'</span><span><b>Date:</b> '+esc(r.issue_date)+'</span></div><section class="body">Dear <div class="name">'+esc(r.recipient_name)+',</div><p>We are pleased to offer you the opportunity to participate in <b>'+esc(r.program_name)+'</b> organized by '+esc(r.issuer_name)+'.</p><div class="box"><b>Program:</b> '+esc(r.program_name)+'<br><b>Participation:</b> '+esc(r.participation)+'<br><b>Duration:</b> '+esc(r.duration)+'<br><b>Program dates:</b> '+esc(r.start_date)+' to '+esc(r.end_date)+'</div>'+(r.details?'<div class="details">'+esc(r.details)+'</div>':'')+'<p>Your participation and completion status will be determined by the program requirements and work actually completed.</p></section><p>We look forward to your participation.</p><div class="sign">'+(r.signatory_name?'<b>'+esc(r.signatory_name)+'</b><br>':'')+'Authorized Signatory<br>'+esc(r.issuer_name)+'</div><footer class="foot"><span>'+esc(r.issuer_name)+'</span><b>'+esc(r.offer_letter_id)+'</b></footer></main><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>';w.document.write(html);w.document.close()};
 const filtered=rows.filter(r=>(r.offer_letter_id+' '+r.recipient_name+' '+r.program_name).toLowerCase().includes(query.toLowerCase()));
 return <div className="certificate-workspace"><div className="admin-stats"><div><span>Offer letters</span><b>{rows.length}</b><small>saved in Supabase</small></div><div><span>Storage</span><b>Cloud</b><small>persistent records</small></div></div>{notice&&<div className={'admin-notice'+(notice.type==='error'?' is-error':'')}>{notice.text}</div>}<div className="admin-panel-card"><h2>Create internship offer letter</h2><p className="admin-help">Create, save and print a branded A4 offer letter. Each letter receives a unique reference number.</p><form onSubmit={issue}><div className="admin-form"><label>Student full name *<input required maxLength="160" value={form.recipient_name} onChange={e=>setForm({...form,recipient_name:e.target.value})}/></label><label>Program title *<input required maxLength="180" value={form.program_name} onChange={e=>setForm({...form,program_name:e.target.value})}/></label><label className="full">Participation / selected area *<input required maxLength="240" value={form.participation} onChange={e=>setForm({...form,participation:e.target.value})}/></label><label>Duration *<input required maxLength="80" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/></label><label>Issue date *<input type="date" required value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})}/></label><label>Program start date *<input type="date" required value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></label><label>Program end date *<input type="date" required min={form.start_date||undefined} value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/></label><label>Issuing organization *<input required maxLength="180" value={form.issuer_name} onChange={e=>setForm({...form,issuer_name:e.target.value})}/></label><label>Authorized signatory<input maxLength="160" value={form.signatory_name} onChange={e=>setForm({...form,signatory_name:e.target.value})}/></label><label className="full">Additional notes<textarea rows="3" maxLength="1200" value={form.details} onChange={e=>setForm({...form,details:e.target.value})}/></label></div><div className="admin-form-actions"><button className="admin-primary" disabled={busy}>{busy?'Saving…':'Save & create offer letter'}</button></div></form></div><div className="admin-panel-card"><h2>Saved offer letters</h2><div className="certificate-filters"><input placeholder="Search reference, student or program" value={query} onChange={e=>setQuery(e.target.value)}/></div>{loading?<p>Loading offer letters…</p>:filtered.length===0?<p className="admin-help">No offer letters saved yet.</p>:filtered.map(r=><div className="admin-row cert-row" key={r.offer_letter_id}><div><b>{r.recipient_name}</b><small>{r.offer_letter_id} · {r.program_name} · {r.duration} · {r.start_date} to {r.end_date}</small></div><span className="admin-pill green">Saved</span><button className="icon-btn" onClick={()=>printLetter(r)}>Print / PDF</button></div>)}</div></div>
}

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function AdminWorkspace({supabase}){
 const [data,setData]=useState(()=>getEhoData());const [certSummary,setCertSummary]=useState({total:0,active:0,revoked:0,recent:[]});const [certError,setCertError]=useState('');const noticeTimer=useRef(null);const [tab,setTab]=useState('overview');const [notice,setNotice]=useState('');const [courseEdit,setCourseEdit]=useState(null);const [domainEdit,setDomainEdit]=useState(null);const [internEdit,setInternEdit]=useState(null);
 useEffect(()=>{document.title='EHO Admin Studio';let alive=true;Promise.all([supabase.from('eho_certificates').select('*',{count:'exact',head:true}),supabase.from('eho_certificates').select('*',{count:'exact',head:true}).eq('status','issued'),supabase.from('eho_certificates').select('*',{count:'exact',head:true}).eq('status','revoked'),supabase.from('eho_certificates').select('certificate_id,recipient_name,program_name,status,created_at').order('created_at',{ascending:false}).limit(5)]).then(([all,active,revoked,recent])=>{if(!alive)return;const failed=[all,active,revoked,recent].find(r=>r.error);if(failed){console.error('[EHO admin] Certificate summary failed:',failed.error);const p=describeSupabaseError(failed.error,'certificate summary');setCertError(problemText(p));return;}setCertError('');setCertSummary({total:all.count||0,active:active.count||0,revoked:revoked.count||0,recent:recent.data||[]})}).catch(err=>{console.error('[EHO admin] Certificate summary failed:',err);if(alive)setCertError(problemText(describeSupabaseError(err,'certificate summary')))});return()=>{alive=false;clearTimeout(noticeTimer.current)}},[supabase]);
 const flash=(msg)=>{setNotice(msg);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(''),3500)};
 const persist=(next)=>{setData(next);try{localStorage.setItem(KEY,JSON.stringify(next));flash('Saved in this browser. Export a backup to keep your changes.');}catch(err){console.error('[EHO admin] Saving content failed:',err);setNotice('Could not save in this browser (storage is full or blocked). Export a backup now so your changes are not lost.');}};
 const update=(key,value)=>persist({...data,[key]:value});
 const exportData=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='eho-content-backup.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 const importData=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const v=JSON.parse(r.result);if(!Array.isArray(v.domains)||!Array.isArray(v.courses)||!Array.isArray(v.internships))throw Error('Invalid EHO backup');persist({...v,settings:{...getEhoData().settings,...(v.settings||{})}});}catch{setNotice('Import failed: choose a valid EHO JSON backup.');}};r.onerror=()=>setNotice('Import failed: the file could not be read.');r.readAsText(f);e.target.value='';};
 const saveItem=(key,raw)=>{const {skillsText,...item}=raw;if(skillsText!==undefined)item.skills=skillsText.split('\n').map(s=>s.trim()).filter(Boolean);const arr=data[key]||[];const next=arr.some(x=>x.id===item.id)?arr.map(x=>x.id===item.id?item:x):[...arr,item];update(key,next);if(key==='courses')setCourseEdit(null);if(key==='domains')setDomainEdit(null);if(key==='internships')setInternEdit(null)};
 const remove=(key,id)=>{if(!confirm('Delete this item?'))return;update(key,data[key].filter(x=>x.id!==id));};
 const addCourse=()=>setCourseEdit({id:`course-${Date.now()}`,title:'',category:data.domains[0]?.name||'',description:'',status:'coming_soon',youtubeUrl:'',externalResourceUrl:'',featured:false,displayOrder:data.courses.length+1});
 const addDomain=()=>setDomainEdit({id:`domain-${Date.now()}`,name:'New IT Domain',icon:'💡',description:'',skills:[]});
 const addIntern=()=>setInternEdit({id:`intern-${Date.now()}`,domainId:data.domains[0]?.id||'',domain:data.domains[0]?.name||'',title:'IT Internship',duration:'1 Month',price:199,description:'',skills:[],published:true});
 return <div className="admin-shell"><aside className="admin-side"><a className="admin-brand" href="/"><BrandLogo size={46}/><span><b>ADMIN STUDIO</b><small>Content workspace</small></span></a><div className="admin-nav-label">WORKSPACE</div>{[['overview',LayoutDashboard,'Overview'],['courses',BookOpen,'Courses'],['domains',ShieldCheck,'IT Domains & Skills'],['internships',BriefcaseBusiness,'Internships'],['settings',Settings,'Site Settings'],['documents',FileText,'Documents'],['certificates',Award,'Certificates'],['offerLetters',FileText,'Offer Letters']].map(([id,Icon,label])=><button key={id} className={tab===id?'selected':''} onClick={()=>{setTab(id);setCourseEdit(null);setDomainEdit(null);setInternEdit(null)}}><Icon size={17}/>{label}</button>)}<div className="admin-side-bottom"><a href="/">← View public website</a><p>Local content editor · v2</p></div></aside>
 <main className="admin-main"><header className="admin-top"><div><span className="section-kicker">EHO CONTROL CENTRE</span><h1>{({'overview':'Overview','courses':'Course Library','domains':'IT Domains & Certificate Skills','internships':'Internship Programs','settings':'Website Settings','documents':'Certificate & Offer Letter Centre','certificates':'Certificate Management','offerLetters':'Offer Letter Studio'})[tab]}</h1></div><div className="admin-top-actions"><button className="admin-btn" onClick={exportData}><Download size={16}/> Export backup</button><label className="admin-btn"><Upload size={16}/> Import<input type="file" accept="application/json" onChange={importData} hidden/></label></div></header>
 {notice&&<div className="admin-notice">{notice}</div>}
 {tab==='overview'&&<><div className="admin-warning"><b>Important publishing note</b><p>This editor saves changes in this browser only. It is not connected to a secure database or live deployment yet. Export your JSON after editing; public visitors will not automatically receive localStorage changes.</p></div><div className="admin-stats"><div><span>Courses</span><b>{data.courses.length}</b><small>in content library</small></div><div><span>IT domains</span><b>{data.domains.length}</b><small>skill profiles</small></div><div><span>Internship listings</span><b>{data.internships.length}</b><small>across all domains</small></div><div><span>Coming soon</span><b>{data.courses.filter(c=>c.status==='coming_soon').length}</b><small>not yet published</small></div></div><div className="admin-panel-card"><h2>Quick actions</h2><div className="quick-grid"><button onClick={()=>{setTab('courses');addCourse()}}><Plus/>Add a course</button><button onClick={()=>{setTab('domains');addDomain()}}><Plus/>Add IT domain</button><button onClick={()=>{setTab('internships');addIntern()}}><Plus/>Add internship</button><button onClick={exportData}><Download/>Download content backup</button></div></div><div className="admin-panel-card"><div className="admin-toolbar"><div><h2>Certificate activity</h2><p className="admin-help">Latest records returned from the certificate database.</p></div><button className="admin-primary" onClick={()=>setTab('certificates')}>Manage certificates</button></div><div className="admin-stats"><div><span>Total certificates</span><b>{certSummary.total}</b><small>database total</small></div><div><span>Active certificates</span><b>{certSummary.active}</b><small>issued status</small></div><div><span>Revoked certificates</span><b>{certSummary.revoked}</b><small>revoked status</small></div></div>{certSummary.recent.map(r=><div className="admin-row" key={r.certificate_id}><div><b>{r.recipient_name}</b><small>{r.certificate_id} · {r.program_name}</small></div><span className={'admin-pill '+(r.status==='issued'?'green':'')}>{r.status}</span></div>)}{certError?<div className="admin-notice is-error" role="alert">Certificate data could not be loaded: {certError}</div>:certSummary.recent.length===0&&<p className="admin-help">No certificate activity yet.</p>}</div><div className="admin-panel-card"><h2>Recent content</h2>{data.courses.slice(0,5).map(c=><div className="admin-row" key={c.id}><div><b>{c.title}</b><small>{c.category}</small></div><span className={'admin-pill '+(c.status==='available'?'green':'')}>{String(c.status||'').replace('_',' ')}</span><button className="icon-btn" onClick={()=>{setTab('courses');setCourseEdit({...c})}}>Edit</button></div>)}</div></>}
 {tab==='courses'&&<><div className="admin-toolbar"><p>Manage titles, descriptions, category, YouTube links and visibility.</p><button className="admin-primary" onClick={addCourse}><Plus size={16}/> Add course</button></div>{courseEdit?<div className="admin-panel-card"><h2>{data.courses.some(c=>c.id===courseEdit.id)?'Edit course':'New course'}</h2><div className="admin-form"><label>Course title<input value={courseEdit.title} onChange={e=>setCourseEdit({...courseEdit,title:e.target.value})}/></label><label>Domain/category<select value={courseEdit.category} onChange={e=>setCourseEdit({...courseEdit,category:e.target.value})}>{data.domains.map(d=><option key={d.id}>{d.name}</option>)}</select></label><label className="full">Description<textarea rows="3" value={courseEdit.description} onChange={e=>setCourseEdit({...courseEdit,description:e.target.value})}/></label><label>YouTube video/playlist URL<input value={courseEdit.youtubeUrl} onChange={e=>setCourseEdit({...courseEdit,youtubeUrl:e.target.value})} placeholder="https://youtube.com/..."/></label><label>External resource URL<input value={courseEdit.externalResourceUrl} onChange={e=>setCourseEdit({...courseEdit,externalResourceUrl:e.target.value})}/></label><label>Status<select value={courseEdit.status} onChange={e=>setCourseEdit({...courseEdit,status:e.target.value})}><option value="coming_soon">Coming Soon</option><option value="available">Available</option><option value="unpublished">Unpublished / Hidden</option></select></label><label>Display order<input type="number" value={courseEdit.displayOrder} onChange={e=>setCourseEdit({...courseEdit,displayOrder:Number(e.target.value)})}/></label><label className="check-label"><input type="checkbox" checked={!!courseEdit.featured} onChange={e=>setCourseEdit({...courseEdit,featured:e.target.checked})}/> Featured course</label></div><div className="admin-form-actions"><button className="admin-primary" onClick={()=>courseEdit.title.trim()&&saveItem('courses',courseEdit)}><Save size={16}/> Save course</button><button className="admin-btn" onClick={()=>setCourseEdit(null)}>Cancel</button></div></div>:<div className="admin-panel-card">{data.courses.map(c=><div className="admin-row" key={c.id}><div><b>{c.title}</b><small>{c.category}</small></div><span className={'admin-pill '+(c.status==='available'?'green':'')}>{String(c.status||'').replace('_',' ')}</span><button className="icon-btn" onClick={()=>setCourseEdit({...c})}>Edit</button><button className="icon-btn danger" onClick={()=>remove('courses',c.id)}><Trash2 size={15}/></button></div>)}</div>}</>}
 {tab==='domains'&&<><div className="admin-toolbar"><p>These skill profiles can be used as a reference for internship outcomes and certificate descriptions.</p><button className="admin-primary" onClick={addDomain}><Plus size={16}/> Add domain</button></div>{domainEdit?<div className="admin-panel-card"><h2>Edit IT domain</h2><div className="admin-form"><label>Domain name<input value={domainEdit.name} onChange={e=>setDomainEdit({...domainEdit,name:e.target.value})}/></label><label>Icon / emoji<input value={domainEdit.icon} onChange={e=>setDomainEdit({...domainEdit,icon:e.target.value})}/></label><label className="full">Description<textarea rows="3" value={domainEdit.description} onChange={e=>setDomainEdit({...domainEdit,description:e.target.value})}/></label><label className="full">Skills (one per line)<textarea rows="8" value={domainEdit.skillsText??(domainEdit.skills||[]).join('\n')} onChange={e=>setDomainEdit({...domainEdit,skillsText:e.target.value})}/></label></div><div className="admin-form-actions"><button className="admin-primary" onClick={()=>domainEdit.name.trim()&&saveItem('domains',domainEdit)}><Save size={16}/> Save domain</button><button className="admin-btn" onClick={()=>setDomainEdit(null)}>Cancel</button></div></div>:<div className="admin-domain-grid">{data.domains.map(d=><article className="admin-domain-card" key={d.id}><div className="admin-domain-icon">{d.icon}</div><h3>{d.name}</h3><p>{d.description}</p><div className="skill-tags">{(d.skills||[]).map(s=><span key={s}>{s}</span>)}</div><div className="admin-form-actions"><button className="icon-btn" onClick={()=>setDomainEdit({...d,skills:[...(d.skills||[])]})}>Edit skills</button><button className="icon-btn danger" onClick={()=>remove('domains',d.id)}><Trash2 size={15}/></button></div></article>)}</div>}</>}
 {tab==='internships'&&<><div className="admin-toolbar"><p>Internship programs are available for every domain and duration. Confirm fees and policies before accepting payments.</p><button className="admin-primary" onClick={addIntern}><Plus size={16}/> Add internship</button></div>{internEdit?<div className="admin-panel-card"><h2>Edit internship listing</h2><div className="admin-form"><label>Domain<select value={internEdit.domainId} onChange={e=>{const d=data.domains.find(x=>x.id===e.target.value);if(!d)return;setInternEdit({...internEdit,domainId:d.id,domain:d.name,title:`${d.name} Internship`,skills:[...(d.skills||[])],skillsText:undefined})}}>{data.domains.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select></label><label>Program title<input value={internEdit.title} onChange={e=>setInternEdit({...internEdit,title:e.target.value})}/></label><label>Duration<select value={internEdit.duration} onChange={e=>setInternEdit({...internEdit,duration:e.target.value,price:({'1 Month':199,'2 Months':300,'3 Months':300,'6 Months':499})[e.target.value]??internEdit.price})}>{['1 Month','2 Months','3 Months','6 Months'].map(d=><option key={d}>{d}</option>)}</select></label><label>Fee (INR)<input type="number" min="0" value={internEdit.price} onChange={e=>setInternEdit({...internEdit,price:Number(e.target.value)})}/></label><label className="full">Description<textarea rows="3" value={internEdit.description} onChange={e=>setInternEdit({...internEdit,description:e.target.value})}/></label><label className="full">Skills / learning outcomes (one per line)<textarea rows="6" value={internEdit.skillsText??(internEdit.skills||[]).join('\n')} onChange={e=>setInternEdit({...internEdit,skillsText:e.target.value})}/></label><label className="check-label"><input type="checkbox" checked={!!internEdit.published} onChange={e=>setInternEdit({...internEdit,published:e.target.checked})}/> Show this program on the public site</label></div><div className="admin-form-actions"><button className="admin-primary" onClick={()=>saveItem('internships',internEdit)}><Save size={16}/> Save internship</button><button className="admin-btn" onClick={()=>setInternEdit(null)}>Cancel</button></div></div>:<div className="admin-panel-card">{data.internships.map(i=><div className="admin-row" key={i.id}><div><b>{i.title} · {i.duration}</b><small>{i.domain} · {i.skills?.length||0} skills</small></div><strong className="admin-price">₹{Number(i.price).toLocaleString('en-IN')}</strong><span className={'admin-pill '+(i.published?'green':'')}>{i.published?'published':'hidden'}</span><button className="icon-btn" onClick={()=>setInternEdit({...i,skills:[...(i.skills||[])]})}>Edit</button><button className="icon-btn danger" onClick={()=>remove('internships',i.id)}><Trash2 size={15}/></button></div>)}</div>}</>}
 {tab==='settings'&&<div className="admin-panel-card"><h2>Public website links & messaging</h2><div className="admin-form"><label className="full">Official YouTube channel URL<input value={data.settings.youtubeChannelUrl} onChange={e=>update('settings',{...data.settings,youtubeChannelUrl:e.target.value})} placeholder="https://youtube.com/@yourchannel"/></label><label>YouTube button label<input value={data.settings.youtubeChannelLabel} onChange={e=>update('settings',{...data.settings,youtubeChannelLabel:e.target.value})}/></label><label>LinkedIn page URL<input value={data.settings.linkedinUrl} onChange={e=>update('settings',{...data.settings,linkedinUrl:e.target.value})}/></label><label className="full">Course announcement text<textarea rows="3" value={data.settings.siteNotice} onChange={e=>update('settings',{...data.settings,siteNotice:e.target.value})}/></label></div><p className="admin-help">Each change saves locally when you edit it. Export a JSON backup to preserve the latest settings.</p></div>}
 {tab==='documents'&&<><div className="admin-panel-card"><h2>Document Centre</h2><p className="admin-help">Generate and manage EHO internship offer letters and completion certificates from one page. Both document types are stored separately; existing certificate IDs and QR verification records are preserved.</p></div><CertificateManager supabase={supabase}/><OfferLetterManager supabase={supabase}/></>}{tab==='certificates'&&<CertificateManager supabase={supabase}/>}{tab==='offerLetters'&&<OfferLetterManager supabase={supabase}/>}
 <footer className="admin-footer">EHO Admin Studio <span>Changes stored in this browser only</span></footer></main></div>
}

export default function Admin(){ return <AdminGate/>; }
