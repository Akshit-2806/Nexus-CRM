import { useState, useMemo } from "react";
import {
  LayoutDashboard, Target, Briefcase, Users, DollarSign, CheckSquare,
  Search, Plus, X, Sparkles, ChevronRight, ChevronDown, LogOut, Shield,
  Layers, Lock, Eye, EyeOff, Mail, Phone, Building2, UserPlus, Edit3,
  Trash2, MapPin, CheckCircle2, CreditCard, Globe, Zap, Award, FileText,
  AlertCircle, Settings, TrendingUp, Banknote, ClipboardList
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRIES = ["Singapore","India","Thailand","UAE","Indonesia"];
const PROJECT_TYPES = ["Development","SEO","Digital Marketing","Design","Consulting","Analytics","Social Media","Content","PR","Other"];
const SOURCES = ["Inbound","Outbound","Referral","Partner","Event","Cold Outreach"];
const TASK_TYPES = ["call","demo","proposal","contract","email","meeting","review"];

const ROLES = {
  admin:      { label:"Admin",              color:"bg-purple-100 text-purple-700",  nav:["dashboard","users","leads","engagements","payments","commissions","tasks","team"] },
  sales:      { label:"Sales Person",       color:"bg-blue-100 text-blue-700",      nav:["dashboard","leads","engagements","payments","commissions","tasks"] },
  engagement: { label:"Engagement Manager", color:"bg-amber-100 text-amber-700",    nav:["dashboard","engagements","payments","tasks","team"] },
  projects:   { label:"Projects Manager",   color:"bg-emerald-100 text-emerald-700",nav:["dashboard","engagements","tasks"] },
};

const ENG_STATUS  = { active:{cls:"bg-emerald-50 text-emerald-700",label:"Active"},paused:{cls:"bg-amber-50 text-amber-700",label:"Paused"},completed:{cls:"bg-slate-100 text-slate-600",label:"Completed"} };
const LEAD_STATUS = { open:{cls:"bg-blue-50 text-blue-700",label:"Open"},active:{cls:"bg-emerald-50 text-emerald-700",label:"Active"},closed_won:{cls:"bg-indigo-50 text-indigo-700",label:"Won"},closed_lost:{cls:"bg-rose-50 text-rose-700",label:"Lost"} };
const PAY_STATUS  = { paid:{cls:"bg-emerald-50 text-emerald-700",label:"Paid",dot:"bg-emerald-400"},pending:{cls:"bg-amber-50 text-amber-700",label:"Pending",dot:"bg-amber-400"},overdue:{cls:"bg-rose-50 text-rose-700",label:"Overdue",dot:"bg-rose-400"} };
const PRIO_COL    = { high:"text-rose-600 bg-rose-50",medium:"text-amber-600 bg-amber-50",low:"text-slate-500 bg-slate-100" };
const USER_COLORS = { u1:"bg-violet-500",u2:"bg-pink-500",u3:"bg-sky-500",u4:"bg-emerald-500",u5:"bg-orange-500",u6:"bg-indigo-500",u7:"bg-teal-500" };

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id:"u1",name:"Raj Patel",    email:"admin@nexus.com", password:"admin123",role:"admin",      territories:[],                    commissionRate:0 },
  { id:"u2",name:"Sarah Chen",   email:"sarah@nexus.com", password:"pass123", role:"sales",      territories:["Singapore","India"], commissionRate:8 },
  { id:"u3",name:"Omar Hassan",  email:"omar@nexus.com",  password:"pass123", role:"sales",      territories:["UAE","Indonesia"],   commissionRate:7 },
  { id:"u4",name:"Elena Vance",  email:"elena@nexus.com", password:"pass123", role:"engagement", territories:[],                    commissionRate:0 },
  { id:"u5",name:"Marcus Bloom", email:"marcus@nexus.com",password:"pass123", role:"projects",   territories:[],                    commissionRate:0 },
];

const SEED_CLIENTS = [
  { id:"cl1",name:"TechFlow Inc",   contact:"David Kim",    email:"david@techflow.com", phone:"+65 9123 4567",  country:"Singapore" },
  { id:"cl2",name:"Gulf Ventures",  contact:"Fatima Al-R.", email:"fatima@gulfv.ae",    phone:"+971 50 123 456",country:"UAE" },
  { id:"cl3",name:"DataNest India", contact:"Priya Sharma", email:"priya@datanest.io",  phone:"+91 98765 43210",country:"India" },
  { id:"cl4",name:"Maju Digital",   contact:"Budi Santoso", email:"budi@maju.co.id",    phone:"+62 812 3456789",country:"Indonesia" },
];

const SEED_ENGAGEMENTS = [
  { id:"en1",clientId:"cl1",name:"Digital Transformation 2024",salesPersonId:"u2",pmId:"u2",status:"active",   value:150000,startDate:"2024-01-15",notes:"Flagship account. Full digital suite." },
  { id:"en2",clientId:"cl2",name:"Platform Launch — MENA",     salesPersonId:"u3",pmId:"u4",status:"active",   value:95000, startDate:"2024-02-01",notes:"Multi-phase delivery." },
  { id:"en3",clientId:"cl3",name:"Brand & Growth Programme",   salesPersonId:"u2",pmId:"u5",status:"active",   value:48000, startDate:"2024-02-15",notes:"SEO + content + social." },
  { id:"en4",clientId:"cl4",name:"E-Commerce Overhaul",        salesPersonId:"u3",pmId:"u4",status:"paused",   value:62000, startDate:"2024-01-20",notes:"On hold — client budget review." },
];

const SEED_PROJECTS = [
  { id:"pr1", engagementId:"en1",name:"Website Redesign",    assignedTo:["u2","u5"],status:"active",   value:55000,type:"Development",     notes:"Next.js + Tailwind CSS" },
  { id:"pr2", engagementId:"en1",name:"SEO Campaign",        assignedTo:["u4"],     status:"active",   value:24000,type:"SEO",             notes:"Monthly retainer, 12 months" },
  { id:"pr3", engagementId:"en1",name:"Digital Marketing",   assignedTo:["u4","u2"],status:"active",   value:36000,type:"Digital Marketing",notes:"Google Ads + Meta Ads" },
  { id:"pr4", engagementId:"en1",name:"Analytics Setup",     assignedTo:["u5"],     status:"completed",value:8000, type:"Analytics",        notes:"GA4 + Looker Studio" },
  { id:"pr5", engagementId:"en2",name:"Mobile App (iOS/Android)",assignedTo:["u5","u4"],status:"active",value:65000,type:"Development",     notes:"React Native cross-platform" },
  { id:"pr6", engagementId:"en2",name:"Backend API",         assignedTo:["u5"],     status:"active",   value:30000,type:"Development",     notes:"Node.js + AWS" },
  { id:"pr7", engagementId:"en3",name:"Brand Identity",      assignedTo:["u4"],     status:"completed",value:12000,type:"Design",          notes:"Logo + brand guidelines" },
  { id:"pr8", engagementId:"en3",name:"Social Media Mgmt",   assignedTo:["u2","u4"],status:"active",   value:18000,type:"Social Media",    notes:"4 platforms managed" },
  { id:"pr9", engagementId:"en3",name:"Content Strategy",    assignedTo:["u4"],     status:"active",   value:12000,type:"Content",         notes:"Blog + newsletter" },
  { id:"pr10",engagementId:"en4",name:"E-Commerce Platform", assignedTo:["u5","u3"],status:"paused",   value:50000,type:"Development",     notes:"Shopify enterprise build" },
  { id:"pr11",engagementId:"en4",name:"Product Photography", assignedTo:["u3"],     status:"paused",   value:8000, type:"Design",          notes:"200 SKUs" },
];

