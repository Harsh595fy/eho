// Shared EHO content data (courses, IT domains, internships, settings).
// Used by both the public website and the admin studio. Admin edits are stored in this browser's localStorage.

export const KEY='eho-admin-content-v2';
export const defaultDomains = [
 {id:'cybersecurity',name:'Cybersecurity & Ethical Hacking',icon:'🛡️',description:'Security fundamentals, ethical hacking, vulnerability assessment, and defensive security.',skills:['Networking fundamentals','Linux & Windows security','OWASP Top 10','Vulnerability assessment','Penetration testing methodology','MITRE ATT&CK','Security reporting']},
 {id:'web-development',name:'Web Development',icon:'🌐',description:'Design and build responsive, accessible websites and full-stack web applications.',skills:['HTML5 & CSS3','JavaScript','Responsive UI','React','Node.js & Express','REST APIs','Database integration','Git & deployment']},
 {id:'python',name:'Python Programming',icon:'🐍',description:'Python programming from core concepts to automation, APIs, and practical scripting.',skills:['Python fundamentals','OOP','File handling','Error handling','Automation scripts','API requests','Testing & debugging','Git']},
 {id:'ai-ml',name:'Artificial Intelligence & Machine Learning',icon:'🤖',description:'Explore data preparation, machine-learning workflows, model evaluation, and responsible AI.',skills:['Python for AI','NumPy & pandas','Data preprocessing','Supervised learning','Unsupervised learning','Model evaluation','Neural-network basics','Responsible AI']},
 {id:'data-science',name:'Data Science & Analytics',icon:'📊',description:'Turn raw data into useful insights through analysis, statistics, and visualization.',skills:['Data cleaning','Excel/CSV workflows','SQL basics','Statistics','pandas','Data visualization','Exploratory analysis','Reporting']},
 {id:'cloud',name:'Cloud Computing & DevOps',icon:'☁️',description:'Learn cloud concepts, deployment, automation, monitoring, and secure infrastructure basics.',skills:['Cloud fundamentals','Linux administration','Git & GitHub','CI/CD concepts','Containers basics','Infrastructure monitoring','Cloud security','Deployment']},
 {id:'soc-forensics',name:'SOC & Digital Forensics',icon:'🔎',description:'Build practical understanding of monitoring, alert triage, incident response, and evidence handling.',skills:['Log analysis','SIEM fundamentals','Alert triage','MITRE ATT&CK mapping','Incident response','Network analysis','Evidence preservation','Case reporting']},
 {id:'software',name:'Software Development',icon:'💻',description:'Develop maintainable software using programming, testing, version control, and design principles.',skills:['Programming fundamentals','Data structures','OOP & design','Git workflows','Testing','Debugging','API integration','Documentation']},
 {id:'mobile',name:'Mobile App Development',icon:'📱',description:'Learn mobile UI, app architecture, API integration, testing, and release basics.',skills:['UI fundamentals','App architecture','Kotlin/Flutter concepts','API integration','Local storage','Authentication basics','App testing','Release workflow']},
 {id:'database',name:'Database & SQL',icon:'🗄️',description:'Design relational data models and query, secure, and maintain databases.',skills:['Relational concepts','ER modelling','SQL queries','Joins & subqueries','Schema design','Transactions','Indexes basics','Backup & access control']},
 {id:'networking',name:'Networking & System Administration',icon:'🖧',description:'Understand network protocols, troubleshooting, operating systems, and system administration.',skills:['TCP/IP & OSI','Subnetting','DNS & DHCP','Routing & switching concepts','Linux CLI','Windows administration','Packet analysis','Troubleshooting']},
 {id:'ui-ux',name:'UI/UX & Product Design',icon:'🎨',description:'Create user-centred interfaces through research, wireframes, prototypes, and usability testing.',skills:['User research','Personas & journeys','Information architecture','Wireframing','Prototyping','Visual hierarchy','Accessibility','Usability testing']}
];
export const durations=[{duration:'1 Month',price:199},{duration:'2 Months',price:299},{duration:'3 Months',price:399},{duration:'6 Months',price:499}];
export function getEhoData(){
 const keep=new Set(['cybersecurity','web-development','python','ai-ml']);
 const fresh={settings:{youtubeChannelUrl:'',youtubeChannelLabel:'Visit Our YouTube Channel',linkedinUrl:'',siteNotice:'Course launches will be announced soon.'},domains:defaultDomains.map(d=>({...d})),courses:[
 {id:'cybersecurity-foundations',title:'Cybersecurity Foundations',category:'Cybersecurity & Ethical Hacking',description:'Understand core security principles, common threats, safe practices, and defensive controls.',status:'coming_soon',youtubeUrl:'',externalResourceUrl:'',featured:true,displayOrder:1},
 {id:'ethical-hacking',title:'Ethical Hacking & Penetration Testing',category:'Cybersecurity & Ethical Hacking',description:'Learn authorised testing workflows, reconnaissance, vulnerability assessment, and clear reporting.',status:'coming_soon',youtubeUrl:'',externalResourceUrl:'',featured:false,displayOrder:2},
 {id:'web-development',title:'Full-Stack Web Development',category:'Full-Stack Web Development',description:'Build responsive frontends, backend APIs, databases and complete web applications.',status:'coming_soon',youtubeUrl:'',externalResourceUrl:'',featured:false,displayOrder:3},
 {id:'python-programming',title:'Python Programming',category:'Python Programming',description:'Learn Python from fundamentals to automation and practical projects.',status:'coming_soon',youtubeUrl:'',externalResourceUrl:'',featured:false,displayOrder:4},
 {id:'ai-ml',title:'AI & Machine Learning',category:'Artificial Intelligence & Machine Learning',description:'Coming soon: AI foundations, applied machine learning and responsible AI workflows.',status:'coming_soon',youtubeUrl:'',externalResourceUrl:'',featured:false,displayOrder:5}
 ],internships:defaultDomains.flatMap(d=>['1 Month','2 Months','3 Months','6 Months'].map((duration,i)=>({id:d.id+'-'+i,domainId:d.id,domain:d.name,title:d.name+' Internship',duration,price:[199,299,399,499][i],description:'Guided '+d.name.toLowerCase()+' learning and project practice.',skills:[...d.skills],published:d.id!=='ai-ml'}))),certificates:{issuer:'EHO — Ethical Hacking Organizations',verificationNote:'Certificate authenticity must be confirmed using an official EHO-issued certificate ID.'}};
 const filter=v=>{
  const domains=(v.domains||defaultDomains).filter(d=>keep.has(d.id)).map(d=>d.id==='web-development'?{...d,name:'Full-Stack Web Development'}:d);
  const names=new Map(domains.map(d=>[d.id,d.name]));
  const courses=(v.courses||fresh.courses).filter(c=>!['data-science','cloud','soc-forensics','software','mobile','database','networking','ui-ux'].some(k=>String(c.id||'').includes(k)||String(c.category||'').toLowerCase().includes(k.replace('-',' ')))).map(c=>({...c,category:c.category==='Web Development'?'Full-Stack Web Development':c.category==='SOC & Digital Forensics'?'Cybersecurity & Ethical Hacking':c.category}));
  const internships=(v.internships||fresh.internships).filter(i=>keep.has(i.domainId)).map(i=>({...i,domain:names.get(i.domainId)||i.domain,title:(names.get(i.domainId)||i.domain)+' Internship'}));
  return {...v,domains,courses,internships};
 };
 try{const v=JSON.parse(localStorage.getItem(KEY));if(v?.domains?.length&&Array.isArray(v.courses)&&Array.isArray(v.internships)&&v.settings)return filter(v);}catch{}
 return filter(fresh);
}
