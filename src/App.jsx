import React, { useMemo, useState } from "react";
import { ShieldCheck, Code2, BrainCircuit, Cloud, Database, Search, Menu, X, ArrowUpRight, Youtube, Linkedin, BookOpen, Clock3, BadgeCheck, ExternalLink, Instagram, Send, Mail, BriefcaseBusiness, Users, Workflow, Globe2, Smartphone, ArrowRight, CheckCircle2, Layers3, Terminal, ChartNoAxesCombined, CloudCog, Fingerprint } from "lucide-react";
import settings from "../content/settings.json";
import Admin from "./Admin.jsx";
import Verify from "./Verify.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { getEhoData } from "./ehoData.js";
import c1 from "../content/courses/cybersecurity-foundations.json";
import c2 from "../content/courses/ethical-hacking.json";
import c3 from "../content/courses/web-development.json";
import c4 from "../content/courses/python-programming.json";
import c5 from "../content/courses/ai-ml.json";
import c6 from "../content/courses/data-science.json";
import c7 from "../content/courses/cloud-computing.json";
import c8 from "../content/courses/soc-digital-forensics.json";
import c9 from "../content/courses/software-development.json";
import i1 from "../content/internships/cybersecurity-1-month.json";
import i2 from "../content/internships/cybersecurity-2-month.json";
import i3 from "../content/internships/cybersecurity-3-month.json";
import i4 from "../content/internships/cybersecurity-6-month.json";

