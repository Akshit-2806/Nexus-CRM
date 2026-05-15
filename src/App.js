/* eslint-disable */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  LayoutDashboard, Target, Layers, CreditCard, Banknote, CheckSquare,
  Users, UserCog, Search, Plus, X, ChevronRight, ChevronDown, LogOut,
  Shield, Lock, Eye, EyeOff, Mail, Phone, Building2, Edit3, Trash2,
  MapPin, CheckCircle2, MessageCircle, Download, Sparkles, Zap, Crown,
  AlertTriangle, RefreshCw, Calculator, TrendingUp, Award, Filter,
  ChevronLeft, CheckCheck, Tag, AlertCircle, UserPlus, SlidersHorizontal,
  CalendarRange, Clock, XCircle, BarChart3
} from "lucide-react";

// --- Design tokens ------------------------------------------------------------
const T = {
  bg:"#0a0c0f", surface:"#111318", surface2:"#181c23",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.12)",
  accent:"#00e5a0", accent2:"#0066ff", accent3:"#ff6b35",
  warn:"#ffb347", text:"#e8eaf0", text2:"#8a8f9e", text3:"#5a5f6e",
  red:"#ff4d6d",
};
const S = {
  card:   { background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"1.25rem" },
  card2:  { background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:"1rem" },
  input:  { background:T.surface2, border:`1px solid ${T.border2}`, borderRadius:8, padding:"9px 12px", fontSize:14, color:T.text, outline:"none", width:"100%", fontFamily:"DM Mono, monospace" },
  btn:    { padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s" },
  label:  { fontSize:11, fontWeight:500, color:T.text3, textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:6 },
};

// --- Constants ----------------------------------------------------------------
const COUNTRIES = ["Singapore","India","Thailand","UAE","Indonesia"];
const COUNTRY_META = {
  Singapore:{ code:"+65", flag:"🇸🇬", currency:"SGD", symbol:"S$" },
  India:    { code:"+91", flag:"🇮🇳", currency:"INR", symbol:"₹"  },
  Thailand: { code:"+66", flag:"🇹🇭", currency:"THB", symbol:"฿"  },
  UAE:      { code:"+971",flag:"🇦🇪", currency:"AED", symbol:"د.إ" },
  Indonesia:{ code:"+62", flag:"🇮🇩", currency:"IDR", symbol:"Rp" },
  Other:    { code:"+1",  flag:"🌍",  currency:"USD", symbol:"$"  },
};
const ALL_CODES = Object.entries(COUNTRY_META).map(([k,v])=>({name:k,...v}));
const CURRENCIES = [
  {code:"USD",symbol:"$"},{code:"SGD",symbol:"S$"},{code:"INR",symbol:"₹"},
  {code:"THB",symbol:"฿"},{code:"AED",symbol:"د.إ"},{code:"IDR",symbol:"Rp"},
  {code:"GBP",symbol:"£"},{code:"EUR",symbol:"€"},
];
const getCurr = code => CURRENCIES.find(c=>c.code===code)||CURRENCIES[0];
const fmtC = (amt,cur) => `${getCurr(cur).symbol}${Number(amt||0).toLocaleString()}`;
const defCur = country => (COUNTRY_META[country]||COUNTRY_META.Other).currency;
const defCode= country => (COUNTRY_META[country]||COUNTRY_META.Other).code;

const SERVICES = ["E-Commerce Development","Website Development","SEO","GEO / Local SEO",
  "Digital Marketing","Social Media Marketing","Performance Marketing","Influencer Marketing",
  "Lead Generation","LinkedIn Marketing","Content Marketing","Email Marketing","PR & Branding","Others"];

const DEAL_STATUSES = [
  {key:"open",        label:"Open",           color:"#0066ff"},
  {key:"active",      label:"Active",         color:"#00e5a0"},
  {key:"won",         label:"Won",            color:"#22c9a0"},
  {key:"partial",     label:"Partial",        color:"#ffb347"},
  {key:"held_client", label:"Held at Client", color:"#ff6b35"},
  {key:"held_agency", label:"Held w/ Agency", color:"#ff6b35"},
  {key:"kiv",         label:"KIV",            color:"#8a8f9e"},
  {key:"lost",        label:"Lost",           color:"#ff4d6d"},
];
const getDealStatus = key => DEAL_STATUSES.find(s=>s.key===key)||DEAL_STATUSES[0];

const ROLES_CFG = {
  super_admin:{ label:"Super Admin", icon:"👑" },
  admin:      { label:"Admin",       icon:"🛡️" },
  sales:      { label:"Sales",       icon:"🎯" },
  engagement: { label:"Eng. Manager",icon:"🤝" },
  projects:   { label:"Projects",    icon:"📋" },
};

// --- Commission Engine --------------------------------------------------------
const DEFAULT_RATES = { referrer:5, closer:5, em:2, rm:2 };

function computeCommissionTimeline(deal) {
  const { monthly=0, oneTime=0, duration=12, lostAt=0,
          refRate=5, closerRate=5, emRate=2, rmRate=2 } = deal;
  const lost = lostAt > 0;
  const effDur = lost ? lostAt : duration;
  const clawTier = !lost ? 0 : lostAt<=3 ? 1 : lostAt<=6 ? 2 : 3;
  const emClaws = clawTier===1||clawTier===2;
  const rmClaws = clawTier===1;
  const remainMo = lost ? Math.max(0, duration - lostAt) : 0;

  // Summary totals
  const refTotal   = (monthly>0?monthly:0)*refRate/100 + (oneTime>0?oneTime:0)*refRate/100;
  const closerOT   = oneTime * closerRate/100;
  let closerMonthly = 0;
  for(let m=1;m<=effDur;m++) if((m-1)%3===0&&m+2<=effDur) closerMonthly+=monthly*closerRate/100;
  const closerTotal = closerOT + closerMonthly;
  const emEarned   = monthly * emRate/100 * effDur;
  const rmEarned   = monthly * rmRate/100 * effDur;
  const emClaw     = emClaws ? monthly*emRate/100*remainMo : 0;
  const rmClaw     = rmClaws ? monthly*rmRate/100*remainMo : 0;
  const grand      = refTotal + closerTotal + emEarned + rmEarned - emClaw - rmClaw;

  // Timeline rows
  const rows = [];
  for(let m=1;m<=duration;m++){
    const afterLost = lost && m > lostAt;
    const isLost    = lost && m === lostAt;
    let rRef=0, rCls=0, rEM=0, rRM=0;
    if(m===1){ if(monthly>0)rRef+=monthly*refRate/100; if(oneTime>0)rRef+=oneTime*refRate/100; }
    if(m===1&&oneTime>0) rCls+=closerOT;
    if(monthly>0&&(m-1)%3===0&&m+2<=effDur) rCls+=monthly*closerRate/100;
    if(!afterLost){ rEM=monthly*emRate/100; rRM=monthly*rmRate/100; }
    else { rEM=emClaws?-(monthly*emRate/100):0; rRM=rmClaws?-(monthly*rmRate/100):0; }
    rows.push({ m, rRef, rCls, rEM, rRM, total:rRef+rCls+rEM+rRM, isLost, afterLost });
  }
  return { refTotal, closerTotal, emEarned, rmEarned, emClaw, rmClaw, grand, clawTier, rows, emClaws, rmClaws };
}

// Compute per-lead commission entries for the Commissions page
function computeLeadCommissions(lead, payments) {
  const entries = [];
  const monthly  = lead.monthlyValue  || 0;
  const oneTime  = lead.oneTimeValue  || (lead.dealType==="one_time"?lead.value:0)||0;
  const duration = lead.durationMonths|| 12;
  const lostAt   = lead.lostAtMonth   || 0;
  const lost     = lostAt > 0;
  const clawTier = !lost ? 0 : lostAt<=3 ? 1 : lostAt<=6 ? 2 : 3;
  const effDur   = lost ? lostAt : duration;
  const remainMo = lost ? Math.max(0, duration-lostAt) : 0;

  const rRate  = lead.referrerRate  || DEFAULT_RATES.referrer;
  const cRate  = lead.closerRate    || DEFAULT_RATES.closer;
  const emRate = lead.emRate        || DEFAULT_RATES.em;
  const rmRate = lead.rmRate        || DEFAULT_RATES.rm;

  // Helper to find if a payment for month index exists and is paid
  const isPaid = (monthIdx) => {
    if(!payments||!payments.length) return false;
    const p = payments.find(p=>p.leadId===lead.id&&p.monthIndex===monthIdx);
    return p?.status==="paid";
  };

  // Referrer - first bill
  if(lead.referrerId){
    const base = monthly>0?monthly:oneTime;
    const comm = base * rRate/100;
    if(comm>0) entries.push({ id:`${lead.id}-ref`, role:"Referrer", userId:lead.referrerId,
      lead:lead.name, description:"First bill commission", amount:comm, month:1,
      status:isPaid(1)?"paid":"pending", type:"earn" });
  }

  // Closer - one-time
  if(lead.closerId&&oneTime>0){
    const comm = oneTime * cRate/100;
    entries.push({ id:`${lead.id}-cls-ot`, role:"Closer", userId:lead.closerId,
      lead:lead.name, description:"One-time deal commission", amount:comm, month:1,
      status:isPaid(1)?"paid":"pending", type:"earn" });
  }

  // Closer - monthly quarterly
  if(lead.closerId&&monthly>0){
    for(let m=1;m<=effDur;m++){
      if((m-1)%3===0&&m+2<=effDur){
        const comm = monthly * cRate/100;
        const allPaid = isPaid(m)&&isPaid(m+1)&&isPaid(m+2);
        entries.push({ id:`${lead.id}-cls-q${m}`, role:"Closer", userId:lead.closerId,
          lead:lead.name, description:`Quarterly payout (M${m}-M${m+2})`, amount:comm,
          month:m, status:allPaid?"paid":"pending", type:"earn" });
      }
    }
  }

  // EM - monthly
  if(lead.pmId&&monthly>0){
    for(let m=1;m<=effDur;m++){
      const comm = monthly * emRate/100;
      entries.push({ id:`${lead.id}-em-${m}`, role:"Eng. Manager", userId:lead.pmId,
        lead:lead.name, description:`Month ${m} retainer`, amount:comm, month:m,
        status:isPaid(m)?"paid":"pending", type:"earn" });
    }
    // EM one-time
    if(oneTime>0){
      entries.push({ id:`${lead.id}-em-ot`, role:"Eng. Manager", userId:lead.pmId,
        lead:lead.name, description:"One-time deal EM commission", amount:oneTime*emRate/100,
        month:1, status:isPaid(1)?"paid":"pending", type:"earn" });
    }
    // EM clawback
    if((clawTier===1||clawTier===2)&&remainMo>0){
      entries.push({ id:`${lead.id}-em-claw`, role:"Eng. Manager", userId:lead.pmId,
        lead:lead.name, description:`Clawback - ${remainMo} remaining months`, 
        amount:-(monthly*emRate/100*remainMo), month:lostAt,
        status:"clawback", type:"claw" });
    }
  }

  // RM - monthly
  if(lead.rmId&&monthly>0){
    for(let m=1;m<=effDur;m++){
      const comm = monthly * rmRate/100;
      entries.push({ id:`${lead.id}-rm-${m}`, role:"Rel. Manager", userId:lead.rmId,
        lead:lead.name, description:`Month ${m} retainer`, amount:comm, month:m,
        status:isPaid(m)?"paid":"pending", type:"earn" });
    }
    if(oneTime>0){
      entries.push({ id:`${lead.id}-rm-ot`, role:"Rel. Manager", userId:lead.rmId,
        lead:lead.name, description:"One-time deal RM commission", amount:oneTime*rmRate/100,
        month:1, status:isPaid(1)?"paid":"pending", type:"earn" });
    }
    if(clawTier===1&&remainMo>0){
      entries.push({ id:`${lead.id}-rm-claw`, role:"Rel. Manager", userId:lead.rmId,
        lead:lead.name, description:`Clawback - ${remainMo} remaining months`,
        amount:-(monthly*rmRate/100*remainMo), month:lostAt,
        status:"clawback", type:"claw" });
    }
  }

  // Custom deal
  if(lead.dealType==="custom"&&lead.customCommissionUserId&&lead.customCommissionRate){
    const base = (monthly||0)+(oneTime||0);
    const comm = base * lead.customCommissionRate/100;
    entries.push({ id:`${lead.id}-custom`, role:"Custom", userId:lead.customCommissionUserId,
      lead:lead.name, description:`Custom ${lead.customCommissionRate}% on deal`,
      amount:comm, month:1, status:"pending", type:"earn" });
  }

  return entries;
}

// --- Seed Data ----------------------------------------------------------------
const genId = p => `${p}${Date.now()}${Math.random().toString(36).slice(2,5)}`;
// ─── Supabase data mappers ────────────────────────────────────────────────────
const dbToUser     = r => r ? ({ id:r.id, name:r.name, email:r.email, password:r.password, role:r.role, territories:r.territories||[], commissionRate:r.commission_rate||0, phone:r.phone||"", countryCode:r.country_code||"+65", designation:r.designation||"" }) : null;
const userToDb     = u => ({ id:u.id, name:u.name, email:u.email, password:u.password, role:u.role, territories:u.territories||[], commission_rate:u.commissionRate||0, phone:u.phone||"", country_code:u.countryCode||"+65", designation:u.designation||"" });
const dbToClient   = r => r ? ({ id:r.id, name:r.name, contact:r.contact||"", email:r.email||"", phone:r.phone||"", countryCode:r.country_code||"+65", country:r.country||"Singapore" }) : null;
const clientToDb   = c => ({ id:c.id, name:c.name, contact:c.contact||"", email:c.email||"", phone:c.phone||"", country_code:c.countryCode||"+65", country:c.country||"Singapore" });
const dbToEng      = r => r ? ({ id:r.id, clientId:r.client_id, name:r.name, salesPersonId:r.sales_person_id||"", pmId:r.pm_id||"", rmId:r.rm_id||"", status:r.status||"active", value:r.value||0, currency:r.currency||"SGD", startDate:r.start_date||"", notes:r.notes||"" }) : null;
const engToDb      = e => ({ id:e.id, client_id:e.clientId, name:e.name, sales_person_id:e.salesPersonId||"", pm_id:e.pmId||"", rm_id:e.rmId||"", status:e.status||"active", value:Number(e.value)||0, currency:e.currency||"SGD", start_date:e.startDate||today, notes:e.notes||"" });
const dbToProj     = r => r ? ({ id:r.id, engagementId:r.engagement_id, name:r.name, assignedTo:r.assigned_to||[], status:r.status||"active", value:r.value||0, currency:r.currency||"SGD", type:r.type||"Development", notes:r.notes||"", recurring:r.recurring||false, recurringDay:r.recurring_day||1, recurringAmount:r.recurring_amount||0 }) : null;
const projToDb     = p => ({ id:p.id, engagement_id:p.engagementId, name:p.name, assigned_to:p.assignedTo||[], status:p.status||"active", value:Number(p.value)||0, currency:p.currency||"SGD", type:p.type||"Development", notes:p.notes||"", recurring:p.recurring||false, recurring_day:p.recurringDay||1, recurring_amount:Number(p.recurringAmount)||0 });
const dbToPayment  = r => r ? ({ id:r.id, engagementId:r.engagement_id||"", projectId:r.project_id||"", clientId:r.client_id||"", description:r.description||"", amount:r.amount||0, currency:r.currency||"SGD", dueDate:r.due_date||"", paidDate:r.paid_date||null, status:r.status||"pending", month:r.month||"", recurring:r.recurring||false, autoGenerated:r.auto_generated||false }) : null;
const paymentToDb  = p => ({ id:p.id, engagement_id:p.engagementId||"", project_id:p.projectId||"", client_id:p.clientId||"", description:p.description||"", amount:Number(p.amount)||0, currency:p.currency||"SGD", due_date:p.dueDate||"", paid_date:p.paidDate||null, status:p.status||"pending", month:p.month||"", recurring:p.recurring||false, auto_generated:p.autoGenerated||false });
const dbToLead     = r => r ? ({ id:r.id, name:r.name, company:r.company||"", brand:r.brand||"", division:r.division||"", email:r.email||"", phone:r.phone||"", countryCode:r.country_code||"+65", country:r.country||"Singapore", dealStatus:r.deal_status||r.status||"open", dealType:r.deal_type||"monthly", monthlyValue:r.monthly_value||r.value||0, oneTimeValue:r.one_time_value||0, durationMonths:r.duration_months||12, lostAtMonth:r.lost_at_month||0, currency:r.currency||"SGD", referrerId:r.referrer_id||"", closerId:r.closer_id||r.sales_person_id||"", pmId:r.pm_id||"", rmId:r.rm_id||"", customCommissionRate:r.custom_commission_rate||"", customCommissionUserId:r.custom_commission_user_id||"", source:r.source||"Inbound", notes:r.notes||"", services:r.services||[],serviceLines:r.service_lines||[], referrerRate:r.referrer_rate||5, closerRate:r.closer_rate||5, emRate:r.em_rate||2, rmRate:r.rm_rate||2, createdAt:r.created_at||today, aiScore:r.ai_score??null, aiNote:r.ai_note||null }) : null;
const leadToDb     = l => ({ id:l.id, name:l.name, company:l.company||"", brand:l.brand||"", division:l.division||"", email:l.email||"", phone:l.phone||"", country_code:l.countryCode||"+65", country:l.country||"Singapore", deal_status:l.dealStatus||"open", deal_type:l.dealType||"monthly", monthly_value:Number(l.monthlyValue)||0, one_time_value:Number(l.oneTimeValue)||0, duration_months:Number(l.durationMonths)||12, lost_at_month:Number(l.lostAtMonth)||0, currency:l.currency||"SGD", referrer_id:l.referrerId||"", closer_id:l.closerId||"", pm_id:l.pmId||"", rm_id:l.rmId||"", custom_commission_rate:l.customCommissionRate||"", custom_commission_user_id:l.customCommissionUserId||"", source:l.source||"Inbound", notes:l.notes||"", services:l.services||[],service_lines:l.serviceLines||[], referrer_rate:Number(l.referrerRate)||5, closer_rate:Number(l.closerRate)||5, em_rate:Number(l.emRate)||2, rm_rate:Number(l.rmRate)||2, created_at:l.createdAt||today, ai_score:l.aiScore??null, ai_note:l.aiNote||null });
const dbToTask     = r => r ? ({ id:r.id, title:r.title||"", dueDate:r.due_date||"", priority:r.priority||"medium", leadId:r.lead_id||"", projectId:r.project_id||"", assignedTo:r.assigned_to||"", status:r.status||"open", type:r.type||"call", note:r.note||"" }) : null;
const taskToDb     = t => ({ id:t.id, title:t.title||"", due_date:t.dueDate||"", priority:t.priority||"medium", lead_id:t.leadId||"", project_id:t.projectId||"", assigned_to:t.assignedTo||"", status:t.status||"open", type:t.type||"call", note:t.note||"" });

const today = new Date().toISOString().split("T")[0];

const SEED_USERS = [
  { id:"u1",name:"Ayush Maheshwari",email:"ayush@solstium.net",  password:"super123", role:"super_admin",territories:[],phone:"91079699",  countryCode:"+65",designation:"CEO",          referrerRate:5,closerRate:5,emRate:2,rmRate:2 },
  { id:"u2",name:"Akshit Sharma",   email:"akshit@solstium.net", password:"Lights@123",role:"super_admin",territories:["Singapore","India","UAE","Thailand","Indonesia"],phone:"9654322740",countryCode:"+91",designation:"Director",     referrerRate:5,closerRate:5,emRate:2,rmRate:2 },
  { id:"u3",name:"Kate Tiwari",     email:"kate@solstium.net",   password:"Kate@123",  role:"admin",      territories:["Thailand","UAE"],   phone:"922590209", countryCode:"+66",designation:"Head",         referrerRate:5,closerRate:5,emRate:2,rmRate:2 },
  { id:"u4",name:"Sarah Chen",      email:"sarah@solstium.net",  password:"pass123",   role:"sales",      territories:["Singapore"],        phone:"91234567",  countryCode:"+65",designation:"Senior AE",    referrerRate:5,closerRate:5,emRate:2,rmRate:2 },
  { id:"u5",name:"Omar Hassan",     email:"omar@solstium.net",   password:"pass123",   role:"sales",      territories:["UAE"],               phone:"501234567", countryCode:"+971",designation:"Account Exec", referrerRate:5,closerRate:5,emRate:2,rmRate:2 },
  { id:"u6",name:"Elena Vance",     email:"elena@solstium.net",  password:"pass123",   role:"engagement", territories:[],                   phone:"81234568",  countryCode:"+65",designation:"Eng. Manager", referrerRate:5,closerRate:5,emRate:2,rmRate:2 },
];

const SEED_CLIENTS = [
  { id:"cl1",name:"TechFlow Inc",   contact:"David Kim",    email:"david@techflow.com", phone:"91234567",  countryCode:"+65", country:"Singapore" },
  { id:"cl2",name:"Gulf Ventures",  contact:"Fatima Al-R.", email:"fatima@gulfv.ae",    phone:"501234567", countryCode:"+971",country:"UAE" },
  { id:"cl3",name:"DataNest India", contact:"Priya Sharma", email:"priya@datanest.io",  phone:"9876543210",countryCode:"+91", country:"India" },
];

const SEED_LEADS = [
  { id:"l1",name:"Wei Lin",     company:"FinTech SG",  brand:"FinSG Pro",    division:"",       email:"wei@fintechsg.com",  phone:"91234001",countryCode:"+65", country:"Singapore",
    dealStatus:"active", dealType:"monthly",  monthlyValue:3000, oneTimeValue:0,    durationMonths:12,lostAtMonth:0,
    value:36000, currency:"SGD", referrerId:"u4",closerId:"u4",pmId:"u6",rmId:"u2",
    referrerRate:5,closerRate:5,emRate:2,rmRate:2, source:"Inbound", createdAt:"2024-01-15",
    notes:"Full digital suite", services:["Website Development","SEO"], aiScore:null, aiNote:null },
  { id:"l2",name:"Ahmed Al-M.", company:"Gulf PropCo", brand:"DubaiProp360",  division:"PropTech",email:"ahmed@dubaiprop.ae", phone:"501234001",countryCode:"+971",country:"UAE",
    dealStatus:"won",    dealType:"combo",    monthlyValue:5000, oneTimeValue:15000,durationMonths:12,lostAtMonth:0,
    value:75000, currency:"AED", referrerId:"u5",closerId:"u5",pmId:"u6",rmId:"u3",
    referrerRate:5,closerRate:5,emRate:2,rmRate:2, source:"Referral", createdAt:"2024-02-01",
    notes:"Real estate portal", services:["E-Commerce Development"], aiScore:82, aiNote:"Strong fit." },
  { id:"l3",name:"Andi Wijaya", company:"Tokobaju.id", brand:"TokoBaju",     division:"Fashion", email:"andi@tokobaju.id",   phone:"81234001",countryCode:"+62", country:"Indonesia",
    dealStatus:"lost",   dealType:"monthly",  monthlyValue:2000, oneTimeValue:0,    durationMonths:12,lostAtMonth:3,
    value:24000, currency:"IDR", referrerId:"u2",closerId:"u5",pmId:"u6",rmId:"u4",
    referrerRate:5,closerRate:5,emRate:2,rmRate:2, source:"Event",    createdAt:"2024-02-10",
    notes:"Lost at M3",  services:["Social Media Marketing"], aiScore:null, aiNote:null },
  { id:"l4",name:"Priya Nair",  company:"EdTech India","brand":"LearnIndia",  division:"",       email:"priya@edtech.in",    phone:"9876500001",countryCode:"+91",country:"India",
    dealStatus:"kiv",    dealType:"one_time", monthlyValue:0,    oneTimeValue:8000, durationMonths:1, lostAtMonth:0,
    value:8000,  currency:"INR", referrerId:"u2",closerId:"u4",pmId:"u6",rmId:"u6",
    referrerRate:5,closerRate:5,emRate:2,rmRate:2, source:"Outbound", createdAt:"2024-03-01",
    notes:"KIV for Q2",  services:["Digital Marketing"], aiScore:null, aiNote:null },
  { id:"l5",name:"Custom Deal", company:"External Co.", brand:"ExtCo",         division:"",       email:"ext@external.com",   phone:"91230000",countryCode:"+65", country:"Singapore",
    dealStatus:"active", dealType:"custom",   monthlyValue:0,    oneTimeValue:20000,durationMonths:1, lostAtMonth:0,
    value:20000, currency:"SGD", referrerId:"",  closerId:"",  pmId:"",  rmId:"",
    customCommissionRate:15, customCommissionUserId:"u2",
    referrerRate:5,closerRate:5,emRate:2,rmRate:2, source:"Partner",  createdAt:"2024-03-10",
    notes:"Custom 15% to Akshit", services:[], aiScore:null, aiNote:null },
];

const SEED_ENGAGEMENTS = [
  { id:"en1",clientId:"cl1",name:"Digital Transformation 2024",salesPersonId:"u4",pmId:"u6",status:"active",value:150000,currency:"SGD",startDate:"2024-01-15",notes:"Flagship." },
  { id:"en2",clientId:"cl2",name:"Platform Launch - MENA",     salesPersonId:"u5",pmId:"u6",status:"active",value:95000, currency:"AED",startDate:"2024-02-01",notes:"Multi-phase." },
];

const SEED_PROJECTS = [
  { id:"pr1",engagementId:"en1",name:"Website Redesign",assignedTo:["u4","u6"],status:"active",value:55000,currency:"SGD",type:"Development",notes:"Next.js",recurring:false,recurringDay:1,recurringAmount:0 },
  { id:"pr2",engagementId:"en1",name:"SEO Campaign",   assignedTo:["u6"],     status:"active",value:24000,currency:"SGD",type:"SEO",        notes:"12mo retainer",recurring:true,recurringDay:1,recurringAmount:2000 },
];

const SEED_PAYMENTS = [
  { id:"pay1",engagementId:"en1",projectId:"pr1",clientId:"cl1",leadId:"l1",description:"Website - Phase 1",amount:27500,currency:"SGD",dueDate:"2024-02-15",paidDate:"2024-02-14",status:"paid",  month:"2024-02",monthIndex:1,recurring:false },
  { id:"pay2",engagementId:"en1",projectId:"pr2",clientId:"cl1",leadId:"l1",description:"SEO Jan Retainer",  amount:2000, currency:"SGD",dueDate:"2024-01-31",paidDate:"2024-01-30",status:"paid",  month:"2024-01",monthIndex:1,recurring:true },
  { id:"pay3",engagementId:"en2",projectId:"",  clientId:"cl2",leadId:"l2",description:"Mobile App M1",     amount:25000,currency:"AED",dueDate:"2024-02-20",paidDate:"2024-02-22",status:"paid",  month:"2024-02",monthIndex:1,recurring:false },
  { id:"pay4",engagementId:"en1",projectId:"pr2",clientId:"cl1",leadId:"l1",description:"SEO Feb Retainer",  amount:2000, currency:"SGD",dueDate:"2024-02-29",paidDate:null,        status:"overdue",month:"2024-02",monthIndex:2,recurring:true },
  { id:"pay5",engagementId:"en2",projectId:"",  clientId:"cl2",leadId:"l2",description:"Platform M2",       amount:25000,currency:"AED",dueDate:"2024-04-15",paidDate:null,        status:"pending",month:"2024-04",monthIndex:2,recurring:false },
];

const SEED_TASKS = [
  { id:"tk1",title:"Follow up - Gulf PropCo proposal",   dueDate:"2024-03-05",priority:"high",  leadId:"l2",projectId:"",   assignedTo:"u5",completed:false,type:"proposal",  status:"open",   note:"" },
  { id:"tk2",title:"Weekly SEO check-in - TechFlow",     dueDate:"2024-03-06",priority:"medium",leadId:"l1",projectId:"pr2",assignedTo:"u6",completed:false,type:"meeting",   status:"open",   note:"" },
  { id:"tk3",title:"Invoice follow-up - overdue Feb SEO",dueDate:"2024-03-04",priority:"high",  leadId:"l1",projectId:"",   assignedTo:"u4",completed:false,type:"email",     status:"open",   note:"" },
  { id:"tk4",title:"KIV review - EdTech India",          dueDate:"2024-03-10",priority:"low",   leadId:"l4",projectId:"",   assignedTo:"u2",completed:false,type:"call",      status:"open",   note:"" },
];

// --- Helpers ------------------------------------------------------------------
const LS = { get:(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } }, set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} } };
const inits    = n=>(n||"").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
const userColor= id=>{ const colors=["#7c3aed","#db2777","#0284c7","#059669","#ea580c","#4f46e5","#0891b2","#be123c"]; return colors[parseInt((id||"0").replace(/\D/g,""),36)%colors.length]; };
const waLink   = (code,phone,msg)=>`https://wa.me/${(code||"").replace("+","")}${phone}?text=${encodeURIComponent(msg||"")}`;
const mailLink = (email,s,b)=>`mailto:${email}?subject=${encodeURIComponent(s||"")}&body=${encodeURIComponent(b||"")}`;
const daysOver = d=>{ if(!d)return 0; return Math.floor((new Date()-new Date(d))/86400000); };
const fmt$     = (n,cur)=>cur?fmtC(n,cur):`$${Number(n||0).toLocaleString()}`;
const exportCSV= (rows,filename)=>{ if(!rows.length)return; const h=Object.keys(rows[0]); const csv=[h.join(","),...rows.map(r=>h.map(k=>{ const v=r[k]; return Array.isArray(v)?`"${v.join("; ")}"`:typeof v==="string"?`"${v.replace(/"/g,'""')}"`:v??"" }).join(","))].join("\n"); const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download=filename+".csv"; a.click(); };

