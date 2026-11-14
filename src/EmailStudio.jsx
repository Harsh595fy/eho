import React, {useMemo, useState} from 'react';
import {Copy, RefreshCw, Mail, FileText, CheckCircle2, AlertCircle} from 'lucide-react';

const EMAIL='ethicalhackingorganizations3@gmail.com';
const ORG='EHO — Ethical Hacking Organizations';
const DURATIONS=['1 Month','2 Months','3 Months','6 Months'];
const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const pretty=d=>{if(!d)return '[date]';const p=d.split('-');return p.length===3?new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}):d};
const clean=s=>String(s||'').trim();
const domainDefaults={
 'Cybersecurity & Ethical Hacking':'Cybersecurity fundamentals, networking and Linux basics, web application security concepts, safe lab-based vulnerability assessment, OWASP awareness and responsible security practices.',
 'Full-Stack Web Development':'HTML, CSS and JavaScript, responsive interfaces, React, backend/API fundamentals, database integration, version control, debugging and practical web application development.',
 'Python Programming':'Python fundamentals, data structures, functions, file handling, modules, debugging, basic automation and practical scripting.',
 'Artificial Intelligence & Machine Learning':'AI and machine-learning fundamentals, Python workflows, data preparation, model usage and evaluation, prompt design and responsible AI practices.'
};
export default function EmailStudio(){
 const [form,setForm]=useState({type:'offer',programme:'Paid',name:'',email:'',domain:'Cybersecurity & Ethical Hacking',duration:'3 Months',start:today(),end:'',issue:today(),project:'',tasks:'',fee:'₹399',certificateId:'',achievement:'',signatory:'EHO Team'});
 const [copied,setCopied]=useState('');
 const [error,setError]=useState('');
 const set=(key,value)=>setForm(v=>({...v,[key]:value}));
 const freeSix=form.programme==='Free'&&form.duration==='6 Months';
 const content=useMemo(()=>{
  const n=clean(form.name)||'[Student Name]',d=form.domain,dur=form.duration,period=form.start&&form.end?pretty(form.start)+' to '+pretty(form.end):'the agreed programme period';
  const project=clean(form.project)||'a domain-related practical project';
  const tasks=clean(form.tasks)||domainDefaults[d]||'complete the published learning activities and practical assignments relevant to the selected domain.';
  const paid=form.programme==='Paid';
  const type=form.type;
  if(type==='offer'){
   const subject='EHO Internship Offer — '+d+' ('+dur+')';
   const body='Dear '+n+',\n\nWe are pleased to offer you an opportunity to participate in the '+d+' Internship Programme conducted by '+ORG+'.\n\nPROGRAMME DETAILS\nProgramme: '+(paid?'Paid / Project-Led Internship':'Free / Self-Learning Internship')+'\nDomain: '+d+'\nDuration: '+dur+'\nInternship period: '+period+'\n'+(paid?'Programme registration fee: '+(clean(form.fee)||'[confirmed fee]')+' (as communicated at registration)\n':'')+'\nLEARNING & PROJECT SCOPE\n'+tasks+'\n\nPrimary project / deliverable: '+project+'\n\n'+(paid?'Your participation is subject to the programme terms shared at registration. The registration fee does not guarantee a certificate; completion is assessed on the basis of the required submissions and review.':'This is a self-paced learning opportunity using EHO’s publicly shared learning resources. Live classes, personal mentoring, placement and client-project assignment are not included unless separately confirmed in writing.')+'\n\nYou are expected to complete original work, follow professional and ethical practices, and submit the required project files, repository/demo link and a short report within the communicated timeline. Certificate eligibility is subject to successful submission, review and approval.\n\nPlease reply to acknowledge this offer and confirm that you understand the programme scope and requirements.\n\nWe wish you a productive learning experience.\n\nRegards,\n'+(clean(form.signatory)||'EHO Team')+'\n'+ORG+'\n'+EMAIL+'\nLearn • Build • Secure • Grow';
   return {subject,body};
  }
  if(type==='certificate'){
   const subject='EHO Internship Certificate — '+d+' | '+n;
   const body='Dear '+n+',\n\nCongratulations on completing the '+d+' internship programme with '+ORG+'.\n\nFollowing the review of your submitted work and completion requirements, your internship certificate has been issued.\n\nPROGRAMME DETAILS\nDomain: '+d+'\nProgramme: '+(paid?'Paid / Project-Led Internship':'Free / Self-Learning Internship')+'\nDuration: '+dur+'\nInternship period: '+period+'\nCertificate ID: '+(clean(form.certificateId)||'[insert issued certificate ID]')+'\nIssue date: '+pretty(form.issue)+'\n\nPlease retain this email and use the certificate ID on EHO’s official verification page if verification is required. You may share your achievement professionally, ensuring that any public description accurately reflects the work you completed.\n\nThank you for learning and building with EHO. We wish you continued success.\n\nRegards,\n'+(clean(form.signatory)||'EHO Team')+'\n'+ORG+'\n'+EMAIL+'\nLearn • Build • Secure • Grow';
   return {subject,body};
  }
  const subject=(freeSix?'EHO Performance-Based Letter of Recommendation — ':'EHO Letter of Recommendation — ')+n;
  const achievement=clean(form.achievement);
  const body='To Whom It May Concern,\n\nThis letter is issued in support of '+n+', who participated in the '+d+' internship programme at '+ORG+' for a duration of '+dur+' ('+period+').\n\nDuring the programme, the participant engaged with the following learning areas and practical work:\n'+tasks+'\n\n'+(achievement?'VERIFIED CONTRIBUTION\n'+achievement+'\n\n':'')+'This recommendation is based on the programme participation and the specific work or achievements described above that have been reviewed by EHO. It should not be interpreted as a guarantee of employment or professional certification. Please consider the documented scope when evaluating the candidate.\n\nWe wish '+n+' success in future academic and professional pursuits.\n\nSincerely,\n'+(clean(form.signatory)||'EHO Team')+'\n'+ORG+'\n'+EMAIL+'\nLearn • Build • Secure • Grow';
  return {subject,body};
 },[form,freeSix]);
 const copy=async(value,label)=>{try{await navigator.clipboard.writeText(value);setCopied(label);setTimeout(()=>setCopied(''),1800);setError('')}catch{setError('Clipboard access was blocked by the browser. Select the generated text and copy it manually.')}};
 const reset=()=>{setForm({type:'offer',programme:'Paid',name:'',email:'',domain:'Cybersecurity & Ethical Hacking',duration:'3 Months',start:today(),end:'',issue:today(),project:'',tasks:'',fee:'₹399',certificateId:'',achievement:'',signatory:'EHO Team'});setCopied('');setError('')};
 const complete=clean(form.name)&&clean(form.email)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
 return <div className="certificate-workspace email-studio">
  <div className="admin-panel-card email-studio-intro"><div><span className="section-kicker">COMMUNICATION WORKSPACE</span><h2><Mail size={20}/> EHO Email Generator</h2><p className="admin-help">Prepare professional student emails, preview them, then copy the subject and message into Gmail. Nothing is sent or stored automatically, and no paid email API is required.</p></div><span className="admin-pill green">Copy & paste mode</span></div>
  <div className="admin-panel-card"><div className="email-step-head"><span>01 / EMAIL SETUP</span><button className="admin-btn" type="button" onClick={reset}><RefreshCw size={14}/> Reset form</button></div>
   <div className="admin-form">
    <label>Email purpose<select value={form.type} onChange={e=>set('type',e.target.value)}><option value="offer">Internship Offer Email</option><option value="certificate">Internship Certificate Email</option><option value="recommendation">Letter of Recommendation Email</option></select></label>
    <label>Programme type<select value={form.programme} onChange={e=>{const p=e.target.value;setForm(v=>({...v,programme:p,fee:p==='Paid'?({'1 Month':'₹199','2 Months':'₹299','3 Months':'₹399','6 Months':'₹499'}[v.duration]):''}))}}><option>Paid</option><option>Free</option></select></label>
    <label>Student full name *<input required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Student's full name"/></label>
    <label>Student email address *<input type="email" required value={form.email} onChange={e=>set('email',e.target.value)} placeholder="student@example.com"/></label>
    <label>Internship domain<select value={form.domain} onChange={e=>set('domain',e.target.value)}>{Object.keys(domainDefaults).map(d=><option key={d}>{d}</option>)}</select></label>
    <label>Duration<select value={form.duration} onChange={e=>setForm(v=>({...v,duration:e.target.value,fee:v.programme==='Paid'?({'1 Month':'₹199','2 Months':'₹299','3 Months':'₹399','6 Months':'₹499'}[e.target.value]):''}))}>{DURATIONS.map(d=><option key={d}>{d}</option>)}</select></label>
    <label>Start date<input type="date" value={form.start} onChange={e=>set('start',e.target.value)}/></label>
    <label>End date<input type="date" value={form.end} min={form.start||undefined} onChange={e=>set('end',e.target.value)}/></label>
    <label>Issue / email date<input type="date" value={form.issue} onChange={e=>set('issue',e.target.value)}/></label>
    {form.type==='offer'&&<><label>Registration fee (INR)<input value={form.fee} disabled={!form.programme||form.programme==='Free'} onChange={e=>set('fee',e.target.value)}/></label><label>Primary project / deliverable<input value={form.project} onChange={e=>set('project',e.target.value)} placeholder="e.g. Build and document a secure web app"/></label></>}
    {form.type==='certificate'&&<label>Issued certificate ID<input value={form.certificateId} onChange={e=>set('certificateId',e.target.value)} placeholder="Enter the real issued ID"/></label>}
    {form.type==='recommendation'&&<label className="full">Verified contribution / project achievement *<textarea rows="3" value={form.achievement} onChange={e=>set('achievement',e.target.value)} placeholder="Only include work that EHO has actually reviewed and verified."/></label>}
    <label className="full">Learning activities / tasks<textarea rows="4" value={form.tasks} onChange={e=>set('tasks',e.target.value)} placeholder="Edit the domain-specific scope for this student."/></label>
    <label>Authorized signatory<input value={form.signatory} onChange={e=>set('signatory',e.target.value)} placeholder="EHO Team"/></label>
   </div>
   {form.programme==='Free'&&form.duration==='6 Months'&&<div className="admin-warning"><b>Six-month free programme note</b><p>The public EHO programme describes the free track as self-paced and certificate-eligible after review. A recommendation letter is not automatic: issue it only when the participant’s work and contribution have been verified. The generated wording reflects that condition.</p></div>}
   {form.type==='recommendation'&&!clean(form.achievement)&&<div className="admin-warning"><b>Verification required</b><p>Add a specific, reviewed contribution before issuing this recommendation. The message is intended to describe evidence, not promise performance that has not been checked.</p></div>}
   {error&&<div className="admin-notice is-error"><AlertCircle size={15}/> {error}</div>}
  </div>
  <div className="admin-panel-card"><div className="email-step-head"><span>02 / PREVIEW & COPY</span><span className="admin-pill">Ready to paste into Gmail</span></div>
   <label className="email-preview-label">Recipient<input readOnly value={form.email?form.email:'Enter student email above'}/></label>
   <label className="email-preview-label">Subject<input readOnly value={content.subject}/></label>
   <label className="email-preview-label">Email body<textarea readOnly rows="18" value={content.body}/></label>
   <div className="admin-form-actions email-copy-actions"><button className="admin-primary" type="button" disabled={!complete} onClick={()=>copy(content.subject,'subject')}><Copy size={15}/>{copied==='subject'?'Subject copied':'Copy subject'}</button><button className="admin-primary" type="button" disabled={!complete} onClick={()=>copy(content.body,'body')}><Copy size={15}/>{copied==='body'?'Body copied':'Copy email body'}</button><button className="admin-btn" type="button" disabled={!complete} onClick={()=>copy('To: '+form.email+'\nSubject: '+content.subject+'\n\n'+content.body,'full')}><Copy size={15}/>{copied==='full'?'Complete email copied':'Copy complete email'}</button></div>
   {!complete&&<p className="admin-help">Enter a valid student name and email address to enable copy actions.</p>}
   <p className="admin-help">Workflow: copy the complete email, open EHO Gmail, paste it into a new message, review all details and send manually. Always verify dates, programme fee, certificate ID and achievement claims before sending.</p>
  </div>
 </div>;
}
