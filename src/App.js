
/* eslint-disable */
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard, Target, Briefcase, Users, CheckSquare,
  Search, Plus, X, Sparkles, ChevronRight, ChevronDown, LogOut, Shield,
  Layers, Lock, Eye, EyeOff, Mail, Phone, Building2, UserPlus, Edit3,
  Trash2, MapPin, CheckCircle2, CreditCard, Globe, Zap, Award,
  AlertCircle, Banknote, Download, MessageCircle, UserCog, Crown,
  Filter, CalendarRange, SlidersHorizontal, Tag, RefreshCw, Clock,
  AlertTriangle, FileSpreadsheet, Upload, ChevronLeft, CheckCheck
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRIES = ["Singapore","India","Thailand","UAE","Indonesia"];
const COUNTRY_META = {
  Singapore: { code:"+65", flag:"🇸🇬", currency:"SGD", symbol:"S$" },
  India:     { code:"+91", flag:"🇮🇳", currency:"INR", symbol:"₹"  },
  Thailand:  { code:"+66", flag:"🇹🇭", currency:"THB", symbol:"฿"  },
  UAE:       { code:"+971",flag:"🇦🇪", currency:"AED", symbol:"د.إ" },
  Indonesia: { code:"+62", flag:"🇮🇩", currency:"IDR", symbol:"Rp"  },
  USA:       { code:"+1",  flag:"🇺🇸", currency:"USD", symbol:"$"  },
  UK:        { code:"+44", flag:"🇬🇧", currency:"GBP", symbol:"£"  },
  Other:     { code:"+1",  flag:"🌍",  currency:"USD", symbol:"$"  },
};
const ALL_COUNTRY_CODES = Object.entries(COUNTRY_META).map(([k,v])=>({name:k,...v}));
const CURRENCIES = [
  {code:"USD",symbol:"$",name:"US Dollar"},
  {code:"SGD",symbol:"S$",name:"Singapore Dollar"},
  {code:"INR",symbol:"₹",name:"Indian Rupee"},
  {code:"THB",symbol:"฿",name:"Thai Baht"},
  {code:"AED",symbol:"د.إ",name:"UAE Dirham"},
  {code:"IDR",symbol:"Rp",name:"Indonesian Rupiah"},
  {code:"GBP",symbol:"£",name:"British Pound"},
  {code:"EUR",symbol:"€",name:"Euro"},
];
const getCurrencyMeta = code => CURRENCIES.find(c=>c.code===code)||CURRENCIES[0];
const defaultCurrency = country => (COUNTRY_META[country]||COUNTRY_META.Other).currency;
const defaultCode     = country => (COUNTRY_META[country]||COUNTRY_META.Other).code;
const fmtCurrency     = (amount, currencyCode) => {
  const c = getCurrencyMeta(currencyCode);
  return `${c.symbol}${Number(amount||0).toLocaleString()}`;
};

const SERVICE_TYPES = ["E-Commerce Development","Website Development","SEO","GEO / Local SEO","Digital Marketing","Social Media Marketing","Performance Marketing","Influencer Marketing","Lead Generation","LinkedIn Marketing","Content Marketing","Email Marketing","PR & Branding","Others"];
const PROJECT_TYPES = ["Development","SEO","Digital Marketing","Design","Consulting","Analytics","Social Media","Content","PR","Performance","Influencer","Lead Gen","LinkedIn","Other"];
const SOURCES = ["Inbound","Outbound","Referral","Partner","Event","Cold Outreach"];
const TASK_TYPES = ["call","demo","proposal","contract","email","meeting","review"];

const ROLES = {
  super_admin:{ label:"Super Admin",        color:"bg-yellow-100 text-yellow-800",  icon:"👑", nav:["dashboard","users","leads","engagements","invoices","payments","commissions","tasks","team","profile"], canAssignRoles:["admin","sales","engagement","projects","super_admin"] },
  admin:      { label:"Admin",              color:"bg-purple-100 text-purple-700",  icon:"🛡️", nav:["dashboard","users","leads","engagements","invoices","payments","commissions","tasks","team","profile"], canAssignRoles:["sales","engagement","projects"] },
  sales:      { label:"Sales Person",       color:"bg-blue-100 text-blue-700",      icon:"🎯", nav:["dashboard","leads","engagements","invoices","payments","commissions","tasks","profile"], canAssignRoles:[] },
  engagement: { label:"Engagement Manager", color:"bg-amber-100 text-amber-700",    icon:"🤝", nav:["dashboard","engagements","invoices","payments","tasks","team","profile"], canAssignRoles:["projects"] },
  projects:   { label:"Projects Manager",   color:"bg-emerald-100 text-emerald-700",icon:"📋", nav:["dashboard","engagements","tasks","profile"], canAssignRoles:["projects"] },
};

const ENG_STATUS  = { active:{cls:"bg-emerald-50 text-emerald-700",label:"Active"},paused:{cls:"bg-amber-50 text-amber-700",label:"Paused"},completed:{cls:"bg-slate-100 text-slate-600",label:"Completed"} };
const LEAD_STATUS = { open:{cls:"bg-blue-50 text-blue-700",label:"Open"},active:{cls:"bg-emerald-50 text-emerald-700",label:"Active"},closed_won:{cls:"bg-indigo-50 text-indigo-700",label:"Won"},closed_lost:{cls:"bg-rose-50 text-rose-700",label:"Lost"} };
const PAY_STATUS  = { paid:{cls:"bg-emerald-50 text-emerald-700",label:"Paid",dot:"bg-emerald-400"},pending:{cls:"bg-amber-50 text-amber-700",label:"Pending",dot:"bg-amber-400"},overdue:{cls:"bg-rose-50 text-rose-700",label:"Overdue",dot:"bg-rose-400"} };
const PRIO_COL    = { high:"text-rose-600 bg-rose-50",medium:"text-amber-600 bg-amber-50",low:"text-slate-500 bg-slate-100" };
const USER_COLORS = ["bg-violet-500","bg-pink-500","bg-sky-500","bg-emerald-500","bg-orange-500","bg-indigo-500","bg-teal-500","bg-rose-500","bg-cyan-500","bg-lime-600"];