// --- UI Atoms -----------------------------------------------------------------
const LOGO = (
  <svg width="26" height="26" viewBox="-64 -64 128 128" xmlns="http://www.w3.org/2000/svg">
    <circle cx="0" cy="0" r="58" fill="none" stroke="#2356d4" strokeWidth="7" strokeDasharray="240 125" strokeLinecap="round"/>
    <circle cx="0" cy="0" r="42" fill="none" stroke="#f07020" strokeWidth="7" strokeDasharray="170 95" strokeDashoffset="60" strokeLinecap="round"/>
    <circle cx="0" cy="0" r="26" fill="none" stroke="#22c9a0" strokeWidth="7" strokeDasharray="100 65" strokeDashoffset="120" strokeLinecap="round"/>
    <circle cx="0" cy="0" r="7" fill="#2356d4"/>
    <circle cx="40" cy="-41" r="6" fill="#f07020"/>
    <circle cx="-36" cy="22" r="5" fill="#22c9a0"/>
  </svg>
);

const Avatar = ({user,size="md"}) => {
  if(!user) return <div style={{width:size==="sm"?24:size==="lg"?40:32,height:size==="sm"?24:size==="lg"?40:32,borderRadius:"50%",background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",color:T.text3,fontSize:size==="sm"?9:11,fontWeight:700,flexShrink:0}}>?</div>;
  const sz = size==="sm"?24:size==="lg"?40:32;
  return <div title={user.name} style={{width:sz,height:sz,borderRadius:"50%",background:userColor(user.id),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size==="sm"?9:size==="lg"?13:11,fontWeight:700,flexShrink:0}}>{inits(user.name)}</div>;
};

const DealBadge = ({status}) => {
  const s = getDealStatus(status);
  return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:5,fontSize:10,fontWeight:700,background:`${s.color}18`,color:s.color,border:`1px solid ${s.color}30`}}>{s.label}</span>;
};

const RoleBadge = ({role}) => {
  const r = ROLES_CFG[role]||{label:role,icon:"•"};
  return <span style={{fontSize:10,fontWeight:600,background:T.surface2,color:T.text2,padding:"2px 8px",borderRadius:4,border:`1px solid ${T.border2}`}}>{r.icon} {r.label}</span>;
};

const WABtn = ({phone,code,msg}) => {
  if(!phone) return null;
  return <a href={waLink(code,phone,msg)} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"rgba(37,211,102,0.12)",color:"#25d366",textDecoration:"none",flexShrink:0}} title="WhatsApp"><MessageCircle size={11}/></a>;
};
const MailBtn = ({email,subj,body}) => {
  if(!email) return null;
  return <a href={mailLink(email,subj,body)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"rgba(0,102,255,0.1)",color:T.accent2,textDecoration:"none",flexShrink:0}} title="Email"><Mail size={11}/></a>;
};

// --- Login Screen -------------------------------------------------------------
const LoginScreen = ({users,onLogin}) => {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [showPw,setShowPw]=useState(false); const [err,setErr]=useState("");
const login=()=>{ const list=users&&users.length>0?users:SEED_USERS; const u=list.find(u=>u.email.toLowerCase().trim()===email.toLowerCase().trim()&&u.password===pw); if(u)onLogin(u); else setErr("Incorrect email or password."); };
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"DM Sans, sans-serif"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:12}}>{LOGO}<span style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text}}>Nexus <span style={{color:T.accent}}>CRM</span></span></div>
          <p style={{color:T.text3,fontSize:13}}>Sign in to your workspace</p>
        </div>
        <div style={{...S.card,padding:28}}>
          {err&&<div style={{background:"rgba(255,77,109,0.1)",border:`1px solid ${T.red}40`,color:T.red,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,display:"flex",alignItems:"center",gap:8}}><AlertCircle size={14}/>{err}</div>}
          <div style={{marginBottom:16}}>
            <label style={S.label}>Email</label>
            <input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="you@solstium.net" style={S.input}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={S.label}>Password</label>
            <div style={{position:"relative"}}>
              <input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="••••••••" style={S.input}/>
              <button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.text3,cursor:"pointer"}}>{showPw?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            </div>
          </div>
          <button onClick={login} style={{...S.btn,width:"100%",background:T.accent,color:"#000",fontSize:14}}>Sign In</button>
          <p style={{textAlign:"center",marginTop:20,fontSize:11,color:T.text3}}>Contact your admin for login credentials.</p>
        </div>
      </div>
    </div>
  );
};

// --- Modal Shell -------------------------------------------------------------
const Modal = ({title,onClose,onSave,saveLabel="Save",wide=false,xl=false,noFooter=false,children}) => (
  <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
    <div style={{position:"relative",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:16,width:"100%",maxWidth:xl?800:wide?640:440,maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
      <div style={{padding:"16px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <span style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:700,color:T.text}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",padding:4}}><X size={18}/></button>
      </div>
      <div style={{padding:24,overflowY:"auto",flex:1}}>{children}</div>
      {!noFooter&&<div style={{padding:"14px 24px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end",gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{...S.btn,background:T.surface2,color:T.text2}}>Cancel</button>
        <button onClick={onSave} style={{...S.btn,background:T.accent,color:"#000"}}>{saveLabel}</button>
      </div>}
    </div>
  </div>
);

const Fld = ({label,children,hint}) => (
  <div style={{marginBottom:14}}>
    <label style={S.label}>{label}{hint&&<span style={{color:T.text3,fontStyle:"italic",textTransform:"none",letterSpacing:"normal",marginLeft:6,fontSize:10}}>({hint})</span>}</label>
    {children}
  </div>
);

const Inp = ({value,onChange,placeholder,type="text",min,max,step,disabled}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max} step={step} disabled={disabled}
    style={{...S.input,opacity:disabled?0.5:1}}/>
);

const Sel = ({value,onChange,children}) => (
  <select value={value} onChange={onChange} style={{...S.input}}>
    {children}
  </select>
);

const PhoneInput = ({code,phone,onCode,onPhone}) => (
  <div style={{display:"flex",gap:8}}>
    <select value={code} onChange={e=>onCode(e.target.value)} style={{...S.input,width:110,flexShrink:0}}>
      {ALL_CODES.map(c=><option key={c.code+c.name} value={c.code}>{c.flag} {c.code}</option>)}
    </select>
    <input value={phone} onChange={e=>onPhone(e.target.value)} placeholder="Phone number" style={S.input}/>
  </div>
);

const CurrencyInput = ({value,currency,onValue,onCurrency,placeholder="0"}) => (
  <div style={{display:"flex",gap:8}}>
    <select value={currency} onChange={e=>onCurrency(e.target.value)} style={{...S.input,width:90,flexShrink:0}}>
      {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}
    </select>
    <input type="number" value={value} onChange={e=>onValue(e.target.value)} placeholder={placeholder} style={S.input}/>
  </div>
);

// ===============================================================================
// MAIN APP

// Lead form empty state
const EL = { step:1,name:"",company:"",brand:"",division:"",email:"",phone:"",countryCode:"+65",country:"Singapore",dealStatus:"open",dealType:"monthly",monthlyValue:"",oneTimeValue:"",durationMonths:"12",lostAtMonth:"0",currency:"SGD",referrerId:"",closerId:"",pmId:"",rmId:"",customCommissionRate:"",customCommissionUserId:"",source:"Inbound",notes:"",services:[],serviceLines:[],referrerRate:5,closerRate:5,emRate:2,rmRate:2 };


// =============================================================================
// DashboardView
// =============================================================================
const DashboardView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const overdue90 = payments.filter(p=>(p.status==="overdue"||p.status==="pending")&&daysOver(p.dueDate)>=90);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
        <div><h1 style={{fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:700,color:T.text,margin:0}}>Good morning, {currentUser.name.split(" ")[0]} 👋</h1><p style={{color:T.text3,fontSize:13,marginTop:4}}>Here's your pipeline at a glance.</p></div>
        <button onClick={()=>{setTab("leads");setTimeout(()=>setShowAddLead(true),50);}} style={{...S.btn,background:T.accent,color:"#000",display:"flex",alignItems:"center",gap:6}}><Plus size={15}/>New Lead</button>
      </div>

      {overdue90.length>0&&<div style={{background:"rgba(255,77,109,0.08)",border:`1px solid ${T.red}40`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
        <AlertTriangle size={16} style={{color:T.red,flexShrink:0}}/><div><p style={{color:T.red,fontWeight:700,fontSize:13,margin:0}}>{overdue90.length} invoice{overdue90.length!==1?"s":""} overdue 90+ days - action required</p></div>
        <button onClick={()=>setTab("payments")} style={{marginLeft:"auto",...S.btn,padding:"6px 14px",background:`${T.red}18`,color:T.red,border:`1px solid ${T.red}40`,fontSize:12}}>View →</button>
      </div>}

      {/* Lead pipeline per currency */}
      <p style={{...S.label,marginBottom:10}}>Lead Pipeline by Currency</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:24}}>
        {leadCurrencyStats.length===0&&<div style={{...S.card2,color:T.text3,fontSize:13}}>No leads yet.</div>}
        {leadCurrencyStats.map(c=>(
          <div key={c.currency} style={S.card2}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:11,fontWeight:500,color:T.text3}}>{c.currency}</span>
              <span style={{fontSize:11,color:T.text3}}>{c.count} leads</span>
            </div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:20,fontWeight:500,color:T.text,marginBottom:6}}>{fmtC(c.total,c.currency)}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {c.won>0&&<span style={{fontSize:10,color:T.accent}}>↑ {fmtC(c.won,c.currency)} won</span>}
              {c.active>0&&<span style={{fontSize:10,color:T.accent2}}>~ {fmtC(c.active,c.currency)} active</span>}
              {c.lost>0&&<span style={{fontSize:10,color:T.red}}>✗ {fmtC(c.lost,c.currency)} lost</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Payments per currency */}
      <p style={{...S.label,marginBottom:10}}>Payments by Currency</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:24}}>
        {currencyStats.length===0&&<div style={{...S.card2,color:T.text3,fontSize:13}}>No payments yet.</div>}
        {currencyStats.map(c=>(
          <div key={c.currency} style={S.card2}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:T.text3,marginBottom:8}}>{c.currency}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
              <div><div style={{fontSize:10,color:T.text3,marginBottom:2}}>Received</div><div style={{fontFamily:"DM Mono,monospace",fontSize:13,color:T.accent,fontWeight:500}}>{fmtC(c.received,c.currency)}</div></div>
              <div><div style={{fontSize:10,color:T.text3,marginBottom:2}}>Pending</div><div style={{fontFamily:"DM Mono,monospace",fontSize:13,color:T.warn,fontWeight:500}}>{fmtC(c.pending,c.currency)}</div></div>
              <div><div style={{fontSize:10,color:T.text3,marginBottom:2}}>Overdue</div><div style={{fontFamily:"DM Mono,monospace",fontSize:13,color:T.red,fontWeight:500}}>{fmtC(c.overdue,c.currency)}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Deal status summary */}
      <p style={{...S.label,marginBottom:10}}>Deals by Status</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {DEAL_STATUSES.map(s=>{ const count=visLeads.filter(l=>l.dealStatus===s.key).length; return (
          <div key={s.key} style={{...S.card2,padding:"10px 16px",minWidth:100,textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:s.color,fontFamily:"DM Mono,monospace"}}>{count}</div>
            <div style={{fontSize:11,color:T.text3,marginTop:2}}>{s.label}</div>
          </div>
        );})}
      </div>
    </div>
  );
};