const SEED_PAYMENTS = [
  { id:"pay1", engagementId:"en1",projectId:"pr1",clientId:"cl1",description:"Website Redesign — Phase 1 (50%)",  amount:27500,dueDate:"2024-02-15",paidDate:"2024-02-14",status:"paid" },
  { id:"pay2", engagementId:"en1",projectId:"pr1",clientId:"cl1",description:"Website Redesign — Phase 2 (50%)",  amount:27500,dueDate:"2024-04-01",paidDate:null,        status:"pending" },
  { id:"pay3", engagementId:"en1",projectId:"pr2",clientId:"cl1",description:"SEO — January Retainer",            amount:2000, dueDate:"2024-01-31",paidDate:"2024-01-30",status:"paid" },
  { id:"pay4", engagementId:"en1",projectId:"pr2",clientId:"cl1",description:"SEO — February Retainer",           amount:2000, dueDate:"2024-02-29",paidDate:"2024-03-02",status:"paid" },
  { id:"pay5", engagementId:"en1",projectId:"pr3",clientId:"cl1",description:"Digital Marketing — Q1 Budget",     amount:9000, dueDate:"2024-03-31",paidDate:null,        status:"overdue" },
  { id:"pay6", engagementId:"en2",projectId:"pr5",clientId:"cl2",description:"Mobile App — Milestone 1",          amount:25000,dueDate:"2024-02-20",paidDate:"2024-02-22",status:"paid" },
  { id:"pay7", engagementId:"en2",projectId:"pr5",clientId:"cl2",description:"Mobile App — Milestone 2",          amount:25000,dueDate:"2024-04-15",paidDate:null,        status:"pending" },
  { id:"pay8", engagementId:"en2",projectId:"pr6",clientId:"cl2",description:"Backend API — Full Delivery",       amount:30000,dueDate:"2024-05-01",paidDate:null,        status:"pending" },
  { id:"pay9", engagementId:"en3",projectId:"pr7",clientId:"cl3",description:"Brand Identity — Full Project",     amount:12000,dueDate:"2024-02-10",paidDate:"2024-02-08",status:"paid" },
  { id:"pay10",engagementId:"en3",projectId:"pr8",clientId:"cl3",description:"Social Media — Q1 Retainer",        amount:4500, dueDate:"2024-03-31",paidDate:null,        status:"overdue" },
];

const SEED_LEADS = [
  { id:"l1",name:"Wei Lin",     company:"FinTech SG",   email:"wei@fintechsg.com",  country:"Singapore",status:"active",     value:45000,salesPersonId:"u2",source:"Inbound",  createdAt:"2024-01-15",aiScore:null,aiNote:null,notes:"Full digital suite interest" },
  { id:"l2",name:"Ahmed Al-M.", company:"Dubai PropCo", email:"ahmed@dubaiprop.ae", country:"UAE",      status:"open",       value:80000,salesPersonId:"u3",source:"Referral", createdAt:"2024-02-01",aiScore:null,aiNote:null,notes:"Real estate portal project" },
  { id:"l3",name:"Kavya Nair",  company:"EdTech India", email:"kavya@edtech.in",    country:"India",    status:"closed_won", value:35000,salesPersonId:"u2",source:"Outbound", createdAt:"2023-12-10",aiScore:82,  aiNote:"Strong fit, champion engaged, clear budget.",notes:"Won Q4 2023" },
  { id:"l4",name:"Andi Wijaya", company:"Tokobaju.id",  email:"andi@tokobaju.id",   country:"Indonesia",status:"active",     value:28000,salesPersonId:"u3",source:"Event",    createdAt:"2024-02-10",aiScore:null,aiNote:null,notes:"E-commerce fashion startup" },
  { id:"l5",name:"Tan Mei L.",  company:"SGRetail",     email:"mei@sgretail.com",   country:"Singapore",status:"open",       value:22000,salesPersonId:"u2",source:"Partner",  createdAt:"2024-02-18",aiScore:null,aiNote:null,notes:"SEO + social package" },
];