const initialCourses = [
  { id:"cybersecurity-foundations", ...c1 }, { id:"ethical-hacking", ...c2 },
  { id:"web-development", ...c3 }, { id:"python-programming", ...c4 },
  { id:"ai-ml", ...c5 }, { id:"data-science", ...c6 },
  { id:"cloud-computing", ...c7 }, { id:"soc-digital-forensics", ...c8 },
  { id:"software-development", ...c9 }
];
const internships = [i1, i2, i3, i4].filter(x => x.published);
const EMAIL = "ethicalhackingorganizations3@gmail.com";
const socialLinks = [
  {label:"LinkedIn",url:"https://www.linkedin.com/company/eho-ethical-hacking-organizations/",Icon:Linkedin},
  {label:"Instagram",url:"https://www.instagram.com/ehoofficial_009/",Icon:Instagram},
  {label:"YouTube",url:"https://youtube.com/@eho-o2r",Icon:Youtube},
  {label:"Telegram",url:"https://t.me/+DcMcdkA1TBJkNTg9",Icon:Send}
];
const serviceCards = [
  {Icon:Globe2,title:"Web Development",text:"Business websites, landing pages, portals and responsive web applications."},
  {Icon:Code2,title:"Software Development",text:"Custom tools, dashboards, workflow systems and API integrations."},
  {Icon:BrainCircuit,title:"AI & Automation",text:"Practical AI-powered assistants, process automation and data-driven tools."},
  {Icon:ShieldCheck,title:"Cybersecurity",text:"Security awareness, web application reviews and authorised security testing."},
  {Icon:Cloud,title:"Cloud & Deployment",text:"Application deployment, database integration, maintenance and technical support."},
  {Icon:Smartphone,title:"Digital Products",text:"Prototype development, UI implementation and product improvement."}
];
const workSteps = [
  ["01","Understand","We discuss your goals, users, requirements and constraints."],
  ["02","Plan","We define the scope, deliverables, timeline and estimate before work begins."],
  ["03","Build & review","Work is shared in clear milestones, with feedback and progress updates."],
  ["04","Deliver","We hand over the agreed source files, documentation and deployment details."]
];
const iconMap = {
  Cybersecurity: ShieldCheck, "Web Development": Code2, Python: Terminal,
  "AI/ML": BrainCircuit, "Data Science": ChartNoAxesCombined, Cloud: CloudCog,
  SOC: Fingerprint, Software: Code2
};
const courseBrandMarks = [
  { match: /cyber|ethical|penetration/i, label: "Cybersecurity", marks: [["owasp","OWASP"],["kalilinux","Kali Linux"],["linux","Linux"]] },
  { match: /web|full.?stack/i, label: "Full Stack Web", marks: [["html5","HTML5"],["css3","CSS3"],["javascript","JavaScript"],["react","React"]] },
  { match: /python/i, label: "Python", marks: [["python","Python"]] },
  { match: /artificial intelligence|machine learning|ai.?ml/i, label: "AI & Machine Learning", marks: [["tensorflow","TensorFlow"],["pytorch","PyTorch"],["scikitlearn","Scikit-learn"]] },
  { match: /data science|analytics/i, label: "Data Science", marks: [["pandas","Pandas"],["numpy","NumPy"],["jupyter","Jupyter"]] },
  { match: /cloud|devops/i, label: "Cloud & DevOps", marks: [["docker","Docker"],["kubernetes","Kubernetes"],["amazonaws","AWS"]] },
  { match: /soc|forensic/i, label: "SOC & Forensics", marks: [["wireshark","Wireshark"],["linux","Linux"],["splunk","Splunk"]] },
  { match: /software development/i, label: "Software Development", marks: [["git","Git"],["github","GitHub"],["vscode","VS Code"]] }
];
const getCourseBrand = course => {
  const key = [course.id, course.title, course.category].filter(Boolean).join(" ");
  return courseBrandMarks.find(item => item.match.test(key));
};
const safeHttps = (value) => { try { return new URL(value).protocol === "https:"; } catch { return false; } };
const validYoutube = (value) => {
  if (!safeHttps(value)) return false;
  try { return ["youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtu.be"].includes(new URL(value).hostname); } catch { return false; }
};
const mailLink = (subject, body="") => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const freeRoadmapResources = {
  cybersecurity: [
    {name:"Cisco Skills for All",topic:"Networking & cybersecurity foundations",url:"https://skillsforall.com/",note:"Free courses and learning paths"},
    {name:"TryHackMe",topic:"Guided cybersecurity labs",url:"https://tryhackme.com/resources/blog/free_path",note:"Use the free rooms and free path content"},
    {name:"OWASP Web Security Testing Guide",topic:"Web security & testing methodology",url:"https://owasp.org/www-project-web-security-testing-guide/",note:"Free official documentation"}
  ],
  "web-development": [
    {name:"freeCodeCamp",topic:"HTML, CSS, JavaScript & projects",url:"https://www.freecodecamp.org/learn/",note:"Free curriculum and projects"},
    {name:"MDN Web Docs",topic:"Web standards, HTML, CSS & JavaScript",url:"https://developer.mozilla.org/en-US/docs/Learn",note:"Free documentation and tutorials"},
    {name:"The Odin Project",topic:"Full-stack web development",url:"https://www.theodinproject.com/paths",note:"Free open curriculum"}
  ],
  python: [
    {name:"Python Official Tutorial",topic:"Python fundamentals",url:"https://docs.python.org/3/tutorial/",note:"Free official tutorial"},
    {name:"freeCodeCamp",topic:"Python practice & projects",url:"https://www.freecodecamp.org/learn/scientific-computing-with-python/",note:"Free course and projects"},
    {name:"Kaggle Learn",topic:"Python exercises",url:"https://www.kaggle.com/learn/python",note:"Free interactive lessons"}
  ],
  "ai-ml": [
    {name:"Google Machine Learning Crash Course",topic:"ML foundations & model evaluation",url:"https://developers.google.com/machine-learning/crash-course",note:"Free course"},
    {name:"Kaggle Learn",topic:"Python, pandas & machine learning",url:"https://www.kaggle.com/learn",note:"Free interactive micro-courses"},
    {name:"Microsoft Learn",topic:"AI fundamentals & responsible AI",url:"https://learn.microsoft.com/en-us/training/ai/",note:"Free learning modules"}
  ],
  "data-science": [
    {name:"Kaggle Learn",topic:"Python, pandas, visualisation & SQL",url:"https://www.kaggle.com/learn",note:"Free interactive lessons"},
    {name:"SQLBolt",topic:"SQL queries and database basics",url:"https://sqlbolt.com/",note:"Free interactive SQL lessons"},
    {name:"freeCodeCamp",topic:"Data analysis with Python",url:"https://www.freecodecamp.org/learn/data-analysis-with-python/",note:"Free curriculum"}
  ],
  cloud: [
    {name:"Microsoft Learn",topic:"Cloud & Azure fundamentals",url:"https://learn.microsoft.com/en-us/training/azure/",note:"Free learning paths"},
    {name:"AWS Skill Builder",topic:"Cloud practitioner foundations",url:"https://skillbuilder.aws/",note:"Free digital training is available"},
    {name:"Docker Get Started",topic:"Containers & deployment basics",url:"https://docs.docker.com/get-started/",note:"Free official tutorials"}
  ],
  "soc-forensics": [
    {name:"Cisco Skills for All",topic:"Networking & cybersecurity foundations",url:"https://skillsforall.com/",note:"Free courses"},
    {name:"Splunk Security Education",topic:"SIEM & security monitoring",url:"https://www.splunk.com/en_us/training/free-courses/overview.html",note:"Free courses are available"},
    {name:"CyberDefenders",topic:"SOC analysis & blue-team labs",url:"https://cyberdefenders.org/",note:"Free challenges are available"}
  ],
  software: [
    {name:"CS50x",topic:"Computer science & programming foundations",url:"https://cs50.harvard.edu/x/",note:"Free to study; optional certificate costs extra"},
    {name:"freeCodeCamp",topic:"Programming, algorithms & projects",url:"https://www.freecodecamp.org/learn/",note:"Free curriculum"},
    {name:"GitHub Skills",topic:"Git, GitHub & collaboration",url:"https://skills.github.com/",note:"Free practical courses"}
  ],
  mobile: [
    {name:"Android Developers",topic:"Android app development with Kotlin",url:"https://developer.android.com/courses",note:"Free official courses"},
    {name:"Flutter documentation",topic:"Flutter & cross-platform app basics",url:"https://docs.flutter.dev/learn",note:"Free official learning resources"},
    {name:"freeCodeCamp",topic:"Mobile app development tutorials",url:"https://www.freecodecamp.org/news/tag/mobile-development/",note:"Free articles and tutorials"}
  ],
  database: [
    {name:"SQLBolt",topic:"SQL fundamentals & query practice",url:"https://sqlbolt.com/",note:"Free interactive lessons"},
    {name:"PostgreSQL Tutorial",topic:"Relational database concepts & SQL",url:"https://www.postgresql.org/docs/current/tutorial.html",note:"Free official tutorial"},
    {name:"W3Schools SQL",topic:"SQL basics, joins & examples",url:"https://www.w3schools.com/sql/",note:"Free tutorials"}
  ],
  networking: [
    {name:"Cisco Skills for All",topic:"Networking basics & packet concepts",url:"https://skillsforall.com/",note:"Free networking courses"},
    {name:"Practical Networking",topic:"Subnetting, routing & TCP/IP",url:"https://www.practicalnetworking.net/",note:"Free explanations and tutorials"},
    {name:"Linux Journey",topic:"Linux command line & administration",url:"https://linuxjourney.com/",note:"Free learning resource"}
  ],
  "ui-ux": [
    {name:"Figma Learn",topic:"Interface design & prototyping",url:"https://www.figma.com/resource-library/",note:"Free learning articles and tutorials"},
    {name:"Google UX Design resources",topic:"UX research, wireframes & usability",url:"https://design.google/library/",note:"Free design learning resources"},
    {name:"Laws of UX",topic:"Visual hierarchy & user-centred design",url:"https://lawsofux.com/",note:"Free UX principles and examples"}
  ]
};\nconst studentShowcasePosts = [
  // Add approved public LinkedIn post links here. No student images or uploads are stored.
];