// =============================================================================
// UsersView
// =============================================================================
const UsersView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const [draft,setDraft]=useState({name:"",email:"",password:"pass123",role:"sales",territories:[],phone:"",countryCode:"+65",designation:"",referrerRate:5,closerRate:5,emRate:2,rmRate:2});
  const save=()=>{ if(!draft.name||!draft.email)return; addUser(draft); setDraft({name:"",email:"",password:"pass123",role:"sales",territories:[],phone:"",countryCode:"+65",designation:"",referrerRate:5,closerRate:5,emRate:2,rmRate:2}); setShowAddUser(false); };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div><h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:0}}>User Management</h1><p style={{color:T.text3,fontSize:13,marginTop:4}}>Manage roles, territories and commission rates.</p></div>
        <button onClick={()=>setShowAddUser(true)} style={{...S.btn,background:T.surface2,color:T.text,border:`1px solid ${T.border2}`,display:"flex",alignItems:"center",gap:6}}><UserPlus size={14}/>Add User</button>
      </div>
      <div style={{...S.card,padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["User","Role","Territories","Comm Rates","Password","Actions"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:600,color:T.text3,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>)}</tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar user={u}/><div><div style={{fontWeight:600,color:T.text,fontSize:13}}>{u.name}</div><div style={{fontSize:11,color:T.text3}}>{u.email}</div></div></div></td>
              <td style={{padding:"12px 16px"}}><RoleBadge role={u.role}/></td>
              <td style={{padding:"12px 16px"}}>{u.territories.length>0?<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{u.territories.map(t=><span key={t} style={{fontSize:10,background:T.surface2,color:T.text2,padding:"2px 6px",borderRadius:4}}>{t}</span>)}</div>:<span style={{fontSize:11,color:T.text3}}>All</span>}</td>
              <td style={{padding:"12px 16px"}}><div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:T.text3}}>Ref {u.referrerRate||5}% · Cls {u.closerRate||5}% · EM {u.emRate||2}% · RM {u.rmRate||2}%</div></td>
              <td style={{padding:"12px 16px"}}><span style={{fontFamily:"DM Mono,monospace",fontSize:11,background:T.surface2,padding:"3px 8px",borderRadius:4,color:T.text2}}>{u.password}</span></td>
              <td style={{padding:"12px 16px"}}><div style={{display:"flex",gap:6}}>
                <button onClick={()=>setEditUser({...u})} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Edit3 size={13}/></button>
                {u.id!==currentUser.id&&<button onClick={()=>deleteUser(u.id)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Trash2 size={13}/></button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showAddUser&&<Modal title="Add User" onClose={()=>setShowAddUser(false)} onSave={save} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Full Name"><Inp value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Jane Smith"/></Fld>
          <Fld label="Email"><Inp value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})} placeholder="jane@solstium.net"/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Password"><Inp value={draft.password} onChange={e=>setDraft({...draft,password:e.target.value})}/></Fld>
          <Fld label="Designation"><Inp value={draft.designation} onChange={e=>setDraft({...draft,designation:e.target.value})} placeholder="Account Executive"/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Role"><Sel value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})}>{Object.entries(ROLES_CFG).filter(([k])=>isSA(currentUser)||k!=="super_admin").map(([k,r])=><option key={k} value={k}>{r.label}</option>)}</Sel></Fld>
          <Fld label="Phone"><PhoneInput code={draft.countryCode} phone={draft.phone} onCode={v=>setDraft({...draft,countryCode:v})} onPhone={v=>setDraft({...draft,phone:v})}/></Fld>
        </div>
        <Fld label="Commission Rates (%)"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {["referrerRate","closerRate","emRate","rmRate"].map(k=>(
            <div key={k}><label style={{...S.label,fontSize:9}}>{k==="referrerRate"?"Referrer":k==="closerRate"?"Closer":k==="emRate"?"EM":"RM"}</label><Inp type="number" value={draft[k]} onChange={e=>setDraft({...draft,[k]:Number(e.target.value)})} min="0" max="50"/></div>
          ))}
        </div></Fld>
        <Fld label="Territories"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{COUNTRIES.map(c=><label key={c} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:T.text2}}><input type="checkbox" checked={draft.territories.includes(c)} onChange={ev=>setDraft({...draft,territories:ev.target.checked?[...draft.territories,c]:draft.territories.filter(t=>t!==c)})} style={{accentColor:T.accent}}/>{c}</label>)}</div></Fld>
      </Modal>}
      {editUser&&<Modal title="Edit User" onClose={()=>setEditUser(null)} onSave={()=>{saveUser(editUser);setEditUser(null);}} saveLabel="Save Changes" wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Full Name"><Inp value={editUser.name} onChange={e=>setEditUser({...editUser,name:e.target.value})}/></Fld>
          <Fld label="Email"><Inp value={editUser.email} onChange={e=>setEditUser({...editUser,email:e.target.value})}/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Password"><Inp value={editUser.password} onChange={e=>setEditUser({...editUser,password:e.target.value})}/></Fld>
          <Fld label="Designation"><Inp value={editUser.designation||""} onChange={e=>setEditUser({...editUser,designation:e.target.value})}/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Role"><Sel value={editUser.role} onChange={e=>setEditUser({...editUser,role:e.target.value})}>{Object.entries(ROLES_CFG).filter(([k])=>isSA(currentUser)||k!=="super_admin").map(([k,r])=><option key={k} value={k}>{r.label}</option>)}</Sel></Fld>
          <Fld label="Phone"><PhoneInput code={editUser.countryCode||"+65"} phone={editUser.phone||""} onCode={v=>setEditUser({...editUser,countryCode:v})} onPhone={v=>setEditUser({...editUser,phone:v})}/></Fld>
        </div>
        <Fld label="Commission Rates (%)"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {["referrerRate","closerRate","emRate","rmRate"].map(k=>(
            <div key={k}><label style={{...S.label,fontSize:9}}>{k==="referrerRate"?"Referrer":k==="closerRate"?"Closer":k==="emRate"?"EM":"RM"}</label><Inp type="number" value={editUser[k]||0} onChange={e=>setEditUser({...editUser,[k]:Number(e.target.value)})} min="0" max="50"/></div>
          ))}
        </div></Fld>
        <Fld label="Territories"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{COUNTRIES.map(c=><label key={c} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:T.text2}}><input type="checkbox" checked={(editUser.territories||[]).includes(c)} onChange={ev=>setEditUser({...editUser,territories:ev.target.checked?[...(editUser.territories||[]),c]:(editUser.territories||[]).filter(t=>t!==c)})} style={{accentColor:T.accent}}/>{c}</label>)}</div></Fld>
      </Modal>}
    </div>
  );
};