const SEED_TASKS = [
  { id:"tk1",title:"Send proposal — Dubai PropCo",    dueDate:"2024-03-05",priority:"high",  leadId:"l2", projectId:null, assignedTo:"u3",completed:false,type:"proposal" },
  { id:"tk2",title:"Weekly check-in — TechFlow SEO",  dueDate:"2024-03-06",priority:"medium",leadId:null, projectId:"pr2",assignedTo:"u4",completed:false,type:"meeting" },
  { id:"tk3",title:"Mobile app wireframe review",     dueDate:"2024-03-07",priority:"high",  leadId:null, projectId:"pr5",assignedTo:"u5",completed:false,type:"review" },
  { id:"tk4",title:"Invoice follow-up — Dig. Mktg",  dueDate:"2024-03-04",priority:"high",  leadId:null, projectId:"pr3",assignedTo:"u2",completed:false,type:"email" },
  { id:"tk5",title:"Onboarding call — Tokobaju",      dueDate:"2024-03-08",priority:"medium",leadId:"l4", projectId:null, assignedTo:"u3",completed:false,type:"call" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt      = (n) => `$${Number(n||0).toLocaleString()}`;
const inits    = (name="") => name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const scoreCol = (s) => s>=70?"text-emerald-600 bg-emerald-50":s>=40?"text-amber-600 bg-amber-50":"text-rose-600 bg-rose-50";
const genId    = (prefix) => `${prefix}${Date.now()}`;

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
const Avatar = ({ user, size="md" }) => {
  if (!user) return <div className={`${size==="sm"?"h-6 w-6 text-[9px]":size==="lg"?"h-10 w-10 text-sm":"h-8 w-8 text-xs"} rounded-full bg-slate-300 flex items-center justify-center text-white font-bold shrink-0`}>?</div>;
  const sz = size==="sm"?"h-6 w-6 text-[9px]":size==="lg"?"h-10 w-10 text-sm":"h-8 w-8 text-xs";
  const col = USER_COLORS[user.id]||"bg-slate-400";
  return <div title={user.name} className={`${sz} ${col} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>{inits(user.name)}</div>;
};
const Badge = ({ cfg, label }) => <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.cls||"bg-slate-100 text-slate-600"}`}>{cfg?.label||label}</span>;
const RoleBadge = ({ role }) => <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLES[role]?.color||"bg-slate-100 text-slate-600"}`}>{ROLES[role]?.label||role}</span>;

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr]       = useState("");
  const demoAccounts = [
    { email:"admin@nexus.com",  password:"admin123", label:"Admin",              color:"bg-purple-500" },
    { email:"sarah@nexus.com",  password:"pass123",  label:"Sales (SG/IN)",      color:"bg-pink-500" },
    { email:"omar@nexus.com",   password:"pass123",  label:"Sales (UAE/ID)",     color:"bg-sky-500" },
    { email:"elena@nexus.com",  password:"pass123",  label:"Engagement Manager", color:"bg-emerald-500" },
    { email:"marcus@nexus.com", password:"pass123",  label:"Projects Manager",   color:"bg-orange-500" },
  ];
  const login = () => {
    const user = SEED_USERS.find(u=>u.email===email&&u.password===pw);
    if (user) onLogin(user); else setErr("Invalid email or password.");
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 bg-blue-600 rounded-2xl mb-4 shadow-xl">
            <Target className="text-white" size={28}/>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">NexusCRM</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your workspace</p>
        </div>
        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 mb-4 text-sm flex items-center gap-2"><AlertCircle size={14}/>{err}</div>}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()}
                  placeholder="you@nexus.com" className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()}
                  placeholder="••••••••" className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                <button onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
          </div>
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 shadow-md">
            Sign In
          </button>
          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium">DEMO ACCOUNTS — click to fill</p>
            <div className="space-y-2">
              {demoAccounts.map(a => (
                <button key={a.email} onClick={()=>{setEmail(a.email);setPw(a.password);setErr("");}}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left border border-slate-100">
                  <div className={`h-6 w-6 rounded-full ${a.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{inits(a.label)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{a.label}</p>
                    <p className="text-[10px] text-slate-400">{a.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL SHELL ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, onSave, saveLabel="Save", wide=false, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}/>
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-md"} overflow-hidden`}>
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="font-bold text-lg text-slate-900">{title}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18}/></button>
      </div>
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
      <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
        <button onClick={onSave} className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">{saveLabel}</button>
      </div>
    </div>
  </div>
);

const IC  = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:outline-none";
const Field = ({ label, children, half }) => (
  <div className={half?"":""}><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>{children}</div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // ── State ──
  const [users,       setUsers]       = useState(SEED_USERS);
  const [clients,     setClients]     = useState(SEED_CLIENTS);
  const [engagements, setEngagements] = useState(SEED_ENGAGEMENTS);
  const [projects,    setProjects]    = useState(SEED_PROJECTS);
  const [payments,    setPayments]    = useState(SEED_PAYMENTS);
  const [leads,       setLeads]       = useState(SEED_LEADS);
  const [tasks,       setTasks]       = useState(SEED_TASKS);

  const [tab,              setTab]              = useState("dashboard");
  const [search,           setSearch]           = useState("");
  const [selEngagement,    setSelEngagement]    = useState(null);
  const [selLead,          setSelLead]          = useState(null);
  const [expandedClients,  setExpandedClients]  = useState({cl1:true});

  // Modal open states
  const [showAddUser,    setShowAddUser]    = useState(false);
  const [showAddClient,  setShowAddClient]  = useState(false);
  const [showAddEng,     setShowAddEng]     = useState(false);
  const [showAddProj,    setShowAddProj]    = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddLead,    setShowAddLead]    = useState(false);
  const [showAddTask,    setShowAddTask]    = useState(false);

  // Edit states
  const [editUser, setEditUser] = useState(null);

  // New item drafts
  const emptyUser    = {name:"",email:"",password:"pass123",role:"sales",territories:[],commissionRate:7};
  const emptyClient  = {name:"",contact:"",email:"",phone:"",country:"Singapore"};
  const emptyEng     = {clientId:"",name:"",salesPersonId:"",pmId:"",status:"active",value:"",startDate:"",notes:""};
  const emptyProj    = {engagementId:selEngagement?.id||"",name:"",assignedTo:[],status:"active",value:"",type:"Development",notes:""};
  const emptyPayment = {engagementId:"",projectId:"",clientId:"",description:"",amount:"",dueDate:"",status:"pending"};
  const emptyLead    = {name:"",company:"",email:"",country:"Singapore",status:"open",value:"",salesPersonId:"",source:"Inbound",notes:""};
  const emptyTask    = {title:"",dueDate:"",priority:"medium",leadId:"",projectId:"",assignedTo:"",type:"call"};

  const [nUser,    setNU] = useState(emptyUser);
  const [nClient,  setNC] = useState(emptyClient);
  const [nEng,     setNE] = useState(emptyEng);
  const [nProj,    setNP] = useState(emptyProj);
  const [nPayment, setNPy]= useState(emptyPayment);
  const [nLead,    setNL] = useState(emptyLead);
  const [nTask,    setNT] = useState(emptyTask);

  // ── Lookups ──
  const getUser       = id => users.find(u=>u.id===id);
  const getClient     = id => clients.find(c=>c.id===id)||{};
  const getEngagement = id => engagements.find(e=>e.id===id)||{};
  const getProject    = id => projects.find(p=>p.id===id)||{};

  // ── Role / territory filtering ──
  const visibleLeads = useMemo(()=>{
    if (!currentUser) return [];
    if (currentUser.role==="admin") return leads;
    if (currentUser.role==="sales") return leads.filter(l=>currentUser.territories.includes(l.country)||l.salesPersonId===currentUser.id);
    return leads;
  },[leads,currentUser]);

  const visibleEngagements = useMemo(()=>{
    if (!currentUser) return [];
    if (currentUser.role==="admin") return engagements;
    if (currentUser.role==="sales") return engagements.filter(e=>{
      const client = getClient(e.clientId);
      return currentUser.territories.includes(client.country)||e.salesPersonId===currentUser.id;
    });
    return engagements;
  },[engagements,currentUser,clients]);

  // ── Stats ──
  const stats = useMemo(()=>{
    const paidPayments = payments.filter(p=>p.status==="paid");
    const totalReceived = paidPayments.reduce((s,p)=>s+p.amount,0);
    const totalPending  = payments.filter(p=>p.status==="pending").reduce((s,p)=>s+p.amount,0);
    const totalOverdue  = payments.filter(p=>p.status==="overdue").reduce((s,p)=>s+p.amount,0);
    const totalComm = users.filter(u=>u.commissionRate>0).reduce((acc,u)=>{
      const salesLeads = leads.filter(l=>l.salesPersonId===u.id&&l.status==="closed_won");
      return acc + salesLeads.reduce((s,l)=>s+l.value,0)*u.commissionRate/100;
    },0);
    return {
      totalEngagements: engagements.length,
      activeEngagements: engagements.filter(e=>e.status==="active").length,
      totalProjects: projects.length,
      totalReceived, totalPending, totalOverdue, totalComm,
      openLeads: leads.filter(l=>l.status==="open").length,
      activeLeads: leads.filter(l=>l.status==="active").length,
      wonLeads: leads.filter(l=>l.status==="closed_won").length,
    };
  },[payments,leads,engagements,projects,users]);

  // ── CRUD ──
  const addUser    = ()=>{ if(!nUser.name||!nUser.email)return; setUsers(p=>[...p,{...nUser,id:genId("u"),commissionRate:Number(nUser.commissionRate)||0}]); setNU(emptyUser); setShowAddUser(false); };
  const saveEditUser=()=>{ if(!editUser)return; setUsers(p=>p.map(u=>u.id===editUser.id?{...editUser,commissionRate:Number(editUser.commissionRate)||0}:u)); setEditUser(null); };
  const deleteUser = id=>setUsers(p=>p.filter(u=>u.id!==id));

  const addClient  = ()=>{ if(!nClient.name)return; setClients(p=>[...p,{...nClient,id:genId("cl")}]); setNC(emptyClient); setShowAddClient(false); };

  const addEng     = ()=>{ if(!nEng.name||!nEng.clientId)return; setEngagements(p=>[...p,{...nEng,id:genId("en"),value:Number(nEng.value)||0}]); setNE(emptyEng); setShowAddEng(false); };
  const updateEngStatus=(id,status)=>{ setEngagements(p=>p.map(e=>e.id===id?{...e,status}:e)); if(selEngagement?.id===id)setSelEngagement(p=>({...p,status})); };

  const addProj    = ()=>{ if(!nProj.name||!nProj.engagementId)return; setProjects(p=>[...p,{...nProj,id:genId("pr"),value:Number(nProj.value)||0}]); setNP(emptyProj); setShowAddProj(false); };
  const updateProjStatus=(id,status)=>setProjects(p=>p.map(pr=>pr.id===id?{...pr,status}:pr));

  const addPayment = ()=>{ if(!nPayment.description||!nPayment.amount)return; setPayments(p=>[...p,{...nPayment,id:genId("pay"),amount:Number(nPayment.amount)||0}]); setNPy(emptyPayment); setShowAddPayment(false); };
  const markPaid   = (id)=>setPayments(p=>p.map(pay=>pay.id===id?{...pay,status:"paid",paidDate:new Date().toISOString().split("T")[0]}:pay));
  const markOverdue= (id)=>setPayments(p=>p.map(pay=>pay.id===id?{...pay,status:"overdue"}:pay));

  const addLead    = ()=>{ if(!nLead.name||!nLead.company)return; setLeads(p=>[...p,{...nLead,id:genId("l"),value:Number(nLead.value)||0,createdAt:new Date().toISOString().split("T")[0],aiScore:null,aiNote:null}]); setNL(emptyLead); setShowAddLead(false); };
  const updateLeadStatus=(id,status)=>{ setLeads(p=>p.map(l=>l.id===id?{...l,status}:l)); if(selLead?.id===id)setSelLead(p=>({...p,status})); };
  const deleteLead = id=>{ setLeads(p=>p.filter(l=>l.id!==id)); if(selLead?.id===id)setSelLead(null); };

  const scoreLead  = async(leadId)=>{
    const lead=leads.find(l=>l.id===leadId); if(!lead)return;
    setLeads(p=>p.map(l=>l.id===leadId?{...l,aiScore:-1}:l));
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:150,
          messages:[{role:"user",content:`Score B2B lead 1-100 close probability. Return ONLY valid JSON: {"score":number,"note":"one sentence"}\n\ncompany=${lead.company},value=$${lead.value},source=${lead.source},country=${lead.country},notes="${lead.notes}"`}]})});
      const data=await res.json();
      const parsed=JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim());
      setLeads(p=>p.map(l=>l.id===leadId?{...l,aiScore:parsed.score,aiNote:parsed.note}:l));
    } catch { setLeads(p=>p.map(l=>l.id===leadId?{...l,aiScore:null}:l)); }
  };
  const scoreAll = async()=>{ for(const l of leads.filter(l=>l.aiScore===null)) await scoreLead(l.id); };

  const addTask    = ()=>{ if(!nTask.title)return; setTasks(p=>[...p,{...nTask,id:genId("tk"),completed:false}]); setNT(emptyTask); setShowAddTask(false); };
  const toggleTask = id=>setTasks(p=>p.map(t=>t.id===id?{...t,completed:!t.completed}:t));
  const deleteTask = id=>setTasks(p=>p.filter(t=>t.id!==id));

  // ── Nav ──
  const allowedTabs = currentUser ? (ROLES[currentUser.role]?.nav||[]) : [];
  const NAV = [
    { id:"dashboard",   icon:LayoutDashboard, label:"Dashboard"        },
    { id:"users",       icon:Shield,          label:"User Management"  },
    { id:"leads",       icon:Target,          label:"Leads"            },
    { id:"engagements", icon:Layers,          label:"Engagements"      },
    { id:"payments",    icon:CreditCard,      label:"Payments"         },
    { id:"commissions", icon:Banknote,        label:"Commissions"      },
    { id:"tasks",       icon:CheckSquare,     label:"Tasks"            },
    { id:"team",        icon:Users,           label:"Team"             },
  ].filter(n=>allowedTabs.includes(n.id));

  if (!currentUser) return <LoginScreen onLogin={u=>{ setCurrentUser(u); setTab("dashboard"); }}/>;

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════════
  const DashboardView = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Good morning, {currentUser.name.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 mt-1">Here's your workspace overview.</p>
        </div>
        {allowedTabs.includes("leads") && (
          <button onClick={()=>setShowAddLead(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm">
            <Plus size={16}/> New Lead
          </button>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Active Engagements",val:stats.activeEngagements,icon:Layers,     col:"text-blue-600",   bg:"bg-blue-50"},
          {label:"Total Projects",    val:stats.totalProjects,    icon:Briefcase,  col:"text-violet-600", bg:"bg-violet-50"},
          {label:"Open Leads",        val:stats.openLeads,        icon:Target,     col:"text-indigo-600", bg:"bg-indigo-50"},
          {label:"Won Deals",         val:stats.wonLeads,         icon:Award,      col:"text-emerald-600",bg:"bg-emerald-50"},
        ].map((k,i)=>(
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`${k.bg} ${k.col} p-3 rounded-xl shrink-0`}><k.icon size={20}/></div>
            <div><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{k.label}</p><p className="text-2xl font-bold text-slate-900">{k.val}</p></div>
          </div>
        ))}
      </div>

      {/* Revenue row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {label:"Received",    val:fmt(stats.totalReceived), sub:"Paid invoices",      col:"text-emerald-600", bg:"bg-emerald-50", border:"border-emerald-100"},
          {label:"Outstanding", val:fmt(stats.totalPending),  sub:"Pending invoices",   col:"text-amber-600",   bg:"bg-amber-50",   border:"border-amber-100"},
          {label:"Overdue",     val:fmt(stats.totalOverdue),  sub:"Requires follow-up", col:"text-rose-600",    bg:"bg-rose-50",    border:"border-rose-100"},
        ].map((r,i)=>(
          <div key={i} className={`bg-white rounded-2xl border ${r.border} p-5`}>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{r.label}</p>
            <p className={`text-3xl font-bold ${r.col}`}>{r.val}</p>
            <p className="text-sm text-slate-400 mt-1">{r.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent activity tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Recent Engagements</h2>
            <button onClick={()=>setTab("engagements")} className="text-blue-600 text-xs hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {visibleEngagements.slice(0,4).map(e=>{
              const client=getClient(e.clientId), sp=getUser(e.salesPersonId);
              return (
                <div key={e.id} onClick={()=>{setSelEngagement(e);setTab("engagements");}} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <Avatar user={sp} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.name}</p>
                    <p className="text-xs text-slate-400">{client.name} · {client.country}</p>
                  </div>
                  <Badge cfg={ENG_STATUS[e.status]}/>
                  <span className="text-sm font-bold text-slate-600 shrink-0 hidden lg:block">{fmt(e.value)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Overdue Payments</h2>
            <button onClick={()=>setTab("payments")} className="text-blue-600 text-xs hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.filter(p=>p.status==="overdue").slice(0,4).map(p=>{
              const client=getClient(p.clientId);
              return (
                <div key={p.id} className="px-6 py-3.5 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-rose-400 shrink-0 mt-0.5"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.description}</p>
                    <p className="text-xs text-slate-400">{client.name} · Due {p.dueDate}</p>
                  </div>
                  <span className="font-bold text-rose-600 text-sm shrink-0">{fmt(p.amount)}</span>
                </div>
              );
            })}
            {payments.filter(p=>p.status==="overdue").length===0 && <p className="px-6 py-8 text-center text-slate-400 text-sm">No overdue payments</p>}
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: USER MANAGEMENT (admin only)
  // ══════════════════════════════════════════════════════════════════════════════
  const UsersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-slate-900">User Management</h1><p className="text-slate-400 text-sm mt-0.5">Manage access roles and territory assignments.</p></div>
        <button onClick={()=>setShowAddUser(true)} className="bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all">
          <UserPlus size={15}/> Add User
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(ROLES).map(([key,r])=>(
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
            <p className="text-xs text-slate-400 mt-2">{
              key==="admin"?"Full platform access + user management":
              key==="sales"?"Leads + assigned territory engagements":
              key==="engagement"?"Engagements, projects, payments":
              "Projects and tasks only"
            }</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Territories</th>
              <th className="px-6 py-4">Commission</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u=>(
              <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={u}/>
                    <div><p className="font-semibold text-sm text-slate-900">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-6 py-4"><RoleBadge role={u.role}/></td>
                <td className="px-6 py-4">
                  {u.territories.length>0
                    ? <div className="flex flex-wrap gap-1">{u.territories.map(t=><span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-0.5"><MapPin size={8}/>{t}</span>)}</div>
                    : <span className="text-xs text-slate-400">All access</span>}
                </td>
                <td className="px-6 py-4">
                  {u.commissionRate>0 ? <span className="font-semibold text-indigo-600 text-sm">{u.commissionRate}%</span> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>setEditUser({...u})} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={14}/></button>
                    {u.id!==currentUser.id && <button onClick={()=>deleteUser(u.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: LEADS
  // ══════════════════════════════════════════════════════════════════════════════
  const LeadsView = () => {
    const [sf, setSf] = useState("all");
    const filtered = visibleLeads.filter(l=>{
      const q=search.toLowerCase();
      return (!q||l.name.toLowerCase().includes(q)||l.company.toLowerCase().includes(q)||l.country.toLowerCase().includes(q))&&(sf==="all"||l.status===sf);
    });
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={scoreAll} className="border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Sparkles size={13}/> Score All</button>
            <button onClick={()=>setShowAddLead(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/> Add Lead</button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all","open","active","closed_won","closed_lost"].map(s=>(
            <button key={s} onClick={()=>setSf(s)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sf===s?"bg-blue-600 text-white shadow-sm":"bg-white border border-slate-200 text-slate-600 hover:border-blue-300"}`}>
              {s==="all"?"All":LEAD_STATUS[s]?.label||s}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Lead / Company</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Sales Rep</th>
                <th className="px-6 py-4">AI Score</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length===0&&<tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">No leads found.</td></tr>}
              {filtered.map(l=>{
                const sp=getUser(l.salesPersonId);
                const live=leads.find(x=>x.id===l.id)||l;
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <button onClick={()=>setSelLead(live)} className="text-left">
                        <p className="font-semibold text-sm text-slate-900 hover:text-blue-600">{l.name}</p>
                        <p className="text-xs text-slate-400">{l.company}</p>
                      </button>
                    </td>
                    <td className="px-6 py-4"><Badge cfg={LEAD_STATUS[l.status]}/></td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{fmt(l.value)}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><Avatar user={sp} size="sm"/><span className="text-sm text-slate-600">{sp?.name||"—"}</span></div></td>
                    <td className="px-6 py-4">
                      {live.aiScore===-1 ? <span className="text-xs text-violet-500 animate-pulse">Scoring…</span>
                       : live.aiScore!==null ? <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreCol(live.aiScore)}`}>{live.aiScore}/100</span>
                       : <button onClick={()=>scoreLead(l.id)} className="text-xs text-violet-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-violet-800"><Sparkles size={11}/>Score</button>}
                    </td>
                    <td className="px-6 py-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><MapPin size={9}/>{l.country}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>setSelLead(live)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit3 size={13}/></button>
                        <button onClick={()=>deleteLead(l.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: ENGAGEMENTS + PROJECTS
  // ══════════════════════════════════════════════════════════════════════════════
  const EngagementsView = () => {
    // Group engagements by client
    const grouped = useMemo(()=>{
      const map={};
      clients.forEach(c=>{ map[c.id]={client:c,items:[]}; });
      visibleEngagements.forEach(e=>{
        if(map[e.clientId]) map[e.clientId].items.push(e);
      });
      return Object.values(map).filter(g=>g.items.length>0);
    },[visibleEngagements,clients]);

    const q=search.toLowerCase();
    const filteredGroups=grouped.map(g=>({...g,items:g.items.filter(e=>!q||e.name.toLowerCase().includes(q)||g.client.name.toLowerCase().includes(q))})).filter(g=>g.items.length>0);

    return (
      <div className="space-y-5">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div><h1 className="text-2xl font-bold text-slate-900">Engagements</h1><p className="text-slate-400 text-sm mt-0.5">Client engagements and their sub-projects.</p></div>
          <div className="flex gap-2">
            {(currentUser.role==="admin"||currentUser.role==="engagement") && <button onClick={()=>setShowAddClient(true)} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Building2 size={13}/> Add Client</button>}
            <button onClick={()=>setShowAddEng(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/> New Engagement</button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredGroups.length===0&&<p className="text-center text-slate-400 py-12 bg-white rounded-2xl border border-slate-200">No engagements found.</p>}
          {filteredGroups.map(({client,items})=>{
            const isOpen=expandedClients[client.id]!==false;
            return (
              <div key={client.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Client header */}
                <button onClick={()=>setExpandedClients(p=>({...p,[client.id]:!isOpen}))}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Building2 size={16} className="text-slate-500"/></div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-400">{client.contact} · <span className="flex items-center gap-0.5 inline-flex"><MapPin size={9}/>{client.country}</span> · {items.length} engagement{items.length!==1?"s":""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-600">{fmt(items.reduce((s,e)=>s+e.value,0))}</span>
                    {isOpen?<ChevronDown size={16} className="text-slate-400"/>:<ChevronRight size={16} className="text-slate-400"/>}
                  </div>
                </button>

                {/* Engagements list */}
                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {items.map(eng=>{
                      const sp=getUser(eng.salesPersonId), pm=getUser(eng.pmId);
                      const engProjects=projects.filter(pr=>pr.engagementId===eng.id);
                      const isSelected=selEngagement?.id===eng.id;
                      return (
                        <div key={eng.id}>
                          <div onClick={()=>setSelEngagement(isSelected?null:eng)}
                            className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${isSelected?"bg-blue-50":"hover:bg-slate-50"}`}>
                            <div className="w-6 shrink-0"/>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <p className={`font-semibold text-sm ${isSelected?"text-blue-700":"text-slate-800"}`}>{eng.name}</p>
                                <Badge cfg={ENG_STATUS[eng.status]}/>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>Sales: <span className="text-slate-600 font-medium">{sp?.name||"—"}</span></span>
                                <span>PM: <span className="text-slate-600 font-medium">{pm?.name||"—"}</span></span>
                                <span>{engProjects.length} project{engProjects.length!==1?"s":""}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex -space-x-1.5">{[...new Set([eng.salesPersonId,eng.pmId])].map(id=><Avatar key={id} user={getUser(id)} size="sm"/>)}</div>
                              <span className="text-sm font-bold text-slate-600 hidden md:block">{fmt(eng.value)}</span>
                              {isSelected?<ChevronDown size={14} className="text-blue-500"/>:<ChevronRight size={14} className="text-slate-400"/>}
                            </div>
                          </div>

                          {/* Projects sub-table */}
                          {isSelected && (
                            <div className="bg-slate-50 border-t border-blue-100 px-6 py-4">
                              <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-Projects ({engProjects.length})</p>
                                <button onClick={(e)=>{e.stopPropagation();setNP({...emptyProj,engagementId:eng.id});setShowAddProj(true);}}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 border border-blue-200 bg-white px-2.5 py-1 rounded-lg">
                                  <Plus size={11}/> Add Project
                                </button>
                              </div>
                              {engProjects.length===0 ? (
                                <p className="text-xs text-slate-400 py-2 text-center">No projects yet. Add one above.</p>
                              ) : (
                                <div className="space-y-2">
                                  {engProjects.map(pr=>(
                                    <div key={pr.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 group/pr">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                          <p className="font-semibold text-sm text-slate-800">{pr.name}</p>
                                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">{pr.type}</span>
                                          <Badge cfg={ENG_STATUS[pr.status]}/>
                                        </div>
                                        <p className="text-xs text-slate-400">{pr.notes}</p>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex -space-x-1.5">{pr.assignedTo.map(id=><Avatar key={id} user={getUser(id)} size="sm"/>)}</div>
                                        <span className="text-sm font-bold text-slate-600">{fmt(pr.value)}</span>
                                        <select value={pr.status} onClick={e=>e.stopPropagation()} onChange={e=>updateProjStatus(pr.id,e.target.value)}
                                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:ring-1 focus:ring-blue-500 opacity-0 group-hover/pr:opacity-100 transition-opacity">
                                          <option value="active">Active</option>
                                          <option value="paused">Paused</option>
                                          <option value="completed">Completed</option>
                                        </select>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Engagement status controls */}
                              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                                <p className="text-xs text-slate-400 font-medium">Engagement status:</p>
                                {["active","paused","completed"].map(s=>(
                                  <button key={s} onClick={()=>updateEngStatus(eng.id,s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${eng.status===s?`${ENG_STATUS[s].cls} border border-current/20`:"bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                                    {ENG_STATUS[s].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: PAYMENTS
  // ══════════════════════════════════════════════════════════════════════════════
  const PaymentsView = () => {
    const [sf, setSf] = useState("all");
    const [cf, setCf] = useState("all");
    const filtered = payments.filter(p=>(sf==="all"||p.status===sf)&&(cf==="all"||p.clientId===cf));
    const totalFiltered = filtered.reduce((s,p)=>s+p.amount,0);
    const totalPaid     = filtered.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div><h1 className="text-2xl font-bold text-slate-900">Payments</h1><p className="text-slate-400 text-sm mt-0.5">Invoice tracking across all clients and projects.</p></div>
          <button onClick={()=>setShowAddPayment(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/> Add Invoice</button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {label:"Total Invoiced", val:fmt(totalFiltered), col:"text-slate-900"},
            {label:"Received",       val:fmt(totalPaid),     col:"text-emerald-600"},
            {label:"Outstanding",    val:fmt(totalFiltered-totalPaid), col:"text-amber-600"},
          ].map((s,i)=>(
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.col}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1">
            {["all","paid","pending","overdue"].map(s=>(
              <button key={s} onClick={()=>setSf(s)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sf===s?"bg-blue-600 text-white":"bg-white border border-slate-200 text-slate-600 hover:border-blue-300"}`}>
                {s==="all"?"All":PAY_STATUS[s]?.label||s}
              </button>
            ))}
          </div>
          <select value={cf} onChange={e=>setCf(e.target.value)} className="border border-slate-200 bg-white rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="all">All Clients</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Paid Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length===0&&<tr><td colSpan="8" className="px-6 py-12 text-center text-slate-400 text-sm">No payments match filters.</td></tr>}
              {filtered.map(p=>{
                const client=getClient(p.clientId), project=getProject(p.projectId), cfg=PAY_STATUS[p.status];
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900 text-sm max-w-[200px] truncate">{p.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{client.name||"—"}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{project.name||"General"}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{fmt(p.amount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{p.dueDate}</td>
                    <td className="px-6 py-4 text-sm text-emerald-600">{p.paidDate||"—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.cls}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${cfg?.dot}`}/>
                        {cfg?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {p.status!=="paid"    && <button onClick={()=>markPaid(p.id)}    className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 border border-emerald-200 bg-emerald-50 px-2.5 py-1 rounded-lg">Mark Paid</button>}
                        {p.status==="pending" && <button onClick={()=>markOverdue(p.id)} className="text-xs font-semibold text-rose-500 hover:text-rose-700 border border-rose-200 bg-rose-50 px-2.5 py-1 rounded-lg ml-1">Overdue</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: COMMISSIONS
  // ══════════════════════════════════════════════════════════════════════════════
  const CommissionsView = () => {
    const salesReps = users.filter(u=>u.commissionRate>0);
    const commData  = salesReps.map(u=>{
      const paidLeads = leads.filter(l=>l.salesPersonId===u.id&&l.status==="closed_won");
      const paidPaymentsForRep = payments.filter(p=>{
        const eng=getEngagement(p.engagementId);
        return p.status==="paid" && eng.salesPersonId===u.id;
      });
      const totalWon    = paidLeads.reduce((s,l)=>s+l.value,0);
      const totalInflow = paidPaymentsForRep.reduce((s,p)=>s+p.amount,0);
      return { rep:u, paidLeads, paidPaymentsForRep, totalWon, totalInflow, commissionOnWon:totalWon*u.commissionRate/100, commissionOnPayments:totalInflow*u.commissionRate/100 };
    });
    const grandTotal = commData.reduce((s,d)=>s+d.commissionOnPayments,0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold text-slate-900">Commissions</h1><p className="text-slate-400 text-sm mt-0.5">Commission is calculated on received payments.</p></div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-2.5 text-center">
            <p className="text-xs text-indigo-400 font-medium uppercase">Total Owed</p>
            <p className="text-2xl font-bold text-indigo-700">{fmt(Math.round(grandTotal))}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commData.map(({rep:u, paidLeads, totalWon, totalInflow, commissionOnPayments})=>(
            <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar user={u} size="lg"/>
                  <div><p className="font-bold text-slate-900">{u.name}</p><p className="text-xs text-slate-400">{u.role==="sales"?"Sales Person":"—"}</p></div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Rate</p>
                  <p className="text-2xl font-black text-indigo-600">{u.commissionRate}%</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {u.territories.map(t=><span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-0.5"><MapPin size={8}/>{t}</span>)}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 rounded-xl p-3">
                <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Won Deals</p><p className="font-bold text-slate-800 mt-0.5">{paidLeads.length}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Payments In</p><p className="font-bold text-emerald-600 mt-0.5">{fmt(totalInflow)}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Commission</p><p className="font-bold text-indigo-700 mt-0.5">{fmt(Math.round(commissionOnPayments))}</p></div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Payment-Level Commission Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Commission earned only on paid invoices</p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Sales Rep</th>
                <th className="px-6 py-4">Paid Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.filter(p=>p.status==="paid").map(p=>{
                const eng=getEngagement(p.engagementId), sp=getUser(eng.salesPersonId), client=getClient(p.clientId);
                const comm=(p.amount*(sp?.commissionRate||0)/100);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800 max-w-[180px] truncate">{p.description}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{client.name||"—"}</td>
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><Avatar user={sp} size="sm"/><span className="text-sm">{sp?.name||"—"}</span></div></td>
                    <td className="px-6 py-3 text-sm text-slate-500">{p.paidDate}</td>
                    <td className="px-6 py-3 font-semibold text-slate-800">{fmt(p.amount)}</td>
                    <td className="px-6 py-3 text-slate-500 text-sm">{sp?.commissionRate||0}%</td>
                    <td className="px-6 py-3 text-right font-bold text-indigo-700">{fmt(Math.round(comm))}</td>
                  </tr>
                );
              })}
              {payments.filter(p=>p.status==="paid").length===0&&<tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400 text-sm">No paid invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: TASKS
  // ══════════════════════════════════════════════════════════════════════════════
  const TasksView = () => {
    const EMOJI = {call:"📞",demo:"💻",proposal:"📄",contract:"✍️",email:"✉️",meeting:"👥",review:"🔍"};
    const pending = tasks.filter(t=>!t.completed), done = tasks.filter(t=>t.completed);
    const Row = ({t})=>{
      const u=getUser(t.assignedTo), lead=leads.find(l=>l.id===t.leadId), proj=projects.find(p=>p.id===t.projectId);
      return (
        <div className={`flex items-center gap-4 px-6 py-4 group ${t.completed?"opacity-50":""}`}>
          <button onClick={()=>toggleTask(t.id)} className={`shrink-0 transition-colors ${t.completed?"text-emerald-500":"text-slate-200 hover:text-emerald-400"}`}><CheckCircle2 size={20}/></button>
          <span className="text-lg shrink-0">{EMOJI[t.type]||"📌"}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${t.completed?"line-through text-slate-400":"text-slate-800"}`}>{t.title}</p>
            <p className="text-xs text-slate-400">{lead?.company||proj?.name||"General"} · Due {t.dueDate||"No date"}</p>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIO_COL[t.priority]} shrink-0`}>{t.priority}</span>
          <Avatar user={u} size="sm"/>
          <button onClick={()=>deleteTask(t.id)} className="text-slate-200 group-hover:text-slate-300 hover:text-rose-400 transition-colors shrink-0"><X size={13}/></button>
        </div>
      );
    };
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Tasks & Activities</h1>
          <button onClick={()=>setShowAddTask(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/> Add Task</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Pending</span>
            <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">{pending.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pending.length===0&&<p className="px-6 py-10 text-center text-slate-400 text-sm">All caught up!</p>}
            {pending.map(t=><Row key={t.id} t={t}/>)}
          </div>
        </div>
        {done.length>0&&(
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">Completed</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">{done.length}</span>
            </div>
            <div className="divide-y divide-slate-100">{done.map(t=><Row key={t.id} t={t}/>)}</div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW: TEAM
  // ══════════════════════════════════════════════════════════════════════════════
  const TeamView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Team Overview</h1>
        {currentUser.role==="admin"&&<button onClick={()=>setShowAddUser(true)} className="bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all"><UserPlus size={13}/> Add Member</button>}
      </div>
      {/* Territory map */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={16}/>Territory Coverage</h2>
        <div className="flex flex-wrap gap-3">
          {COUNTRIES.map(c=>{
            const assigned=users.filter(u=>u.territories.includes(c));
            return (
              <div key={c} className="border border-slate-200 rounded-xl p-3.5 min-w-[140px]">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1 mb-2"><MapPin size={11} className="text-slate-400"/>{c}</p>
                {assigned.length===0?<span className="text-xs text-slate-400 italic">Unassigned</span>
                  :<div className="flex flex-wrap gap-1">{assigned.map(u=><span key={u.id} className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{u.name.split(" ")[0]}</span>)}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u=>{
          const myEngagements=engagements.filter(e=>e.salesPersonId===u.id||e.pmId===u.id);
          const myProjects=projects.filter(p=>p.assignedTo.includes(u.id));
          const myTasks=tasks.filter(t=>t.assignedTo===u.id&&!t.completed);
          return (
            <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar user={u} size="lg"/>
                <div>
                  <p className="font-bold text-slate-900">{u.name}</p>
                  <RoleBadge role={u.role}/>
                  <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                </div>
              </div>
              {u.territories.length>0&&<div className="flex flex-wrap gap-1 mb-3">{u.territories.map(t=><span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-0.5"><MapPin size={8}/>{t}</span>)}</div>}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-xl p-3">
                <div><p className="text-[10px] text-slate-400 uppercase">Engagements</p><p className="font-bold text-slate-800">{myEngagements.length}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase">Projects</p><p className="font-bold text-slate-800">{myProjects.length}</p></div>
                <div><p className="text-[10px] text-slate-400 uppercase">Open Tasks</p><p className="font-bold text-slate-800">{myTasks.length}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // LEAD DETAIL DRAWER
  // ══════════════════════════════════════════════════════════════════════════════
  const LeadDrawer = () => {
    if (!selLead) return null;
    const lead = leads.find(l=>l.id===selLead.id)||selLead;
    const sp=getUser(lead.salesPersonId);
    const estComm=lead.value*(sp?.commissionRate||0)/100;
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={()=>setSelLead(null)}/>
        <div className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto">
          <div className="p-7 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <Badge cfg={LEAD_STATUS[lead.status]}/>
                <h2 className="text-2xl font-bold mt-2 text-slate-900">{lead.name}</h2>
                <p className="text-slate-500 flex items-center gap-1.5 mt-0.5 text-sm"><Building2 size={13}/>{lead.company} · {lead.country}</p>
              </div>
              <button onClick={()=>setSelLead(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={18}/></button>
            </div>

            {/* AI Score */}
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-violet-800 flex items-center gap-2"><Sparkles size={13}/>AI Lead Score</h3>
                <button onClick={()=>scoreLead(lead.id)} className="text-xs text-violet-600 font-semibold border border-violet-300 bg-white px-2.5 py-1 rounded-lg hover:bg-violet-50 flex items-center gap-1"><Zap size={10}/>{lead.aiScore!==null?"Rescore":"Score Now"}</button>
              </div>
              {lead.aiScore===null ? <p className="text-sm text-violet-500">Click Score Now for an AI-powered close probability.</p>
               : lead.aiScore===-1 ? <div className="flex items-center gap-2 text-violet-600 text-sm"><div className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin"/>Analysing…</div>
               : (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`text-4xl font-black ${lead.aiScore>=70?"text-emerald-600":lead.aiScore>=40?"text-amber-600":"text-rose-600"}`}>{lead.aiScore}<span className="text-sm font-normal text-slate-400">/100</span></span>
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${lead.aiScore>=70?"bg-emerald-500":lead.aiScore>=40?"bg-amber-500":"bg-rose-500"}`} style={{width:`${lead.aiScore}%`}}/></div>
                  </div>
                  {lead.aiNote&&<p className="text-sm text-violet-700 italic border-t border-violet-200 pt-2">"{lead.aiNote}"</p>}
                </div>
               )}
            </div>

            {/* Info */}
            <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
              {[
                ["Deal Value",fmt(lead.value),"font-bold text-slate-900"],
                ["Source",lead.source,"text-slate-700"],
                ["Sales Rep",sp?.name||"—","font-semibold text-slate-700"],
                ["Commission Rate",sp?`${sp.commissionRate}%`:"—","text-slate-700"],
                ["Est. Commission",fmt(Math.round(estComm)),"font-bold text-indigo-600"],
                ["Created",lead.createdAt,"text-slate-600"],
              ].map(([k,v,vc])=>(
                <div key={k} className="flex justify-between"><span className="text-sm text-slate-500">{k}</span><span className={`text-sm ${vc}`}>{v}</span></div>
              ))}
            </div>

            {/* Stage */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Move to Stage</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LEAD_STATUS).map(([k,s])=>(
                  <button key={k} onClick={()=>updateLeadStatus(lead.id,k)}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${lead.status===k?"bg-blue-600 border-blue-600 text-white shadow":"border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {lead.notes&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-xs font-bold text-amber-600 uppercase mb-1">Notes</p><p className="text-sm text-amber-800">{lead.notes}</p></div>}
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // MODALS
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Target size={20}/></div>
          <span className="text-lg font-black tracking-tight">NexusCRM</span>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab===n.id?"bg-blue-600 text-white shadow-md":"text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <n.icon size={16}/>{n.label}
            </button>
          ))}
        </nav>
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <Avatar user={currentUser} size="md"/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
              <RoleBadge role={currentUser.role}/>
            </div>
            <button onClick={()=>setCurrentUser(null)} title="Sign out" className="text-slate-400 hover:text-slate-700 transition-colors"><LogOut size={15}/></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
              className="pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500 focus:outline-none w-60"/>
          </div>
          <div className="flex items-center gap-3">
            {allowedTabs.includes("tasks")&&<button onClick={()=>setShowAddTask(true)} className="text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all"><CheckSquare size={14}/> Task</button>}
            {allowedTabs.includes("leads")&&<button onClick={()=>setShowAddLead(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"><Plus size={14}/> New Lead</button>}
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {tab==="dashboard"   && <DashboardView/>}
          {tab==="users"       && <UsersView/>}
          {tab==="leads"       && <LeadsView/>}
          {tab==="engagements" && <EngagementsView/>}
          {tab==="payments"    && <PaymentsView/>}
          {tab==="commissions" && <CommissionsView/>}
          {tab==="tasks"       && <TasksView/>}
          {tab==="team"        && <TeamView/>}
        </div>
      </main>

      {/* Drawers */}
      <LeadDrawer/>

      {/* ── ADD USER ── */}
      {showAddUser && <Modal title="Add User" onClose={()=>setShowAddUser(false)} onSave={addUser}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name"><input value={nUser.name} onChange={e=>setNU({...nUser,name:e.target.value})} className={IC} placeholder="Jane Smith"/></Field>
          <Field label="Email"><input value={nUser.email} onChange={e=>setNU({...nUser,email:e.target.value})} className={IC} placeholder="jane@nexus.com"/></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Password"><input value={nUser.password} onChange={e=>setNU({...nUser,password:e.target.value})} className={IC} placeholder="pass123"/></Field>
          <Field label="Role">
            <select value={nUser.role} onChange={e=>setNU({...nUser,role:e.target.value})} className={IC}>
              {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
            </select>
          </Field>
        </div>
        {nUser.role==="sales" && <>
          <Field label={`Commission Rate (%)`}><input type="number" value={nUser.commissionRate} onChange={e=>setNU({...nUser,commissionRate:e.target.value})} className={IC} min="0" max="50"/></Field>
          <Field label="Territories (select all that apply)">
            <div className="grid grid-cols-2 gap-2 mt-1">{COUNTRIES.map(c=><label key={c} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="checkbox" checked={nUser.territories.includes(c)} onChange={ev=>setNU({...nUser,territories:ev.target.checked?[...nUser.territories,c]:nUser.territories.filter(t=>t!==c)}) } className="rounded"/>{c}</label>)}</div>
          </Field>
        </>}
      </Modal>}

      {/* ── EDIT USER ── */}
      {editUser && <Modal title="Edit User" onClose={()=>setEditUser(null)} onSave={saveEditUser} saveLabel="Save Changes">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name"><input value={editUser.name} onChange={e=>setEditUser({...editUser,name:e.target.value})} className={IC}/></Field>
          <Field label="Email"><input value={editUser.email} onChange={e=>setEditUser({...editUser,email:e.target.value})} className={IC}/></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role">
            <select value={editUser.role} onChange={e=>setEditUser({...editUser,role:e.target.value})} className={IC}>
              {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Commission Rate (%)"><input type="number" value={editUser.commissionRate} onChange={e=>setEditUser({...editUser,commissionRate:e.target.value})} className={IC} min="0" max="50"/></Field>
        </div>
        <Field label="Territories">
          <div className="grid grid-cols-2 gap-2 mt-1">{COUNTRIES.map(c=><label key={c} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"><input type="checkbox" checked={(editUser.territories||[]).includes(c)} onChange={ev=>setEditUser({...editUser,territories:ev.target.checked?[...(editUser.territories||[]),c]:(editUser.territories||[]).filter(t=>t!==c)})} className="rounded"/>{c}</label>)}</div>
        </Field>
      </Modal>}

      {/* ── ADD CLIENT ── */}
      {showAddClient && <Modal title="Add Client" onClose={()=>setShowAddClient(false)} onSave={addClient}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name"><input value={nClient.name} onChange={e=>setNC({...nClient,name:e.target.value})} className={IC} placeholder="Acme Corp"/></Field>
          <Field label="Contact Person"><input value={nClient.contact} onChange={e=>setNC({...nClient,contact:e.target.value})} className={IC} placeholder="John Smith"/></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><input value={nClient.email} onChange={e=>setNC({...nClient,email:e.target.value})} className={IC}/></Field>
          <Field label="Phone"><input value={nClient.phone} onChange={e=>setNC({...nClient,phone:e.target.value})} className={IC}/></Field>
        </div>
        <Field label="Country">
          <select value={nClient.country} onChange={e=>setNC({...nClient,country:e.target.value})} className={IC}>
            {COUNTRIES.map(c=><option key={c}>{c}</option>)}
            <option value="Other">Other</option>
          </select>
        </Field>
      </Modal>}

      {/* ── ADD ENGAGEMENT ── */}
      {showAddEng && <Modal title="New Engagement" onClose={()=>setShowAddEng(false)} onSave={addEng} wide>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Client">
            <select value={nEng.clientId} onChange={e=>setNE({...nEng,clientId:e.target.value})} className={IC}>
              <option value="">Select client…</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}
            </select>
          </Field>
          <Field label="Engagement Name"><input value={nEng.name} onChange={e=>setNE({...nEng,name:e.target.value})} className={IC} placeholder="e.g. Digital Transformation 2024"/></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sales Person">
            <select value={nEng.salesPersonId} onChange={e=>setNE({...nEng,salesPersonId:e.target.value})} className={IC}>
              <option value="">Select…</option>
              {users.filter(u=>u.role==="sales"||u.role==="admin").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Project Manager">
            <select value={nEng.pmId} onChange={e=>setNE({...nEng,pmId:e.target.value})} className={IC}>
              <option value="">Select…</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Total Value ($)"><input type="number" value={nEng.value} onChange={e=>setNE({...nEng,value:e.target.value})} className={IC} placeholder="100000"/></Field>
          <Field label="Start Date"><input type="date" value={nEng.startDate} onChange={e=>setNE({...nEng,startDate:e.target.value})} className={IC}/></Field>
          <Field label="Status">
            <select value={nEng.status} onChange={e=>setNE({...nEng,status:e.target.value})} className={IC}>
              <option value="active">Active</option><option value="paused">Paused</option>
            </select>
          </Field>
        </div>
        <Field label="Notes"><textarea value={nEng.notes} onChange={e=>setNE({...nEng,notes:e.target.value})} className={IC+" h-20 resize-none"} placeholder="Any key context…"/></Field>
      </Modal>}

      {/* ── ADD PROJECT ── */}
      {showAddProj && <Modal title="Add Sub-Project" onClose={()=>setShowAddProj(false)} onSave={addProj} wide>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Engagement">
            <select value={nProj.engagementId} onChange={e=>setNP({...nProj,engagementId:e.target.value})} className={IC}>
              <option value="">Select engagement…</option>
              {engagements.map(e=><option key={e.id} value={e.id}>{getClient(e.clientId).name} — {e.name}</option>)}
            </select>
          </Field>
          <Field label="Project Name"><input value={nProj.name} onChange={e=>setNP({...nProj,name:e.target.value})} className={IC} placeholder="e.g. Website Redesign"/></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select value={nProj.type} onChange={e=>setNP({...nProj,type:e.target.value})} className={IC}>
              {PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Value ($)"><input type="number" value={nProj.value} onChange={e=>setNP({...nProj,value:e.target.value})} className={IC} placeholder="50000"/></Field>
        </div>
        <Field label="Assigned Team Members">
          <div className="grid grid-cols-2 gap-2 mt-1">
            {users.map(u=><label key={u.id} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" checked={(nProj.assignedTo||[]).includes(u.id)} onChange={ev=>setNP({...nProj,assignedTo:ev.target.checked?[...(nProj.assignedTo||[]),u.id]:(nProj.assignedTo||[]).filter(i=>i!==u.id)})} className="rounded"/>
              {u.name} <RoleBadge role={u.role}/>
            </label>)}
          </div>
        </Field>
        <Field label="Notes"><input value={nProj.notes} onChange={e=>setNP({...nProj,notes:e.target.value})} className={IC} placeholder="Brief description…"/></Field>
      </Modal>}

      {/* ── ADD PAYMENT ── */}
      {showAddPayment && <Modal title="Add Invoice / Payment" onClose={()=>setShowAddPayment(false)} onSave={addPayment} wide>
        <Field label="Description"><input value={nPayment.description} onChange={e=>setNPy({...nPayment,description:e.target.value})} className={IC} placeholder="e.g. Website Redesign — Phase 1"/></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Client">
            <select value={nPayment.clientId} onChange={e=>setNPy({...nPayment,clientId:e.target.value})} className={IC}>
              <option value="">Select client…</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Engagement">
            <select value={nPayment.engagementId} onChange={e=>setNPy({...nPayment,engagementId:e.target.value})} className={IC}>
              <option value="">Select engagement…</option>
              {engagements.filter(e=>!nPayment.clientId||e.clientId===nPayment.clientId).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Project (optional)">
            <select value={nPayment.projectId} onChange={e=>setNPy({...nPayment,projectId:e.target.value})} className={IC}>
              <option value="">General / Engagement-level</option>
              {projects.filter(p=>!nPayment.engagementId||p.engagementId===nPayment.engagementId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Amount ($)"><input type="number" value={nPayment.amount} onChange={e=>setNPy({...nPayment,amount:e.target.value})} className={IC} placeholder="10000"/></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due Date"><input type="date" value={nPayment.dueDate} onChange={e=>setNPy({...nPayment,dueDate:e.target.value})} className={IC}/></Field>
          <Field label="Status">
            <select value={nPayment.status} onChange={e=>setNPy({...nPayment,status:e.target.value})} className={IC}>
              <option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
            </select>
          </Field>
        </div>
      </Modal>}

      {/* ── ADD LEAD ── */}
      {showAddLead && <Modal title="Add Lead" onClose={()=>setShowAddLead(false)} onSave={addLead} wide>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name"><input value={nLead.name} onChange={e=>setNL({...nLead,name:e.target.value})} className={IC} placeholder="John Smith"/></Field>
          <Field label="Company"><input value={nLead.company} onChange={e=>setNL({...nLead,company:e.target.value})} className={IC} placeholder="Acme Corp"/></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email"><input value={nLead.email} onChange={e=>setNL({...nLead,email:e.target.value})} className={IC}/></Field>
          <Field label="Deal Value ($)"><input type="number" value={nLead.value} onChange={e=>setNL({...nLead,value:e.target.value})} className={IC} placeholder="50000"/></Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Country">
            <select value={nLead.country} onChange={e=>setNL({...nLead,country:e.target.value})} className={IC}>
              {COUNTRIES.map(c=><option key={c}>{c}</option>)}<option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Source">
            <select value={nLead.source} onChange={e=>setNL({...nLead,source:e.target.value})} className={IC}>
              {SOURCES.map(s=><option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={nLead.status} onChange={e=>setNL({...nLead,status:e.target.value})} className={IC}>
              <option value="open">Open</option><option value="active">Active</option>
            </select>
          </Field>
        </div>
        <Field label="Assigned Sales Rep">
          <select value={nLead.salesPersonId} onChange={e=>setNL({...nLead,salesPersonId:e.target.value})} className={IC}>
            <option value="">Select rep…</option>
            {users.filter(u=>u.role==="sales"||u.role==="admin").map(u=><option key={u.id} value={u.id}>{u.name} — {u.territories.join(", ")||"All"}</option>)}
          </select>
        </Field>
        <Field label="Notes"><textarea value={nLead.notes} onChange={e=>setNL({...nLead,notes:e.target.value})} className={IC+" h-16 resize-none"} placeholder="Key context…"/></Field>
      </Modal>}

      {/* ── ADD TASK ── */}
      {showAddTask && <Modal title="Add Task" onClose={()=>setShowAddTask(false)} onSave={addTask}>
        <Field label="Task Title"><input value={nTask.title} onChange={e=>setNT({...nTask,title:e.target.value})} className={IC} placeholder="e.g. Follow-up call with…"/></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due Date"><input type="date" value={nTask.dueDate} onChange={e=>setNT({...nTask,dueDate:e.target.value})} className={IC}/></Field>
          <Field label="Priority">
            <select value={nTask.priority} onChange={e=>setNT({...nTask,priority:e.target.value})} className={IC}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select value={nTask.type} onChange={e=>setNT({...nTask,type:e.target.value})} className={IC}>
              {TASK_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Assigned To">
            <select value={nTask.assignedTo} onChange={e=>setNT({...nTask,assignedTo:e.target.value})} className={IC}>
              <option value="">Select…</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Linked Lead">
            <select value={nTask.leadId} onChange={e=>setNT({...nTask,leadId:e.target.value})} className={IC}>
              <option value="">None</option>
              {leads.map(l=><option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}
            </select>
          </Field>
          <Field label="Linked Project">
            <select value={nTask.projectId} onChange={e=>setNT({...nTask,projectId:e.target.value})} className={IC}>
              <option value="">None</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
      </Modal>}
    </div>
  );
}
