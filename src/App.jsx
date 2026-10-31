import React, { useMemo, useState } from "react";
import { ShieldCheck, Code2, BrainCircuit, Cloud, Database, Search, Menu, X, ArrowUpRight, Youtube, Linkedin, BookOpen, Clock3, BadgeCheck, ExternalLink, Instagram, Send } from "lucide-react";
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

const iconMap = {
  Cybersecurity: ShieldCheck, "Web Development": Code2, Python: Code2,
  "AI/ML": BrainCircuit, "Data Science": Database, Cloud, SOC: Search, Software: Code2
};
const safeHttps = (value) => {
  try { const u = new URL(value); return u.protocol === "https:"; } catch { return false; }
};
const validYoutube = (value) => {
  if (!safeHttps(value)) return false;
  try {
    const u = new URL(value);
    return ["youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtu.be"].includes(u.hostname);
  } catch { return false; }
};

function CourseCard({ course }) {
  const Icon = iconMap[course.category] || BookOpen;
  const available = course.status === "available" && validYoutube(course.youtubeUrl);
  return <article className="course-card">
    <div className="course-art">
      <Icon size={42} strokeWidth={1.5} aria-hidden="true" />
      <span className={`status ${course.status === "available" ? "status-live" : "status-soon"}`}>
        {course.status === "available" ? "Available" : "Coming Soon"}
      </span>
      {course.featured && <span className="featured">Featured</span>}
    </div>
    <div className="course-body">
      <span className="category">{course.category}</span>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <div className="course-actions">
        {available
          ? <a className="btn btn-youtube-small" href={course.youtubeUrl} target="_blank" rel="noopener noreferrer">Watch Course <ArrowUpRight size={16}/></a>
          : <span className="coming-label"><Clock3 size={15}/> Course coming soon</span>}
        {course.externalResourceUrl && safeHttps(course.externalResourceUrl) &&
          <a className="resource-link" href={course.externalResourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`External resource for ${course.title}`}><ExternalLink size={17}/></a>}
      </div>
    </div>
  </article>;
}

// Simple path-based routing. Kept outside the page component so React hooks are never called conditionally.
export default function App() {
  const path = window.location.pathname;
  if (path === "/admin" || path.startsWith("/admin/")) return <Admin />;
  if (path === "/verify" || path.startsWith("/verify/")) return <Verify />;
  return <Home />;
}