// =============================================================================
// AddLeadWizard
// =============================================================================
const AddLeadWizard = (props) => {
  const {nLead,setNL,onClose,onSave} = props;
  const ctx = props.ctx;
  const { currentUser, users, isAdmin } = ctx;
  const [step,setStep] = useState(1);
  // serviceLines: [{service, dealType, monthlyValue, oneTimeValue, durationMonths, currency,
  //                 referrerId, closerId, pmId, rmId, referrerRate, closerRate, emRate, rmRate}]
  const [serviceLines,setSL] = useState(nLead.serviceLines||[]);

  const steps = ["Contact & Brand","Services & Deals","Roles & Commission","Notes & Review"];
  const v1 = nLead.name&&nLead.company&&nLead.brand;
  const v2 = serviceLines.length>0;
  const v3 = serviceLines.every(sl=>sl.referrerId&&sl.closerId);

  // Sync serviceLines back into nLead so save works
  const syncLines = (lines) => {
    setSL(lines);
    // Roll up totals for backward compat
    const monthly = lines.reduce((s,l)=>s+(l.dealType==="monthly"||l.dealType==="combo"?Number(l.monthlyValue)||0:0),0);
    const oneTime = lines.reduce((s,l)=>s+(l.dealType==="one_time"||l.dealType==="combo"?Number(l.oneTimeValue)||0:0),0);
    const services = lines.map(l=>l.service);
    const cur = lines[0]?.currency||nLead.currency||"SGD";
    // Use first line roles as overall (for backward compat)
    const fl = lines[0]||{};
    setNL(p=>({...p,services,serviceLines:lines,monthlyValue:monthly,oneTimeValue:oneTime,
      currency:cur,dealType:lines.length===1?fl.dealType:"combo",
      durationMonths:fl.durationMonths||12,
      referrerId:fl.referrerId||p.referrerId,closerId:fl.closerId||p.closerId,
      pmId:fl.pmId||p.pmId,rmId:fl.rmId||p.rmId,
      referrerRate:fl.referrerRate||p.referrerRate,closerRate:fl.closerRate||p.closerRate,
      emRate:fl.emRate||p.emRate,rmRate:fl.rmRate||p.rmRate,
    }));
  };

  const addServiceLine = (svc) => {
    if(serviceLines.find(l=>l.service===svc)) return;
    const nl = {service:svc,dealType:"monthly",monthlyValue:"",oneTimeValue:"",durationMonths:12,
      currency:nLead.currency||"SGD",
      referrerId:nLead.referrerId||"",closerId:nLead.closerId||"",
      pmId:nLead.pmId||"",rmId:nLead.rmId||"",
      referrerRate:nLead.referrerRate||5,closerRate:nLead.closerRate||5,
      emRate:nLead.emRate||2,rmRate:nLead.rmRate||2};
    syncLines([...serviceLines,nl]);
  };
  const removeServiceLine = (svc) => syncLines(serviceLines.filter(l=>l.service!==svc));
  const updateLine = (svc,upd) => syncLines(serviceLines.map(l=>l.service===svc?{...l,...upd}:l));

  return (
    <Modal title="Add New Lead" onClose={onClose} xl noFooter>
      {/* Step bar */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:24}}>
        {steps.map((s,i)=>(
          <React.Fragment key={i}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:6,fontSize:11,fontWeight:600,
              background:step===i+1?T.accent2:step>i+1?"rgba(0,229,160,0.1)":T.surface2,
              color:step===i+1?"#fff":step>i+1?T.accent:T.text3}}>
              {step>i+1?<CheckCheck size={11}/>:<span>{i+1}</span>}{s}
            </div>
            {i<3&&<div style={{height:1,flex:1,background:step>i+1?T.accent:T.border,margin:"0 4px"}}/>}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Contact & Brand ───────────────────────────────────── */}
      {step===1&&<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Contact Name *"><Inp value={nLead.name} onChange={e=>setNL(p=>({...p,name:e.target.value}))} placeholder="John Smith"/></Fld>
          <Fld label="Company *"><Inp value={nLead.company} onChange={e=>setNL(p=>({...p,company:e.target.value}))} placeholder="Acme Corp"/></Fld>
        </div>
        <Fld label="Brand *" hint="the specific brand or product this deal is for"><Inp value={nLead.brand} onChange={e=>setNL(p=>({...p,brand:e.target.value}))} placeholder="e.g. AcmePro, BrandX"/></Fld>
        <Fld label="Division / Sub-brand" hint="optional"><Inp value={nLead.division} onChange={e=>setNL(p=>({...p,division:e.target.value}))} placeholder="e.g. Fashion, PropTech"/></Fld>
        <Fld label="Email"><Inp value={nLead.email} onChange={e=>setNL(p=>({...p,email:e.target.value}))} placeholder="john@company.com"/></Fld>
        <Fld label="Phone"><PhoneInput code={nLead.countryCode} phone={nLead.phone} onCode={v=>setNL(p=>({...p,countryCode:v}))} onPhone={v=>setNL(p=>({...p,phone:v}))}/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Country"><Sel value={nLead.country} onChange={e=>setNL(p=>({...p,country:e.target.value,currency:defCur(e.target.value),countryCode:defCode(e.target.value)}))}>
            {[...COUNTRIES,"Other"].map(c=><option key={c}>{c}</option>)}
          </Sel></Fld>
          <Fld label="Source"><Sel value={nLead.source} onChange={e=>setNL(p=>({...p,source:e.target.value}))}>
            {["Inbound","Outbound","Referral","Partner","Event","Cold Outreach"].map(s=><option key={s}>{s}</option>)}
          </Sel></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:4}}>
          <Fld label="Deal Status"><Sel value={nLead.dealStatus} onChange={e=>setNL(p=>({...p,dealStatus:e.target.value}))}>
            {DEAL_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </Sel></Fld>
          {nLead.dealStatus==="lost"&&<Fld label="Lost at Month #"><Inp type="number" value={nLead.lostAtMonth} onChange={e=>setNL(p=>({...p,lostAtMonth:e.target.value}))} placeholder="3" min="1"/></Fld>}
        </div>
      </div>}

      {/* ── Step 2: Services + Deal per service ───────────────────────── */}
      {step===2&&<div>
        {/* Service picker */}
        <p style={{...S.label,marginBottom:8}}>Select Services *</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,border:`1px solid ${T.border}`,borderRadius:8,padding:12,background:T.surface2,marginBottom:20}}>
          {SERVICES.map(svc=>{
            const active=serviceLines.find(l=>l.service===svc);
            return <label key={svc} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:active?T.accent:T.text2,padding:"3px 0"}}>
              <input type="checkbox" checked={!!active}
                onChange={ev=>ev.target.checked?addServiceLine(svc):removeServiceLine(svc)}
                style={{accentColor:T.accent}}/>{svc}
            </label>;
          })}
        </div>

        {/* Deal card per selected service */}
        {serviceLines.length===0&&<div style={{textAlign:"center",color:T.text3,fontSize:13,padding:"20px 0"}}>Select at least one service above to configure the deal.</div>}
        {serviceLines.map((sl,idx)=>(
          <div key={sl.service} style={{...S.card2,marginBottom:14,position:"relative"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontWeight:600,fontSize:14,color:T.accent2}}>{sl.service}</span>
              <button onClick={()=>removeServiceLine(sl.service)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><X size={14}/></button>
            </div>

            {/* Deal type tabs */}
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {["monthly","one_time","combo"].map(t=>(
                <button key={t} onClick={()=>updateLine(sl.service,{dealType:t})}
                  style={{flex:1,padding:"7px 4px",borderRadius:7,border:`1px solid ${sl.dealType===t?T.accent:T.border2}`,
                    background:sl.dealType===t?"rgba(0,229,160,0.08)":T.surface2,
                    color:sl.dealType===t?T.accent:T.text2,fontSize:11,fontWeight:500,cursor:"pointer"}}>
                  {t==="monthly"?"Monthly":t==="one_time"?"One-Time":"Combined"}
                </button>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {(sl.dealType==="monthly"||sl.dealType==="combo")&&
                <Fld label="Monthly Value"><CurrencyInput value={sl.monthlyValue} currency={sl.currency}
                  onValue={v=>updateLine(sl.service,{monthlyValue:v})}
                  onCurrency={v=>updateLine(sl.service,{currency:v})} placeholder="3000"/></Fld>}
              {(sl.dealType==="one_time"||sl.dealType==="combo")&&
                <Fld label="One-Time Value"><CurrencyInput value={sl.oneTimeValue} currency={sl.currency}
                  onValue={v=>updateLine(sl.service,{oneTimeValue:v})}
                  onCurrency={v=>updateLine(sl.service,{currency:v})} placeholder="10000"/></Fld>}
              {sl.dealType!=="one_time"&&
                <Fld label="Duration (months)"><Inp type="number" value={sl.durationMonths}
                  onChange={e=>updateLine(sl.service,{durationMonths:Number(e.target.value)})} min="1" max="60"/></Fld>}
            </div>
          </div>
        ))}
      </div>}

      {/* ── Step 3: Roles + Commission rates per service ──────────────── */}
      {step===3&&<div>
        <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.text3}}>
          Assign roles and commission rates for each service. Referrer and Closer are required.
        </div>
        {serviceLines.map((sl,idx)=>{
          const preview = (sl.dealType!=="custom"&&(Number(sl.monthlyValue)||Number(sl.oneTimeValue)))
            ? computeCommissionTimeline({monthly:Number(sl.monthlyValue)||0,oneTime:Number(sl.oneTimeValue)||0,
                duration:Number(sl.durationMonths)||12,lostAt:0,
                refRate:Number(sl.referrerRate)||5,closerRate:Number(sl.closerRate)||5,
                emRate:Number(sl.emRate)||2,rmRate:Number(sl.rmRate)||2})
            : null;
          return (
          <div key={sl.service} style={{...S.card2,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontWeight:600,fontSize:13,color:T.accent2}}>{sl.service}</span>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:T.text3}}>
                {sl.dealType==="monthly"?`${fmtC(sl.monthlyValue,sl.currency)}/mo`:
                 sl.dealType==="one_time"?fmtC(sl.oneTimeValue,sl.currency):
                 `${fmtC(sl.monthlyValue,sl.currency)}/mo + ${fmtC(sl.oneTimeValue,sl.currency)}`}
              </span>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {[["referrerId","Referrer *"],["closerId","Closer *"],["pmId","Eng. Manager"],["rmId","Rel. Manager"]].map(([f,l])=>(
                <Fld key={f} label={l}>
                  <Sel value={sl[f]||""} onChange={e=>updateLine(sl.service,{[f]:e.target.value})}>
                    <option value="">Select…</option>
                    {users.map(u=><option key={u.id} value={u.id}>{u.name}{u.designation?` (${u.designation})`:""}</option>)}
                  </Sel>
                </Fld>
              ))}
            </div>

            {isAdmin(currentUser)&&<>
              <p style={{...S.label,fontSize:9,marginBottom:6}}>Commission Rates (% — leave blank for defaults)</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:10}}>
                {[["referrerRate","Ref %"],["closerRate","Closer %"],["emRate","EM %"],["rmRate","RM %"]].map(([k,l])=>(
                  <div key={k}><label style={{...S.label,fontSize:9}}>{l}</label>
                    <Inp type="number" value={sl[k]||""} onChange={e=>updateLine(sl.service,{[k]:Number(e.target.value)||undefined})} min="0" max="50" placeholder={k==="emRate"||k==="rmRate"?"2":"5"}/>
                  </div>
                ))}
              </div>
            </>}

            {preview&&<div style={{background:T.surface,borderRadius:8,padding:10,border:`1px solid ${T.border}`}}>
              <p style={{...S.label,fontSize:9,marginBottom:8}}>Commission Preview</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {[["Referrer",preview.refTotal,T.warn],["Closer",preview.closerTotal,T.accent2],["EM",preview.emEarned,T.accent],["RM",preview.rmEarned,T.accent3]].map(([r,a,c])=>(
                  <div key={r} style={{textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.text3,marginBottom:2}}>{r}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:12,color:c,fontWeight:500}}>{fmt$(a,sl.currency)}</div>
                  </div>
                ))}
              </div>
              <div style={{textAlign:"right",marginTop:6,paddingTop:6,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.text3}}>
                Total: <span style={{fontFamily:"DM Mono,monospace",color:T.text,fontWeight:500}}>{fmt$(preview.grand,sl.currency)}</span>
              </div>
            </div>}
          </div>
        );})}
      </div>}

      {/* ── Step 4: Notes + Summary ───────────────────────────────────── */}
      {step===4&&<div>
        <Fld label="Notes"><textarea value={nLead.notes} onChange={e=>setNL(p=>({...p,notes:e.target.value}))} style={{...S.input,height:80,resize:"vertical"}} placeholder="Budget signals, timeline, competition…"/></Fld>
        {/* Summary */}
        <div style={{...S.card2,marginTop:16}}>
          <p style={{...S.label,marginBottom:12}}>Lead Summary</p>
          <div style={{marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:T.text}}>{nLead.name}</span>
            <span style={{fontSize:12,color:T.text3,marginLeft:8}}>{nLead.company} · {nLead.brand}</span>
          </div>
          {serviceLines.map(sl=>{
            const val = sl.dealType==="monthly"?`${fmtC(sl.monthlyValue,sl.currency)}/mo`:
                        sl.dealType==="one_time"?fmtC(sl.oneTimeValue,sl.currency):
                        `${fmtC(sl.monthlyValue,sl.currency)}/mo + ${fmtC(sl.oneTimeValue,sl.currency)}`;
            const ref=users.find(u=>u.id===sl.referrerId), cls=users.find(u=>u.id===sl.closerId);
            const preview = computeCommissionTimeline({monthly:Number(sl.monthlyValue)||0,oneTime:Number(sl.oneTimeValue)||0,
              duration:Number(sl.durationMonths)||12,lostAt:0,
              refRate:Number(sl.referrerRate)||5,closerRate:Number(sl.closerRate)||5,
              emRate:Number(sl.emRate)||2,rmRate:Number(sl.rmRate)||2});
            return (
              <div key={sl.service} style={{borderTop:`1px solid ${T.border}`,paddingTop:10,marginTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:T.accent2}}>{sl.service}</span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:T.text}}>{val}</span>
                </div>
                <div style={{fontSize:11,color:T.text3,marginBottom:4}}>
                  Ref: {ref?.name||"—"} · Closer: {cls?.name||"—"} · {sl.durationMonths}mo
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                  {[["R",preview.refTotal,T.warn],["C",preview.closerTotal,T.accent2],["EM",preview.emEarned,T.accent],["RM",preview.rmEarned,T.accent3]].map(([r,a,c])=>(
                    <div key={r} style={{textAlign:"center",background:T.surface,borderRadius:6,padding:"4px 0"}}>
                      <div style={{fontSize:9,color:T.text3}}>{r}</div>
                      <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:c}}>{fmt$(a,sl.currency)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      <div style={{display:"flex",justifyContent:"space-between",paddingTop:16,borderTop:`1px solid ${T.border}`,marginTop:16}}>
        <button onClick={()=>step>1?setStep(s=>s-1):onClose()} style={{...S.btn,background:T.surface2,color:T.text2,display:"flex",alignItems:"center",gap:4}}>
          {step>1&&<ChevronLeft size={13}/>}{step>1?"Back":"Cancel"}
        </button>
        <button
          onClick={()=>{ if(step===1&&!v1)return; if(step===2&&!v2)return; if(step===3&&!v3)return; step===4?onSave():setStep(s=>s+1); }}
          disabled={(step===1&&!v1)||(step===2&&!v2)||(step===3&&!v3)}
          style={{...S.btn,background:T.accent,color:"#000",display:"flex",alignItems:"center",gap:4,
            opacity:((step===1&&!v1)||(step===2&&!v2)||(step===3&&!v3))?0.4:1}}>
          {step===4?"Save Lead":"Next"}<ChevronRight size={13}/>
        </button>
      </div>
    </Modal>
  );
};


// =============================================================================
// LeadsView
// =============================================================================
const LeadsView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const [nLead,setNL] = useState(EL);
const [sf,setSf]=useState("all"); const [geoF,setGeoF]=useState("all"); const [typeF,setTypeF]=useState("all");
const [dateFrom,setDateFrom]=useState("");
const [dateTo,setDateTo]=useState("");
const [sortBy,setSortBy]=useState("date_desc");
const filteredBase = visLeads.filter(l=>{
    if(dateFrom&&l.createdAt&&l.createdAt<dateFrom) return false;
    if(dateTo&&l.createdAt&&l.createdAt>dateTo) return false;
    const q=search.toLowerCase();
    return (!q||l.name.toLowerCase().includes(q)||l.company.toLowerCase().includes(q)||(l.brand||"").toLowerCase().includes(q))&&(sf==="all"||l.dealStatus===sf)&&(geoF==="all"||l.country===geoF)&&(typeF==="all"||l.dealType===typeF);
  });
  const filtered = [...filteredBase].sort((a,b)=>{
    if(sortBy==="date_desc") return (b.createdAt||"").localeCompare(a.createdAt||"");
    if(sortBy==="date_asc") return (a.createdAt||"").localeCompare(b.createdAt||"");
    if(sortBy==="value_desc") return (Number(b.monthlyValue)||Number(b.oneTimeValue)||0)-(Number(a.monthlyValue)||Number(a.oneTimeValue)||0);
    if(sortBy==="company") return a.company.localeCompare(b.company);
    return 0;
  });
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:0}}>Leads</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportCSV(filtered.map(l=>({Name:l.name,Company:l.company,Brand:l.brand||"",Division:l.division||"",Email:l.email,Phone:`${l.countryCode}${l.phone}`,Country:l.country,Status:l.dealStatus,Type:l.dealType,Monthly:l.monthlyValue||0,OneTime:l.oneTimeValue||0,Currency:l.currency,Duration:l.durationMonths||"",Referrer:getUser(l.referrerId)?.name||"",Closer:getUser(l.closerId)?.name||"",EM:getUser(l.pmId)?.name||"",RM:getUser(l.rmId)?.name||"",Services:(l.services||[]).join("; "),Notes:l.notes||""  })),"leads_export")} style={{...S.btn,background:T.surface2,color:T.text2,border:`1px solid ${T.border2}`,display:"flex",alignItems:"center",gap:6,fontSize:12}}><Download size={12}/>Export</button>
          <button onClick={()=>setShowAddLead(true)} style={{...S.btn,background:T.accent,color:"#000",display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>Add Lead</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Sel value={sf} onChange={e=>setSf(e.target.value)}><option value="all">All Statuses</option>{DEAL_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</Sel>
        <Sel value={typeF} onChange={e=>setTypeF(e.target.value)}><option value="all">All Types</option><option value="monthly">Monthly</option><option value="one_time">One-Time</option><option value="combo">Combined</option><option value="custom">Custom</option></Sel>
        <Sel value={geoF} onChange={e=>setGeoF(e.target.value)}><option value="all">All Countries</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</Sel>
        <Sel value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="date_desc">Newest First</option><option value="date_asc">Oldest First</option><option value="value_desc">Highest Value</option><option value="company">Company A-Z</option></Sel>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...S.input,width:"auto",fontSize:11,padding:"5px 8px"}} title="From date"/>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...S.input,width:"auto",fontSize:11,padding:"5px 8px"}} title="To date"/>
        {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} style={{...S.btn,padding:"5px 10px",fontSize:11,background:T.surface2,color:T.text3}}>Clear dates</button>}
        <span style={{marginLeft:"auto",fontSize:12,color:T.text3,alignSelf:"center"}}>{filtered.length} leads</span>
      </div>
      <div style={{...S.card,padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Lead / Brand","Deal","Roles","Added","Status","Actions"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:600,color:T.text3,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>)}</tr></thead>
          <tbody>{filtered.length===0&&<tr><td colSpan="5" style={{padding:"40px",textAlign:"center",color:T.text3,fontSize:13}}>No leads match your filters.</td></tr>}
          {filtered.map(l=>{
            const ref=getUser(l.referrerId), closer=getUser(l.closerId), em=getUser(l.pmId), rm=getUser(l.rmId);
            return <tr key={l.id} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:"12px 16px"}}>
                <button onClick={()=>setSelLead(l)} style={{background:"none",border:"none",textAlign:"left",cursor:"pointer",padding:0}}>
                  <div style={{fontWeight:600,color:T.text,fontSize:13}}>{l.name}</div>
                  <div style={{fontSize:11,color:T.text3}}>{l.company}{l.brand?` · ${l.brand}`:""}{l.division?<span style={{marginLeft:6,background:T.surface2,padding:"1px 5px",borderRadius:3,fontSize:9}}>{l.division}</span>:""}</div>
                  <div style={{fontSize:10,color:T.text3,marginTop:2}}>{l.country} · {l.source}</div>
                </button>
              </td>
              <td style={{padding:"12px 16px"}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:13,color:T.text,fontWeight:500}}>
                  {l.dealType==="monthly"?fmtC(l.monthlyValue,l.currency)+"/mo":l.dealType==="one_time"?fmtC(l.oneTimeValue,l.currency):l.dealType==="combo"?fmtC(l.monthlyValue,l.currency)+"/mo + "+fmtC(l.oneTimeValue,l.currency):`Custom ${l.customCommissionRate}%`}
                </div>
                <div style={{fontSize:10,color:T.text3}}>{l.dealType==="monthly"||l.dealType==="combo"?`${l.durationMonths||12} months`:l.dealType==="one_time"?"One-time":"Custom deal"}</div>
              </td>
              <td style={{padding:"12px 16px"}}>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  {[["R",ref,T.warn],["C",closer,T.accent2],["EM",em,T.accent],["RM",rm,T.accent3]].map(([r,u,c])=>u?<div key={r} style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:c,fontWeight:700,width:16}}>{r}</span><span style={{fontSize:11,color:T.text2}}>{u.name.split(" ")[0]}</span></div>:null)}
                  {l.dealType==="custom"&&l.customCommissionUserId&&<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:T.accent3,fontWeight:700,width:16}}>CX</span><span style={{fontSize:11,color:T.text2}}>{getUser(l.customCommissionUserId)?.name.split(" ")[0]} ({l.customCommissionRate}%)</span></div>}
                </div>
              </td>
              <td style={{padding:"12px 16px",fontSize:11,color:T.text3,fontFamily:"DM Mono,monospace"}}>{l.createdAt||"—"}</td>
              <td style={{padding:"8px 16px"}}>{(l.services||[]).length>0?<div style={{display:"flex",flexWrap:"wrap",gap:3}}>{(l.services||[]).slice(0,2).map(s=><span key={s} style={{fontSize:9,background:`${T.accent2}12`,color:T.accent2,padding:"2px 5px",borderRadius:3}}>{s}</span>)}{(l.services||[]).length>2&&<span style={{fontSize:9,color:T.text3}}>+{(l.services||[]).length-2}</span>}</div>:<span style={{fontSize:11,color:T.text3}}>—</span>}</td>
              <td style={{padding:"8px 16px",fontSize:11,color:T.text3,fontFamily:"DM Mono,monospace",whiteSpace:"nowrap"}}>{l.createdAt||"—"}</td>
              <td style={{padding:"12px 16px"}}><DealBadge status={l.dealStatus}/></td>
              <td style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <WABtn phone={l.phone} code={l.countryCode} msg={`Hi ${l.name.split(" ")[0]}, following up from Nexus.`}/>
                  <MailBtn email={l.email} subj={`Follow up - ${l.company}`} body={`Hi ${l.name.split(" ")[0]},\n\nFollowing up on our discussion.\n\nBest,`}/>
                  <button onClick={()=>setSelLead(l)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Edit3 size={13}/></button>
                  <button onClick={()=>deleteLead(l.id)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Trash2 size={13}/></button>
                </div>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      {showAddLead&&<AddLeadWizard nLead={nLead} setNL={setNL} onClose={()=>{setShowAddLead(false);setNL(EL);}} onSave={()=>{addLead(nLead);setNL(EL);setShowAddLead(false);}} ctx={ctx}/>}
    </div>
  );
};