function CourseCard({ course }) {
  const Icon = iconMap[course.category] || BookOpen;
  const brandMark = getCourseBrand(course);
  const available = course.status === "available" && validYoutube(course.youtubeUrl);
  return <article className="course-card">
    <div className="course-art"><div className="course-brand-mark">{brandMark ? <div className="course-tech-logos" aria-label={brandMark.label}>{brandMark.marks.map(([slug,label])=><span className="course-tech-logo" key={slug}><img src={`https://cdn.simpleicons.org/${slug}`} alt={label} loading="lazy" onError={e=>{e.currentTarget.parentElement.style.display="none";}}/><small>{label}</small></span>)}</div> : <Icon size={38} strokeWidth={1.5} aria-hidden="true"/>}<span>{brandMark?.label || course.category}</span></div>
      <span className={`status ${available ? "status-live" : "status-soon"}`}>{available ? "Available" : "In preparation"}</span>
      {course.featured && <span className="featured">Featured</span>}
    </div>
    <div className="course-body"><span className="category">{course.category}</span><h3>{course.title}</h3><p>{course.description}</p>
      <div className="course-actions">{available
        ? <a className="btn btn-youtube-small" href={course.youtubeUrl} target="_blank" rel="noopener noreferrer">Watch course <ArrowUpRight size={16}/></a>
        : <span className="coming-label"><Clock3 size={15}/> Content coming soon</span>}
        {course.externalResourceUrl && safeHttps(course.externalResourceUrl) && <a className="resource-link" href={course.externalResourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`External resource for ${course.title}`}><ExternalLink size={17}/></a>}
      </div>
    </div>
  </article>;
}
function App() {
  const path = window.location.pathname;
  if (path === "/admin" || path.startsWith("/admin/")) return <Admin/>;
  if (path === "/verify" || path.startsWith("/verify/")) return <Verify/>;
  return <Home/>;
}
function Home() {
  const stored = useMemo(() => getEhoData(), []);
  const coursesData = stored.courses || initialCourses;
  const internshipsData = stored.internships || internships;
  const siteSettings = stored.settings || settings;
  const domainsData = stored.domains || [];
  const categories = ["All domains", ...domainsData.map(d=>d.name)];
  const [filter,setFilter] = useState("All domains");
  const [query,setQuery] = useState("");
  const [menuOpen,setMenuOpen] = useState(false);
  const [socialOpen,setSocialOpen] = useState(false);
  const [activeRoadmapId,setActiveRoadmapId] = useState(domainsData[0]?.id || "cybersecurity");
  const visibleCourses = useMemo(() => coursesData.filter(c=>c.status!=="unpublished")
    .filter(c=>filter==="All domains"||c.category===filter)
    .filter(c=>`${c.title} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0)),[filter,query,coursesData]);
  const channelUrl = validYoutube(siteSettings.youtubeChannelUrl) ? siteSettings.youtubeChannelUrl : "https://youtube.com/@eho-o2r";
  const linkedinUrl = safeHttps(siteSettings.linkedinUrl) ? siteSettings.linkedinUrl : socialLinks[0].url;
  const uniqueInternships = internshipsData.filter(item=>item.published).filter((item,index,arr)=>arr.findIndex(x=>x.domainId===item.domainId)===index);
  const projectMail = mailLink("Project enquiry — EHO", "Hello EHO team,\n\nI would like to discuss a project.\n\nProject type:\nBrief requirements:\nExpected timeline:\nName / organisation:\nContact number:\n");
  const internshipMail = mailLink("Internship enquiry — EHO","Hello EHO team,\n\nI am interested in an EHO internship.\n\nName:\nPreferred domain:\nPreferred duration:\nContact number:\n");
  const teachingFormUrl = "https://forms.gle/xu6TyKVNQgLPtFYD6";
  const internshipFormUrl = "https://forms.gle/f3Qp1mp6oC5rX73f7";
  return <div>
    <header className="site-header"><nav className="nav wrap" aria-label="Main navigation">
      <a className="brand" href="#home" aria-label="EHO home"><BrandLogo size={48}/><span><strong>EHO</strong><small>Ethical Hacking Organizations</small></span></a>
      <button className="menu-toggle" onClick={()=>setMenuOpen(!menuOpen)} aria-label={menuOpen?"Close menu":"Open menu"}>{menuOpen?<X/>:<Menu/>}</button>
      <div className={`nav-links ${menuOpen?"nav-open":""}`}>
        {[[ "#home","Home"],["#services","Services"],["#learning","Learning"],["#internships","Internships"],["#student-work","Student Work"],["#roadmap","Roadmaps"],["#about","About"]].map(([href,label])=><a key={href} onClick={()=>setMenuOpen(false)} href={href}>{label}</a>)}
        <div className={`social-menu-wrap ${socialOpen?"social-menu-active":""}`}>
          <button className="social-menu-trigger" type="button" aria-expanded={socialOpen} onClick={()=>setSocialOpen(v=>!v)}><Globe2 size={15}/> Social media <span className="social-chevron">▾</span></button>
          {socialOpen&&<div className="social-dropdown" aria-label="EHO social media links">{socialLinks.map(({label,url,Icon})=><a key={label} href={label==="YouTube"?channelUrl:label==="LinkedIn"?linkedinUrl:url} target="_blank" rel="noopener noreferrer" onClick={()=>{setSocialOpen(false);setMenuOpen(false);}}><Icon size={17}/><span>{label}</span><ExternalLink size={13}/></a>)}</div>}
        </div>
        <a className="nav-verify" onClick={()=>setMenuOpen(false)} href="/verify/"><BadgeCheck size={15}/> Verify</a>
        <a className="nav-cta" onClick={()=>setMenuOpen(false)} href={projectMail}>Start a project <ArrowUpRight size={15}/></a>
      </div>
    </nav></header>
    <main>
      <section className="hero hero-enterprise" id="home"><div className="hero-grid"/>
        <div className="hero-content wrap">
          <div className="eyebrow"><span className="pulse-dot"/> TECHNOLOGY • LEARNING • DELIVERY</div>
          <h1>Technology that<br/><span>moves ideas forward.</span></h1>
          <p>EHO is a technology learning and delivery initiative. We help learners build practical skills and work with organisations to shape useful digital solutions — from websites and software to AI and cybersecurity.</p>
          <div className="hero-actions"><a className="btn btn-gold" href="#services">Explore our services <ArrowUpRight size={17}/></a><a className="btn btn-outline" href="#learning">Explore learning</a></div>
          <div className="hero-points"><span><CheckCircle2 size={16}/> Clear scope & deliverables</span><span><CheckCircle2 size={16}/> Practical, project-led learning</span><span><CheckCircle2 size={16}/> Direct communication</span></div>
          <div className="hero-trust-note"><span className="hero-trust-line"/> BUILT AROUND REAL REQUIREMENTS, NOT EMPTY PROMISES</div>
        </div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><BrandLogo large size={320} className="hero-logo"/>
      </section>
      <section className="proof-strip wrap" aria-label="EHO focus areas">
        <div><strong>01</strong><span>Technology services</span></div><div><strong>02</strong><span>Accessible learning</span></div><div><strong>03</strong><span>Hands-on internships</span></div><div><strong>04</strong><span>Student & client projects</span></div>
      </section>
      <section className="section wrap" id="services">
        <div className="section-heading"><div><span className="section-kicker">WHAT WE CAN BUILD</span><h2>Technology services</h2><p>One point of contact for digital work. Share your requirement and we’ll discuss the right scope, timeline and deliverables before starting.</p></div><a className="text-link" href={projectMail}>Discuss a project <ArrowUpRight size={16}/></a></div>
        <div className="service-grid">{serviceCards.map(({Icon,title,text})=><article className="service-card" key={title}><div className="service-icon"><Icon size={23}/></div><h3>{title}</h3><p>{text}</p><a href={projectMail}>Discuss this service <ArrowRight size={15}/></a></article>)}</div>
        <div className="project-callout"><div><span className="section-kicker">HAVE A REQUIREMENT?</span><h3>Let’s turn your brief into a clear project plan.</h3><p>Send a short description. We’ll follow up to understand the requirement and confirm whether it fits our current capabilities.</p></div><a className="btn btn-gold" href={projectMail}>Send project enquiry <ArrowUpRight size={17}/></a></div>
      </section>
      <section className="process-band"><div className="wrap"><div className="section-heading"><div><span className="section-kicker">HOW WE WORK</span><h2>A straightforward delivery process</h2><p>Clients should know what happens next, what is included and how progress is communicated.</p></div></div>
        <div className="process-grid">{workSteps.map(([num,title,desc])=><article className="process-card" key={num}><span>{num}</span><h3>{title}</h3><p>{desc}</p></article>)}</div>
      </div></section>
      <section className="section wrap" id="learning">
        <div className="section-heading"><div><span className="section-kicker">EHO LEARNING</span><h2>Learn without barriers.</h2><p>Accessible technology education across our IT domains. Free learning resources are the foundation; internships add structure, guided tasks and project practice.</p></div><div className="learning-badge"><BookOpen size={20}/><span>Learn • Practise • Build</span></div></div>
        <div className="learning-summary"><div className="learning-summary-icon"><BookOpen size={21}/></div><div><strong>One library. Multiple technology paths.</strong><p>Start with the fundamentals, practise through guided resources and build skills at your own pace.</p></div><a href={channelUrl} target="_blank" rel="noopener noreferrer">Free learning resources <ArrowUpRight size={15}/></a></div>
        <div className="course-library-heading"><div><span className="section-kicker">RESOURCE LIBRARY</span><h3>Explore learning paths</h3></div><span className="library-count">{visibleCourses.length} listed paths</span></div>
        <div className="course-tools"><label className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search courses..." aria-label="Search courses"/></label><div className="filters" aria-label="Filter courses">{categories.map(c=><button key={c} className={`filter ${filter===c?"active":""}`} onClick={()=>setFilter(c)}>{c}</button>)}</div></div>
        <div className="courses-grid">{visibleCourses.map(c=><CourseCard key={c.id} course={c}/>)}{visibleCourses.length===0&&<div className="empty-state">No learning paths match your search. Try another keyword or domain.</div>}</div>
      </section>
      <section className="internship-section" id="internships"><div className="wrap section">
        <div className="section-heading"><div><span className="section-kicker">PRACTICAL EXPERIENCE</span><h2>Internship programmes</h2><p>Choose a learning duration and domain. Each programme is intended to include guided tasks and practical project work appropriate to its duration.</p></div></div>
        <div className="programme-application-grid"><article className="programme-application-card teaching-programme"><div className="programme-card-top"><span className="programme-icon"><BookOpen size={22}/></span><span className="programme-pill">NO PROGRAMME FEE</span></div><span className="section-kicker">6 MONTHS · REMOTE</span><h3>Teaching & Knowledge Contributor</h3><p>Create educational videos, explain technical concepts and help build EHO’s learning library. Certificate and performance-based LOR opportunities are subject to successful completion and review.</p><div className="programme-highlights"><span><CheckCircle2 size={15}/> Educational content creation</span><span><CheckCircle2 size={15}/> Knowledge-sharing experience</span></div><a className="btn btn-gold" href={teachingFormUrl} target="_blank" rel="noopener noreferrer">Apply for Teaching Programme <ArrowUpRight size={16}/></a></article><article className="programme-application-card regular-programme"><div className="programme-card-top"><span className="programme-icon"><BriefcaseBusiness size={22}/></span><span className="programme-pill paid-pill">PAID PROGRAMME</span></div><span className="section-kicker">MULTIPLE DOMAINS · PROJECT-LED</span><h3>Regular Internship Programme</h3><p>Choose your preferred IT domain and internship duration. Work through guided tasks, practical assignments and project deliverables.</p><div className="programme-highlights"><span><CheckCircle2 size={15}/> Structured practical tasks</span><span><CheckCircle2 size={15}/> Project-based deliverables</span></div><a className="btn btn-outline" href={internshipFormUrl} target="_blank" rel="noopener noreferrer">Explore paid internships <ArrowUpRight size={16}/></a></article></div><div className="internship-grid">{uniqueInternships.map((item,index)=><article className="internship-card" key={item.domainId||index}><div className="internship-top"><span className="duration"><Clock3 size={15}/> Flexible duration</span><span className="internship-icon"><Layers3/></span></div><h3>{item.domain||item.title}</h3><p>{item.description}</p>{item.skills?.length>0&&<div className="public-skills">{item.skills.slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</div>}
          <div className="domain-prices">{internshipsData.filter(pkg=>pkg.domainId===item.domainId&&pkg.published).sort((a,b)=>parseInt(a.duration)-parseInt(b.duration)).map(pkg=><div key={pkg.id}><small>{pkg.duration}</small><b>₹{Number(pkg.price).toLocaleString("en-IN")}</b></div>)}</div>
          <a className="internship-apply" href={internshipFormUrl} target="_blank" rel="noopener noreferrer">Register for this internship <ArrowUpRight size={15}/></a>
        </article>)}</div>
        <p className="pricing-note">Programme scope, task schedule, eligibility and deliverables are shared with applicants before enrolment. Fees shown are programme fees; any separately offered assessment or certification is communicated clearly.</p>
      </div></section>

      <section className="section wrap student-showcase-section" id="student-work">
        <div className="section-heading"><div><span className="section-kicker">STUDENT COMMUNITY</span><h2>Student work & achievements</h2><p>Explore projects, learning milestones and achievements shared by EHO learners. We link directly to students’ public LinkedIn posts instead of uploading images, keeping the site lightweight and inexpensive to operate.</p></div><a className="text-link" href={linkedinUrl} target="_blank" rel="noopener noreferrer">Visit EHO on LinkedIn <ArrowUpRight size={16}/></a></div>
        {studentShowcasePosts.length>0 ? <div className="student-post-grid">{studentShowcasePosts.map((post,index)=><article className="student-post-card" key={post.url}><div className="student-post-top"><span className="student-post-icon"><Linkedin size={22}/></span><span className="section-kicker">STUDENT SPOTLIGHT · {String(index+1).padStart(2,"0")}</span></div><h3>{post.title}</h3><p>{post.description}</p><a href={post.url} target="_blank" rel="noopener noreferrer">View LinkedIn post <ArrowUpRight size={15}/></a></article>)}</div> : <div className="student-gallery-empty"><div className="student-empty-icon"><Users size={25}/></div><div><h3>Student spotlights are coming soon</h3><p>As learners share their project updates and achievements on LinkedIn, EHO can feature their original posts here—with their permission.</p></div><a className="btn btn-outline" href={linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin size={16}/> Visit EHO LinkedIn <ArrowUpRight size={15}/></a></div>}
        <p className="student-privacy-note">Only public post links approved by the student will be featured. EHO does not copy or host student photos and media on this website.</p>
      </section>
      <section className="roadmap-section" id="roadmap"><div className="wrap section">
        <div className="section-heading"><div><span className="section-kicker">YOUR LEARNING JOURNEY</span><h2>Interactive learning roadmaps</h2><p>Choose an IT domain to see a suggested learning sequence—from foundations to practical skills. Move through the steps at your own pace.</p></div><div className="roadmap-heading-badge"><Workflow size={20}/><span>12 technology domains</span></div></div>
        <div className="roadmap-layout">
          <div className="roadmap-domain-list" role="tablist" aria-label="Choose a learning domain">{domainsData.map(domain=><button type="button" role="tab" aria-selected={activeRoadmapId===domain.id} className={activeRoadmapId===domain.id?"active":""} key={domain.id} onClick={()=>setActiveRoadmapId(domain.id)}><span className="roadmap-domain-emoji">{domain.icon||"◆"}</span><span>{domain.name}</span><ArrowRight size={15}/></button>)}</div>
          {(()=>{const activeDomain=domainsData.find(d=>d.id===activeRoadmapId)||domainsData[0];const steps=activeDomain?.skills||[];return activeDomain?<div className="roadmap-detail" role="tabpanel"><div className="roadmap-detail-head"><div><span className="section-kicker">SELECTED ROADMAP</span><h3>{activeDomain.name}</h3><p>{activeDomain.description}</p></div><span className="roadmap-domain-hero">{activeDomain.icon||"◆"}</span></div><div className="roadmap-steps">{steps.map((step,index)=><div className="roadmap-step" key={step}><span className="roadmap-step-number">{String(index+1).padStart(2,"0")}</span><div><strong>{step}</strong><small>{index===0?"Start here":index===steps.length-1?"Apply this skill in a practical project":"Build this skill before moving to the next stage"}</small></div>{index===steps.length-1?<BadgeCheck size={18}/>:<ArrowRight size={16}/>}</div>)}</div><div className="roadmap-resources"><div className="roadmap-resources-heading"><div><span className="section-kicker">FREE EXTERNAL LEARNING</span><h4>Recommended resources for {activeDomain.name}</h4><p>Hand-picked free learning material matched to this domain. Optional paid upgrades and certificates are not required.</p></div><span className="free-only-pill"><CheckCircle2 size={14}/> FREE TO LEARN</span></div><div className="roadmap-resource-grid">{(freeRoadmapResources[activeDomain.id]||[]).map(resource=><a className="roadmap-resource-card" key={resource.name} href={resource.url} target="_blank" rel="noopener noreferrer"><span className="roadmap-resource-top"><strong>{resource.name}</strong><ExternalLink size={15}/></span><span className="roadmap-resource-topic">{resource.topic}</span><small>{resource.note}</small></a>)}</div></div><div className="roadmap-footer"><span><CheckCircle2 size={16}/> Suggested order · Learn, practise, then build</span><button className="btn btn-gold" type="button" onClick={()=>{setFilter(activeDomain.name);setQuery("");document.getElementById("learning")?.scrollIntoView({behavior:"smooth"});}}>View learning resources <ArrowUpRight size={15}/></button></div></div>:<div className="roadmap-detail"><p>Learning domains will appear here when available.</p></div>})()}
        </div>
        <p className="roadmap-disclaimer">Roadmaps are learning guides, not guaranteed course schedules. Topics and tools may be updated as EHO learning content develops.</p>
      </div></section>
      <section className="dual-model-band" id="about"><div className="wrap dual-model-inner">
        <div><span className="section-kicker">THE EHO MODEL</span><h2>Learn with purpose.<br/><span>Build with responsibility.</span></h2><p>Our work is organised around two connected goals: make technology learning more accessible, and deliver useful digital work for real requirements.</p></div>
        <div className="model-card"><div className="model-number">01 / LEARNING</div><h3>EHO Learning Initiative</h3><p>Free educational resources, student development, guided internships, practical projects and assessment-led learning opportunities.</p><ul><li>Accessible learning content</li><li>Structured internship tracks</li><li>Project-based practice</li></ul></div>
        <div className="model-card model-card-accent"><div className="model-number">02 / DELIVERY</div><h3>EHO Technology Services</h3><p>Client-focused digital projects that help sustain our learning work while giving the team opportunities to solve practical problems.</p><ul><li>Websites & software</li><li>AI, automation & cloud</li><li>Authorised security services</li></ul></div>
      </div></section>
      <section className="about-details wrap"><div><span className="section-kicker">ABOUT THE ORGANISATION</span><h2>Small team mindset.<br/>Professional standards.</h2></div><div><p>EHO — Ethical Hacking Organizations — is an independent technology initiative focused on accessible learning and practical digital solutions. We aim to work transparently: define requirements, communicate progress, document deliverables and be clear about what is currently available.</p><p>We do not claim a project, client result, certification or legal registration unless it has actually been completed and can be verified.</p><div className="about-values"><span><CheckCircle2/> Honest communication</span><span><CheckCircle2/> Documented work</span><span><CheckCircle2/> Responsible practice</span></div></div></section>
      <section className="contact-band"><div className="wrap contact-inner"><div><span className="section-kicker">LET’S TALK</span><h2>Have a project, question or learning goal?</h2><p>Reach the EHO team directly. Tell us what you need and we’ll guide you to the right next step.</p></div><div className="contact-actions"><a className="btn btn-gold" href={projectMail}><BriefcaseBusiness size={17}/> Client project enquiry</a><a className="btn btn-outline" href={`mailto:${EMAIL}`}><Mail size={17}/> Email EHO</a></div></div></section>
    </main>
    <footer className="footer"><div className="wrap footer-grid">
      <div className="footer-brand"><a className="brand" href="#home"><BrandLogo size={56}/><span><strong>EHO</strong><small>Ethical Hacking Organizations</small></span></a><p>Learn • Build • Secure • Grow</p><a className="footer-email" href={`mailto:${EMAIL}`}><Mail size={15}/>{EMAIL}</a></div>
      <div><h4>Explore</h4><a href="#services">Technology services</a><a href="#learning">Free learning</a><a href="#internships">Internships</a><a href="#student-work">Student Work</a><a href="#roadmap">Learning Roadmaps</a><a href={teachingFormUrl} target="_blank" rel="noopener noreferrer">Teaching Contributor Application</a><a href={internshipFormUrl} target="_blank" rel="noopener noreferrer">Internship Registration</a><a href="#about">About EHO</a></div>
      <div><h4>Connect</h4>{socialLinks.map(({label,url,Icon})=><a key={label} href={url} target="_blank" rel="noopener noreferrer"><Icon size={16}/>{label}</a>)}</div>
      <div><h4>Trust & support</h4><a href="/verify/">Verify a certificate <BadgeCheck size={15}/></a><a href={`mailto:${EMAIL}`}>Contact the EHO team <ArrowUpRight size={15}/></a><p className="footer-note">Certificate verification checks the current official EHO record.</p></div>
    </div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} EHO — Ethical Hacking Organizations</span><span>Technology learning & project services</span></div></footer>
  </div>;
}
export default App;