function Home() {
  const stored = useMemo(() => getEhoData(), []);
  const coursesData = stored.courses || initialCourses;
  const internshipsData = stored.internships || internships;
  const siteSettings = stored.settings || settings;
  const domainsData = stored.domains || [];
  const categories = ["All Courses", ...domainsData.map(d=>d.name)];
  const [filter, setFilter] = useState("All Courses");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleCourses = useMemo(() => coursesData
    .filter(c => c.status !== "unpublished")
    .filter(c => filter === "All Courses" || c.category === filter)
    .filter(c => `${c.title} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)), [filter, query, coursesData]);
  const channelUrl = validYoutube(siteSettings.youtubeChannelUrl) ? siteSettings.youtubeChannelUrl : "";
  const linkedinUrl = safeHttps(siteSettings.linkedinUrl) ? siteSettings.linkedinUrl : "https://www.linkedin.com/";

  return <div>
    <header className="site-header">
      <nav className="nav wrap" aria-label="Main navigation">
        <a className="brand" href="#home" aria-label="EHO home">
          <BrandLogo size={48} />
          <span><strong>EHO</strong><small>Ethical Hacking Organizations</small></span>
        </a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X/> : <Menu/>}</button>
        <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <a onClick={() => setMenuOpen(false)} href="#home">Home</a>
          <a className="nav-verify" onClick={() => setMenuOpen(false)} href="/verify/"><BadgeCheck size={15}/> Verify Certificate</a>
          <a onClick={() => setMenuOpen(false)} href="#courses">Free Courses</a>
          <a onClick={() => setMenuOpen(false)} href="#internships">Internships</a>
          <a onClick={() => setMenuOpen(false)} href="#about">About</a>
          
        </div>
      </nav>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-grid"></div>
        <div className="hero-content wrap">
          <div className="eyebrow"><span className="pulse-dot"></span> Technology education for everyone</div>
          <h1>Learn. Build.<br/><span>Secure. Grow.</span></h1>
          <p>Build practical skills in cybersecurity and modern technology with EHO. Free learning resources and career-focused programs are on the way.</p>
          <div className="hero-actions">
            <a className="btn btn-gold" href="#courses">Explore Courses <ArrowUpRight size={17}/></a>
            <a className="btn btn-outline" href="#internships">Explore Internships</a>
            <a className="btn btn-verify-hero" href="/verify/"><BadgeCheck size={17}/> Verify Certificate</a>
          </div>
          <div className="hero-points">
            <span><ShieldCheck size={17}/> Security-minded learning</span>
            <span><BookOpen size={17}/> Practical skill building</span>
            <span><BadgeCheck size={17}/> Clear course status</span>
          </div>
        </div>
        <div className="hero-orbit orbit-one"></div><div className="hero-orbit orbit-two"></div>
        <BrandLogo large size={340} className="hero-logo" />
      </section>

      <section className="domains wrap" aria-label="Technology domains">
        <div className="domain-chip"><ShieldCheck/> Cybersecurity</div>
        <div className="domain-chip"><Code2/> Web & Software</div>
        <div className="domain-chip"><BrainCircuit/> AI & ML</div>
        <div className="domain-chip"><Database/> Data Science</div>
        <div className="domain-chip"><Cloud/> Cloud Computing</div>
      </section>

      <section className="section wrap" id="courses">
        <div className="section-heading">
          <div><span className="section-kicker">LEARN WITH EHO</span><h2>Free Courses</h2><p>Our course library is being prepared. Every course will be marked clearly before it goes live.</p></div>
          <div className="course-count"><strong>{visibleCourses.length.toString().padStart(2,"0")}</strong><span>learning paths</span></div>
        </div>
        <div className="course-tools">
          <label className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses..." aria-label="Search courses"/></label>
          <div className="filters" aria-label="Filter courses">{categories.map(c =>
            <button key={c} className={`filter ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>)}</div>
        </div>
        <div className="courses-grid">
          {visibleCourses.map(c => <CourseCard key={c.id} course={c}/>)}
          {visibleCourses.length === 0 && <div className="empty-state">No courses match your search. Try another keyword or category.</div>}
        </div>
      </section>

      <section className="channel-band">
        <div className="channel-inner wrap">
          <div className="youtube-symbol"><Youtube size={34}/></div>
          <div className="channel-copy"><span className="section-kicker">VIDEO LEARNING</span><h2>Learn with EHO on YouTube</h2><p>Course videos are coming soon. The official channel link can be updated by the EHO content administrator whenever needed.</p></div>
          {channelUrl && <a className="btn btn-youtube" href={channelUrl} target="_blank" rel="noopener noreferrer">{siteSettings.youtubeChannelLabel || "Visit Our YouTube Channel"} <ArrowUpRight size={17}/></a>}
          {!channelUrl && <span className="channel-pending"><Clock3 size={16}/> Channel link coming soon</span>}
        </div>
      </section>

      <section className="section wrap" id="internships">
        <div className="section-heading">
          <div><span className="section-kicker">BUILD REAL-WORLD SKILLS</span><h2>Internship Programs</h2><p>Proposed programs and prices. Program details and application process should be confirmed before enrollment.</p></div>
        </div>
        <div className="internship-grid">{internshipsData.filter(item=>item.published).filter((item,index,arr)=>arr.findIndex(x=>x.domainId===item.domainId)===index).map((item, index) =>
          <article className="internship-card" key={`${item.duration}-${index}`}>
            <div className="internship-top"><span className="duration"><Clock3 size={15}/>{item.duration}</span><span className="internship-icon"><ShieldCheck/></span></div>
            <h3>{item.domain || item.title}</h3><p>{item.description}</p>{item.skills?.length>0&&<div className="public-skills">{item.skills.slice(0,4).map(skill=><span key={skill}>{skill}</span>)}</div>}
            <div className="domain-prices">{internshipsData.filter(pkg=>pkg.domainId===item.domainId&&pkg.published).map(pkg=><div key={pkg.id}><small>{pkg.duration}</small><b>₹{Number(pkg.price).toLocaleString("en-IN")}</b></div>)}</div>
            <span className="coming-label"><Clock3 size={15}/> Program details to be announced</span>
          </article>)}
        </div>
      </section>

      <section className="about-band" id="about">
        <div className="wrap about-inner">
          <div><span className="section-kicker">ABOUT EHO</span><h2>Technology skills should be within reach.</h2></div>
          <p>EHO — Ethical Hacking Organizations aims to help learners explore technology, develop practical skills, and grow through accessible learning resources. Course availability and program details will be clearly communicated as they are finalized.</p>
          <a className="btn btn-outline" href={linkedinUrl} target="_blank" rel="noopener noreferrer">Connect on LinkedIn <ArrowUpRight size={17}/></a>
        </div>
      </section>
    </main>

    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand"><a className="brand" href="#home"><BrandLogo size={56} /><span><strong>EHO</strong><small>Ethical Hacking Organizations</small></span></a><p>Learn • Build • Secure • Grow</p></div>
        <div><h4>Explore</h4><a href="#courses">Free Courses</a><a href="#internships">Internships</a><a href="#about">About EHO</a></div>
        <div><h4>Connect with EHO</h4>
          <a href="https://t.me/+DcMcdkA1TBJkNTg9" target="_blank" rel="noopener noreferrer"><Send size={16}/> Telegram</a>
          <a href="https://www.instagram.com/ehoofficial_009/" target="_blank" rel="noopener noreferrer"><Instagram size={16}/> Instagram</a>
          <a href="https://www.linkedin.com/company/eho-ethical-hacking-organizations/" target="_blank" rel="noopener noreferrer"><Linkedin size={16}/> LinkedIn</a>
          <a href="https://youtube.com/@eho-o2r?si=AZXenkZ_18xZattr" target="_blank" rel="noopener noreferrer"><Youtube size={16}/> YouTube</a>
        </div>
        <div><h4>Certificate Services</h4><a href="/verify/">Verify a certificate <BadgeCheck size={15}/></a><p className="footer-note">Check certificate status against the official EHO record.</p></div>
      </div>
      <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} EHO — Ethical Hacking Organizations</span><span>Learn • Build • Secure • Grow</span></div>
    </footer>
  </div>;
}