// =============================================================================
// LeadDrawer
// =============================================================================
const LeadDrawer = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  if(!selLead) return null;
  const lead = leads.find(l=>l.id===selLead.id)||selLead;
  const [editingLead,setEditingLead]=useState(false);
  const [editDraft,setED]=useState(null);
  const dr=editDraft||lead;
  const ref=getUser(lead.referrerId), closer=getUser(lead.closerId), em=getUser(lead.pmId), rm=getUser(lead.rmId);
  const result = lead.dealType!=="custom" ? computeCommissionTimeline({
    monthly:Number(lead.monthlyValue)||0, oneTime:Number(lead.oneTimeValue)||0,
    duration:Number(lead.durationMonths)||12, lostAt:Number(lead.lostAtMonth)||0,
    refRate:lead.referrerRate||5, closerRate:lead.closerRate||5, emRate:lead.emRate||2, rmRate:lead.rmRate||2
  }) : null;
  const [scoreLoading,setScoreLoading]=useState(lead.aiScore===-1);
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={()=>setSelLead(null)}/>
      <div style={{position:"relative",width:"100%",maxWidth:560,background:T.surface,height:"100%",overflowY:"auto",boxShadow:"-20px 0 60px rgba(0,0,0,0.6)"}}>
        <div style={{padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <DealBadge status={lead.dealStatus}/>
              <h2 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:"8px 0 4px"}}>{lead.name}</h2>
              <p style={{fontSize:13,color:T.text3,margin:0}}>{lead.company} {lead.brand?`· ${lead.brand}`:""} {lead.division?`· ${lead.division}`:""}</p>
              <p style={{fontSize:11,color:T.text3,marginTop:4}}>{lead.country} · {lead.source}</p>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditingLead(true)} style={{...S.btn,padding:"6px 12px",fontSize:11,background:T.surface2,color:T.text2,border:`1px solid ${T.border2}`,display:"flex",alignItems:"center",gap:4}}><Edit3 size={11}/>Edit</button>
              <button onClick={()=>setSelLead(null)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><X size={20}/></button>
            </div>
          </div>

          {/* Contact */}
          <div style={{...S.card2,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
            {lead.email&&<div style={{display:"flex",alignItems:"center",gap:8}}><Mail size={13} style={{color:T.text3}}/><span style={{fontSize:13,color:T.text2}}>{lead.email}</span><MailBtn email={lead.email} subj={`Re: ${lead.company}`} body={`Hi ${lead.name.split(" ")[0]},`}/></div>}
            {lead.phone&&<div style={{display:"flex",alignItems:"center",gap:8}}><Phone size={13} style={{color:T.text3}}/><span style={{fontSize:13,color:T.text2}}>{lead.countryCode} {lead.phone}</span><WABtn phone={lead.phone} code={lead.countryCode} msg={`Hi ${lead.name.split(" ")[0]}, following up from Nexus.`}/></div>}
          </div>

          {/* Deal info */}
          <div style={{...S.card2,marginBottom:16}}>
            <p style={{...S.label,marginBottom:10}}>Deal Info</p>
            {[
              ["Type", lead.dealType==="monthly"?"Monthly":lead.dealType==="one_time"?"One-Time":lead.dealType==="combo"?"Combined":"Custom"],
              lead.monthlyValue&&["Monthly Value", fmtC(lead.monthlyValue,lead.currency)],
              lead.oneTimeValue&&["One-Time Value", fmtC(lead.oneTimeValue,lead.currency)],
              lead.durationMonths&&["Duration", `${lead.durationMonths} months`],
              lead.lostAtMonth&&Number(lead.lostAtMonth)>0&&["Lost at Month", lead.lostAtMonth],
            ].filter(Boolean).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:12,color:T.text3}}>{k}</span>
                <span style={{fontSize:12,color:T.text,fontFamily:"DM Mono,monospace"}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Roles */}
          <div style={{...S.card2,marginBottom:16}}>
            <p style={{...S.label,marginBottom:10}}>Roles</p>
            {[["Referrer",ref,T.warn,lead.referrerRate||5+"%"],["Closer",closer,T.accent2,lead.closerRate||5+"%"],["Eng. Manager",em,T.accent,lead.emRate||2+"%"],["Rel. Manager",rm,T.accent3,lead.rmRate||2+"%"]].map(([r,u,c,rate])=>(
              <div key={r} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,fontWeight:700,color:c,width:80}}>{r}</span>{u?<><Avatar user={u} size="sm"/><span style={{fontSize:12,color:T.text2}}>{u.name}</span></>:<span style={{fontSize:11,color:T.text3}}>-</span>}</div>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:c}}>{rate}</span>
              </div>
            ))}
            {lead.dealType==="custom"&&lead.customCommissionUserId&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,fontWeight:700,color:T.accent3,width:80}}>Custom</span><Avatar user={getUser(lead.customCommissionUserId)} size="sm"/><span style={{fontSize:12,color:T.text2}}>{getUser(lead.customCommissionUserId)?.name}</span></div>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:T.accent3}}>{lead.customCommissionRate}%</span>
              </div>
            )}
          </div>

          {/* Commission summary */}
          {result&&<div style={{...S.card2,marginBottom:16}}>
            <p style={{...S.label,marginBottom:10}}>Commission Breakdown</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
              {[["Referrer",result.refTotal,T.warn],["Closer",result.closerTotal,T.accent2],["EM",result.emEarned,T.accent],["RM",result.rmEarned,T.accent3]].map(([r,a,c])=>(
                <div key={r} style={{textAlign:"center"}}><div style={{fontSize:9,color:T.text3,marginBottom:2}}>{r}</div><div style={{fontFamily:"DM Mono,monospace",fontSize:13,color:c,fontWeight:500}}>{fmt$(a,lead.currency)}</div></div>
              ))}
            </div>
            {(result.emClaw>0||result.rmClaw>0)&&<div style={{background:"rgba(255,77,109,0.06)",border:`1px solid ${T.red}30`,borderRadius:6,padding:"8px 12px",marginBottom:8}}>
              <p style={{fontSize:10,color:T.red,fontWeight:600,margin:"0 0 4px"}}>Clawback - Tier {result.clawTier}</p>
              {result.emClaw>0&&<p style={{fontSize:11,color:T.red,margin:"2px 0",fontFamily:"DM Mono,monospace"}}>EM: −{fmt$(result.emClaw,lead.currency)}</p>}
              {result.rmClaw>0&&<p style={{fontSize:11,color:T.red,margin:"2px 0",fontFamily:"DM Mono,monospace"}}>RM: −{fmt$(result.rmClaw,lead.currency)}</p>}
            </div>}
            <div style={{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${T.border}`,paddingTop:8}}>
              <span style={{fontSize:12,color:T.text3}}>Net commission cost</span>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:14,color:T.text,fontWeight:500}}>{fmt$(result.grand,lead.currency)}</span>
            </div>
          </div>}

          {/* AI Score */}
          <div style={{...S.card2,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <p style={{...S.label,margin:0}}>AI Lead Score</p>
              <button onClick={()=>scoreLead(lead.id)} style={{...S.btn,padding:"4px 12px",fontSize:11,background:T.surface,color:T.text3,border:`1px solid ${T.border2}`,display:"flex",alignItems:"center",gap:4}}><Sparkles size={10}/>{lead.aiScore!=null?"Rescore":"Score Now"}</button>
            </div>
            {lead.aiScore===null&&<p style={{fontSize:12,color:T.text3}}>Click Score Now for an AI close probability.</p>}
            {lead.aiScore===-1&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:T.text3}}><div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${T.accent2}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>Analysing…</div>}
            {lead.aiScore!=null&&lead.aiScore!==-1&&<>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:32,fontWeight:500,color:lead.aiScore>=70?T.accent:lead.aiScore>=40?T.warn:T.red}}>{lead.aiScore}</span>
                <div style={{flex:1,height:6,background:T.border,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:lead.aiScore>=70?T.accent:lead.aiScore>=40?T.warn:T.red,width:`${lead.aiScore}%`,transition:"width 0.5s"}}/></div>
                <span style={{fontSize:11,color:T.text3}}>/100</span>
              </div>
              {lead.aiNote&&<p style={{fontSize:11,color:T.text3,fontStyle:"italic"}}>"{lead.aiNote}"</p>}
            </>}
          </div>

          {/* Status + Won action */}
          <div style={{marginBottom:16}}>
            <p style={{...S.label,marginBottom:8}}>Move to Status</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
              {DEAL_STATUSES.map(s=><button key={s.key} onClick={()=>updateLeadStatus(lead.id,s.key)} style={{padding:"8px 4px",borderRadius:6,border:`1px solid ${lead.dealStatus===s.key?s.color:T.border2}`,background:lead.dealStatus===s.key?`${s.color}15`:T.surface2,color:lead.dealStatus===s.key?s.color:T.text3,fontSize:10,fontWeight:600,cursor:"pointer"}}>{s.label}</button>)}
            </div>
            {lead.dealStatus!=="won"&&<button onClick={()=>wonToEngagement(lead)} style={{...S.btn,width:"100%",justifyContent:"center",background:"rgba(0,229,160,0.12)",color:T.accent,border:`1px solid ${T.accent}40`,display:"flex",alignItems:"center",gap:6,fontWeight:600}}><CheckCheck size={14}/>Mark Won & Create Engagement</button>}
            {lead.dealStatus==="won"&&<div style={{textAlign:"center",fontSize:12,color:T.accent,padding:"8px",background:"rgba(0,229,160,0.06)",borderRadius:6,border:`1px solid ${T.accent}30`}}>Deal won - engagement created</div>}
          </div>

          {/* Services */}
          {(lead.services||[]).length>0&&<div style={{marginBottom:16}}>
            <p style={{...S.label,marginBottom:8}}>Services</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(lead.services||[]).map(s=><span key={s} style={{fontSize:10,background:`${T.accent2}12`,color:T.accent2,padding:"3px 8px",borderRadius:4,border:`1px solid ${T.accent2}20`}}>{s}</span>)}</div>
          </div>}

          {lead.notes&&<div style={{...S.card2,fontSize:12,color:T.text2}}><p style={{...S.label,marginBottom:4}}>Notes</p>{lead.notes}</div>}
        </div>
      </div>
      {editingLead&&<Modal title="Edit Lead" onClose={()=>{setEditingLead(false);setED(null);}} onSave={async()=>{ const updated={...dr}; await supabase.from("leads").update(leadToDb(updated)).eq("id",updated.id); setLeads(p=>p.map(l=>l.id===updated.id?updated:l)); setSelLead(updated); setEditingLead(false); setED(null); }} saveLabel="Save Changes" wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Contact Name"><Inp value={dr.name} onChange={e=>setED(p=>({...(p||lead),name:e.target.value}))}/></Fld>
          <Fld label="Company"><Inp value={dr.company} onChange={e=>setED(p=>({...(p||lead),company:e.target.value}))}/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Brand"><Inp value={dr.brand||""} onChange={e=>setED(p=>({...(p||lead),brand:e.target.value}))}/></Fld>
          <Fld label="Division"><Inp value={dr.division||""} onChange={e=>setED(p=>({...(p||lead),division:e.target.value}))}/></Fld>
        </div>
        <Fld label="Email"><Inp value={dr.email||""} onChange={e=>setED(p=>({...(p||lead),email:e.target.value}))}/></Fld>
        <Fld label="Phone"><PhoneInput code={dr.countryCode} phone={dr.phone} onCode={v=>setED(p=>({...(p||lead),countryCode:v}))} onPhone={v=>setED(p=>({...(p||lead),phone:v}))}/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Country"><Sel value={dr.country} onChange={e=>setED(p=>({...(p||lead),country:e.target.value}))}>{[...COUNTRIES,"Other"].map(c=><option key={c}>{c}</option>)}</Sel></Fld>
          <Fld label="Source"><Sel value={dr.source||"Inbound"} onChange={e=>setED(p=>({...(p||lead),source:e.target.value}))}>{["Inbound","Outbound","Referral","Partner","Event","Cold Outreach"].map(s=><option key={s}>{s}</option>)}</Sel></Fld>
        </div>
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:4}}>
          <p style={{...S.label,marginBottom:10}}>Deal Structure</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Fld label="Deal Type"><Sel value={dr.dealType} onChange={e=>setED(p=>({...(p||lead),dealType:e.target.value}))}><option value="monthly">Monthly</option><option value="one_time">One-Time</option><option value="combo">Combined</option><option value="custom">Custom</option></Sel></Fld>
            <Fld label="Currency"><Sel value={dr.currency} onChange={e=>setED(p=>({...(p||lead),currency:e.target.value}))}>{Object.keys(CURRENCIES).map(c=><option key={c}>{c}</option>)}</Sel></Fld>
          </div>
          {(dr.dealType==="monthly"||dr.dealType==="combo")&&<Fld label="Monthly Value"><Inp type="number" value={dr.monthlyValue||""} onChange={e=>setED(p=>({...(p||lead),monthlyValue:e.target.value}))}/></Fld>}
          {(dr.dealType==="one_time"||dr.dealType==="combo")&&<Fld label="One-Time Value"><Inp type="number" value={dr.oneTimeValue||""} onChange={e=>setED(p=>({...(p||lead),oneTimeValue:e.target.value}))}/></Fld>}
          {dr.dealType!=="one_time"&&<Fld label="Duration (months)"><Inp type="number" value={dr.durationMonths||12} onChange={e=>setED(p=>({...(p||lead),durationMonths:e.target.value}))}/></Fld>}
        </div>
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:4}}>
          <p style={{...S.label,marginBottom:10}}>Roles & Commission Rates</p>
          {[["referrerId","Referrer"],["closerId","Closer"],["pmId","Engagement Manager"],["rmId","Relationship Manager"]].map(([f,l])=>(
            <Fld key={f} label={l}><Sel value={dr[f]||""} onChange={e=>setED(p=>({...(p||lead),[f]:e.target.value}))}><option value="">Select…</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Sel></Fld>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:8}}>
            {[["referrerRate","Referrer %"],["closerRate","Closer %"],["emRate","EM %"],["rmRate","RM %"]].map(([k,l])=>(
              <div key={k}><label style={{...S.label,fontSize:9}}>{l}</label><Inp type="number" value={dr[k]||""} onChange={e=>setED(p=>({...(p||lead),[k]:Number(e.target.value)}))}/></div>
            ))}
          </div>
        </div>
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,marginTop:4}}>
          <p style={{...S.label,marginBottom:8}}>Services</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,maxHeight:160,overflowY:"auto",border:`1px solid ${T.border}`,borderRadius:8,padding:10,background:T.surface2}}>
            {SERVICES.map(s=><label key={s} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:(dr.services||[]).includes(s)?T.accent:T.text2}}><input type="checkbox" checked={(dr.services||[]).includes(s)} onChange={ev=>setED(p=>({...(p||lead),services:ev.target.checked?[...((p||lead).services||[]),s]:((p||lead).services||[]).filter(x=>x!==s)}))} style={{accentColor:T.accent}}/>{s}</label>)}
          </div>
        </div>
        <Fld label="Notes"><textarea value={dr.notes||""} onChange={e=>setED(p=>({...(p||lead),notes:e.target.value}))} style={{...S.input,height:80,resize:"vertical"}}/></Fld>
      </Modal>}
    </div>
  );
};


// =============================================================================
// CommissionsView
// =============================================================================
const CommissionsView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const [viewUser,setViewUser] = useState(currentUser.id);
  const allEntries = useMemo(()=>{
    const entries=[];
    leads.forEach(l=>entries.push(...computeLeadCommissions(l,payments)));
    return entries;
  },[leads,payments]);
  const myEntries = isSA(currentUser) ? allEntries.filter(e=>e.userId===viewUser) : allEntries.filter(e=>e.userId===currentUser.id);
  const earned  = myEntries.filter(e=>e.type==="earn"&&e.status==="paid").reduce((s,e)=>s+e.amount,0);
  const pending = myEntries.filter(e=>e.type==="earn"&&e.status!=="paid").reduce((s,e)=>s+e.amount,0);
  const claw    = myEntries.filter(e=>e.type==="claw").reduce((s,e)=>s+e.amount,0);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:0}}>Commissions</h1><p style={{color:T.text3,fontSize:13,marginTop:4}}>Earned on paid payments. Clawbacks shown as negatives.</p></div>
        {isSA(currentUser)&&<Sel value={viewUser} onChange={e=>setViewUser(e.target.value)}>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Sel>}
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
        {[["Earned (Paid)",earned,T.accent],["Pending",pending,T.warn],["Clawback",claw,T.red]].map(([l,v,c])=>(
          <div key={l} style={S.card2}>
            <div style={{fontSize:10,color:T.text3,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{l}</div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:22,fontWeight:500,color:c}}>{fmt$(Math.abs(v))}</div>
          </div>
        ))}
      </div>

      {/* Entries table */}
      <div style={{...S.card,padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Lead","Role","Description","Amount","Month","Status"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:600,color:T.text3,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>)}</tr></thead>
          <tbody>
            {myEntries.length===0&&<tr><td colSpan="6" style={{padding:"40px",textAlign:"center",color:T.text3,fontSize:13}}>No commission entries yet.</td></tr>}
            {myEntries.map(e=>{
              const isPaid=e.status==="paid"; const isClaw=e.type==="claw";
              const roleColors={Referrer:T.warn,Closer:T.accent2,"Eng. Manager":T.accent,"Rel. Manager":T.accent3,Custom:T.accent3};
              return <tr key={e.id} style={{borderBottom:`1px solid ${T.border}`,background:isClaw?"rgba(255,77,109,0.04)":"transparent"}}>
                <td style={{padding:"10px 16px",fontSize:13,color:T.text,fontWeight:500}}>{e.lead}</td>
                <td style={{padding:"10px 16px"}}><span style={{fontSize:10,fontWeight:700,color:roleColors[e.role]||T.text2}}>{e.role}</span></td>
                <td style={{padding:"10px 16px",fontSize:12,color:T.text3}}>{e.description}</td>
                <td style={{padding:"10px 16px",fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:500,color:isClaw?T.red:T.accent}}>{isClaw?"-":""}{fmt$(Math.abs(e.amount))}</td>
                <td style={{padding:"10px 16px",fontSize:11,color:T.text3,fontFamily:"DM Mono,monospace"}}>M{e.month}</td>
                <td style={{padding:"10px 16px"}}>
                  {e.status==="clawback"?<span style={{fontSize:10,fontWeight:700,color:T.red,background:"rgba(255,77,109,0.1)",padding:"2px 8px",borderRadius:4}}>Clawback</span>
                  :e.status==="paid"?<span style={{fontSize:10,fontWeight:700,color:T.accent,background:"rgba(0,229,160,0.1)",padding:"2px 8px",borderRadius:4}}>Paid</span>
                  :<span style={{fontSize:10,fontWeight:700,color:T.warn,background:"rgba(255,179,71,0.1)",padding:"2px 8px",borderRadius:4}}>Pending</span>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// =============================================================================
// SimulatorView
// =============================================================================
const SimulatorView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const [deal,setDeal] = useState({monthly:1000,oneTime:0,duration:12,lostAt:0,refRate:5,closerRate:5,emRate:2,rmRate:2,type:"monthly"});
  const result = useMemo(()=>computeCommissionTimeline({monthly:deal.type==="onetime"?0:Number(deal.monthly)||0,oneTime:deal.type==="monthly"?0:Number(deal.oneTime)||0,duration:Number(deal.duration)||12,lostAt:Number(deal.lostAt)||0,refRate:Number(deal.refRate)||5,closerRate:Number(deal.closerRate)||5,emRate:Number(deal.emRate)||2,rmRate:Number(deal.rmRate)||2}),[deal]);
  const scenarios = [
    {label:"$1k/mo · 12 months",t:{type:"monthly",monthly:1000,oneTime:0,duration:12,lostAt:0,refRate:5,closerRate:5,emRate:2,rmRate:2}},
    {label:"$8k one-time",t:{type:"onetime",monthly:0,oneTime:8000,duration:1,lostAt:0,refRate:5,closerRate:5,emRate:2,rmRate:2}},
    {label:"$2k/mo · lost M3",t:{type:"monthly",monthly:2000,oneTime:0,duration:12,lostAt:3,refRate:5,closerRate:5,emRate:2,rmRate:2}},
    {label:"$2k/mo · lost M5",t:{type:"monthly",monthly:2000,oneTime:0,duration:12,lostAt:5,refRate:5,closerRate:5,emRate:2,rmRate:2}},
    {label:"$3k+$800/mo combo",t:{type:"combo",monthly:800,oneTime:3000,duration:12,lostAt:0,refRate:5,closerRate:5,emRate:2,rmRate:2}},
  ];
  const clawLabel = result.clawTier===0?"No loss - no clawback":result.clawTier===1?"Lost ≤ M3 - both EM & RM clawback":result.clawTier===2?"Lost M4-M6 - EM clawback only":"Lost > M6 - no clawback";
  const clawColor = result.clawTier===0?T.accent:result.clawTier===3?T.accent:T.red;
  return (
    <div>
      <div style={{marginBottom:24}}><h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:0}}>Commission Simulator</h1><p style={{color:T.text3,fontSize:13,marginTop:4}}>Model any deal structure and see the full payout timeline.</p></div>

      {/* Scenarios */}
      <div style={{...S.card,marginBottom:16}}>
        <p style={{...S.label,marginBottom:10}}>Quick Scenarios</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {scenarios.map(s=><button key={s.label} onClick={()=>setDeal(p=>({...p,...s.t}))} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${T.border2}`,background:"transparent",color:T.text2,fontSize:12,cursor:"pointer"}}>{s.label}</button>)}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div style={S.card}>
          <p style={{...S.label,marginBottom:14}}>Deal Configuration</p>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {["monthly","onetime","combo"].map(t=><button key={t} onClick={()=>setDeal(p=>({...p,type:t}))} style={{flex:1,padding:"8px 4px",borderRadius:6,border:`1px solid ${deal.type===t?T.accent:T.border2}`,background:deal.type===t?"rgba(0,229,160,0.08)":T.surface2,color:deal.type===t?T.accent:T.text2,fontSize:12,fontWeight:500,cursor:"pointer"}}>{t==="monthly"?"Monthly":t==="onetime"?"One-Time":"Combined"}</button>)}
          </div>
          {deal.type!=="onetime"&&<Fld label="Monthly Value ($)"><Inp type="number" value={deal.monthly} onChange={e=>setDeal(p=>({...p,monthly:e.target.value}))}/></Fld>}
          {deal.type!=="monthly"&&<Fld label="One-Time Value ($)"><Inp type="number" value={deal.oneTime} onChange={e=>setDeal(p=>({...p,oneTime:e.target.value}))}/></Fld>}
          <Fld label="Duration (months)"><Inp type="number" value={deal.duration} onChange={e=>setDeal(p=>({...p,duration:e.target.value}))} min="1" max="60"/></Fld>
          <Fld label="Lost at Month (0 = not lost)"><Inp type="number" value={deal.lostAt} onChange={e=>setDeal(p=>({...p,lostAt:e.target.value}))} min="0" max={deal.duration}/></Fld>
        </div>
        <div style={S.card}>
          <p style={{...S.label,marginBottom:14}}>Commission Rates</p>
          {[["refRate","Referrer % (first bill only)","warn"],["closerRate","Closer % (one-time: full · monthly: quarterly)","accent2"],["emRate","Engagement Manager % (monthly · clawback)","accent"],["rmRate","Relationship Manager % (monthly · clawback)","accent3"]].map(([k,l,c])=>(
            <Fld key={k} label={l}><Inp type="number" value={deal[k]} onChange={e=>setDeal(p=>({...p,[k]:e.target.value}))} min="0" max="100" step="0.5"/></Fld>
          ))}
        </div>
      </div>

      {/* Clawback tier */}
      <div style={{...S.card,marginBottom:12}}>
        <p style={{...S.label,marginBottom:10}}>Active Clawback Tier</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["No loss - no clawback","Lost ≤ M3 - both EM & RM clawback","Lost M4-M6 - EM clawback only","Lost > M6 - no clawback"].map((l,i)=>(
            <span key={i} style={{padding:"5px 12px",borderRadius:5,fontSize:11,fontFamily:"DM Mono,monospace",border:`1px solid ${result.clawTier===i?clawColor:T.border2}`,color:result.clawTier===i?clawColor:T.text3,background:result.clawTier===i?`${clawColor}10`:"transparent"}}>{l}</span>
          ))}
        </div>
      </div>

      {/* Results cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:12}}>
        {[["Referrer",result.refTotal,T.warn,`${deal.refRate}% × 1st bill`],["Closer",result.closerTotal,T.accent2,deal.type==="monthly"?"Quarterly":"On payment"],["Eng. Mgr",result.emEarned,T.accent,`${deal.emRate}% × ${deal.type==="onetime"?1:deal.duration}mo`],["Rel. Mgr",result.rmEarned,T.accent3,`${deal.rmRate}% × ${deal.type==="onetime"?1:deal.duration}mo`],["EM Claw",result.emClaw>0?-result.emClaw:0,T.red,result.emClaw>0?`${deal.emRate}% × remaining`:"No clawback"],["RM Claw",result.rmClaw>0?-result.rmClaw:0,T.red,result.rmClaw>0?`${deal.rmRate}% × remaining`:"No clawback"]].map(([role,amt,c,detail])=>(
          <div key={role} style={S.card2}>
            <div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",color:T.text3,marginBottom:4}}>{role}</div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:18,fontWeight:500,color:c,marginBottom:2}}>{amt<0?"-":""}{fmt$(Math.abs(amt))}</div>
            <div style={{fontSize:10,color:T.text3,fontFamily:"DM Mono,monospace"}}>{detail}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={S.card}>
        <p style={{...S.label,marginBottom:12}}>Month-by-Month Payout Timeline</p>
        <div style={{display:"grid",gridTemplateColumns:"50px 1fr 1fr 1fr 1fr 1fr",gap:6,padding:"0 8px 8px",borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
          {["Month","Referrer","Closer","Eng. Mgr","Rel. Mgr","Row Total"].map(h=><div key={h} style={{fontSize:10,color:T.text3,fontFamily:"DM Mono,monospace"}}>{h}</div>)}
        </div>
        <div style={{maxHeight:320,overflowY:"auto"}}>
          {result.rows.map(row=>(
            <div key={row.m} style={{display:"grid",gridTemplateColumns:"50px 1fr 1fr 1fr 1fr 1fr",gap:6,padding:"7px 8px",borderRadius:6,background:row.m===1?"rgba(0,229,160,0.04)":row.afterLost?"rgba(255,77,109,0.04)":"transparent",border:`1px solid ${row.m===1?"rgba(0,229,160,0.2)":row.afterLost?"rgba(255,77,109,0.15)":"transparent"}`,marginBottom:3,fontFamily:"DM Mono,monospace",fontSize:11}}>
              <div style={{color:T.text,fontWeight:500}}>M{row.m}{row.isLost?" 🔴":""}</div>
              <div style={{color:row.rRef>0?T.warn:T.text3}}>{row.rRef>0?fmt$(row.rRef):"-"}{row.m===1&&row.rRef>0?<span style={{fontSize:9,background:"rgba(255,179,71,0.15)",color:T.warn,padding:"0 4px",borderRadius:3,marginLeft:4}}>1st</span>:""}</div>
              <div style={{color:row.rCls>0?T.accent2:T.text3}}>{row.rCls>0?fmt$(row.rCls):"-"}{((row.m-1)%3===0&&row.m+2<=result.rows.length&&row.rCls>0)?<span style={{fontSize:9,background:"rgba(0,102,255,0.15)",color:T.accent2,padding:"0 4px",borderRadius:3,marginLeft:4}}>Q</span>:""}</div>
              <div style={{color:row.afterLost&&result.emClaws?T.red:row.rEM>0?T.accent:T.text3}}>{row.rEM!==0?fmt$(row.rEM):"-"}</div>
              <div style={{color:row.afterLost&&result.rmClaws?T.red:row.rRM>0?T.accent3:T.text3}}>{row.rRM!==0?fmt$(row.rRM):"-"}</div>
              <div style={{color:row.total<0?T.red:row.total>0?T.text:T.text3,fontWeight:500}}>{fmt$(row.total)}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,padding:"12px 8px",background:T.surface2,borderRadius:8}}>
          <span style={{fontSize:13,color:T.text2}}>Grand total commission payout</span>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:20,fontWeight:500,color:T.accent}}>{fmt$(result.grand)}</span>
        </div>
      </div>
    </div>
  );
};


// =============================================================================
// EngagementsView
// =============================================================================
const EngagementsView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const EE={clientId:"",name:"",salesPersonId:"",pmId:"",status:"active",value:"",currency:"SGD",startDate:"",notes:""};
  const EP={engagementId:"",name:"",assignedTo:[],status:"active",value:"",currency:"SGD",type:"Development",notes:"",recurring:false,recurringDay:1,recurringAmount:""};
  const [nEng,setNE]=useState(EE); const [nProj,setNP]=useState(EP);
  const [statusF,setStatusF]=useState("all"); const [clientF,setClientF]=useState("all");
  const filtered=engagements.filter(e=>(statusF==="all"||e.status===statusF)&&(clientF==="all"||e.clientId===clientF));
  const grouped=useMemo(()=>{ const m={}; clients.forEach(c=>{m[c.id]={client:c,items:[]};}); filtered.forEach(e=>{if(m[e.clientId])m[e.clientId].items.push(e);}); return Object.values(m).filter(g=>g.items.length>0); },[filtered,clients]);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:0}}>Engagements</h1>
        <div style={{display:"flex",gap:8}}>
          {isAdmin(currentUser)&&<button onClick={()=>setShowAddClient(true)} style={{...S.btn,background:T.surface2,color:T.text2,border:`1px solid ${T.border2}`,display:"flex",alignItems:"center",gap:6,fontSize:12}}><Building2 size={12}/>Add Client</button>}
          <button onClick={()=>setShowAddEng(true)} style={{...S.btn,background:T.accent,color:"#000",display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>New Engagement</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <Sel value={statusF} onChange={e=>setStatusF(e.target.value)}><option value="all">All Statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></Sel>
        <Sel value={clientF} onChange={e=>setClientF(e.target.value)}><option value="all">All Clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {grouped.length===0&&<div style={{...S.card,textAlign:"center",color:T.text3,fontSize:13,padding:40}}>No engagements found.</div>}
        {grouped.map(({client,items})=>{ const isOpen=expandedClients[client.id]!==false; return (
          <div key={client.id} style={{...S.card,padding:0,overflow:"hidden"}}>
            <button onClick={()=>setExpClients(p=>({...p,[client.id]:!isOpen}))} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 20px",background:T.surface2,border:"none",cursor:"pointer",textAlign:"left"}}>
              <Building2 size={16} style={{color:T.text3,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:T.text,fontSize:14}}>{client.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
                  <span style={{fontSize:11,color:T.text3}}>{client.contact} · {client.country}</span>
                  <WABtn phone={client.phone} code={client.countryCode} msg={`Hi ${client.contact?.split(" ")[0]}, quick update.`}/>
                  <MailBtn email={client.email} subj={`Update - ${client.name}`} body="Hi,\n\n"/>
                </div>
              </div>
              <span style={{fontSize:11,color:T.text3,marginRight:8}}>{items.length} engagement{items.length!==1?"s":""}</span>
              {isOpen?<ChevronDown size={14} style={{color:T.text3}}/>:<ChevronRight size={14} style={{color:T.text3}}/>}
            </button>
            {isOpen&&<div style={{borderTop:`1px solid ${T.border}`}}>{items.map(eng=>{ const sp=getUser(eng.salesPersonId),pm=getUser(eng.pmId),engProjs=projects.filter(p=>p.engagementId===eng.id),isSel=selEng?.id===eng.id; return (
              <div key={eng.id}>
                <div onClick={()=>setSelEng(isSel?null:eng)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px 12px 44px",cursor:"pointer",background:isSel?"rgba(0,102,255,0.04)":"transparent",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontWeight:600,fontSize:13,color:isSel?T.accent2:T.text}}>{eng.name}</span>
                      <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:4,background:eng.status==="active"?"rgba(0,229,160,0.1)":T.surface2,color:eng.status==="active"?T.accent:T.text3}}>{eng.status}</span>
                    </div>
                    <div style={{display:"flex",gap:10,marginTop:4,alignItems:"center"}}>
                      <span style={{fontSize:11,color:T.text3}}>Sales: <span style={{color:T.text2,fontWeight:500}}>{sp?.name||"-"}</span></span>
                      {sp&&<WABtn phone={sp.phone} code={sp.countryCode} msg={`Hi ${sp.name.split(" ")[0]}, update on ${eng.name}.`}/>}
                      <span style={{fontSize:11,color:T.text3}}>PM: <span style={{color:T.text2,fontWeight:500}}>{pm?.name||"-"}</span></span>
                      <span style={{fontSize:11,color:T.text3}}>{engProjs.length} project{engProjs.length!==1?"s":""}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"DM Mono,monospace",fontSize:13,color:T.text,fontWeight:500}}>{fmtC(eng.value,eng.currency)}</span>
                    {isAdmin(currentUser)&&<><button onClick={e=>{e.stopPropagation();setEditEng({...eng});}} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Edit3 size={12}/></button><button onClick={e=>{e.stopPropagation();if(window.confirm(`Delete "${eng.name}"?`))deleteEng(eng.id);}} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Trash2 size={12}/></button></>}
                    {isSel?<ChevronDown size={13} style={{color:T.accent2}}/>:<ChevronRight size={13} style={{color:T.text3}}/>}
                  </div>
                </div>
                {isSel&&<div style={{background:"rgba(0,102,255,0.03)",borderBottom:`1px solid ${T.border}`,padding:"14px 20px 14px 44px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:11,fontWeight:600,color:T.text3,textTransform:"uppercase",letterSpacing:"0.07em"}}>Sub-Projects ({engProjs.length})</span>
                    <button onClick={e=>{e.stopPropagation();setNP({...EP,engagementId:eng.id,currency:eng.currency});setShowAddProj(true);}} style={{...S.btn,padding:"5px 12px",fontSize:11,background:T.surface,color:T.text2,border:`1px solid ${T.border2}`,display:"flex",alignItems:"center",gap:4}}><Plus size={11}/>Add Project</button>
                  </div>
                  {engProjs.length===0?<p style={{fontSize:12,color:T.text3}}>No projects yet.</p>:<div style={{display:"flex",flexDirection:"column",gap:6}}>{engProjs.map(pr=>(
                    <div key={pr.id} style={{display:"flex",alignItems:"center",gap:10,background:T.surface2,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontWeight:600,fontSize:13,color:T.text}}>{pr.name}</span>
                          <span style={{fontSize:9,background:T.surface,padding:"1px 6px",borderRadius:3,color:T.text3,textTransform:"uppercase"}}>{pr.type}</span>
                          <span style={{fontSize:9,color:pr.status==="active"?T.accent:T.text3,fontWeight:600,textTransform:"uppercase"}}>{pr.status}</span>
                          {pr.recurring&&<span style={{fontSize:9,color:T.accent2,fontWeight:600,display:"flex",alignItems:"center",gap:3}}><RefreshCw size={8}/>REC</span>}
                        </div>
                        <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>{pr.assignedTo.map(uid=>{ const u=getUser(uid); return u?<span key={uid} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.text2}}><Avatar user={u} size="sm"/>{u.name.split(" ")[0]}<WABtn phone={u.phone} code={u.countryCode} msg={`Hi ${u.name.split(" ")[0]}, update on ${pr.name}.`}/></span>:null; })}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontFamily:"DM Mono,monospace",fontSize:13,color:T.text,fontWeight:500}}>{fmtC(pr.value,pr.currency)}</span>
                        {pr.recurring&&<span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:T.accent2}}>{fmtC(pr.recurringAmount,pr.currency)}/mo</span>}
                        <button onClick={()=>{setShowAddTask(true);}} title="Add task for this project" style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><CheckSquare size={11}/></button>
                        <button onClick={()=>deleteProj(pr.id)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Trash2 size={11}/></button>
                      </div>
                    </div>
                  ))}</div>}
                  <div style={{display:"flex",gap:6,marginTop:12,paddingTop:10,borderTop:`1px solid ${T.border}`,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:11,color:T.text3,alignSelf:"center"}}>Status:</span>
                    {["active","paused"].map(s=><button key={s} onClick={async()=>{ const updated={...eng,status:s}; await supabase.from("engagements").update({status:s}).eq("id",eng.id); setEngagements(p=>p.map(e=>e.id===eng.id?updated:e)); setSelEng(updated); }} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${eng.status===s?T.accent:T.border2}`,background:eng.status===s?"rgba(0,229,160,0.08)":T.surface2,color:eng.status===s?T.accent:T.text3,fontSize:11,fontWeight:500,cursor:"pointer"}}>{s==="active"?"Active":"Pause"}</button>)}
                    <button onClick={async()=>{ const month=window.prompt("Engagement ended at month # (for clawback calc):",String(Math.max(1,Math.round((new Date()-new Date(eng.startDate||today))/(1000*60*60*24*30))))); if(!month)return; const m=Number(month); const updated={...eng,status:"completed",endedAtMonth:m}; await supabase.from("engagements").update({status:"completed",ended_at_month:m}).eq("id",eng.id); setEngagements(p=>p.map(e=>e.id===eng.id?updated:e)); setSelEng(updated); // trigger clawback on leads linked to this engagement
                      const linkedLeads=leads.filter(l=>l.closerId===eng.salesPersonId||l.pmId===eng.pmId); linkedLeads.forEach(async l=>{ if(l.dealStatus==="won"&&l.dealType==="monthly"){ const ul={...l,lostAtMonth:m,dealStatus:"lost"}; await supabase.from("leads").update({lost_at_month:m,deal_status:"lost"}).eq("id",l.id); setLeads(p=>p.map(x=>x.id===l.id?ul:x)); } }); }} style={{padding:"5px 14px",borderRadius:6,border:`1px solid ${T.red}40`,background:"rgba(255,77,109,0.06)",color:T.red,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><XCircle size={11}/>End & Clawback</button>
                  </div>
                </div>}
              </div>
            );})}
            </div>}
          </div>
        );})}
      </div>

      {showAddEng&&<Modal title="New Engagement" onClose={()=>setShowAddEng(false)} onSave={()=>{addEng(nEng);setNE(EE);setShowAddEng(false);}} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Client"><Sel value={nEng.clientId} onChange={e=>setNE({...nEng,clientId:e.target.value})}><option value="">Select…</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}</Sel></Fld>
          <Fld label="Engagement Name"><Inp value={nEng.name} onChange={e=>setNE({...nEng,name:e.target.value})} placeholder="e.g. Digital Transformation 2024"/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Sales Person"><Sel value={nEng.salesPersonId} onChange={e=>setNE({...nEng,salesPersonId:e.target.value})}><option value="">Select…</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Sel></Fld>
          <Fld label="Project Manager"><Sel value={nEng.pmId} onChange={e=>setNE({...nEng,pmId:e.target.value})}><option value="">Select…</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Sel></Fld>
        </div>
        <Fld label="Total Value"><CurrencyInput value={nEng.value} currency={nEng.currency} onValue={v=>setNE({...nEng,value:v})} onCurrency={v=>setNE({...nEng,currency:v})}/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Start Date"><Inp type="date" value={nEng.startDate} onChange={e=>setNE({...nEng,startDate:e.target.value})}/></Fld>
          <Fld label="Status"><Sel value={nEng.status} onChange={e=>setNE({...nEng,status:e.target.value})}><option value="active">Active</option><option value="paused">Paused</option></Sel></Fld>
        </div>
        <Fld label="Notes"><textarea value={nEng.notes} onChange={e=>setNE({...nEng,notes:e.target.value})} style={{...S.input,height:70,resize:"vertical"}}/></Fld>
      </Modal>}
      {editEng&&<Modal title="Edit Engagement" onClose={()=>setEditEng(null)} onSave={()=>{saveEng(editEng);setEditEng(null);}} saveLabel="Save Changes" wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Name"><Inp value={editEng.name} onChange={e=>setEditEng({...editEng,name:e.target.value})}/></Fld>
          <Fld label="Status"><Sel value={editEng.status} onChange={e=>setEditEng({...editEng,status:e.target.value})}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></Sel></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Sales Person"><Sel value={editEng.salesPersonId} onChange={e=>setEditEng({...editEng,salesPersonId:e.target.value})}>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Sel></Fld>
          <Fld label="Project Manager"><Sel value={editEng.pmId} onChange={e=>setEditEng({...editEng,pmId:e.target.value})}>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Sel></Fld>
        </div>
        <Fld label="Value"><CurrencyInput value={editEng.value} currency={editEng.currency||"USD"} onValue={v=>setEditEng({...editEng,value:v})} onCurrency={v=>setEditEng({...editEng,currency:v})}/></Fld>
        <Fld label="Notes"><textarea value={editEng.notes} onChange={e=>setEditEng({...editEng,notes:e.target.value})} style={{...S.input,height:70,resize:"vertical"}}/></Fld>
      </Modal>}
      {showAddProj&&<Modal title="Add Sub-Project" onClose={()=>setShowAddProj(false)} onSave={()=>{addProj(nProj);setNP(EP);setShowAddProj(false);}} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Project Name"><Inp value={nProj.name} onChange={e=>setNP({...nProj,name:e.target.value})} placeholder="e.g. Website Redesign"/></Fld>
          <Fld label="Type"><Sel value={nProj.type} onChange={e=>setNP({...nProj,type:e.target.value})}>{["Development","SEO","Digital Marketing","Design","Analytics","Social Media","Content","PR","Other"].map(t=><option key={t}>{t}</option>)}</Sel></Fld>
        </div>
        <Fld label="Value"><CurrencyInput value={nProj.value} currency={nProj.currency} onValue={v=>setNP({...nProj,value:v})} onCurrency={v=>setNP({...nProj,currency:v})}/></Fld>
        <Fld label="Recurring Monthly Invoice?">
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:T.text2,marginBottom:nProj.recurring?10:0}}><input type="checkbox" checked={nProj.recurring} onChange={e=>setNP({...nProj,recurring:e.target.checked})} style={{accentColor:T.accent}}/> Yes - auto-generate monthly invoice</label>
          {nProj.recurring&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Fld label="Monthly Amount"><CurrencyInput value={nProj.recurringAmount} currency={nProj.currency} onValue={v=>setNP({...nProj,recurringAmount:v})} onCurrency={v=>setNP({...nProj,currency:v})}/></Fld>
            <Fld label="Billing Day"><Inp type="number" value={nProj.recurringDay} onChange={e=>setNP({...nProj,recurringDay:Number(e.target.value)})} min="1" max="28"/></Fld>
          </div>}
        </Fld>
        <Fld label="Assigned Team"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{users.map(u=><label key={u.id} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:T.text2}}><input type="checkbox" checked={(nProj.assignedTo||[]).includes(u.id)} onChange={ev=>setNP({...nProj,assignedTo:ev.target.checked?[...(nProj.assignedTo||[]),u.id]:(nProj.assignedTo||[]).filter(i=>i!==u.id)})} style={{accentColor:T.accent}}/>{u.name}</label>)}</div></Fld>
        <Fld label="Notes"><Inp value={nProj.notes} onChange={e=>setNP({...nProj,notes:e.target.value})}/></Fld>
      </Modal>}
    </div>
  );
};


// =============================================================================
// PaymentsView
// =============================================================================
const PaymentsView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const [sf,setSf]=useState("all"); const [cf,setCf]=useState("all"); const [monthF,setMonthF]=useState("all");
  const yearMonths=[...new Set(payments.map(p=>p.month).filter(Boolean))].sort();
  const filtered=payments.filter(p=>(sf==="all"||p.status===sf)&&(cf==="all"||p.clientId===cf)&&(monthF==="all"||p.month===monthF));
  const EP2={engagementId:"",projectId:"",clientId:"",leadId:"",description:"",amount:"",currency:"SGD",dueDate:"",status:"pending",month:"",recurring:false};
  const [nPay,setNPay]=useState(EP2);
  const [showRecurring,setShowRecurring]=useState(false);
  const recurringPayments=payments.filter(p=>p.recurring);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:0}}>Payments</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportCSV(filtered.map(p=>({Desc:p.description,Client:getClient(p.clientId).name||"",Amount:p.amount,Currency:p.currency,DueDate:p.dueDate,PaidDate:p.paidDate||"",Status:p.status,Month:p.month||""})),"payments_export")} style={{...S.btn,background:T.surface2,color:T.text2,border:`1px solid ${T.border2}`,fontSize:12,display:"flex",alignItems:"center",gap:5}}><Download size={12}/>Export</button>
          <button onClick={()=>setShowRecurring(true)} style={{...S.btn,background:T.surface2,color:T.accent2,border:`1px solid ${T.accent2}30`,display:"flex",alignItems:"center",gap:6,fontSize:12}}><RefreshCw size={12}/>Recurring</button>
          <button onClick={()=>setShowAddPay(true)} style={{...S.btn,background:T.accent,color:"#000",display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>Add Invoice</button>
        </div>
      </div>
      {/* Currency summary strip */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {currencyStats.map(c=>(
          <div key={c.currency} style={{...S.card2,padding:"10px 16px",display:"flex",gap:16,alignItems:"center"}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:11,fontWeight:600,color:T.text3}}>{c.currency}</span>
            <span style={{fontSize:12,color:T.accent}}>↑ {fmtC(c.received,c.currency)}</span>
            <span style={{fontSize:12,color:T.warn}}>~ {fmtC(c.pending,c.currency)}</span>
            {c.overdue>0&&<span style={{fontSize:12,color:T.red}}>! {fmtC(c.overdue,c.currency)}</span>}
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Sel value={sf} onChange={e=>setSf(e.target.value)}><option value="all">All Statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option></Sel>
        <Sel value={cf} onChange={e=>setCf(e.target.value)}><option value="all">All Clients</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel>
        <Sel value={monthF} onChange={e=>setMonthF(e.target.value)}><option value="all">All Months</option>{yearMonths.map(m=><option key={m}>{m}</option>)}</Sel>
        <span style={{fontSize:12,color:T.text3,alignSelf:"center",marginLeft:"auto"}}>{filtered.length} invoices</span>
      </div>
      <div style={{...S.card,padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>{["Description","Client","Amount","Due Date","Paid","Status","Actions"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:600,color:T.text3,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan="7" style={{padding:"40px",textAlign:"center",color:T.text3,fontSize:13}}>No payments match filters.</td></tr>}
            {filtered.map(p=>{ const client=getClient(p.clientId); const sc={paid:T.accent,pending:T.warn,overdue:T.red}[p.status]||T.text3; return (
              <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:"12px 16px"}}><div style={{fontWeight:500,fontSize:13,color:T.text,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description}</div>{p.recurring&&<div style={{fontSize:9,color:T.accent2,display:"flex",alignItems:"center",gap:3,marginTop:2}}><RefreshCw size={8}/>Recurring</div>}</td>
                <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,color:T.text2}}>{client.name||"-"}</span><WABtn phone={client.phone} code={client.countryCode} msg={`Hi ${client.contact?.split(" ")[0]}, payment reminder: ${p.description} - ${fmtC(p.amount,p.currency)} due ${p.dueDate}.`}/><MailBtn email={client.email} subj={`Payment Reminder - ${p.description}`} body={`Hi ${client.contact?.split(" ")[0]},\n\nThis is a reminder for the outstanding invoice:\n\n• ${p.description}\n• Amount: ${fmtC(p.amount,p.currency)}\n• Due: ${p.dueDate}\n\nThank you`}/></div></td>
                <td style={{padding:"12px 16px",fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:500,color:T.text}}>{fmtC(p.amount,p.currency)}</td>
                <td style={{padding:"12px 16px",fontSize:12,color:T.text3}}>{p.dueDate}</td>
                <td style={{padding:"12px 16px",fontSize:12,color:T.accent}}>{p.paidDate||"-"}</td>
                <td style={{padding:"12px 16px"}}><span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,color:sc,background:`${sc}15`,padding:"3px 8px",borderRadius:4}}><div style={{width:5,height:5,borderRadius:"50%",background:sc}}/>{p.status}</span></td>
                <td style={{padding:"12px 16px"}}><div style={{display:"flex",gap:6}}>
                  {p.status!=="paid"&&<button onClick={()=>markPaid(p.id)} style={{...S.btn,padding:"4px 10px",fontSize:11,background:"rgba(0,229,160,0.1)",color:T.accent,border:`1px solid ${T.accent}30`}}>Mark Paid</button>}
                  {p.status==="pending"&&<button onClick={()=>markOverdue(p.id)} style={{...S.btn,padding:"4px 10px",fontSize:11,background:"rgba(255,77,109,0.1)",color:T.red,border:`1px solid ${T.red}30`}}>Overdue</button>}
                  <button onClick={()=>setEditPayment({...p})} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Edit3 size={12}/></button>
                </div></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      {showAddPayment&&<Modal title="Add Invoice" onClose={()=>setShowAddPay(false)} onSave={()=>{addPayment(nPay);setNPay(EP2);setShowAddPay(false);}} wide>
        <Fld label="Description"><Inp value={nPay.description} onChange={e=>setNPay({...nPay,description:e.target.value})} placeholder="e.g. Website Redesign - Phase 1"/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Client"><Sel value={nPay.clientId} onChange={e=>setNPay({...nPay,clientId:e.target.value})}><option value="">Select…</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Sel></Fld>
          <Fld label="Engagement"><Sel value={nPay.engagementId} onChange={e=>setNPay({...nPay,engagementId:e.target.value})}><option value="">Select…</option>{engagements.filter(e=>!nPay.clientId||e.clientId===nPay.clientId).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</Sel></Fld>
        </div>
        <Fld label="Amount"><CurrencyInput value={nPay.amount} currency={nPay.currency} onValue={v=>setNPay({...nPay,amount:v})} onCurrency={v=>setNPay({...nPay,currency:v})}/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Due Date"><Inp type="date" value={nPay.dueDate} onChange={e=>setNPay({...nPay,dueDate:e.target.value,month:e.target.value.slice(0,7)})}/></Fld>
          <Fld label="Status"><Sel value={nPay.status} onChange={e=>setNPay({...nPay,status:e.target.value})}><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></Sel></Fld>
        </div>
      </Modal>}
      {editPayment&&<Modal title="Edit Payment" onClose={()=>setEditPayment(null)} onSave={()=>{savePayment(editPayment);setEditPayment(null);}} saveLabel="Save Changes" wide>
        <Fld label="Description"><Inp value={editPayment.description} onChange={e=>setEditPayment({...editPayment,description:e.target.value})}/></Fld>
        <Fld label="Amount"><CurrencyInput value={editPayment.amount} currency={editPayment.currency||"USD"} onValue={v=>setEditPayment({...editPayment,amount:v})} onCurrency={v=>setEditPayment({...editPayment,currency:v})}/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Due Date"><Inp type="date" value={editPayment.dueDate||""} onChange={e=>setEditPayment({...editPayment,dueDate:e.target.value,month:e.target.value.slice(0,7)})}/></Fld>
          <Fld label="Status"><Sel value={editPayment.status} onChange={e=>setEditPayment({...editPayment,status:e.target.value})}><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></Sel></Fld>
        </div>
        <Fld label="Date Payment Received" hint="only if paid"><Inp type="date" value={editPayment.paidDate||""} onChange={e=>setEditPayment({...editPayment,paidDate:e.target.value})}/></Fld>
      </Modal>}
      {showRecurring&&<Modal title="Manage Recurring Invoices" onClose={()=>setShowRecurring(false)} wide>
        <p style={{fontSize:12,color:T.text3,marginBottom:16}}>Recurring invoices are tied to projects. To add one, go to Engagements, open a project, and enable "Recurring Monthly Invoice". The system will auto-generate monthly invoices.</p>
        {recurringPayments.length===0?<p style={{color:T.text3,fontSize:13,textAlign:"center",padding:"20px 0"}}>No recurring invoices yet.</p>:
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {recurringPayments.map(p=>{ const client=getClient(p.clientId); return (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,background:T.surface2,borderRadius:8,padding:"10px 14px",border:`1px solid ${T.border}`}}>
              <RefreshCw size={14} style={{color:T.accent2,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:T.text}}>{p.description}</div>
                <div style={{fontSize:11,color:T.text3}}>{client?.name||"—"} · {p.month}</div>
              </div>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:13,color:T.text}}>{fmtC(p.amount,p.currency)}</span>
              <span style={{fontSize:10,fontWeight:700,color:{paid:T.accent,pending:T.warn,overdue:T.red}[p.status]||T.text3,background:`${{paid:T.accent,pending:T.warn,overdue:T.red}[p.status]||T.text3}15`,padding:"2px 8px",borderRadius:4}}>{p.status}</span>
              {p.status!=="paid"&&<button onClick={()=>markPaid(p.id)} style={{...S.btn,padding:"4px 10px",fontSize:11,background:"rgba(0,229,160,0.1)",color:T.accent,border:`1px solid ${T.accent}30`}}>Mark Paid</button>}
            </div>
          );})}
        </div>}
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginTop:16}}>          <p style={{...S.label,marginBottom:10}}>Generate Recurring Invoice Manually</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Fld label="Project (recurring)"><Sel value={nPay.projectId} onChange={e=>{ const pr=projects.find(p=>p.id===e.target.value); const eng=pr?engagements.find(en=>en.id===pr.engagementId):null; setNPay(p=>({...p,projectId:e.target.value,engagementId:eng?.id||"",clientId:eng?.clientId||"",amount:pr?.recurringAmount||p.amount,currency:pr?.currency||p.currency,description:pr?`${pr.name} - Monthly`:p.description,recurring:true})); }}><option value="">Select project…</option>{projects.filter(p=>p.recurring).map(p=><option key={p.id} value={p.id}>{p.name} ({fmtC(p.recurringAmount,p.currency)}/mo)</option>)}</Sel></Fld>
            <Fld label="Month"><Inp type="month" value={nPay.month} onChange={e=>setNPay(p=>({...p,month:e.target.value,dueDate:e.target.value+"-01"}))}/></Fld>
          </div>
          <button onClick={()=>{ if(!nPay.projectId||!nPay.month)return; addPayment({...nPay,status:"pending",recurring:true}); setNPay(EP2); }} style={{...S.btn,background:T.accent,color:"#000",display:"flex",alignItems:"center",gap:6,marginTop:8}}><Plus size={13}/>Generate Invoice</button>
        </div>
      </Modal>}
    </div>
  );
};