// ─── Persistence ──────────────────────────────────────────────────────────────
const LS = { get:(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } }, set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} } };

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id:"u1",name:"Raj Patel",    email:"admin@nexus.com",  password:"super123", role:"super_admin", territories:[],                    commissionRate:0, phone:"9876543210", countryCode:"+91",  designation:"CEO" },
  { id:"u2",name:"Priya Kapoor", email:"priya@nexus.com",  password:"admin123", role:"admin",       territories:["Singapore","India"], commissionRate:0, phone:"8123456789", countryCode:"+91",  designation:"Regional Director" },
  { id:"u3",name:"Sarah Chen",   email:"sarah@nexus.com",  password:"pass123",  role:"sales",       territories:["Singapore","India"], commissionRate:8, phone:"91234567",   countryCode:"+65",  designation:"Senior AE" },
  { id:"u4",name:"Omar Hassan",  email:"omar@nexus.com",   password:"pass123",  role:"sales",       territories:["UAE","Indonesia"],   commissionRate:7, phone:"501234567",  countryCode:"+971", designation:"Account Executive" },
  { id:"u5",name:"Elena Vance",  email:"elena@nexus.com",  password:"pass123",  role:"engagement",  territories:[],                    commissionRate:0, phone:"81234568",   countryCode:"+65",  designation:"Engagement Manager" },
  { id:"u6",name:"Marcus Bloom", email:"marcus@nexus.com", password:"pass123",  role:"projects",    territories:[],                    commissionRate:0, phone:"81234569",   countryCode:"+65",  designation:"Project Manager" },
];
const SEED_CLIENTS = [
  { id:"cl1",name:"TechFlow Inc",   contact:"David Kim",    email:"david@techflow.com", phone:"91234567",   countryCode:"+65",  country:"Singapore" },
  { id:"cl2",name:"Gulf Ventures",  contact:"Fatima Al-R.", email:"fatima@gulfv.ae",    phone:"501234567",  countryCode:"+971", country:"UAE" },
  { id:"cl3",name:"DataNest India", contact:"Priya Sharma", email:"priya@datanest.io",  phone:"9876543210", countryCode:"+91",  country:"India" },
  { id:"cl4",name:"Maju Digital",   contact:"Budi Santoso", email:"budi@maju.co.id",    phone:"81234567",   countryCode:"+62",  country:"Indonesia" },
];
const SEED_ENGAGEMENTS = [
  { id:"en1",clientId:"cl1",name:"Digital Transformation 2024",salesPersonId:"u3",pmId:"u5",status:"active",   value:150000,currency:"SGD",startDate:"2024-01-15",notes:"Flagship account." },
  { id:"en2",clientId:"cl2",name:"Platform Launch — MENA",     salesPersonId:"u4",pmId:"u5",status:"active",   value:95000, currency:"AED",startDate:"2024-02-01",notes:"Multi-phase delivery." },
  { id:"en3",clientId:"cl3",name:"Brand & Growth Programme",   salesPersonId:"u3",pmId:"u6",status:"active",   value:48000, currency:"INR",startDate:"2024-02-15",notes:"SEO + content + social." },
  { id:"en4",clientId:"cl4",name:"E-Commerce Overhaul",        salesPersonId:"u4",pmId:"u5",status:"paused",   value:62000, currency:"IDR",startDate:"2024-01-20",notes:"On hold — budget review." },
];
const SEED_PROJECTS = [
  { id:"pr1",engagementId:"en1",name:"Website Redesign",    assignedTo:["u3","u6"],status:"active",   value:55000,currency:"SGD",type:"Development",     notes:"Next.js build" },
  { id:"pr2",engagementId:"en1",name:"SEO Campaign",        assignedTo:["u5"],     status:"active",   value:24000,currency:"SGD",type:"SEO",             notes:"12-month retainer",recurring:true,recurringDay:1,recurringAmount:2000 },
  { id:"pr3",engagementId:"en1",name:"Digital Marketing",   assignedTo:["u5","u3"],status:"active",   value:36000,currency:"SGD",type:"Digital Marketing",notes:"Google + Meta Ads",recurring:true,recurringDay:1,recurringAmount:3000 },
  { id:"pr4",engagementId:"en2",name:"Mobile App",          assignedTo:["u6","u5"],status:"active",   value:65000,currency:"AED",type:"Development",     notes:"React Native" },
  { id:"pr5",engagementId:"en3",name:"Brand Identity",      assignedTo:["u5"],     status:"completed",value:12000,currency:"INR",type:"Design",          notes:"Logo + guidelines" },
  { id:"pr6",engagementId:"en3",name:"Social Media Mgmt",   assignedTo:["u3","u5"],status:"active",   value:18000,currency:"INR",type:"Social Media",    notes:"4 platforms" },
];
const today = new Date().toISOString().split("T")[0];
const ago = days => { const d=new Date(); d.setDate(d.getDate()-days); return d.toISOString().split("T")[0]; };
const SEED_PAYMENTS = [
  { id:"pay1",engagementId:"en1",projectId:"pr1",clientId:"cl1",description:"Website Redesign — Phase 1",amount:27500,currency:"SGD",dueDate:ago(45), paidDate:ago(46),status:"paid",   month:"2024-02",recurring:false },
  { id:"pay2",engagementId:"en1",projectId:"pr1",clientId:"cl1",description:"Website Redesign — Phase 2",amount:27500,currency:"SGD",dueDate:ago(5),  paidDate:null,   status:"pending",month:"2024-04",recurring:false },
  { id:"pay3",engagementId:"en1",projectId:"pr2",clientId:"cl1",description:"SEO — Jan Retainer",         amount:2000, currency:"SGD",dueDate:ago(95), paidDate:ago(94),status:"paid",   month:"2024-01",recurring:true },
  { id:"pay4",engagementId:"en1",projectId:"pr2",clientId:"cl1",description:"SEO — Feb Retainer",         amount:2000, currency:"SGD",dueDate:ago(65), paidDate:ago(63),status:"paid",   month:"2024-02",recurring:true },
  { id:"pay5",engagementId:"en1",projectId:"pr3",clientId:"cl1",description:"Dig. Mktg — Q1 Budget",      amount:9000, currency:"SGD",dueDate:ago(95), paidDate:null,   status:"overdue",month:"2024-03",recurring:false },
  { id:"pay6",engagementId:"en2",projectId:"pr4",clientId:"cl2",description:"Mobile App — Milestone 1",   amount:25000,currency:"AED",dueDate:ago(50), paidDate:ago(49),status:"paid",   month:"2024-02",recurring:false },
  { id:"pay7",engagementId:"en2",projectId:"pr4",clientId:"cl2",description:"Mobile App — Milestone 2",   amount:25000,currency:"AED",dueDate:ago(10), paidDate:null,   status:"pending",month:"2024-04",recurring:false },
  { id:"pay8",engagementId:"en3",projectId:"pr5",clientId:"cl3",description:"Brand Identity — Full",      amount:12000,currency:"INR",dueDate:ago(70), paidDate:ago(71),status:"paid",   month:"2024-02",recurring:false },
  { id:"pay9",engagementId:"en3",projectId:"pr6",clientId:"cl3",description:"Social Media — Q1 Retainer", amount:4500, currency:"INR",dueDate:ago(100),paidDate:null,   status:"overdue",month:"2024-03",recurring:false },
  { id:"pay10",engagementId:"en1",projectId:"pr2",clientId:"cl1",description:"SEO — Mar Retainer",        amount:2000, currency:"SGD",dueDate:ago(35), paidDate:null,   status:"overdue",month:"2024-03",recurring:true },
];
const SEED_LEADS = [
  { id:"l1",name:"Wei Lin",     company:"FinTech SG",  division:"",       email:"wei@fintechsg.com",  phone:"91234001",countryCode:"+65", country:"Singapore",status:"active",     value:45000,currency:"SGD",salesPersonId:"u3",source:"Inbound", createdAt:"2024-01-15",aiScore:null,aiNote:null,notes:"Full digital suite",   services:["Website Development","SEO"],       dealType:"one_time" },
  { id:"l2",name:"Ahmed Al-M.", company:"Dubai PropCo",division:"PropTech",email:"ahmed@dubaiprop.ae", phone:"501234001",countryCode:"+971",country:"UAE",      status:"open",       value:80000,currency:"AED",salesPersonId:"u4",source:"Referral",createdAt:"2024-02-01",aiScore:null,aiNote:null,notes:"Real estate portal",   services:["E-Commerce Development"],          dealType:"recurring",recurringMonthlyValue:8000 },
  { id:"l3",name:"Kavya Nair",  company:"EdTech India",division:"",       email:"kavya@edtech.in",    phone:"9876500001",countryCode:"+91",country:"India",    status:"closed_won", value:35000,currency:"INR",salesPersonId:"u3",source:"Outbound",createdAt:"2023-12-10",aiScore:82, aiNote:"Strong fit.",notes:"Won Q4 2023",          services:["Digital Marketing","Social Media Marketing"],dealType:"recurring",recurringMonthlyValue:3500 },
  { id:"l4",name:"Andi Wijaya", company:"Tokobaju.id", division:"Fashion",email:"andi@tokobaju.id",   phone:"81234001",countryCode:"+62",country:"Indonesia",status:"active",     value:28000,currency:"IDR",salesPersonId:"u4",source:"Event",    createdAt:"2024-02-10",aiScore:null,aiNote:null,notes:"E-commerce fashion",   services:["E-Commerce Development","Influencer Marketing"],dealType:"one_time" },
];
const SEED_TASKS = [
  { id:"tk1",title:"Send proposal — Dubai PropCo",   dueDate:ago(-2),priority:"high",  leadId:"l2",projectId:null, assignedTo:"u4",completed:false,type:"proposal" },
  { id:"tk2",title:"Weekly check-in — TechFlow SEO", dueDate:ago(-1),priority:"medium",leadId:null,projectId:"pr2",assignedTo:"u5",completed:false,type:"meeting" },
  { id:"tk3",title:"Mobile app wireframe review",    dueDate:ago(-3),priority:"high",  leadId:null,projectId:"pr4",assignedTo:"u6",completed:false,type:"review" },
  { id:"tk4",title:"Invoice follow-up — Dig. Mktg",  dueDate:ago(0), priority:"high",  leadId:null,projectId:"pr3",assignedTo:"u3",completed:false,type:"email" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inits    = (n="")=>n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const genId    = p=>`${p}${Date.now()}${Math.random().toString(36).slice(2,5)}`;
const userCol  = id=>USER_COLORS[parseInt((id||"0").replace(/\D/g,""),36)%USER_COLORS.length]||USER_COLORS[0];
const scoreCol = s=>s>=70?"text-emerald-600 bg-emerald-50":s>=40?"text-amber-600 bg-amber-50":"text-rose-600 bg-rose-50";
const waLink   = (code,phone,msg)=>`https://wa.me/${(code||"").replace("+","")}${phone}?text=${encodeURIComponent(msg||"")}`;
const mailLink = (email,subj,body)=>`mailto:${email}?subject=${encodeURIComponent(subj||"")}&body=${encodeURIComponent(body||"")}`;
const daysOverdue = dueDate => { if(!dueDate)return 0; const diff=new Date()-new Date(dueDate); return Math.floor(diff/86400000); };
const agingBucket = days => days>=90?"90+":days>=60?"60-90":days>=30?"30-60":"<30";
const agingColor  = days => days>=90?"text-rose-700 bg-rose-100 border-rose-300":days>=60?"text-rose-600 bg-rose-50 border-rose-200":days>=30?"text-amber-600 bg-amber-50 border-amber-200":"text-slate-600 bg-slate-50 border-slate-200";

const exportCSV = (rows, filename) => {
  if(!rows.length)return;
  const headers=Object.keys(rows[0]);
  const csv=[headers.join(","),...rows.map(r=>headers.map(h=>{ const v=r[h]; return Array.isArray(v)?`"${v.join("; ")}"`:typeof v==="string"?`"${v.replace(/"/g,'""')}"`:v??""}).join(","))].join("\n");
  const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download=filename+".csv"; a.click();
};

// Auto-generate recurring payments for current month
const ensureRecurringPayments = (payments, projects, engagements) => {
  const ym = today.slice(0,7);
  const newPays = [...payments];
  projects.filter(p=>p.recurring&&p.status==="active"&&p.recurringAmount>0).forEach(pr=>{
    const eng = engagements.find(e=>e.id===pr.engagementId);
    if(!eng)return;
    const exists = payments.some(p=>p.projectId===pr.id&&p.recurring&&p.month===ym);
    if(!exists){
      const day = String(pr.recurringDay||1).padStart(2,"0");
      newPays.push({ id:genId("pay"),engagementId:pr.engagementId,projectId:pr.id,clientId:eng.clientId,description:`${pr.name} — ${ym} (Auto)`,amount:pr.recurringAmount,currency:pr.currency||eng.currency||"USD",dueDate:`${ym}-${day}`,paidDate:null,status:"pending",month:ym,recurring:true,autoGenerated:true });
    }
  });
  return newPays;
};

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
const Avatar=({user,size="md"})=>{
  if(!user)return <div className={`${size==="sm"?"h-6 w-6 text-[9px]":size==="lg"?"h-10 w-10 text-sm":"h-8 w-8 text-xs"} rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0`}>?</div>;
  const sz=size==="sm"?"h-6 w-6 text-[9px]":size==="lg"?"h-10 w-10 text-sm":"h-8 w-8 text-xs";
  return <div title={user.name} className={`${sz} ${userCol(user.id)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>{inits(user.name)}</div>;
};
const Badge=({cfg})=><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.cls||"bg-slate-100 text-slate-600"}`}>{cfg?.label||""}</span>;
const RoleBadge=({role})=><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLES[role]?.color||"bg-slate-100 text-slate-600"}`}>{ROLES[role]?.icon} {ROLES[role]?.label||role}</span>;
const ServiceTag=({s})=><span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">{s}</span>;
const WABtn=({phone,code,msg,size="sm"})=>{ if(!phone)return null; return <a href={waLink(code,phone,msg)} target="_blank" rel="noreferrer" title="WhatsApp" className={`${size==="sm"?"h-6 w-6":"h-7 w-7"} rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors shrink-0`}><MessageCircle size={size==="sm"?11:13}/></a>; };
const MailBtn=({email,subj,body,size="sm"})=>{ if(!email)return null; return <a href={mailLink(email,subj,body)} className={`${size==="sm"?"h-6 w-6":"h-7 w-7"} rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors shrink-0`} title="Email"><Mail size={size==="sm"?11:13}/></a>; };
const RecurringBadge=()=><span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><RefreshCw size={8}/>REC</span>;

const IC="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:outline-none";
const Fld=({label,children,hint})=><div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}{hint&&<span className="ml-1 text-[9px] font-normal normal-case text-slate-300">({hint})</span>}</label>{children}</div>;
const PhoneInput=({code,phone,onCode,onPhone,placeholder="Phone number"})=>(
  <div className="flex gap-2">
    <select value={code} onChange={e=>onCode(e.target.value)} className="border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none w-28 shrink-0">
      {ALL_COUNTRY_CODES.map(c=><option key={c.code+c.name} value={c.code}>{c.flag} {c.code}</option>)}
    </select>
    <input value={phone} onChange={e=>onPhone(e.target.value)} placeholder={placeholder} className={IC+" flex-1"}/>
  </div>
);
const CurrencyInput=({value,currency,onValue,onCurrency,placeholder="0"})=>(
  <div className="flex gap-2">
    <select value={currency} onChange={e=>onCurrency(e.target.value)} className="border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none w-24 shrink-0">
      {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}
    </select>
    <input type="number" value={value} onChange={e=>onValue(e.target.value)} placeholder={placeholder} className={IC+" flex-1"}/>
  </div>
);

// ─── Modal Shell ──────────────────────────────────────────────────────────────
const Modal=({title,onClose,onSave,saveLabel="Save",wide=false,xl=false,noFooter=false,children})=>(
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}/>
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${xl?"max-w-3xl":wide?"max-w-2xl":"max-w-md"} overflow-hidden flex flex-col max-h-[90vh]`}>
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h2 className="font-bold text-lg text-slate-900">{title}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18}/></button>
      </div>
      <div className="p-6 space-y-4 overflow-y-auto flex-1">{children}</div>
      {!noFooter&&<div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
        <button onClick={onSave} className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">{saveLabel}</button>
      </div>}
    </div>
  </div>
);
// ─── LOGIN
jsconst AddLeadWizard = ({ nLead, setNL, onClose, onSave, users, isAdmin }) => {
  const [step, setStep] = useState(1);
  const steps = ["Contact Info","Deal Details","Services & Notes"];
  const valid1 = nLead.name && nLead.company;
  const valid2 = nLead.value && nLead.salesPersonId;
  return (
    <Modal title="Add New Lead" onClose={onClose} onSave={step===3?onSave:()=>setStep(s=>s+1)} saveLabel={step===3?"Save Lead":"Next →"} xl noFooter>
      <div className="flex items-center gap-0 mb-6 -mt-2">
        {steps.map((s,i)=>(
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${step===i+1?"bg-blue-600 text-white":step>i+1?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-400"}`}>
              {step>i+1?<CheckCheck size={12}/>:<span>{i+1}</span>}{s}
            </div>
            {i<2&&<div className={`h-0.5 flex-1 mx-1 ${step>i+1?"bg-emerald-300":"bg-slate-200"}`}/>}
          </React.Fragment>
        ))}
      </div>
      {step===1&&<div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Contact Name *"><input value={nLead.name} onChange={e=>setNL(p=>({...p,name:e.target.value}))} className={IC} placeholder="John Smith"/></Fld>
          <Fld label="Company Name *"><input value={nLead.company} onChange={e=>setNL(p=>({...p,company:e.target.value}))} className={IC} placeholder="Acme Corp"/></Fld>
        </div>
        <Fld label="Division / Sub-brand" hint="optional"><input value={nLead.division} onChange={e=>setNL(p=>({...p,division:e.target.value}))} className={IC} placeholder="e.g. Fashion, PropTech"/></Fld>
        <Fld label="Email Address"><input value={nLead.email} onChange={e=>setNL(p=>({...p,email:e.target.value}))} className={IC} placeholder="john@company.com"/></Fld>
        <Fld label="Phone Number">
          <PhoneInput code={nLead.countryCode} phone={nLead.phone} onCode={v=>setNL(p=>({...p,countryCode:v}))} onPhone={v=>setNL(p=>({...p,phone:v}))}/>
        </Fld>
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Country">
            <select value={nLead.country} onChange={e=>{const cur=defaultCurrency(e.target.value);const code=defaultCode(e.target.value);setNL(p=>({...p,country:e.target.value,currency:cur,countryCode:code}));}} className={IC}>
              {[...COUNTRIES,"Other"].map(c=><option key={c}>{c}</option>)}
            </select>
          </Fld>
          <Fld label="Source">
            <select value={nLead.source} onChange={e=>setNL(p=>({...p,source:e.target.value}))} className={IC}>
              {SOURCES.map(s=><option key={s}>{s}</option>)}
            </select>
          </Fld>
        </div>
      </div>}
      {step===2&&<div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Deal Type">
            <select value={nLead.dealType} onChange={e=>setNL(p=>({...p,dealType:e.target.value}))} className={IC}>
              <option value="one_time">One-Time</option>
              <option value="recurring">Recurring / Retainer</option>
            </select>
          </Fld>
          <Fld label="Status">
            <select value={nLead.status} onChange={e=>setNL(p=>({...p,status:e.target.value}))} className={IC}>
              <option value="open">Open</option>
              <option value="active">Active</option>
            </select>
          </Fld>
        </div>
        <Fld label="Total Deal Value *">
          <CurrencyInput value={nLead.value} currency={nLead.currency} onValue={v=>setNL(p=>({...p,value:v}))} onCurrency={v=>setNL(p=>({...p,currency:v}))} placeholder="50000"/>
        </Fld>
        {nLead.dealType==="recurring"&&<Fld label="Monthly Recurring Value" hint="auto-added to payments each month">
          <CurrencyInput value={nLead.recurringMonthlyValue} currency={nLead.currency} onValue={v=>setNL(p=>({...p,recurringMonthlyValue:v}))} onCurrency={v=>setNL(p=>({...p,currency:v}))} placeholder="5000"/>
        </Fld>}
        <Fld label="Assigned Sales Rep *">
          <select value={nLead.salesPersonId} onChange={e=>setNL(p=>({...p,salesPersonId:e.target.value}))} className={IC}>
            <option value="">Select rep…</option>
            {users.filter(u=>u.role==="sales"||isAdmin({role:u.role})).map(u=><option key={u.id} value={u.id}>{u.name} — {u.territories.join(", ")||"All"}</option>)}
          </select>
        </Fld>
      </div>}
      {step===3&&<div className="space-y-4">
        <Fld label="Services Interested In">
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
            {SERVICE_TYPES.map(s=><label key={s} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-blue-700 py-0.5">
              <input type="checkbox" checked={(nLead.services||[]).includes(s)} onChange={ev=>setNL(p=>({...p,services:ev.target.checked?[...(p.services||[]),s]:(p.services||[]).filter(x=>x!==s)}))} className="rounded accent-blue-600"/>
              {s}
            </label>)}
          </div>
        </Fld>
        <Fld label="Notes">
          <textarea value={nLead.notes} onChange={e=>setNL(p=>({...p,notes:e.target.value}))} className={IC+" h-24 resize-none"} placeholder="Budget signals, decision timeline, competition…"/>
        </Fld>
        {(nLead.services||[]).length>0&&<div>
          <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Selected Services</p>
          <div className="flex flex-wrap gap-1.5">{(nLead.services||[]).map(s=><ServiceTag key={s} s={s}/>)}</div>
        </div>}
      </div>}
      <div className="flex justify-between pt-4 border-t border-slate-100">
        <button onClick={()=>step>1?setStep(s=>s-1):onClose()} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1">
          {step>1&&<ChevronLeft size={14}/>}{step>1?"Back":"Cancel"}
        </button>
        <button onClick={()=>{if(step===1&&!valid1)return;if(step===2&&!valid2)return;step===3?onSave():setStep(s=>s+1);}} disabled={(step===1&&!valid1)||(step===2&&!valid2)}
          className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-sm flex items-center gap-1">
          {step===3?"Save Lead":"Next"}<ChevronRight size={14}/>
        </button>
      </div>
    </Modal>
  );
};
// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginScreen=({onLogin,users,onResetUsers})=>{
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [showPw,setShowPw]=useState(false); const [err,setErr]=useState("");
  const login=()=>{ const u=users.find(u=>u.email.toLowerCase().trim()===email.toLowerCase().trim()&&u.password===pw); if(u)onLogin(u); else setErr("Incorrect email or password."); };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center h-14 w-14 bg-blue-600 rounded-2xl mb-4 shadow-xl"><Target className="text-white" size={28}/></div><h1 className="text-3xl font-black text-white tracking-tight">NexusCRM</h1><p className="text-slate-400 mt-1 text-sm">Sign in to your workspace</p></div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {err&&<div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 mb-4 text-sm flex items-center gap-2"><AlertCircle size={14}/>{err}</div>}
          <div className="space-y-4 mb-6">
            <Fld label="Email"><div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="you@nexus.com" className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/></div></Fld>
            <Fld label="Password"><div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••" className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/><button onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></Fld>
          </div>
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 shadow-md">Sign In</button>
          <p className="mt-6 text-center text-xs text-slate-400">Contact your admin for login credentials.</p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser,setCU]=useState(null);
  const [users,setUsers]=useState(()=>LS.get("ncrm_v4_users",SEED_USERS));
  const [clients,setClients]=useState(SEED_CLIENTS);
  const [engagements,setEngagements]=useState(SEED_ENGAGEMENTS);
  const [projects,setProjects]=useState(SEED_PROJECTS);
  const [payments,setPayments]=useState(()=>ensureRecurringPayments(SEED_PAYMENTS,SEED_PROJECTS,SEED_ENGAGEMENTS));
  const [leads,setLeads]=useState(SEED_LEADS);
  const [tasks,setTasks]=useState(SEED_TASKS);
  const [tab,setTab]=useState("dashboard");
  const [search,setSearch]=useState("");
  const [selEngagement,setSelEng]=useState(null);
  const [selLead,setSelLead]=useState(null);
  const [expandedClients,setExpandedClients]=useState({cl1:true});
  const [editEng,setEditEng]=useState(null);
  const [editProj,setEditProj]=useState(null);
  const [showAddUser,setShowAddUser]=useState(false);
  const [showAddClient,setShowAddClient]=useState(false);
  const [showAddEng,setShowAddEng]=useState(false);
  const [showAddProj,setShowAddProj]=useState(false);
  const [showAddPayment,setShowAddPayment]=useState(false);
  const [editPayment,setEditPayment]=useState(null);
  const [showAddLead,setShowAddLead]=useState(false);
  const [showAddTask,setShowAddTask]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [editUser,setEditUser]=useState(null);

  const EU={name:"",email:"",password:"pass123",role:"sales",territories:[],commissionRate:7,phone:"",countryCode:"+65",designation:""};
  const EC={name:"",contact:"",email:"",phone:"",countryCode:"+65",country:"Singapore"};
  const EE={clientId:"",name:"",salesPersonId:"",pmId:"",status:"active",value:"",currency:"SGD",startDate:"",notes:""};
  const EP={engagementId:"",name:"",assignedTo:[],status:"active",value:"",currency:"SGD",type:"Development",notes:"",recurring:false,recurringDay:1,recurringAmount:""};
  const EPay={engagementId:"",projectId:"",clientId:"",description:"",amount:"",currency:"SGD",dueDate:"",status:"pending",month:"",recurring:false};
  const EL={step:1,name:"",company:"",division:"",email:"",phone:"",countryCode:"+65",country:"Singapore",status:"open",value:"",currency:"SGD",salesPersonId:"",source:"Inbound",notes:"",services:[],dealType:"one_time",recurringMonthlyValue:""};
  const ET={title:"",dueDate:"",priority:"medium",leadId:"",projectId:"",assignedTo:"",type:"call"};
  const [nUser,setNU]=useState(EU); const [nClient,setNC]=useState(EC); const [nEng,setNE]=useState(EE);
  const [nProj,setNP]=useState(EP); const [nPayment,setNPy]=useState(EPay); const [nLead,setNL]=useState(EL); const [nTask,setNT]=useState(ET);

  const getUser=id=>users.find(u=>u.id===id);
  const getClient=id=>clients.find(c=>c.id===id)||{};
  const getEngagement=id=>engagements.find(e=>e.id===id)||{};
  const getProject=id=>projects.find(p=>p.id===id)||{};

  const updateUsers=fn=>setUsers(prev=>{ const next=typeof fn==="function"?fn(prev):fn; LS.set("ncrm_v4_users",next); return next; });
  const isSA=u=>u?.role==="super_admin"; const isAdmin=u=>u?.role==="admin"||u?.role==="super_admin";
  const canManageEng=u=>u&&["super_admin","admin","engagement"].includes(u.role);
  const canManageProj=(u,proj)=>{ if(!u)return false; if(["super_admin","admin","engagement"].includes(u.role))return true; if(u.role==="projects") return (proj?.assignedTo||[]).includes(u.id)||true; return false; };

  // Auto-refresh recurring payments when projects change
  useEffect(()=>{ setPayments(prev=>ensureRecurringPayments(prev,projects,engagements)); },[projects,engagements]);

  const stats=useMemo(()=>{
    const paid=payments.filter(p=>p.status==="paid");
    const overdue=payments.filter(p=>p.status==="overdue"||p.status==="pending");
    const flag90=overdue.filter(p=>daysOverdue(p.dueDate)>=90);
    return { activeEngs:engagements.filter(e=>e.status==="active").length, totalProjs:projects.length, openLeads:leads.filter(l=>l.status==="open").length, wonLeads:leads.filter(l=>l.status==="closed_won").length, totalReceived:paid.reduce((s,p)=>s+p.amount,0), totalPending:payments.filter(p=>p.status==="pending").reduce((s,p)=>s+p.amount,0), totalOverdue:payments.filter(p=>p.status==="overdue").reduce((s,p)=>s+p.amount,0), flag90Count:flag90.length };
  },[payments,leads,engagements,projects]);

  const allowedTabs=currentUser?(ROLES[currentUser.role]?.nav||[]):[];
  const NAV=[
    {id:"dashboard",   icon:LayoutDashboard,label:"Dashboard"},
    {id:"users",       icon:Shield,         label:"User Management"},
    {id:"leads",       icon:Target,         label:"Leads"},
    {id:"engagements", icon:Layers,         label:"Engagements"},
    {id:"invoices",    icon:Clock,          label:"Invoices",badge:stats.flag90Count>0?stats.flag90Count:null},
    {id:"payments",    icon:CreditCard,     label:"Payments"},
    {id:"commissions", icon:Banknote,       label:"Commissions"},
    {id:"tasks",       icon:CheckSquare,    label:"Tasks"},
    {id:"team",        icon:Users,          label:"Team"},
    {id:"profile",     icon:UserCog,        label:"My Profile"},
  ].filter(n=>allowedTabs.includes(n.id));

  // ── CRUD ──
  const addUser=()=>{ if(!nUser.name||!nUser.email)return; updateUsers(p=>[...p,{...nUser,id:genId("u"),commissionRate:Number(nUser.commissionRate)||0}]); setNU(EU); setShowAddUser(false); };
  const saveEditUser=()=>{ if(!editUser)return; updateUsers(p=>p.map(u=>u.id===editUser.id?{...editUser,commissionRate:Number(editUser.commissionRate)||0}:u)); if(currentUser.id===editUser.id)setCU({...editUser,commissionRate:Number(editUser.commissionRate)||0}); setEditUser(null); };
  const deleteUser=id=>updateUsers(p=>p.filter(u=>u.id!==id));

  const addClient=()=>{ if(!nClient.name)return; setClients(p=>[...p,{...nClient,id:genId("cl")}]); setNC(EC); setShowAddClient(false); };

  const addEng=()=>{ if(!nEng.name||!nEng.clientId)return; setEngagements(p=>[...p,{...nEng,id:genId("en"),value:Number(nEng.value)||0}]); setNE(EE); setShowAddEng(false); };
  const saveEng=()=>{ if(!editEng)return; setEngagements(p=>p.map(e=>e.id===editEng.id?{...editEng,value:Number(editEng.value)||0}:e)); if(selEngagement?.id===editEng.id)setSelEng({...editEng}); setEditEng(null); };
  const deleteEng=id=>{ setEngagements(p=>p.filter(e=>e.id!==id)); if(selEngagement?.id===id)setSelEng(null); };

  const addProj=()=>{ if(!nProj.name||!nProj.engagementId)return; const p={...nProj,id:genId("pr"),value:Number(nProj.value)||0,recurringAmount:Number(nProj.recurringAmount)||0}; setProjects(prev=>[...prev,p]); setNP(EP); setShowAddProj(false); };
  const saveProj=()=>{ if(!editProj)return; setProjects(p=>p.map(x=>x.id===editProj.id?{...editProj,value:Number(editProj.value)||0,recurringAmount:Number(editProj.recurringAmount)||0}:x)); setEditProj(null); };
  const deleteProj=id=>setProjects(p=>p.filter(x=>x.id!==id));

  const addPayment=()=>{ if(!nPayment.description||!nPayment.amount)return; setPayments(p=>[...p,{...nPayment,id:genId("pay"),amount:Number(nPayment.amount)||0}]); setNPy(EPay); setShowAddPayment(false); };
  const markPaid=id=>setPayments(p=>p.map(pay=>pay.id===id?{...pay,status:"paid",paidDate:today}:pay));
  const markOverdue=id=>setPayments(p=>p.map(pay=>pay.id===id?{...pay,status:"overdue"}:pay));
  const saveEditPayment=()=>{ if(!editPayment)return; setPayments(p=>p.map(pay=>pay.id===editPayment.id?{...editPayment,amount:Number(editPayment.amount)||0}:pay)); setEditPayment(null); };

  const addLead=()=>{ if(!nLead.name||!nLead.company)return; setLeads(p=>[...p,{...nLead,id:genId("l"),value:Number(nLead.value)||0,recurringMonthlyValue:Number(nLead.recurringMonthlyValue)||0,createdAt:today,aiScore:null,aiNote:null}]); setNL(EL); setShowAddLead(false); };
  const updateLeadStatus=(id,status)=>{ setLeads(p=>p.map(l=>l.id===id?{...l,status}:l)); if(selLead?.id===id)setSelLead(p=>({...p,status})); };
  const deleteLead=id=>{ setLeads(p=>p.filter(l=>l.id!==id)); if(selLead?.id===id)setSelLead(null); };
  const scoreLead=async id=>{ const lead=leads.find(l=>l.id===id); if(!lead)return; setLeads(p=>p.map(l=>l.id===id?{...l,aiScore:-1}:l)); try{ const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:150,messages:[{role:"user",content:`Score B2B lead 1-100 close probability. JSON only: {"score":number,"note":"one sentence"}\ncompany=${lead.company},value=${lead.value}${lead.currency},dealType=${lead.dealType},services=${(lead.services||[]).join(",")},country=${lead.country},notes="${lead.notes}"`}]})}); const d=await r.json(); const parsed=JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()); setLeads(p=>p.map(l=>l.id===id?{...l,aiScore:parsed.score,aiNote:parsed.note}:l)); }catch{ setLeads(p=>p.map(l=>l.id===id?{...l,aiScore:null}:l)); } };
  const scoreAll=async()=>{ for(const l of leads.filter(l=>l.aiScore===null))await scoreLead(l.id); };

  const addTask=()=>{ if(!nTask.title)return; setTasks(p=>[...p,{...nTask,id:genId("tk"),completed:false}]); setNT(ET); setShowAddTask(false); };
  const toggleTask=id=>setTasks(p=>p.map(t=>t.id===id?{...t,completed:!t.completed}:t));
  const deleteTask=id=>setTasks(p=>p.filter(t=>t.id!==id));

  if(!currentUser)return <LoginScreen users={users} onLogin={u=>{setCU(u);setTab("dashboard");}} onResetUsers={()=>{LS.set("ncrm_v4_users",SEED_USERS);setUsers(SEED_USERS);}}/>;

  // ══════════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════════
  const DashboardView=()=>(
    <div className="space-y-8">
      <div className="flex justify-between items-end"><div><h1 className="text-3xl font-bold">Good morning, {currentUser.name.split(" ")[0]} 👋</h1><p className="text-slate-500 mt-1 text-sm">Workspace overview.</p></div>{allowedTabs.includes("leads")&&<button onClick={()=>setShowAddLead(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-md text-sm active:scale-95"><Plus size={15}/>New Lead</button>}</div>
      {stats.flag90Count>0&&<div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3"><AlertTriangle size={18} className="text-rose-600 shrink-0"/><div><p className="font-bold text-rose-800 text-sm">{stats.flag90Count} payment{stats.flag90Count!==1?"s":""} overdue 90+ days</p><p className="text-rose-600 text-xs">These require immediate follow-up.</p></div><button onClick={()=>setTab("invoices")} className="ml-auto text-xs font-bold text-rose-700 border border-rose-300 bg-white px-3 py-1.5 rounded-lg hover:bg-rose-50">View Invoices →</button></div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[{label:"Active Engagements",val:stats.activeEngs,icon:Layers,col:"text-blue-600",bg:"bg-blue-50"},{label:"Total Projects",val:stats.totalProjs,icon:Briefcase,col:"text-violet-600",bg:"bg-violet-50"},{label:"Open Leads",val:stats.openLeads,icon:Target,col:"text-indigo-600",bg:"bg-indigo-50"},{label:"Won Deals",val:stats.wonLeads,icon:Award,col:"text-emerald-600",bg:"bg-emerald-50"}].map((k,i)=>(
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"><div className={`${k.bg} ${k.col} p-3 rounded-xl shrink-0`}><k.icon size={20}/></div><div><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{k.label}</p><p className="text-2xl font-bold">{k.val}</p></div></div>
      ))}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{[{label:"Received",val:"Multi-currency",sub:"Paid invoices",col:"text-emerald-600",border:"border-emerald-100"},{label:"Outstanding",val:stats.totalPending.toLocaleString(),sub:"Pending invoices",col:"text-amber-600",border:"border-amber-100"},{label:"Overdue",val:stats.totalOverdue.toLocaleString(),sub:"Requires follow-up",col:"text-rose-600",border:"border-rose-100"}].map((r,i)=>(
        <div key={i} className={`bg-white rounded-2xl border ${r.border} p-5`}><p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{r.label}</p><p className={`text-3xl font-bold ${r.col}`}>{r.val}</p><p className="text-sm text-slate-400 mt-1">{r.sub}</p></div>
      ))}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h2 className="font-bold">Recent Leads</h2><button onClick={()=>setTab("leads")} className="text-blue-600 text-xs hover:underline">View all</button></div><div className="divide-y divide-slate-50">{leads.slice(0,5).map(l=><div key={l.id} onClick={()=>setSelLead(l)} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"><Avatar user={getUser(l.salesPersonId)} size="sm"/><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p><p className="text-xs text-slate-400">{l.company}{l.division?` · ${l.division}`:""}</p></div><div className="flex items-center gap-2">{l.dealType==="recurring"&&<RecurringBadge/>}<Badge cfg={LEAD_STATUS[l.status]}/><span className="text-xs font-bold text-slate-600">{fmtCurrency(l.value,l.currency)}</span></div></div>)}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h2 className="font-bold">Overdue 90+ Days</h2><button onClick={()=>setTab("invoices")} className="text-blue-600 text-xs hover:underline">View all</button></div><div className="divide-y divide-slate-50">{payments.filter(p=>(p.status==="overdue"||p.status==="pending")&&daysOverdue(p.dueDate)>=90).slice(0,5).map(p=><div key={p.id} className="px-6 py-3.5 flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-rose-500 shrink-0"/><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.description}</p><p className="text-xs text-slate-400">{getClient(p.clientId).name} · {daysOverdue(p.dueDate)}d overdue</p></div><span className="font-bold text-rose-600 text-sm shrink-0">{fmtCurrency(p.amount,p.currency)}</span></div>)}{payments.filter(p=>(p.status==="overdue"||p.status==="pending")&&daysOverdue(p.dueDate)>=90).length===0&&<p className="px-6 py-8 text-center text-slate-400 text-sm">No critical overdue payments</p>}</div></div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════════════════════════════════════════
  const UsersView=()=>{
    const visUsers=isSA(currentUser)?users:currentUser.role==="admin"?users.filter(u=>u.role!=="super_admin"):[];
    return (<div className="space-y-6"><div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">User Management</h1><p className="text-slate-400 text-sm mt-0.5">Manage roles, territories and credentials.</p></div><button onClick={()=>setShowAddUser(true)} className="bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><UserPlus size={14}/>Add User</button></div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Territories</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4">Password</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{visUsers.map(u=>(
        <tr key={u.id} className="hover:bg-slate-50 group"><td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar user={u}/><div><p className="font-semibold text-sm">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p>{u.designation&&<p className="text-[10px] text-slate-400">{u.designation}</p>}</div></div></td><td className="px-6 py-4"><RoleBadge role={u.role}/></td><td className="px-6 py-4">{u.territories.length>0?<div className="flex flex-wrap gap-1">{u.territories.map(t=><span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{t}</span>)}</div>:<span className="text-xs text-slate-400">All</span>}</td>
        <td className="px-6 py-4"><div className="flex items-center gap-1">{u.phone&&<span className="text-xs text-slate-500">{u.countryCode} {u.phone}</span>}<WABtn phone={u.phone} code={u.countryCode} msg={`Hi ${u.name.split(" ")[0]}!`}/><MailBtn email={u.email} subj="Hello" body={`Hi ${u.name.split(" ")[0]},`}/></div></td>
        <td className="px-6 py-4"><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{u.password}</span></td>
        <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>setEditUser({...u})} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit3 size={13}/></button>{u.id!==currentUser.id&&<button onClick={()=>deleteUser(u.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 size={13}/></button>}</div></td>
        </tr>
      ))}</tbody></table></div>
    </div>);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // LEADS (with Import)
  // ══════════════════════════════════════════════════════════════════════════════
  const LeadsView=()=>{
    const [sf,setSf]=useState("all"); const [repF,setRepF]=useState("all"); const [geoF,setGeoF]=useState("all"); const [svcF,setSvcF]=useState("all"); const [typeF,setTypeF]=useState("all");
    const visLeads=isSA(currentUser)||currentUser.role==="engagement"||currentUser.role==="projects"?leads:currentUser.role==="admin"?leads.filter(l=>currentUser.territories.includes(l.country)):leads.filter(l=>currentUser.territories.includes(l.country)||l.salesPersonId===currentUser.id);
    const filtered=visLeads.filter(l=>{ const q=search.toLowerCase(); return(!q||l.name.toLowerCase().includes(q)||l.company.toLowerCase().includes(q)||l.country.toLowerCase().includes(q)||(l.division||"").toLowerCase().includes(q))&&(sf==="all"||l.status===sf)&&(repF==="all"||l.salesPersonId===repF)&&(geoF==="all"||l.country===geoF)&&(svcF==="all"||(l.services||[]).includes(svcF))&&(typeF==="all"||l.dealType===typeF); });
    const exportData=filtered.map(l=>({Name:l.name,Company:l.company,Division:l.division||"",Email:l.email,Phone:`${l.countryCode}${l.phone}`,Country:l.country,Status:l.status,Value:l.value,Currency:l.currency,DealType:l.dealType,RecurringMonthly:l.recurringMonthlyValue||"",SalesPerson:getUser(l.salesPersonId)?.name||"",Source:l.source,Services:(l.services||[]).join("; "),Notes:l.notes,AIScore:l.aiScore??""}));
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3"><h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>setShowImport(true)} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><FileSpreadsheet size={13}/>Import Excel</button>
            <button onClick={()=>exportCSV(exportData,"leads_export")} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Download size={13}/>Export CSV</button>
            <button onClick={scoreAll} className="border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Sparkles size={13}/>Score All</button>
            <button onClick={()=>setShowAddLead(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/>Add Lead</button>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
          <SlidersHorizontal size={14} className="text-slate-400 shrink-0"/>
          {[{val:sf,set:setSf,opts:[["all","All Statuses"],...Object.entries(LEAD_STATUS).map(([k,v])=>[k,v.label])]},{val:typeF,set:setTypeF,opts:[["all","All Types"],["one_time","One-Time"],["recurring","Recurring"]]},{val:repF,set:setRepF,opts:[["all","All Reps"],...users.filter(u=>u.role==="sales").map(u=>[u.id,u.name])]},{val:geoF,set:setGeoF,opts:[["all","All Countries"],...COUNTRIES.map(c=>[c,c])]},{val:svcF,set:setSvcF,opts:[["all","All Services"],...SERVICE_TYPES.map(s=>[s,s])]}].map((f,i)=>(
            <select key={i} value={f.val} onChange={e=>f.set(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">{f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
          ))}
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} leads</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold"><tr><th className="px-5 py-4">Lead / Company</th><th className="px-5 py-4">Deal</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Rep</th><th className="px-5 py-4">Score</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length===0&&<tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">No leads match your filters.</td></tr>}
            {filtered.map(l=>{ const sp=getUser(l.salesPersonId); const live=leads.find(x=>x.id===l.id)||l; return (
              <tr key={l.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-5 py-4"><button onClick={()=>setSelLead(live)} className="text-left"><p className="font-semibold text-sm hover:text-blue-600">{l.name}</p><p className="text-xs text-slate-400">{l.company}{l.division?<span className="ml-1 text-[10px] bg-slate-100 px-1 rounded">{l.division}</span>:""}</p><p className="text-[10px] text-slate-400 flex items-center gap-0.5"><MapPin size={8}/>{l.country}</p></button></td>
                <td className="px-5 py-4"><p className="font-bold text-sm text-slate-800">{fmtCurrency(l.value,l.currency)}</p><div className="flex items-center gap-1 mt-0.5">{l.dealType==="recurring"?<><RecurringBadge/><span className="text-[10px] text-slate-500">{fmtCurrency(l.recurringMonthlyValue,l.currency)}/mo</span></>:<span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">One-Time</span>}</div></td>
                <td className="px-5 py-4"><div className="flex items-center gap-1"><span className="text-xs text-slate-500">{l.countryCode} {l.phone}</span><WABtn phone={l.phone} code={l.countryCode} msg={`Hi ${l.name.split(" ")[0]}, following up from Nexus on digital services for ${l.company}.`}/><MailBtn email={l.email} subj={`Follow up — ${l.company}`} body={`Hi ${l.name.split(" ")[0]},\n\nFollowing up on our discussion.\n\nBest,`}/></div></td>
                <td className="px-5 py-4"><Badge cfg={LEAD_STATUS[l.status]}/></td>
                <td className="px-5 py-4"><div className="flex items-center gap-2"><Avatar user={sp} size="sm"/><span className="text-xs text-slate-600 hidden lg:block">{sp?.name||"—"}</span></div></td>
                <td className="px-5 py-4">{live.aiScore===-1?<span className="text-xs text-violet-500 animate-pulse">Scoring…</span>:live.aiScore!=null?<span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreCol(live.aiScore)}`}>{live.aiScore}/100</span>:<button onClick={()=>scoreLead(l.id)} className="text-xs text-violet-600 flex items-center gap-1 opacity-0 group-hover:opacity-100"><Sparkles size={10}/>Score</button>}</td>
                <td className="px-5 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100"><button onClick={()=>setSelLead(live)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit3 size={13}/></button><button onClick={()=>deleteLead(l.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 size={13}/></button></div></td>
              </tr>
            );})}
          </tbody></table>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ENGAGEMENTS (with edit/delete/filter)
  // ══════════════════════════════════════════════════════════════════════════════
  const EngagementsView=()=>{
    const [statusF,setStatusF]=useState("all"); const [clientF,setClientF]=useState("all"); const [repF,setRepF]=useState("all");
    const visEngs=isSA(currentUser)?engagements:currentUser.role==="admin"?engagements.filter(e=>{ const c=getClient(e.clientId); return currentUser.territories.length===0||currentUser.territories.includes(c.country); }):currentUser.role==="sales"?engagements.filter(e=>{ const c=getClient(e.clientId); return currentUser.territories.includes(c.country)||e.salesPersonId===currentUser.id; }):engagements;
    const filteredEngs=visEngs.filter(e=>{ const q=search.toLowerCase(); return(!q||e.name.toLowerCase().includes(q)||getClient(e.clientId).name?.toLowerCase().includes(q))&&(statusF==="all"||e.status===statusF)&&(clientF==="all"||e.clientId===clientF)&&(repF==="all"||e.salesPersonId===repF||e.pmId===repF); });
    const grouped=useMemo(()=>{ const map={}; clients.forEach(c=>{map[c.id]={client:c,items:[]};}); filteredEngs.forEach(e=>{ if(map[e.clientId])map[e.clientId].items.push(e); }); return Object.values(map).filter(g=>g.items.length>0); },[filteredEngs,clients]);
    return (
      <div className="space-y-5">
        <div className="flex justify-between items-center flex-wrap gap-3"><div><h1 className="text-2xl font-bold">Engagements</h1><p className="text-slate-400 text-sm mt-0.5">Client engagements and sub-projects.</p></div>
          <div className="flex gap-2">{isAdmin(currentUser)&&<button onClick={()=>setShowAddClient(true)} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Building2 size={13}/>Add Client</button>}<button onClick={()=>setShowAddEng(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/>New Engagement</button></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-slate-400 shrink-0"/>
          {[{val:statusF,set:setStatusF,opts:[["all","All Statuses"],...Object.entries(ENG_STATUS).map(([k,v])=>[k,v.label])]},{val:clientF,set:setClientF,opts:[["all","All Clients"],...clients.map(c=>[c.id,c.name])]},{val:repF,set:setRepF,opts:[["all","All Team"],...users.map(u=>[u.id,u.name])]}].map((f,i)=>(
            <select key={i} value={f.val} onChange={e=>f.set(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">{f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
          ))}
          <span className="text-xs text-slate-400 ml-auto">{filteredEngs.length} engagements</span>
        </div>
        <div className="space-y-4">{grouped.length===0&&<p className="text-center text-slate-400 py-12 bg-white rounded-2xl border border-slate-200">No engagements found.</p>}
          {grouped.map(({client,items})=>{ const isOpen=expandedClients[client.id]!==false; return (
            <div key={client.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button onClick={()=>setExpandedClients(p=>({...p,[client.id]:!isOpen}))} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Building2 size={16} className="text-slate-500"/></div>
                <div className="flex-1 text-left min-w-0"><p className="font-bold">{client.name}</p><div className="flex items-center gap-2 text-xs text-slate-400"><span>{client.contact}</span><WABtn phone={client.phone} code={client.countryCode} msg={`Hi ${client.contact?.split(" ")[0]}, update from Nexus.`}/><MailBtn email={client.email} subj={`Update — ${client.name}`} body="Hi,\n\n"/><MapPin size={8}/><span>{client.country}</span><span>· {items.length} engagement{items.length!==1?"s":""}</span></div></div>
                <div className="flex items-center gap-3">{isOpen?<ChevronDown size={16} className="text-slate-400"/>:<ChevronRight size={16} className="text-slate-400"/>}</div>
              </button>
              {isOpen&&<div className="border-t border-slate-100 divide-y divide-slate-50">{items.map(eng=>{ const sp=getUser(eng.salesPersonId),pm=getUser(eng.pmId),engProjs=projects.filter(pr=>pr.engagementId===eng.id),isSel=selEngagement?.id===eng.id; return (
                <div key={eng.id}>
                  <div onClick={()=>setSelEng(isSel?null:eng)} className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${isSel?"bg-blue-50":"hover:bg-slate-50"}`}>
                    <div className="w-6 shrink-0"/>
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5 flex-wrap"><p className={`font-semibold text-sm ${isSel?"text-blue-700":"text-slate-800"}`}>{eng.name}</p><Badge cfg={ENG_STATUS[eng.status]}/></div><div className="flex items-center gap-2 text-xs text-slate-400"><span>Sales: <b className="text-slate-600">{sp?.name||"—"}</b></span>{sp&&<WABtn phone={sp.phone} code={sp.countryCode} msg={`Hi ${sp.name.split(" ")[0]}, update on ${eng.name}.`}/>}<span>PM: <b className="text-slate-600">{pm?.name||"—"}</b></span>{pm&&pm.id!==sp?.id&&<WABtn phone={pm.phone} code={pm.countryCode} msg={`Hi ${pm.name.split(" ")[0]}, update on ${eng.name}.`}/>}<span>{engProjs.length} projects</span></div></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-slate-600 hidden md:block">{fmtCurrency(eng.value,eng.currency)}</span>
                      {canManageEng(currentUser)&&<button onClick={e=>{e.stopPropagation();setEditEng({...eng});}} className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={13}/></button>}
                      {canManageEng(currentUser)&&<button onClick={e=>{e.stopPropagation();if(window.confirm(`Delete engagement "${eng.name}"?`))deleteEng(eng.id);}} className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={13}/></button>}
                      {isSel?<ChevronDown size={14} className="text-blue-500"/>:<ChevronRight size={14} className="text-slate-400"/>}
                    </div>
                  </div>
                  {isSel&&<div className="bg-slate-50 border-t border-blue-100 px-6 py-4">
                    <div className="flex justify-between items-center mb-3"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-Projects ({engProjs.length})</p><button onClick={e=>{e.stopPropagation();setNP({...EP,engagementId:eng.id,currency:eng.currency});setShowAddProj(true);}} className="text-xs text-blue-600 font-semibold border border-blue-200 bg-white px-2.5 py-1 rounded-lg flex items-center gap-1"><Plus size={11}/>Add Project</button></div>
                    {engProjs.length===0?<p className="text-xs text-slate-400 py-2 text-center">No projects yet.</p>:<div className="space-y-2">{engProjs.map(pr=>(
                      <div key={pr.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 group/pr">
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap mb-1"><p className="font-semibold text-sm">{pr.name}</p><span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">{pr.type}</span><Badge cfg={ENG_STATUS[pr.status]}/>{pr.recurring&&<RecurringBadge/>}</div><div className="flex flex-wrap gap-1">{pr.assignedTo.map(uid=>{ const u=getUser(uid); return u?<span key={uid} className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-0.5 rounded-full"><Avatar user={u} size="sm"/>{u.name.split(" ")[0]}<WABtn phone={u.phone} code={u.countryCode} msg={`Hi ${u.name.split(" ")[0]}, update needed on ${pr.name}.`}/></span>:null; })}</div></div>
                        <div className="flex items-center gap-2 shrink-0"><span className="text-sm font-bold text-slate-600">{fmtCurrency(pr.value,pr.currency)}</span>{pr.recurring&&<span className="text-xs text-indigo-600">{fmtCurrency(pr.recurringAmount,pr.currency)}/mo</span>}
                        {canManageProj(currentUser,pr)&&<button onClick={e=>{e.stopPropagation();setEditProj({...pr});}} className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-600 opacity-0 group-hover/pr:opacity-100 transition-all"><Edit3 size={12}/></button>}
                        {canManageProj(currentUser,pr)&&<button onClick={e=>{e.stopPropagation();if(window.confirm(`Delete project "${pr.name}"?`))deleteProj(pr.id);}} className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 opacity-0 group-hover/pr:opacity-100 transition-all"><Trash2 size={12}/></button>}
                        </div>
                      </div>
                    ))}</div>}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2"><p className="text-xs text-slate-400 font-medium mr-1">Status:</p>{["active","paused","completed"].map(s=><button key={s} onClick={()=>{ setEngagements(p=>p.map(e=>e.id===eng.id?{...e,status:s}:e)); setSelEng(p=>p?{...p,status:s}:p); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${eng.status===s?`${ENG_STATUS[s].cls} border border-current/20`:"bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}>{ENG_STATUS[s].label}</button>)}</div>
                  </div>}
                </div>
              );})}
              </div>}
            </div>
          );})}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // INVOICES (aging buckets)
  // ══════════════════════════════════════════════════════════════════════════════
  const InvoicesView=()=>{
    const [buckF,setBuckF]=useState("all"); const [cf,setCf]=useState("all");
    const unpaid=payments.filter(p=>p.status!=="paid");
    const filtered=unpaid.filter(p=>{ const days=daysOverdue(p.dueDate); const bucket=days>=90?"90+":days>=60?"60-90":days>=30?"30-60":"<30"; return(buckF==="all"||bucket===buckF)&&(cf==="all"||p.clientId===cf); });
    const buckets=[{key:"90+",label:"90+ Days",col:"text-rose-700",bg:"bg-rose-50",border:"border-rose-200"},{key:"60-90",label:"60–90 Days",col:"text-rose-600",bg:"bg-rose-50",border:"border-rose-100"},{key:"30-60",label:"30–60 Days",col:"text-amber-600",bg:"bg-amber-50",border:"border-amber-200"},{key:"<30",label:"< 30 Days",col:"text-slate-600",bg:"bg-slate-50",border:"border-slate-200"}];
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3"><div><h1 className="text-2xl font-bold">Invoice Tracker</h1><p className="text-slate-400 text-sm mt-0.5">All unpaid invoices grouped by aging.</p></div><button onClick={()=>setShowAddPayment(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/>Add Invoice</button></div>
        <div className="grid grid-cols-4 gap-3">{buckets.map(b=>{ const bItems=unpaid.filter(p=>agingBucket(daysOverdue(p.dueDate))===b.key); return (<div key={b.key} className={`rounded-2xl border ${b.border} ${b.bg} p-4 cursor-pointer transition-all ${buckF===b.key?"ring-2 ring-blue-400":""}`} onClick={()=>setBuckF(buckF===b.key?"all":b.key)}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${b.col}`}>{b.label}</p><p className={`text-xl font-black ${b.col}`}>{bItems.length}</p><p className="text-xs text-slate-500 mt-0.5">{bItems.length} invoices</p></div>); })}</div>
        <div className="flex gap-2 items-center flex-wrap"><select value={cf} onChange={e=>setCf(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="all">All Clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><span className="text-xs text-slate-400">{filtered.length} invoices</span></div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold"><tr><th className="px-6 py-4">Invoice</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Due Date</th><th className="px-6 py-4">Days Overdue</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length===0&&<tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">No unpaid invoices match filters.</td></tr>}
            {filtered.sort((a,b)=>daysOverdue(b.dueDate)-daysOverdue(a.dueDate)).map(p=>{ const days=daysOverdue(p.dueDate); const client=getClient(p.clientId); const eng=getEngagement(p.engagementId); const sp=getUser(eng.salesPersonId); return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4"><p className="font-medium text-sm text-slate-900 max-w-[200px] truncate">{p.description}</p>{p.autoGenerated&&<span className="text-[9px] text-indigo-500 flex items-center gap-0.5"><RefreshCw size={8}/>Auto-generated</span>}</td>
                <td className="px-6 py-4"><p className="text-sm text-slate-600">{client.name||"—"}</p><div className="flex items-center gap-1 mt-0.5"><WABtn phone={client.phone} code={client.countryCode} msg={`Hi ${client.contact?.split(" ")[0]}, a friendly reminder about invoice "${p.description}" of ${fmtCurrency(p.amount,p.currency)} due ${p.dueDate}.`}/><MailBtn email={client.email} subj={`Payment Reminder — ${p.description}`} body={`Hi ${client.contact?.split(" ")[0]},\n\nThis is a friendly reminder that the following invoice is outstanding:\n\n• ${p.description}\n• Amount: ${fmtCurrency(p.amount,p.currency)}\n• Due date: ${p.dueDate}\n\nPlease arrange payment at your earliest convenience.\n\nThank you`}/></div></td>
                <td className="px-6 py-4 font-bold text-slate-800">{fmtCurrency(p.amount,p.currency)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{p.dueDate}</td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${agingColor(days)}`}>{days>0?`${days}d overdue`:"Due soon"}</span></td>
                <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${PAY_STATUS[p.status]?.cls}`}><div className={`h-1.5 w-1.5 rounded-full ${PAY_STATUS[p.status]?.dot}`}/>{PAY_STATUS[p.status]?.label}</span></td>
                <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100"><button onClick={()=>setEditPayment({...p})} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit3 size={13}/></button><button onClick={()=>markPaid(p.id)} className="text-xs font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 px-2.5 py-1 rounded-lg">Mark Paid</button></div></td>
              </tr>
            );})}
          </tbody></table>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PAYMENTS
  // ══════════════════════════════════════════════════════════════════════════════
  const PaymentsView=()=>{
    const [sf,setSf]=useState("all"); const [cf,setCf]=useState("all"); const [repF,setRepF]=useState("all"); const [geoF,setGeoF]=useState("all"); const [monthF,setMonthF]=useState("all"); const [dateFrom,setDateFrom]=useState(""); const [dateTo,setDateTo]=useState(""); const [recurF,setRecurF]=useState("all");
    const yearMonths=useMemo(()=>[...new Set(payments.map(p=>p.month||p.dueDate?.slice(0,7)).filter(Boolean))].sort(),[]);
    const filtered=useMemo(()=>payments.filter(p=>{ const eng=getEngagement(p.engagementId); const client=getClient(p.clientId||eng.clientId); const sp=getUser(eng.salesPersonId); return(sf==="all"||p.status===sf)&&(cf==="all"||p.clientId===cf)&&(repF==="all"||sp?.id===repF)&&(geoF==="all"||client.country===geoF)&&(monthF==="all"||(p.month||p.dueDate?.slice(0,7))===monthF)&&(!dateFrom||p.dueDate>=dateFrom)&&(!dateTo||p.dueDate<=dateTo)&&(recurF==="all"||(recurF==="recurring"?p.recurring:!p.recurring)); }),[payments,sf,cf,repF,geoF,monthF,dateFrom,dateTo,recurF]);
    const hasFilter=sf!=="all"||cf!=="all"||repF!=="all"||geoF!=="all"||monthF!=="all"||dateFrom||dateTo||recurF!=="all";
    const exportData=filtered.map(p=>({Description:p.description,Client:getClient(p.clientId).name||"",Amount:p.amount,Currency:p.currency,DueDate:p.dueDate,PaidDate:p.paidDate||"",Status:p.status,Month:p.month||"",Recurring:p.recurring?"Yes":"No"}));
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3"><div><h1 className="text-2xl font-bold">Payments</h1><p className="text-slate-400 text-sm mt-0.5">Invoice tracking across all clients.</p></div><div className="flex gap-2"><button onClick={()=>exportCSV(exportData,"payments_export")} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Download size={13}/>Export</button><button onClick={()=>setShowAddPayment(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/>Add Invoice</button></div></div>
        <div className="grid grid-cols-3 gap-4">{[{l:"Received",v:filtered.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amount,0),col:"text-emerald-600"},{l:"Pending",v:filtered.filter(p=>p.status==="pending").reduce((s,p)=>s+p.amount,0),col:"text-amber-600"},{l:"Overdue",v:filtered.filter(p=>p.status==="overdue").reduce((s,p)=>s+p.amount,0),col:"text-rose-600"}].map((s,i)=><div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center"><p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.l}</p><p className={`text-xl font-bold mt-1 ${s.col}`}>{s.v.toLocaleString()}</p></div>)}</div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Filter size={13}/>Filters {hasFilter&&<button onClick={()=>{setSf("all");setCf("all");setRepF("all");setGeoF("all");setMonthF("all");setDateFrom("");setDateTo("");setRecurF("all");}} className="text-rose-400 hover:text-rose-600 ml-auto">Clear all</button>}</div>
          <div className="flex flex-wrap gap-2">{[{val:sf,set:setSf,opts:[["all","All Statuses"],["paid","Paid"],["pending","Pending"],["overdue","Overdue"]]},{val:cf,set:setCf,opts:[["all","All Clients"],...clients.map(c=>[c.id,c.name])]},{val:repF,set:setRepF,opts:[["all","All Reps"],...users.filter(u=>u.role==="sales").map(u=>[u.id,u.name])]},{val:geoF,set:setGeoF,opts:[["all","All Countries"],...COUNTRIES.map(c=>[c,c])]},{val:monthF,set:setMonthF,opts:[["all","All Months"],...yearMonths.map(m=>[m,m])]},{val:recurF,set:setRecurF,opts:[["all","All Types"],["recurring","Recurring"],["one_time","One-Time"]]}].map((f,i)=><select key={i} value={f.val} onChange={e=>f.set(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">{f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>)}</div>
          <div className="flex flex-wrap gap-2 items-center"><CalendarRange size={13} className="text-slate-400"/><span className="text-xs text-slate-500">Date range:</span><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"/><span className="text-xs text-slate-400">to</span><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"/><span className="text-xs text-slate-400 ml-auto">{filtered.length} invoices</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold"><tr><th className="px-6 py-4">Description</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Due Date</th><th className="px-6 py-4">Paid</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length===0&&<tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">No payments match filters.</td></tr>}
            {filtered.map(p=>{ const cfg=PAY_STATUS[p.status]; return (
              <tr key={p.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4"><div className="flex items-center gap-2"><p className="font-medium text-sm text-slate-900 max-w-[180px] truncate">{p.description}</p>{p.recurring&&<RecurringBadge/>}</div></td>
                <td className="px-6 py-4 text-sm text-slate-600">{getClient(p.clientId).name||"—"}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{fmtCurrency(p.amount,p.currency)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{p.dueDate}</td>
                <td className="px-6 py-4 text-sm text-emerald-600">{p.paidDate||"—"}</td>
                <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.cls}`}><div className={`h-1.5 w-1.5 rounded-full ${cfg?.dot}`}/>{cfg?.label}</span></td>
                <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100"><button onClick={()=>setEditPayment({...p})} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit3 size={13}/></button>{p.status!=="paid"&&<button onClick={()=>markPaid(p.id)} className="text-xs font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 px-2.5 py-1 rounded-lg">Mark Paid</button>}{p.status==="pending"&&<button onClick={()=>markOverdue(p.id)} className="text-xs font-semibold text-rose-500 border border-rose-200 bg-rose-50 px-2.5 py-1 rounded-lg ml-1">Overdue</button>}</div></td>
              </tr>
            );})}
          </tbody></table>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // COMMISSIONS / TASKS / TEAM / PROFILE — compact
  // ══════════════════════════════════════════════════════════════════════════════
  const CommissionsView=()=>{ const commData=users.filter(u=>u.commissionRate>0).map(u=>{ const paidPays=payments.filter(p=>{ const eng=getEngagement(p.engagementId); return p.status==="paid"&&eng.salesPersonId===u.id; }); const wonLeads=leads.filter(l=>l.salesPersonId===u.id&&l.status==="closed_won"); return { rep:u,paidPays,wonLeads,totalInflow:paidPays.reduce((s,p)=>s+p.amount,0),commission:paidPays.reduce((s,p)=>s+p.amount,0)*u.commissionRate/100 }; }).sort((a,b)=>b.commission-a.commission); const grand=commData.reduce((s,d)=>s+d.commission,0);
    return (<div className="space-y-6"><div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Commissions</h1><div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-2.5 text-center"><p className="text-xs text-indigo-400 font-medium uppercase">Total Owed</p><p className="text-2xl font-bold text-indigo-700">{grand.toLocaleString()}</p></div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{commData.map(({rep:u,wonLeads,totalInflow,commission})=>(
      <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Avatar user={u} size="lg"/><div><p className="font-bold">{u.name}</p><p className="text-xs text-slate-400">{u.designation}</p></div></div><div className="text-right"><p className="text-xs text-slate-400">Rate</p><p className="text-2xl font-black text-indigo-600">{u.commissionRate}%</p></div></div>
      <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 rounded-xl p-3"><div><p className="text-[10px] text-slate-400 uppercase">Won</p><p className="font-bold">{wonLeads.length}</p></div><div><p className="text-[10px] text-slate-400 uppercase">Payments In</p><p className="font-bold text-emerald-600">{totalInflow.toLocaleString()}</p></div><div><p className="text-[10px] text-slate-400 uppercase">Commission</p><p className="font-bold text-indigo-700">{Math.round(commission).toLocaleString()}</p></div></div>
    </div>))}</div></div>); };

  const TasksView=()=>{ const EMOJI={call:"📞",demo:"💻",proposal:"📄",contract:"✍️",email:"✉️",meeting:"👥",review:"🔍"}; const pending=tasks.filter(t=>!t.completed),done=tasks.filter(t=>t.completed);
    const Row=({t})=>{ const u=getUser(t.assignedTo); const lead=leads.find(l=>l.id===t.leadId); const proj=projects.find(p=>p.id===t.projectId); const waMsg=`Hi ${u?.name?.split(" ")[0]||""}, reminder: "${t.title}" is due ${t.dueDate}. Please update.`; return (
      <div className={`flex items-center gap-4 px-6 py-4 group ${t.completed?"opacity-50":""}`}><button onClick={()=>toggleTask(t.id)} className={`shrink-0 ${t.completed?"text-emerald-500":"text-slate-200 hover:text-emerald-400"}`}><CheckCircle2 size={20}/></button><span className="text-lg shrink-0">{EMOJI[t.type]||"📌"}</span><div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${t.completed?"line-through text-slate-400":"text-slate-800"}`}>{t.title}</p><p className="text-xs text-slate-400">{lead?.company||proj?.name||"General"} · Due {t.dueDate||"No date"}</p></div><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIO_COL[t.priority]} shrink-0`}>{t.priority}</span><div className="flex items-center gap-1 shrink-0"><Avatar user={u} size="sm"/>{!t.completed&&<><WABtn phone={u?.phone} code={u?.countryCode} msg={waMsg}/><MailBtn email={u?.email} subj={`Reminder: ${t.title}`} body={waMsg}/></>}</div><button onClick={()=>deleteTask(t.id)} className="text-slate-200 group-hover:text-slate-300 hover:text-rose-400 shrink-0"><X size={13}/></button></div>
    );};
    return (<div className="space-y-6"><div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Tasks</h1><button onClick={()=>setShowAddTask(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><Plus size={13}/>Add Task</button></div>
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><span className="text-sm font-semibold text-slate-600">Pending</span><span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">{pending.length}</span></div><div className="divide-y divide-slate-100">{pending.length===0&&<p className="px-6 py-10 text-center text-slate-400 text-sm">All caught up!</p>}{pending.map(t=><Row key={t.id} t={t}/>)}</div></div>
    {done.length>0&&<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><span className="text-sm font-semibold text-slate-600">Completed</span><span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">{done.length}</span></div><div className="divide-y divide-slate-100">{done.map(t=><Row key={t.id} t={t}/>)}</div></div>}
    </div>); };

  const TeamView=()=>(<div className="space-y-6"><h1 className="text-2xl font-bold">Team Overview</h1>
    <div className="bg-white rounded-2xl border border-slate-200 p-6"><h2 className="font-bold mb-4 flex items-center gap-2"><Globe size={16}/>Territory Coverage</h2><div className="flex flex-wrap gap-3">{COUNTRIES.map(c=>{ const assigned=users.filter(u=>u.territories.includes(c)); return (<div key={c} className="border border-slate-200 rounded-xl p-3.5 min-w-[140px]"><p className="text-sm font-semibold flex items-center gap-1 mb-2"><MapPin size={11} className="text-slate-400"/>{c}</p>{assigned.length===0?<span className="text-xs text-slate-400 italic">Unassigned</span>:<div className="flex flex-wrap gap-1">{assigned.map(u=><span key={u.id} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">{u.name.split(" ")[0]}<WABtn phone={u.phone} code={u.countryCode} msg={`Hi!`}/></span>)}</div>}</div>); })}</div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{users.map(u=>{ const myProjs=projects.filter(p=>p.assignedTo.includes(u.id)); const myTasks=tasks.filter(t=>t.assignedTo===u.id&&!t.completed); return (<div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="flex items-center gap-3 mb-3"><Avatar user={u} size="lg"/><div className="flex-1 min-w-0"><p className="font-bold">{u.name}</p><RoleBadge role={u.role}/><p className="text-xs text-slate-400 mt-0.5">{u.designation}</p></div><div className="flex gap-1"><WABtn phone={u.phone} code={u.countryCode} msg={`Hi ${u.name.split(" ")[0]}!`} size="md"/><MailBtn email={u.email} subj="Hello" body={`Hi ${u.name.split(" ")[0]},`} size="md"/></div></div><div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-xl p-3"><div><p className="text-[10px] text-slate-400 uppercase">Projects</p><p className="font-bold">{myProjs.length}</p></div><div><p className="text-[10px] text-slate-400 uppercase">Open Tasks</p><p className="font-bold">{myTasks.length}</p></div><div><p className="text-[10px] text-slate-400 uppercase">Rate</p><p className="font-bold text-indigo-600">{u.commissionRate>0?`${u.commissionRate}%`:"—"}</p></div></div></div>); })}</div>
  </div>);

  const ProfileView=()=>{ const [d,setD]=useState({...currentUser}); const [showPw,setShowPw]=useState(false); const save=()=>{ updateUsers(p=>p.map(u=>u.id===d.id?{...d}:u)); setCU({...d}); };
    return (<div className="max-w-xl space-y-6"><div><h1 className="text-2xl font-bold">My Profile</h1><p className="text-slate-400 text-sm mt-0.5">Update your personal details and password.</p></div>
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"><div className="flex items-center gap-4 pb-4 border-b border-slate-100"><Avatar user={d} size="lg"/><div><p className="font-bold">{d.name}</p><RoleBadge role={d.role}/></div></div>
    <div className="grid grid-cols-2 gap-4"><Fld label="Full Name"><input value={d.name} onChange={e=>setD({...d,name:e.target.value})} className={IC}/></Fld><Fld label="Designation"><input value={d.designation||""} onChange={e=>setD({...d,designation:e.target.value})} className={IC}/></Fld></div>
    <Fld label="Email"><input value={d.email} onChange={e=>setD({...d,email:e.target.value})} className={IC}/></Fld>
    <Fld label="Phone"><PhoneInput code={d.countryCode||"+65"} phone={d.phone||""} onCode={v=>setD({...d,countryCode:v})} onPhone={v=>setD({...d,phone:v})}/></Fld>
    <Fld label="Password"><div className="relative"><input type={showPw?"text":"password"} value={d.password} onChange={e=>setD({...d,password:e.target.value})} className={IC+" pr-10"}/><button onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw?<EyeOff size={14}/>:<Eye size={14}/>}</button></div></Fld>
    <button onClick={save} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-md">Save Changes</button></div></div>); };

  // ══════════════════════════════════════════════════════════════════════════════
  // ADD LEAD WIZARD (3-step)
  // ══════════════════════════════════════════════════════════════════════════════
  // AddLeadWizard moved outside App — see below main export

  // ══════════════════════════════════════════════════════════════════════════════
  // EXCEL IMPORT
  // ══════════════════════════════════════════════════════════════════════════════
  const ImportModal=()=>{
    const [rows,setRows]=useState(null); const [importing,setImporting]=useState(false); const [done,setDone]=useState(false); const fileRef=useRef();
    const parseFile=async(file)=>{
      const ext=file.name.split(".").pop().toLowerCase();
      if(ext==="csv"){
        const text=await file.text();
        const lines=text.split("\n").filter(l=>l.trim());
        const headers=lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
        const parsed=lines.slice(1).map(line=>{ const vals=line.split(",").map(v=>v.trim().replace(/^"|"$/g,"")); const obj={}; headers.forEach((h,i)=>obj[h]=vals[i]||""); return obj; }).filter(r=>r.Name||r.name||r.Company||r.company);
        setRows(parsed);
      } else {
        // Load SheetJS
        const script=document.createElement("script"); script.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(script);
        script.onload=()=>{
          const reader=new FileReader(); reader.onload=e=>{ const wb=window.XLSX.read(e.target.result,{type:"binary"}); const ws=wb.Sheets[wb.SheetNames[0]]; const data=window.XLSX.utils.sheet_to_json(ws); setRows(data); }; reader.readAsBinaryString(file);
        };
      }
    };
    const doImport=()=>{ if(!rows)return; setImporting(true);
      const mapped=rows.map(r=>({ id:genId("l"), name:r.Name||r.name||r["Contact Name"]||"", company:r.Company||r.company||"", division:r.Division||r.division||"", email:r.Email||r.email||"", phone:r.Phone||r.phone||"", countryCode:r.CountryCode||r["Country Code"]||"+65", country:r.Country||r.country||"Singapore", status:"open", value:Number(r.Value||r.value||r["Deal Value"]||0), currency:r.Currency||r.currency||defaultCurrency(r.Country||r.country||"Singapore"), salesPersonId:users.find(u=>u.name===(r.SalesPerson||r["Sales Person"]||""))?.id||"", source:r.Source||r.source||"Inbound", notes:r.Notes||r.notes||"", services:r.Services?r.Services.split(";").map(s=>s.trim()):[], dealType:r.DealType||r["Deal Type"]||"one_time", recurringMonthlyValue:Number(r.RecurringMonthly||0), createdAt:today, aiScore:null, aiNote:null })).filter(r=>r.name&&r.company);
      setLeads(p=>[...p,...mapped]); setImporting(false); setDone(true);
    };
    return (
      <Modal title="Import Leads from Excel / CSV" onClose={()=>{setShowImport(false);setRows(null);setDone(false);}} onSave={rows&&!done?doImport:()=>setShowImport(false)} saveLabel={done?"Done":rows?"Import "+rows.length+" Leads":"Waiting for file…"} wide>
        {!done&&<>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Supported columns (case-insensitive):</p>
            <p className="text-xs font-mono text-blue-700">Name, Company, Division, Email, Phone, CountryCode, Country, Value, Currency, Source, SalesPerson, Services (semicolon-separated), Notes, DealType, RecurringMonthly</p>
          </div>
          <div onClick={()=>fileRef.current?.click()} className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-10 text-center cursor-pointer transition-colors group">
            <Upload size={32} className="mx-auto text-slate-300 group-hover:text-blue-400 mb-3 transition-colors"/>
            <p className="font-semibold text-slate-600 group-hover:text-blue-600">Click to upload Excel (.xlsx) or CSV</p>
            <p className="text-xs text-slate-400 mt-1">or drag and drop your file here</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{ if(e.target.files?.[0])parseFile(e.target.files[0]); }}/>
          </div>
          {rows&&<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><p className="text-sm font-semibold text-emerald-800">✓ {rows.length} rows detected. Preview (first 3):</p><div className="mt-2 space-y-1">{rows.slice(0,3).map((r,i)=><p key={i} className="text-xs font-mono text-emerald-700 truncate">{JSON.stringify(r).slice(0,120)}…</p>)}</div></div>}
        </>}
        {done&&<div className="text-center py-8"><div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCheck size={32} className="text-emerald-600"/></div><p className="text-xl font-bold text-slate-800">Import Complete!</p><p className="text-slate-500 mt-1">{rows?.length} leads have been added to your CRM.</p></div>}
      </Modal>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // LEAD DRAWER
  // ══════════════════════════════════════════════════════════════════════════════
  const LeadDrawer=()=>{ if(!selLead)return null; const lead=leads.find(l=>l.id===selLead.id)||selLead; const sp=getUser(lead.salesPersonId); const estComm=lead.value*(sp?.commissionRate||0)/100;
    return (<div className="fixed inset-0 z-50 flex justify-end"><div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={()=>setSelLead(null)}/><div className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto"><div className="p-7 space-y-5">
      <div className="flex justify-between items-start"><div><Badge cfg={LEAD_STATUS[lead.status]}/><h2 className="text-2xl font-bold mt-2">{lead.name}</h2><div className="flex items-center gap-2 mt-1"><p className="text-slate-500 text-sm">{lead.company}{lead.division?<span className="ml-1 text-xs bg-slate-100 px-2 py-0.5 rounded">{lead.division}</span>:""}</p></div><p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10}/>{lead.country}</p></div><button onClick={()=>setSelLead(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={18}/></button></div>
      {(lead.services||[]).length>0&&<div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Tag size={10}/>Services</p><div className="flex flex-wrap gap-1.5">{(lead.services||[]).map(s=><ServiceTag key={s} s={s}/>)}</div></div>}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2"><div className="flex items-center gap-2"><Mail size={13} className="text-slate-400"/><span className="text-sm">{lead.email}</span><MailBtn email={lead.email} subj={`Follow up — ${lead.company}`} body={`Hi ${lead.name.split(" ")[0]},\n\nFollowing up.\n\nBest,`}/></div><div className="flex items-center gap-2"><Phone size={13} className="text-slate-400"/><span className="text-sm">{lead.countryCode} {lead.phone}</span><WABtn phone={lead.phone} code={lead.countryCode} msg={`Hi ${lead.name.split(" ")[0]}, following up from Nexus on digital services for ${lead.company}.`} size="md"/></div></div>
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5"><div className="flex justify-between items-center mb-3"><h3 className="text-sm font-bold text-violet-800 flex items-center gap-2"><Sparkles size={13}/>AI Lead Score</h3><button onClick={()=>scoreLead(lead.id)} className="text-xs text-violet-600 font-semibold border border-violet-300 bg-white px-2.5 py-1 rounded-lg flex items-center gap-1"><Zap size={10}/>{lead.aiScore!=null?"Rescore":"Score Now"}</button></div>{lead.aiScore===null?<p className="text-sm text-violet-500">Click Score Now for an AI-powered close probability.</p>:lead.aiScore===-1?<div className="flex items-center gap-2 text-violet-600 text-sm"><div className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin"/>Analysing…</div>:<><div className="flex items-center gap-4 mb-2"><span className={`text-4xl font-black ${lead.aiScore>=70?"text-emerald-600":lead.aiScore>=40?"text-amber-600":"text-rose-600"}`}>{lead.aiScore}<span className="text-sm font-normal text-slate-400">/100</span></span><div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${lead.aiScore>=70?"bg-emerald-500":lead.aiScore>=40?"bg-amber-500":"bg-rose-500"}`} style={{width:`${lead.aiScore}%`}}/></div></div>{lead.aiNote&&<p className="text-sm text-violet-700 italic border-t border-violet-200 pt-2">"{lead.aiNote}"</p>}</>}</div>
      <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">{[["Deal Value",fmtCurrency(lead.value,lead.currency),"font-bold"],["Deal Type",lead.dealType==="recurring"?"Recurring / Retainer":"One-Time","text-slate-700"],[lead.dealType==="recurring"?"Monthly Value":"",lead.recurringMonthlyValue?fmtCurrency(lead.recurringMonthlyValue,lead.currency):"","text-indigo-600"],["Sales Rep",sp?.name||"—","font-semibold"],["Commission Rate",sp?`${sp.commissionRate}%`:"—","text-slate-700"],["Est. Commission",`${fmtCurrency(Math.round(estComm),lead.currency)}`,"font-bold text-indigo-600"],["Created",lead.createdAt,"text-slate-600"]].filter(([k])=>k).map(([k,v,vc])=><div key={k} className="flex justify-between"><span className="text-sm text-slate-500">{k}</span><span className={`text-sm ${vc}`}>{v}</span></div>)}</div>
      <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Move to Stage</p><div className="grid grid-cols-2 gap-2">{Object.entries(LEAD_STATUS).map(([k,s])=><button key={k} onClick={()=>updateLeadStatus(lead.id,k)} className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${lead.status===k?"bg-blue-600 border-blue-600 text-white shadow":"border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"}`}>{s.label}</button>)}</div></div>
      {lead.notes&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-xs font-bold text-amber-600 uppercase mb-1">Notes</p><p className="text-sm text-amber-800">{lead.notes}</p></div>}
    </div></div></div>); };

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-2 mb-8"><div className="bg-blue-600 p-2 rounded-xl text-white"><Target size={20}/></div><span className="text-lg font-black tracking-tight">NexusCRM</span>{isSA(currentUser)&&<Crown size={14} className="text-yellow-500 ml-auto"/>}</div>
        <nav className="space-y-1 flex-1">{NAV.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab===n.id?"bg-blue-600 text-white shadow-md":"text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}><n.icon size={16}/>{n.label}{n.badge&&<span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{n.badge}</span>}</button>)}</nav>
        <div className="mt-6 pt-5 border-t border-slate-100"><div className="flex items-center gap-3 px-2"><Avatar user={currentUser} size="md"/><div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{currentUser.name}</p><RoleBadge role={currentUser.role}/></div><button onClick={()=>setCU(null)} title="Sign out" className="text-slate-400 hover:text-slate-700"><LogOut size={15}/></button></div></div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm border-none focus:ring-2 focus:ring-blue-500 focus:outline-none w-60"/></div>
          <div className="flex items-center gap-3">
            {allowedTabs.includes("tasks")&&<button onClick={()=>setShowAddTask(true)} className="text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"><CheckSquare size={14}/>Task</button>}
            {allowedTabs.includes("leads")&&<button onClick={()=>setShowAddLead(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"><Plus size={14}/>New Lead</button>}
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {tab==="dashboard"   &&<DashboardView/>}
          {tab==="users"       &&<UsersView/>}
          {tab==="leads"       &&<LeadsView/>}
          {tab==="engagements" &&<EngagementsView/>}
          {tab==="invoices"    &&<InvoicesView/>}
          {tab==="payments"    &&<PaymentsView/>}
          {tab==="commissions" &&<CommissionsView/>}
          {tab==="tasks"       &&<TasksView/>}
          {tab==="team"        &&<TeamView/>}
          {tab==="profile"     &&<ProfileView/>}
        </div>
      </main>
      <LeadDrawer/>
      {showAddLead&&<AddLeadWizard nLead={nLead} setNL={setNL} onClose={()=>setShowAddLead(false)} onSave={addLead} users={users} isAdmin={isAdmin}/>}
      {showImport&&<ImportModal/>}

      {/* Add User */}
      {showAddUser&&<Modal title="Add User" onClose={()=>setShowAddUser(false)} onSave={addUser} wide>
        <div className="grid grid-cols-2 gap-4"><Fld label="Full Name"><input value={nUser.name} onChange={e=>setNU({...nUser,name:e.target.value})} className={IC} placeholder="Jane Smith"/></Fld><Fld label="Email"><input value={nUser.email} onChange={e=>setNU({...nUser,email:e.target.value})} className={IC}/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Password"><input value={nUser.password} onChange={e=>setNU({...nUser,password:e.target.value})} className={IC}/></Fld><Fld label="Designation"><input value={nUser.designation} onChange={e=>setNU({...nUser,designation:e.target.value})} className={IC}/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Role"><select value={nUser.role} onChange={e=>setNU({...nUser,role:e.target.value})} className={IC}>{Object.entries(ROLES).filter(([k])=>isSA(currentUser)||k!=="super_admin").map(([k,r])=><option key={k} value={k}>{r.label}</option>)}</select></Fld><Fld label="Commission %"><input type="number" value={nUser.commissionRate} onChange={e=>setNU({...nUser,commissionRate:e.target.value})} className={IC} min="0" max="50"/></Fld></div>
        <Fld label="Phone"><PhoneInput code={nUser.countryCode} phone={nUser.phone} onCode={v=>setNU({...nUser,countryCode:v})} onPhone={v=>setNU({...nUser,phone:v})}/></Fld>
        <Fld label="Territories"><div className="grid grid-cols-2 gap-2 mt-1">{COUNTRIES.map(c=><label key={c} className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={nUser.territories.includes(c)} onChange={ev=>setNU({...nUser,territories:ev.target.checked?[...nUser.territories,c]:nUser.territories.filter(t=>t!==c)})} className="rounded"/>{c}</label>)}</div></Fld>
      </Modal>}
      {editUser&&<Modal title="Edit User" onClose={()=>setEditUser(null)} onSave={saveEditUser} saveLabel="Save Changes" wide>
        <div className="grid grid-cols-2 gap-4"><Fld label="Full Name"><input value={editUser.name} onChange={e=>setEditUser({...editUser,name:e.target.value})} className={IC}/></Fld><Fld label="Email"><input value={editUser.email} onChange={e=>setEditUser({...editUser,email:e.target.value})} className={IC}/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Password"><input value={editUser.password} onChange={e=>setEditUser({...editUser,password:e.target.value})} className={IC}/></Fld><Fld label="Designation"><input value={editUser.designation||""} onChange={e=>setEditUser({...editUser,designation:e.target.value})} className={IC}/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Role"><select value={editUser.role} onChange={e=>setEditUser({...editUser,role:e.target.value})} className={IC}>{Object.entries(ROLES).filter(([k])=>isSA(currentUser)||k!=="super_admin").map(([k,r])=><option key={k} value={k}>{r.label}</option>)}</select></Fld><Fld label="Commission %"><input type="number" value={editUser.commissionRate} onChange={e=>setEditUser({...editUser,commissionRate:e.target.value})} className={IC} min="0" max="50"/></Fld></div>
        <Fld label="Phone"><PhoneInput code={editUser.countryCode||"+65"} phone={editUser.phone||""} onCode={v=>setEditUser({...editUser,countryCode:v})} onPhone={v=>setEditUser({...editUser,phone:v})}/></Fld>
        <Fld label="Territories"><div className="grid grid-cols-2 gap-2 mt-1">{COUNTRIES.map(c=><label key={c} className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={(editUser.territories||[]).includes(c)} onChange={ev=>setEditUser({...editUser,territories:ev.target.checked?[...(editUser.territories||[]),c]:(editUser.territories||[]).filter(t=>t!==c)})} className="rounded"/>{c}</label>)}</div></Fld>
      </Modal>}

      {/* Add/Edit Engagement */}
      {showAddEng&&<Modal title="New Engagement" onClose={()=>setShowAddEng(false)} onSave={addEng} wide>
        <div className="grid grid-cols-2 gap-4"><Fld label="Client"><select value={nEng.clientId} onChange={e=>setNE({...nEng,clientId:e.target.value})} className={IC}><option value="">Select…</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}</select></Fld><Fld label="Engagement Name"><input value={nEng.name} onChange={e=>setNE({...nEng,name:e.target.value})} className={IC} placeholder="e.g. Digital Transformation 2024"/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Sales Person"><select value={nEng.salesPersonId} onChange={e=>setNE({...nEng,salesPersonId:e.target.value})} className={IC}><option value="">Select…</option>{users.filter(u=>u.role==="sales"||isAdmin({role:u.role})).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Fld><Fld label="Project Manager"><select value={nEng.pmId} onChange={e=>setNE({...nEng,pmId:e.target.value})} className={IC}><option value="">Select…</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Total Value"><CurrencyInput value={nEng.value} currency={nEng.currency} onValue={v=>setNE({...nEng,value:v})} onCurrency={v=>setNE({...nEng,currency:v})}/></Fld><Fld label="Start Date"><input type="date" value={nEng.startDate} onChange={e=>setNE({...nEng,startDate:e.target.value})} className={IC}/></Fld></div>
        <Fld label="Notes"><textarea value={nEng.notes} onChange={e=>setNE({...nEng,notes:e.target.value})} className={IC+" h-16 resize-none"}/></Fld>
      </Modal>}
      {editEng&&<Modal title="Edit Engagement" onClose={()=>setEditEng(null)} onSave={saveEng} saveLabel="Save Changes" wide>
        <div className="grid grid-cols-2 gap-4"><Fld label="Client"><select value={editEng.clientId} onChange={e=>setEditEng({...editEng,clientId:e.target.value})} className={IC}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Fld><Fld label="Engagement Name"><input value={editEng.name} onChange={e=>setEditEng({...editEng,name:e.target.value})} className={IC}/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Sales Person"><select value={editEng.salesPersonId} onChange={e=>setEditEng({...editEng,salesPersonId:e.target.value})} className={IC}>{users.filter(u=>u.role==="sales"||isAdmin({role:u.role})).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Fld><Fld label="Project Manager"><select value={editEng.pmId} onChange={e=>setEditEng({...editEng,pmId:e.target.value})} className={IC}>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Total Value"><CurrencyInput value={editEng.value} currency={editEng.currency||"USD"} onValue={v=>setEditEng({...editEng,value:v})} onCurrency={v=>setEditEng({...editEng,currency:v})}/></Fld><Fld label="Status"><select value={editEng.status} onChange={e=>setEditEng({...editEng,status:e.target.value})} className={IC}>{Object.keys(ENG_STATUS).map(k=><option key={k} value={k}>{ENG_STATUS[k].label}</option>)}</select></Fld></div>
        <Fld label="Notes"><textarea value={editEng.notes} onChange={e=>setEditEng({...editEng,notes:e.target.value})} className={IC+" h-16 resize-none"}/></Fld>
      </Modal>}

      {/* Add/Edit Project */}
      {showAddProj&&<Modal title="Add Sub-Project" onClose={()=>setShowAddProj(false)} onSave={addProj} wide>
        <div className="grid grid-cols-2 gap-4"><Fld label="Engagement"><select value={nProj.engagementId} onChange={e=>setNP({...nProj,engagementId:e.target.value})} className={IC}><option value="">Select…</option>{engagements.map(e=><option key={e.id} value={e.id}>{getClient(e.clientId).name} — {e.name}</option>)}</select></Fld><Fld label="Project Name"><input value={nProj.name} onChange={e=>setNP({...nProj,name:e.target.value})} className={IC} placeholder="e.g. Website Redesign"/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Type"><select value={nProj.type} onChange={e=>setNP({...nProj,type:e.target.value})} className={IC}>{PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Fld><Fld label="Value"><CurrencyInput value={nProj.value} currency={nProj.currency} onValue={v=>setNP({...nProj,value:v})} onCurrency={v=>setNP({...nProj,currency:v})}/></Fld></div>
        <Fld label="Recurring Monthly Invoice?">
          <div className="flex items-center gap-3 mt-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={nProj.recurring} onChange={e=>setNP({...nProj,recurring:e.target.checked})} className="rounded accent-blue-600"/><span className="text-sm text-slate-700">Yes — auto-generate monthly invoice</span></label></div>
          {nProj.recurring&&<div className="mt-3 grid grid-cols-2 gap-3"><Fld label="Monthly Amount"><CurrencyInput value={nProj.recurringAmount} currency={nProj.currency} onValue={v=>setNP({...nProj,recurringAmount:v})} onCurrency={v=>setNP({...nProj,currency:v})}/></Fld><Fld label="Invoice Day of Month"><input type="number" min="1" max="28" value={nProj.recurringDay} onChange={e=>setNP({...nProj,recurringDay:Number(e.target.value)})} className={IC}/></Fld></div>}
        </Fld>
        <Fld label="Assigned Team Members"><div className="grid grid-cols-2 gap-2 mt-1">{users.map(u=><label key={u.id} className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={(nProj.assignedTo||[]).includes(u.id)} onChange={ev=>setNP({...nProj,assignedTo:ev.target.checked?[...(nProj.assignedTo||[]),u.id]:(nProj.assignedTo||[]).filter(i=>i!==u.id)})} className="rounded"/><Avatar user={u} size="sm"/>{u.name}</label>)}</div></Fld>
        <Fld label="Notes"><input value={nProj.notes} onChange={e=>setNP({...nProj,notes:e.target.value})} className={IC}/></Fld>
      </Modal>}
      {editProj&&<Modal title="Edit Project" onClose={()=>setEditProj(null)} onSave={saveProj} saveLabel="Save Changes" wide>
        <div className="grid grid-cols-2 gap-4"><Fld label="Project Name"><input value={editProj.name} onChange={e=>setEditProj({...editProj,name:e.target.value})} className={IC}/></Fld><Fld label="Type"><select value={editProj.type} onChange={e=>setEditProj({...editProj,type:e.target.value})} className={IC}>{PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Value"><CurrencyInput value={editProj.value} currency={editProj.currency||"USD"} onValue={v=>setEditProj({...editProj,value:v})} onCurrency={v=>setEditProj({...editProj,currency:v})}/></Fld><Fld label="Status"><select value={editProj.status} onChange={e=>setEditProj({...editProj,status:e.target.value})} className={IC}>{Object.keys(ENG_STATUS).map(k=><option key={k} value={k}>{ENG_STATUS[k].label}</option>)}</select></Fld></div>
        <Fld label="Recurring?"><div className="flex items-center gap-3 mt-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editProj.recurring||false} onChange={e=>setEditProj({...editProj,recurring:e.target.checked})} className="rounded accent-blue-600"/><span className="text-sm text-slate-700">Auto-generate monthly invoice</span></label></div>{editProj.recurring&&<div className="mt-3 grid grid-cols-2 gap-3"><Fld label="Monthly Amount"><CurrencyInput value={editProj.recurringAmount||""} currency={editProj.currency||"USD"} onValue={v=>setEditProj({...editProj,recurringAmount:v})} onCurrency={v=>setEditProj({...editProj,currency:v})}/></Fld><Fld label="Day"><input type="number" min="1" max="28" value={editProj.recurringDay||1} onChange={e=>setEditProj({...editProj,recurringDay:Number(e.target.value)})} className={IC}/></Fld></div>}</Fld>
        <Fld label="Assigned Team"><div className="grid grid-cols-2 gap-2 mt-1">{users.map(u=><label key={u.id} className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={(editProj.assignedTo||[]).includes(u.id)} onChange={ev=>setEditProj({...editProj,assignedTo:ev.target.checked?[...(editProj.assignedTo||[]),u.id]:(editProj.assignedTo||[]).filter(i=>i!==u.id)})} className="rounded"/><Avatar user={u} size="sm"/>{u.name}</label>)}</div></Fld>
        <Fld label="Notes"><input value={editProj.notes||""} onChange={e=>setEditProj({...editProj,notes:e.target.value})} className={IC}/></Fld>
      </Modal>}

      {/* Add Payment */}
      {showAddPayment&&<Modal title="Add Invoice / Payment" onClose={()=>setShowAddPayment(false)} onSave={addPayment} wide>
        <Fld label="Description"><input value={nPayment.description} onChange={e=>setNPy({...nPayment,description:e.target.value})} className={IC} placeholder="e.g. Website Redesign — Phase 1"/></Fld>
        <div className="grid grid-cols-2 gap-4"><Fld label="Client"><select value={nPayment.clientId} onChange={e=>setNPy({...nPayment,clientId:e.target.value})} className={IC}><option value="">Select…</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Fld><Fld label="Engagement"><select value={nPayment.engagementId} onChange={e=>setNPy({...nPayment,engagementId:e.target.value})} className={IC}><option value="">Select…</option>{engagements.filter(e=>!nPayment.clientId||e.clientId===nPayment.clientId).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Amount"><CurrencyInput value={nPayment.amount} currency={nPayment.currency} onValue={v=>setNPy({...nPayment,amount:v})} onCurrency={v=>setNPy({...nPayment,currency:v})}/></Fld><Fld label="Due Date"><input type="date" value={nPayment.dueDate} onChange={e=>setNPy({...nPayment,dueDate:e.target.value,month:e.target.value.slice(0,7)})} className={IC}/></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Status"><select value={nPayment.status} onChange={e=>setNPy({...nPayment,status:e.target.value})} className={IC}><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></Fld><Fld label="Recurring?"><div className="flex items-center gap-2 mt-2.5"><input type="checkbox" checked={nPayment.recurring} onChange={e=>setNPy({...nPayment,recurring:e.target.checked})} className="rounded accent-blue-600"/><span className="text-sm text-slate-700">This is a recurring monthly invoice</span></div></Fld></div>
      </Modal>}

      {/* Add Task */}
      {showAddTask&&<Modal title="Add Task" onClose={()=>setShowAddTask(false)} onSave={addTask}>
        <Fld label="Title"><input value={nTask.title} onChange={e=>setNT({...nTask,title:e.target.value})} className={IC} placeholder="e.g. Follow-up call…"/></Fld>
        <div className="grid grid-cols-2 gap-4"><Fld label="Due Date"><input type="date" value={nTask.dueDate} onChange={e=>setNT({...nTask,dueDate:e.target.value})} className={IC}/></Fld><Fld label="Priority"><select value={nTask.priority} onChange={e=>setNT({...nTask,priority:e.target.value})} className={IC}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Type"><select value={nTask.type} onChange={e=>setNT({...nTask,type:e.target.value})} className={IC}>{TASK_TYPES.map(t=><option key={t}>{t}</option>)}</select></Fld><Fld label="Assigned To"><select value={nTask.assignedTo} onChange={e=>setNT({...nTask,assignedTo:e.target.value})} className={IC}><option value="">Select…</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></Fld></div>
        <div className="grid grid-cols-2 gap-4"><Fld label="Linked Lead"><select value={nTask.leadId} onChange={e=>setNT({...nTask,leadId:e.target.value})} className={IC}><option value="">None</option>{leads.map(l=><option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}</select></Fld><Fld label="Linked Project"><select value={nTask.projectId} onChange={e=>setNT({...nTask,projectId:e.target.value})} className={IC}><option value="">None</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Fld></div>
      </Modal>}

      {/* Edit Payment */}
      {editPayment&&<Modal title="Edit Payment / Invoice" onClose={()=>setEditPayment(null)} onSave={saveEditPayment} saveLabel="Save Changes" wide>
        <Fld label="Description"><input value={editPayment.description} onChange={e=>setEditPayment({...editPayment,description:e.target.value})} className={IC}/></Fld>
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Amount"><CurrencyInput value={editPayment.amount} currency={editPayment.currency||"USD"} onValue={v=>setEditPayment({...editPayment,amount:v})} onCurrency={v=>setEditPayment({...editPayment,currency:v})}/></Fld>
          <Fld label="Due Date"><input type="date" value={editPayment.dueDate||""} onChange={e=>setEditPayment({...editPayment,dueDate:e.target.value,month:e.target.value.slice(0,7)})} className={IC}/></Fld>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Status">
            <select value={editPayment.status} onChange={e=>setEditPayment({...editPayment,status:e.target.value})} className={IC}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </Fld>
          <Fld label="Date Payment Received" hint="only if paid">
            <input type="date" value={editPayment.paidDate||""} onChange={e=>setEditPayment({...editPayment,paidDate:e.target.value})} className={IC}/>
          </Fld>
        </div>
        <Fld label="Month (YYYY-MM)"><input value={editPayment.month||""} onChange={e=>setEditPayment({...editPayment,month:e.target.value})} className={IC} placeholder="2024-03"/></Fld>
        {editPayment.status!=="paid"&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">To reverse a paid status, change Status above to Pending or Overdue and clear the received date.</div>}
      </Modal>}

      {/* Add Client */}
      {showAddClient&&<Modal title="Add Client" onClose={()=>setShowAddClient(false)} onSave={addClient}>
        <div className="grid grid-cols-2 gap-4"><Fld label="Company Name"><input value={nClient.name} onChange={e=>setNC({...nClient,name:e.target.value})} className={IC} placeholder="Acme Corp"/></Fld><Fld label="Contact Person"><input value={nClient.contact} onChange={e=>setNC({...nClient,contact:e.target.value})} className={IC}/></Fld></div>
        <Fld label="Email"><input value={nClient.email} onChange={e=>setNC({...nClient,email:e.target.value})} className={IC}/></Fld>
        <Fld label="Phone"><PhoneInput code={nClient.countryCode} phone={nClient.phone} onCode={v=>setNC({...nClient,countryCode:v})} onPhone={v=>setNC({...nClient,phone:v})}/></Fld>
        <Fld label="Country"><select value={nClient.country} onChange={e=>setNC({...nClient,country:e.target.value})} className={IC}>{[...COUNTRIES,"Other"].map(c=><option key={c}>{c}</option>)}</select></Fld>
      </Modal>}
    </div>
  );
}