// =============================================================================
// TaskRow - extracted from TasksView to avoid hooks-in-nested-component error
// =============================================================================
const TASK_STATUS_CFG_TOP={open:{label:"Open",color:"#0066ff"},checked:{label:"Checked",color:"#00e5a0"},clarification:{label:"Need Clarification",color:"#ffb347"},closed:{label:"Closed",color:"#8a8f9e"}};
const EMOJI_TOP={call:"📞",demo:"💻",proposal:"📄",contract:"✍️",email:"✉️",meeting:"👥",review:"🔍"};

const TaskRow = (props) => {
  const { t, PRIO } = props;
  const ctx = props.ctx;
  const { getUser, leads, projects, updateTask, setNoteTask, setNoteText, deleteTask } = ctx;
  const TASK_STATUS_CFG = TASK_STATUS_CFG_TOP;
  const EMOJI = EMOJI_TOP;
  const u=getUser(t.assignedTo);
  const lead=leads.find(l=>l.id===t.leadId);
  const proj=projects.find(p=>p.id===t.projectId);
  const sc=TASK_STATUS_CFG[t.status||"open"];
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderBottom:`1px solid ${T.border}`,background:t.status==="clarification"?"rgba(255,179,71,0.04)":t.status==="closed"?"rgba(255,255,255,0.01)":"transparent"}}>
      <span style={{fontSize:16,flexShrink:0}}>{EMOJI[t.type]||"📌"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:t.status==="closed"?T.text3:T.text,textDecoration:t.status==="closed"?"line-through":"none",marginBottom:2}}>{t.title}</div>
        <div style={{fontSize:11,color:T.text3}}>{lead?.company||proj?.name||"General"} · Due {t.dueDate||"No date"}{t.note?<span style={{marginLeft:8,color:T.warn,fontStyle:"italic"}}>Note: {t.note}</span>:""}</div>
      </div>
      <span style={{fontSize:9,fontWeight:700,color:PRIO[t.priority]?.c||T.text3,background:`${PRIO[t.priority]?.c||T.text3}15`,padding:"2px 7px",borderRadius:3,textTransform:"uppercase",flexShrink:0}}>{t.priority}</span>
      <span style={{fontSize:9,fontWeight:700,color:sc.color,background:`${sc.color}12`,padding:"2px 7px",borderRadius:3,flexShrink:0}}>{sc.label}</span>
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        <Avatar user={u} size="sm"/>
        {u&&<WABtn phone={u.phone} code={u.countryCode} msg={`Hi ${u.name.split(" ")[0]}, reminder: "${t.title}" is due ${t.dueDate}.`}/>}
        {u&&<MailBtn email={u.email} subj={`Reminder: ${t.title}`} body={`Hi ${u.name.split(" ")[0]},\n\nReminder that "${t.title}" is due ${t.dueDate}.\n\nPlease update.`}/>}
        <select value={t.status||"open"} onChange={e=>updateTask(t.id,{status:e.target.value})} style={{...S.input,width:"auto",fontSize:10,padding:"3px 6px"}} onClick={e=>e.stopPropagation()}>
          {Object.entries(TASK_STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={()=>{setNoteTask(t);setNoteText("");}} style={{background:"none",border:"none",color:T.text3,cursor:"pointer",fontSize:11}}>📝</button>
        <button onClick={()=>deleteTask(t.id)} style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><Trash2 size={11}/></button>
      </div>
    </div>
  );
};

// =============================================================================
// TasksView
// =============================================================================
const TasksView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const EMOJI={call:"📞",demo:"💻",proposal:"📄",contract:"✍️",email:"✉️",meeting:"👥",review:"🔍"};
  const TASK_STATUS_CFG={open:{label:"Open",color:T.accent2},checked:{label:"Checked",color:T.accent},clarification:{label:"Need Clarification",color:T.warn},closed:{label:"Closed",color:T.text3}};
  const ET2={title:"",dueDate:"",priority:"medium",leadId:"",projectId:"",assignedTo:"",type:"call"};
  const [nTask,setNTask]=useState(ET2);
  const [noteTask,setNoteTask]=useState(null);
  const [noteText,setNoteText]=useState("");
  const visTasks = isSA(currentUser)||isAdmin(currentUser) ? tasks : tasks.filter(t=>t.assignedTo===currentUser.id);
  const pending=visTasks.filter(t=>t.status!=="closed"), done=visTasks.filter(t=>t.status==="closed");
  const PRIO={high:{c:T.red},medium:{c:T.warn},low:{c:T.text3}};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,margin:0}}>Tasks</h1>
        <button onClick={()=>setShowAddTask(true)} style={{...S.btn,background:T.accent,color:"#000",display:"flex",alignItems:"center",gap:6}}><Plus size={14}/>Add Task</button>
      </div>
      <div style={{...S.card,padding:0,overflow:"hidden",marginBottom:10}}>
        <div style={{padding:"10px 20px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,fontWeight:600,color:T.text2}}>Active</span><span style={{fontSize:10,fontWeight:700,background:"rgba(255,77,109,0.15)",color:T.red,padding:"1px 7px",borderRadius:20}}>{pending.length}</span>
        </div>
        {pending.length===0&&<div style={{padding:"30px",textAlign:"center",color:T.text3,fontSize:13}}>All caught up! No active tasks.</div>}
        {pending.map(t=><TaskRow key={t.id} t={t} ctx={ctx} PRIO={PRIO}/>)}
      </div>
      {done.length>0&&<div style={{...S.card,padding:0,overflow:"hidden"}}>
        <div style={{padding:"10px 20px",background:T.surface2,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,fontWeight:600,color:T.text2}}>Closed</span><span style={{fontSize:10,fontWeight:700,background:"rgba(0,229,160,0.1)",color:T.accent,padding:"1px 7px",borderRadius:20}}>{done.length}</span>
        </div>
        {done.map(t=><TaskRow key={t.id} t={t} ctx={ctx} PRIO={PRIO}/>)}
      </div>}
      {showAddTask&&<Modal title="Add Task" onClose={()=>setShowAddTask(false)} onSave={()=>{addTask(nTask);setNTask(ET2);setShowAddTask(false);}}>
        <Fld label="Title"><Inp value={nTask.title} onChange={e=>setNTask({...nTask,title:e.target.value})} placeholder="e.g. Follow-up call…"/></Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Due Date"><Inp type="date" value={nTask.dueDate} onChange={e=>setNTask({...nTask,dueDate:e.target.value})}/></Fld>
          <Fld label="Priority"><Sel value={nTask.priority} onChange={e=>setNTask({...nTask,priority:e.target.value})}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Sel></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Type"><Sel value={nTask.type} onChange={e=>setNTask({...nTask,type:e.target.value})}>{["call","demo","proposal","contract","email","meeting","review"].map(t=><option key={t}>{t}</option>)}</Sel></Fld>
          <Fld label="Assigned To"><Sel value={nTask.assignedTo} onChange={e=>setNTask({...nTask,assignedTo:e.target.value})}><option value="">Select…</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</Sel></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Linked Lead"><Sel value={nTask.leadId} onChange={e=>setNTask({...nTask,leadId:e.target.value})}><option value="">None</option>{leads.map(l=><option key={l.id} value={l.id}>{l.name} - {l.company}</option>)}</Sel></Fld>
          <Fld label="Linked Project"><Sel value={nTask.projectId} onChange={e=>setNTask({...nTask,projectId:e.target.value})}><option value="">None</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Sel></Fld>
        </div>
      </Modal>}
      {noteTask&&<Modal title="Add Note to Task" onClose={()=>setNoteTask(null)} onSave={()=>{updateTask(noteTask.id,{note:noteText});setNoteTask(null);}}>
        <div style={{marginBottom:12,fontSize:13,color:T.text2}}>Task: <strong>{noteTask.title}</strong></div>
        <Fld label="Note"><textarea value={noteText} onChange={e=>setNoteText(e.target.value)} style={{...S.input,height:80,resize:"vertical"}} placeholder="Add a note or comment about this task…"/></Fld>
      </Modal>}
    </div>
  );
};


// =============================================================================
// TeamView
// =============================================================================
const TeamView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
return (
  <div>
    <h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,marginBottom:24}}>Team Overview</h1>
    <div style={{...S.card,marginBottom:16}}>
      <p style={{...S.label,marginBottom:12}}>Territory Coverage</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        {COUNTRIES.map(c=>{ const assigned=users.filter(u=>(u.territories||[]).includes(c)); return (
          <div key={c} style={{...S.card2,minWidth:140}}>
            <p style={{fontSize:12,fontWeight:600,color:T.text2,marginBottom:8,display:"flex",alignItems:"center",gap:4}}><MapPin size={11} style={{color:T.text3}}/>{c}</p>
            {assigned.length===0?<span style={{fontSize:11,color:T.text3,fontStyle:"italic"}}>Unassigned</span>:<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{assigned.map(u=><span key={u.id} style={{display:"flex",alignItems:"center",gap:4}}><Avatar user={u} size="sm"/><WABtn phone={u.phone} code={u.countryCode} msg={`Hi ${u.name.split(" ")[0]}!`}/></span>)}</div>}
          </div>
        );})}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
      {users.map(u=>{ const myLeads=leads.filter(l=>l.closerId===u.id||l.referrerId===u.id||l.pmId===u.id||l.rmId===u.id); const myTasks=tasks.filter(t=>t.assignedTo===u.id&&t.status!=="closed"); return (
        <div key={u.id} style={S.card}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <Avatar user={u} size="lg"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:14,color:T.text}}>{u.name}</div>
              <RoleBadge role={u.role}/>
              <div style={{fontSize:11,color:T.text3,marginTop:3}}>{u.designation} · {u.email}</div>
            </div>
            <div style={{display:"flex",gap:4}}><WABtn phone={u.phone} code={u.countryCode} msg={`Hi ${u.name.split(" ")[0]}!`}/><MailBtn email={u.email} subj="Hello" body={`Hi ${u.name.split(" ")[0]},`}/></div>
          </div>
          {(u.territories||[]).length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{u.territories.map(t=><span key={t} style={{fontSize:10,background:`${T.accent2}12`,color:T.accent2,padding:"2px 6px",borderRadius:4}}>{t}</span>)}</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,textAlign:"center",background:T.surface2,borderRadius:8,padding:10}}>
            <div><div style={{fontSize:9,color:T.text3,textTransform:"uppercase",marginBottom:2}}>Leads</div><div style={{fontFamily:"DM Mono,monospace",fontSize:14,fontWeight:500,color:T.text}}>{myLeads.length}</div></div>
            <div><div style={{fontSize:9,color:T.text3,textTransform:"uppercase",marginBottom:2}}>Tasks</div><div style={{fontFamily:"DM Mono,monospace",fontSize:14,fontWeight:500,color:T.text}}>{myTasks.length}</div></div>
            <div><div style={{fontSize:9,color:T.text3,textTransform:"uppercase",marginBottom:2}}>Ref%</div><div style={{fontFamily:"DM Mono,monospace",fontSize:14,fontWeight:500,color:T.warn}}>{u.referrerRate||5}</div></div>
            <div><div style={{fontSize:9,color:T.text3,textTransform:"uppercase",marginBottom:2}}>Close%</div><div style={{fontFamily:"DM Mono,monospace",fontSize:14,fontWeight:500,color:T.accent2}}>{u.closerRate||5}</div></div>
          </div>
        </div>
      );})}
    </div>
  </div>
);
};


// =============================================================================
// ProfileView
// =============================================================================
const ProfileView = (props) => {
  const ctx = props.ctx;
  const { currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  } = ctx;
  const [d,setD]=useState({...currentUser}); const [showPw,setShowPw]=useState(false);
  return (
    <div style={{maxWidth:520}}>
      <h1 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:T.text,marginBottom:24}}>My Profile</h1>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
          <Avatar user={d} size="lg"/>
          <div><div style={{fontWeight:700,fontSize:16,color:T.text}}>{d.name}</div><RoleBadge role={d.role}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Full Name"><Inp value={d.name} onChange={e=>setD({...d,name:e.target.value})}/></Fld>
          <Fld label="Designation"><Inp value={d.designation||""} onChange={e=>setD({...d,designation:e.target.value})}/></Fld>
        </div>
        <Fld label="Email"><Inp value={d.email} onChange={e=>setD({...d,email:e.target.value})}/></Fld>
        <Fld label="Phone"><PhoneInput code={d.countryCode||"+65"} phone={d.phone||""} onCode={v=>setD({...d,countryCode:v})} onPhone={v=>setD({...d,phone:v})}/></Fld>
        <Fld label="Password"><div style={{position:"relative"}}><Inp type={showPw?"text":"password"} value={d.password} onChange={e=>setD({...d,password:e.target.value})}/><button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.text3,cursor:"pointer"}}>{showPw?<EyeOff size={14}/>:<Eye size={14}/>}</button></div></Fld>
        <button onClick={()=>{ saveUser(d); }} style={{...S.btn,width:"100%",background:T.accent,color:"#000",marginTop:8}}>Save Changes</button>
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCU] = useState(null);
  const [loading, setLoading] = useState(false);
  const [users,       setUsers]       = useState([]);
  const [clients,     setClients]     = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [projects,    setProjects]    = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [leads,       setLeads]       = useState([]);
  const [tasks,       setTasks]       = useState([]);
  const [tab,setTab] = useState("dashboard");
  const [search,setSearch] = useState("");
  const [selLead,setSelLead] = useState(null);
  const [selEng,setSelEng]   = useState(null);
  const [showAddLead,setShowAddLead]     = useState(false);
  const [showAddUser,setShowAddUser]     = useState(false);
  const [showAddEng,setShowAddEng]       = useState(false);
  const [showAddProj,setShowAddProj]     = useState(false);
  const [showAddPayment,setShowAddPay]   = useState(false);
  const [showAddTask,setShowAddTask]     = useState(false);
  const [editUser,setEditUser]           = useState(null);
  const [editEng,setEditEng]             = useState(null);
  const [editPayment,setEditPayment]     = useState(null);
  const [expandedClients,setExpClients]  = useState({cl1:true});
  const [showAddClientModal,setShowAddClient] = useState(false);

  // ── Load all data from Supabase on login ──────────────────────────────────
  useEffect(()=>{
    if(!currentUser)return;
    const load=async()=>{
      setLoading(true);
      const [u,cl,en,pr,pa,le,ta]=await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("engagements").select("*"),
        supabase.from("projects").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("leads").select("*"),
        supabase.from("tasks").select("*"),
      ]);
      if(u.data)  setUsers(u.data.map(dbToUser));
      if(cl.data) setClients(cl.data.map(dbToClient));
      if(en.data) setEngagements(en.data.map(dbToEng));
      if(pr.data) setProjects(pr.data.map(dbToProj));
      if(pa.data) setPayments(pa.data.map(dbToPayment));
      if(le.data) setLeads(le.data.map(dbToLead));
      if(ta.data) setTasks(ta.data.map(dbToTask));
      setLoading(false);
    };
    load();
  },[currentUser]);

  const AC={name:"",contact:"",email:"",phone:"",countryCode:"+65",country:"Singapore"};
  const [nClient,setNC]=useState(AC);

  const getUser       = id => users.find(u=>u.id===id);
  const getClient     = id => clients.find(c=>c.id===id)||{};
  const getEngagement = id => engagements.find(e=>e.id===id)||{};
  const getProject    = id => projects.find(p=>p.id===id)||{};
  const isSA    = u => u?.role==="super_admin";
  const isAdmin = u => u?.role==="admin"||u?.role==="super_admin";

  // -- CRUD (Supabase) -------------------------------------------------------
  const updateUsers = (id,updates) => { setUsers(p=>p.map(u=>u.id===id?{...u,...updates}:u)); supabase.from("users").update(updates).eq("id",id); };
  const addUser=async(nUser)=>{ if(!nUser.name||!nUser.email)return; const obj={...nUser,id:genId("u"),commissionRate:Number(nUser.commissionRate)||0}; const {error}=await supabase.from("users").insert(userToDb(obj)); if(!error){setUsers(p=>[...p,obj]);} };
  const saveUser=async(editUser)=>{ if(!editUser)return; const {error}=await supabase.from("users").update(userToDb(editUser)).eq("id",editUser.id); if(!error){setUsers(p=>p.map(u=>u.id===editUser.id?editUser:u)); if(currentUser.id===editUser.id)setCU(editUser);} };
  const deleteUser=async id=>{ await supabase.from("users").delete().eq("id",id); setUsers(p=>p.filter(u=>u.id!==id)); };

  const addClient=async()=>{ if(!nClient.name)return; const obj={...nClient,id:genId("cl")}; const {error}=await supabase.from("clients").insert(clientToDb(obj)); if(!error){setClients(p=>[...p,obj]);setNC(AC);setShowAddClient(false);} };

  const addEng=async(nEng)=>{ if(!nEng.name||!nEng.clientId)return; const obj={...nEng,id:genId("en"),value:Number(nEng.value)||0,startDate:nEng.startDate||today}; const {error}=await supabase.from("engagements").insert(engToDb(obj)); if(error){console.error("addEng error:",error);alert("Error adding engagement: "+error.message);return;} setEngagements(p=>[...p,obj]); };
  const saveEng=async(editEng)=>{ if(!editEng)return; const {error}=await supabase.from("engagements").update(engToDb(editEng)).eq("id",editEng.id); if(!error){setEngagements(p=>p.map(e=>e.id===editEng.id?editEng:e)); if(selEng?.id===editEng.id)setSelEng(editEng);} };
  const deleteEng=async id=>{ await supabase.from("engagements").delete().eq("id",id); setEngagements(p=>p.filter(e=>e.id!==id)); if(selEng?.id===id)setSelEng(null); };

  const addProj=async(nProj)=>{ if(!nProj.name||!nProj.engagementId)return; const obj={...nProj,id:genId("pr"),value:Number(nProj.value)||0,recurringAmount:Number(nProj.recurringAmount)||0}; const {error}=await supabase.from("projects").insert(projToDb(obj)); if(!error){setProjects(p=>[...p,obj]);} };
  const deleteProj=async id=>{ await supabase.from("projects").delete().eq("id",id); setProjects(p=>p.filter(x=>x.id!==id)); };

  const addPayment=async(nPayment)=>{ if(!nPayment||!nPayment.description||!nPayment.amount)return; const obj={...nPayment,id:genId("pay"),amount:Number(nPayment.amount)||0}; const {error}=await supabase.from("payments").insert(paymentToDb(obj)); if(!error){setPayments(p=>[...p,obj]);} };
  const savePayment=async()=>{ if(!editPayment)return; const {error}=await supabase.from("payments").update(paymentToDb(editPayment)).eq("id",editPayment.id); if(!error){setPayments(p=>p.map(pay=>pay.id===editPayment.id?editPayment:pay)); setEditPayment(null);} };
  const markPaid=async id=>{ await supabase.from("payments").update({status:"paid",paid_date:today}).eq("id",id); setPayments(p=>p.map(pay=>pay.id===id?{...pay,status:"paid",paidDate:today}:pay)); };
  const markOverdue=async id=>{ await supabase.from("payments").update({status:"overdue"}).eq("id",id); setPayments(p=>p.map(pay=>pay.id===id?{...pay,status:"overdue"}:pay)); };

  const addLead=async(lead)=>{ const obj={...lead,id:genId("l"),createdAt:today,aiScore:null,aiNote:null}; const {error}=await supabase.from("leads").insert(leadToDb(obj)); if(!error){setLeads(p=>[...p,obj]);} };
  const updateLeadStatus=async(id,dealStatus)=>{ await supabase.from("leads").update({deal_status:dealStatus}).eq("id",id); setLeads(p=>p.map(l=>l.id===id?{...l,dealStatus}:l)); if(selLead?.id===id)setSelLead(p=>({...p,dealStatus})); };
  const deleteLead=async id=>{ await supabase.from("leads").delete().eq("id",id); setLeads(p=>p.filter(l=>l.id!==id)); if(selLead?.id===id)setSelLead(null); };
  const wonToEngagement=async(lead)=>{
    // Step 1: Find or create client
    let client = clients.find(c=>c.name.toLowerCase()===lead.company.toLowerCase());
    if(!client){
      client={id:genId("cl"),name:lead.company,contact:lead.name||"",email:lead.email||"",phone:lead.phone||"",countryCode:lead.countryCode||"+65",country:lead.country||"Singapore"};
      const {error:ce}=await supabase.from("clients").insert(clientToDb(client));
      if(ce){ console.error("wonToEngagement - client insert error:",ce); alert("Error creating client: "+ce.message); return; }
      setClients(p=>[...p,client]);
    }
    // Step 2: Create engagement
    const engObj={
      id:genId("en"),clientId:client.id,
      name:`${lead.brand||lead.company} - ${(lead.services||[]).length?lead.services[0]:"Engagement"}`,
      salesPersonId:lead.closerId||"",pmId:lead.pmId||"",rmId:lead.rmId||"",
      status:"active",value:Number(lead.monthlyValue)||Number(lead.oneTimeValue)||0,
      currency:lead.currency||"SGD",startDate:today,
      notes:`Converted from lead: ${lead.name}`,
    };
    console.log("wonToEngagement - inserting:", engToDb(engObj));
    const {error:e2}=await supabase.from("engagements").insert(engToDb(engObj));
    if(e2){ console.error("wonToEngagement - engagement insert error:",e2); alert("Error creating engagement: "+e2.message); return; }
    // Step 3: Update lead status
    const {error:e3}=await supabase.from("leads").update({deal_status:"won"}).eq("id",lead.id);
    if(e3) console.error("wonToEngagement - lead status update error:",e3);
    setLeads(p=>p.map(l=>l.id===lead.id?{...l,dealStatus:"won"}:l));
    setEngagements(p=>[...p,engObj]);
    setTab("engagements");
    setSelEng(engObj);
  };
    const scoreLead=async id=>{ const lead=leads.find(l=>l.id===id); if(!lead)return; setLeads(p=>p.map(l=>l.id===id?{...l,aiScore:-1}:l)); try{ const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:150,messages:[{role:"user",content:`Score B2B lead 1-100 close probability. JSON only: {"score":number,"note":"one sentence"}\ncompany=${lead.company},value=${lead.monthlyValue}${lead.currency},dealType=${lead.dealType},services=${(lead.services||[]).join(",")},country=${lead.country},notes="${lead.notes}"`}]})}); const d=await r.json(); const parsed=JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()); await supabase.from("leads").update({ai_score:parsed.score,ai_note:parsed.note}).eq("id",id); setLeads(p=>p.map(l=>l.id===id?{...l,aiScore:parsed.score,aiNote:parsed.note}:l)); }catch{ setLeads(p=>p.map(l=>l.id===id?{...l,aiScore:null}:l)); } };

  const addTask=async(task)=>{ const obj={...task,id:genId("tk"),status:"open",note:""}; const {error}=await supabase.from("tasks").insert(taskToDb(obj)); if(!error){setTasks(p=>[...p,obj]);} };
  const updateTask=async(id,upd)=>{ await supabase.from("tasks").update(upd).eq("id",id); setTasks(p=>p.map(t=>t.id===id?{...t,...upd}:t)); };
  const deleteTask=async id=>{ await supabase.from("tasks").delete().eq("id",id); setTasks(p=>p.filter(t=>t.id!==id)); };

  // -- Visibility --------------------------------------------------------------
  const visLeads = useMemo(()=>{
    if(!currentUser)return [];
    if(isSA(currentUser))return leads;
    if(currentUser.role==="admin") return leads.filter(l=>currentUser.territories.includes(l.country));
    return leads.filter(l=>currentUser.territories.includes(l.country)||l.closerId===currentUser.id||l.referrerId===currentUser.id||l.rmId===currentUser.id);
  },[leads,currentUser]);

  // -- Stats per currency ------------------------------------------------------
  const currencyStats = useMemo(()=>{
    const map={};
    payments.forEach(p=>{
      if(!map[p.currency])map[p.currency]={currency:p.currency,received:0,pending:0,overdue:0};
      if(p.status==="paid")   map[p.currency].received+=p.amount;
      if(p.status==="pending")map[p.currency].pending +=p.amount;
      if(p.status==="overdue")map[p.currency].overdue +=p.amount;
    });
    return Object.values(map);
  },[payments]);

  const leadCurrencyStats = useMemo(()=>{
    const map={};
    visLeads.forEach(l=>{
      const cur=l.currency||"USD";
      if(!map[cur])map[cur]={currency:cur,total:0,won:0,active:0,lost:0,count:0};
      map[cur].total+=l.value||0; map[cur].count++;
      if(l.dealStatus==="won"||l.dealStatus==="partial") map[cur].won+=(l.value||0);
      if(l.dealStatus==="active")    map[cur].active+=(l.value||0);
      if(l.dealStatus==="lost")      map[cur].lost+=(l.value||0);
    });
    return Object.values(map);
  },[visLeads]);

  const NAV = [
    {id:"dashboard",   icon:LayoutDashboard, label:"Dashboard"},
    {id:"users",       icon:Shield,          label:"Users",        adminOnly:true},
    {id:"leads",       icon:Target,          label:"Leads"},
    {id:"engagements", icon:Layers,          label:"Engagements"},
    {id:"payments",    icon:CreditCard,      label:"Payments"},
    {id:"commissions", icon:Banknote,        label:"Commissions"},
    {id:"simulator",   icon:Calculator,      label:"Simulator"},
    {id:"tasks",       icon:CheckSquare,     label:"Tasks"},
    {id:"team",        icon:Users,           label:"Team"},
    {id:"profile",     icon:UserCog,         label:"My Profile"},
  ].filter(n=>!n.adminOnly||isAdmin(currentUser));

  const css = { row:(hov)=>({ display:"flex",alignItems:"center",gap:12,padding:"12px 20px",cursor:"pointer",borderBottom:`1px solid ${T.border}`,transition:"background 0.12s" }), };

  // =============================================================================
  // DASHBOARD
  // =============================================================================

  // -- Build ctx for child components ------------------------------------------
  const ctx = {
    currentUser, setCU, users, setUsers, clients, setClients,
    engagements, setEngagements, projects, setProjects,
    payments, setPayments, leads, setLeads, tasks, setTasks,
    tab, setTab, search, setSearch, selLead, setSelLead,
    selEng, setSelEng, showAddLead, setShowAddLead,
    showAddUser, setShowAddUser, showAddEng, setShowAddEng,
    showAddProj, setShowAddProj, showAddPayment, setShowAddPay,
    showAddTask, setShowAddTask, editUser, setEditUser,
    editEng, setEditEng, editPayment, setEditPayment,
    expandedClients, setExpClients, showAddClientModal, setShowAddClient,
    getUser, getClient, getEngagement, getProject,
    isSA, isAdmin, updateUsers,
    addUser, saveUser, deleteUser, addClient,
    addEng, saveEng, deleteEng, addProj, deleteProj,
    addPayment, savePayment, markPaid, markOverdue,
    addLead, updateLeadStatus, deleteLead, scoreLead, wonToEngagement,
    addTask, updateTask, deleteTask,
    visLeads, currencyStats, leadCurrencyStats,
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  if(!currentUser) return <LoginScreen onLogin={u=>{setCU(u);setTab("dashboard");}}/>;
  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,flexDirection:"column",gap:16}}><div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${T.accent}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/><div style={{color:T.text2,fontSize:14}}>Loading workspace...</div></div>;

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:"DM Sans, sans-serif",color:T.text}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * { box-sizing:border-box; margin:0; padding:0; } body { background:${T.bg}; } input::placeholder,textarea::placeholder { color:${T.text3}; } select option { background:#1a1e28; }`}</style>

      {/* Sidebar */}
      <aside style={{width:220,background:T.surface,borderRight:`1px solid ${T.border}`,padding:20,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>{LOGO}<span style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700}}>Nexus <span style={{color:T.accent}}>CRM</span></span>{isSA(currentUser)&&<Crown size={13} style={{color:T.warn,marginLeft:"auto"}}/>}</div>
        <nav style={{flex:1}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",marginBottom:3,background:tab===n.id?`${T.accent2}18`:"transparent",color:tab===n.id?T.accent2:T.text3,fontSize:13,fontWeight:tab===n.id?600:400,textAlign:"left",transition:"all 0.12s"}}>
              <n.icon size={15}/>{n.label}
            </button>
          ))}
        </nav>
        <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginTop:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Avatar user={currentUser} size="md"/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div><RoleBadge role={currentUser.role}/></div>
            <button onClick={()=>setCU(null)} title="Sign out" style={{background:"none",border:"none",color:T.text3,cursor:"pointer"}}><LogOut size={14}/></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,minWidth:0,overflowY:"auto"}}>
        <header style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"12px 28px",position:"sticky",top:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{position:"relative"}}><Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.text3}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads, clients…" style={{...S.input,paddingLeft:34,width:240,fontSize:13}}/></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAddTask(true)} style={{...S.btn,background:T.surface2,color:T.text2,border:`1px solid ${T.border2}`,fontSize:12,display:"flex",alignItems:"center",gap:5}}><CheckSquare size={13}/>Task</button>
            <button onClick={()=>setShowAddLead(true)} style={{...S.btn,background:T.accent,color:"#000",fontSize:13,display:"flex",alignItems:"center",gap:5}}><Plus size={14}/>New Lead</button>
          </div>
        </header>
        <div style={{padding:"28px 32px",maxWidth:1200,margin:"0 auto"}}>
          {tab==="dashboard"   &&<DashboardView ctx={ctx}/>}
          {tab==="users"       &&<UsersView ctx={ctx}/>}
          {tab==="leads"       &&<LeadsView ctx={ctx}/>}
          {tab==="engagements" &&<EngagementsView ctx={ctx}/>}
          {tab==="payments"    &&<PaymentsView ctx={ctx}/>}
          {tab==="commissions" &&<CommissionsView ctx={ctx}/>}
          {tab==="simulator"   &&<SimulatorView ctx={ctx}/>}
          {tab==="tasks"       &&<TasksView ctx={ctx}/>}
          {tab==="team"        &&<TeamView ctx={ctx}/>}
          {tab==="profile"     &&<ProfileView ctx={ctx}/>}
        </div>
      </main>

      <LeadDrawer ctx={ctx}/>

      {/* Add Client Modal */}
      {showAddClientModal&&<Modal title="Add Client" onClose={()=>setShowAddClient(false)} onSave={()=>{addClient(nClient);setNC(AC);setShowAddClient(false);}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Company Name"><Inp value={nClient.name} onChange={e=>setNC({...nClient,name:e.target.value})} placeholder="Acme Corp"/></Fld>
          <Fld label="Contact Person"><Inp value={nClient.contact} onChange={e=>setNC({...nClient,contact:e.target.value})} placeholder="John Smith"/></Fld>
        </div>
        <Fld label="Email"><Inp value={nClient.email} onChange={e=>setNC({...nClient,email:e.target.value})}/></Fld>
        <Fld label="Phone"><PhoneInput code={nClient.countryCode} phone={nClient.phone} onCode={v=>setNC({...nClient,countryCode:v})} onPhone={v=>setNC({...nClient,phone:v})}/></Fld>
        <Fld label="Country"><Sel value={nClient.country} onChange={e=>setNC({...nClient,country:e.target.value})}>{[...COUNTRIES,"Other"].map(c=><option key={c}>{c}</option>)}</Sel></Fld>
      </Modal>}
    </div>
  );
}
