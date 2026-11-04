/* Journey+ rail engine: real timetable (datameet, ~2016), synthetic seats and estimated fares. */
(function(root){
const R={ready:false};
// City groups: several stations count as one city. Capitals without a railway map to the nearest railhead.
const CITY={
 'delhi':['NDLS','NZM','DLI','ANVT','DEE'],'new delhi':['NDLS','NZM','DLI','ANVT'],
 'mumbai':['CSTM','BCT','LTT','DR','BDTS'],'bombay':['CSTM','BCT','LTT','DR','BDTS'],
 'kolkata':['HWH','SDAH','KOAA','SRC'],'calcutta':['HWH','SDAH','KOAA'],
 'chennai':['MAS','MS','TBM'],'madras':['MAS','MS'],
 'bengaluru':['SBC','YPR','BNC','BNCE','KJM'],'bangalore':['SBC','YPR','BNC','BNCE'],
 'hyderabad':['SC','HYB','KCG','LPI'],'secunderabad':['SC'],
 'ahmedabad':['ADI','SBI'],'pune':['PUNE'],'jaipur':['JP'],'lucknow':['LKO','LJN'],
 'kanpur':['CNB'],'patna':['PNBE','RJPB','PNC'],'bhopal':['BPL','HBJ'],'raipur':['R'],
 'ranchi':['RNC','HTE'],'bhubaneswar':['BBS'],'guwahati':['GHY','KYQ'],'thiruvananthapuram':['TVC','KCVL'],
 'trivandrum':['TVC'],'chandigarh':['CDG'],'shimla':['SML','KLK'],'dehradun':['DDN'],
 'gandhinagar':['GNC','ADI'],'panaji':['KRMI','MAO'],'goa':['MAO','KRMI','VSG'],'agartala':['AGTL'],
 'kohima':['DMV'],'dimapur':['DMV'],'imphal':['DMV','JRBM'],'aizawl':['BHRB','SCL'],'shillong':['GHY'],
 'gangtok':['NJP'],'itanagar':['NHLG','HRT'],'srinagar':['JAT'],'jammu':['JAT'],'leh':['JAT'],
 'port blair':['MAS','HWH'],'puducherry':['PDY','VM'],'pondicherry':['PDY','VM'],'amaravati':['BZA','GNT'],
 'vijayawada':['BZA'],'katra':['SVDK'],'varanasi':['BSB','MUV','BSBS'],'banaras':['BSB','MUV'],
 'haridwar':['HW'],'rishikesh':['RKSH','HW'],'puri':['PURI'],'tirupati':['TPTY','RU'],'ayodhya':['AY','FD'],
 'prayagraj':['ALD','PRYJ','ALY'],'allahabad':['ALD','ALY'],'agra':['AGC','AF','IDH'],'mathura':['MTJ'],
 'ujjain':['UJN'],'nashik':['NK'],'shirdi':['SNSI'],'dwarka':['DWK'],'rameswaram':['RMM'],
 'madurai':['MDU'],'amritsar':['ASR'],'gaya':['GAYA'],'bodh gaya':['GAYA'],'khajuraho':['KURJ'],
 'hampi':['HPT'],'mysuru':['MYS'],'mysore':['MYS'],'udaipur':['UDZ'],'jodhpur':['JU'],'kochi':['ERS','ERN'],
 'ernakulam':['ERS','ERN'],'coimbatore':['CBE'],'visakhapatnam':['VSKP'],'vizag':['VSKP'],'nagpur':['NGP'],
 'indore':['INDB'],'surat':['ST'],'vadodara':['BRC'],'siliguri':['NJP','SGUJ'],'darjeeling':['NJP'],
 'jabalpur':['JBP'],'gwalior':['GWL'],'ludhiana':['LDH'],'ambala':['UMB'],'mangaluru':['MAQ','MAJN'],
};
const NOTE={kohima:'Kohima has no railway; nearest railhead is Dimapur.',imphal:'Imphal has no railway yet; nearest railheads are Dimapur and Jiribam.',aizawl:'Aizawl has no railway yet; nearest railhead is Bairabi/Silchar.',shillong:'Shillong has no railway; nearest railhead is Guwahati.',gangtok:'Gangtok has no railway; nearest railhead is New Jalpaiguri.',itanagar:'Itanagar is served by Naharlagun station.',srinagar:'Long-distance trains for Srinagar run to Jammu Tawi in this dataset.',leh:'Leh has no railway; nearest major railhead is Jammu Tawi.','port blair':'Port Blair has no railway; ships and flights leave from Chennai or Kolkata.',panaji:'Panaji is served by Karmali and Madgaon.',amaravati:'Amaravati is served by Vijayawada and Guntur.',shimla:'Long-distance trains for Shimla run to Kalka.'};
const PILGRIM=new Set(['SVDK','JAT','HW','RKSH','BSB','MUV','PURI','TPTY','RU','AY','FD','ALD','ALY','PRYJ','AGC','AF','MTJ','UJN','NK','SNSI','DWK','RMM','MDU','ASR','GAYA','KURJ','HPT','MYS','UDZ','AJM','PRR','DDN']);
let S=[],T=[],byCode={},atStation=[];
R.load=function(d){S=d.s;T=d.t;T.forEach(t=>{const L=t[1].replace(/[^A-Za-z]/g,'');if(L&&L.replace(/[^A-Z]/g,'').length/L.length>0.6)t[1]=t[1].toLowerCase().replace(/\b[a-z]/g,m=>m.toUpperCase()).replace(/\bExp\b/,'Exp')});S.forEach(s=>{s[1]=s[1].replace(/\bS M V D\b/i,'SMVD').replace(/\bJn\b\.?/,'Jn').replace(/\s+/g,' ').trim()});byCode={};S.forEach((s,i)=>byCode[s[0]]=i);atStation=S.map(()=>[]);
 T.forEach((t,ti)=>t[4].forEach((st,si)=>atStation[st[0]].push([ti,si])));R.ready=true;R.nTrains=T.length;R.nStations=S.length};
const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
R.station=c=>{const i=byCode[c];if(i==null)return null;const s=S[i];return {code:s[0],name:s[1],state:s[2],trains:atStation[i].length}};
R.isPilgrim=codes=>codes.some(c=>PILGRIM.has(c));
// Find places: returns [{key,label,codes,note,trains}]
R.find=function(q,limit=8){q=norm(q);if(!q)return [];const out=[];const seen=new Set();
 const push=(key,label,codes,note)=>{codes=codes.filter(c=>byCode[c]!=null);if(!codes.length)return;const k=codes.join(',');if(seen.has(k))return;seen.add(k);
  out.push({key,label,codes,note:note||'',trains:codes.reduce((a,c)=>a+atStation[byCode[c]].length,0)})};
 for(const [city,codes] of Object.entries(CITY)){if(city===q||(q.length>=3&&city.startsWith(q))){const nm=city.replace(/\b\w/g,m=>m.toUpperCase());push(city,nm+(codes.length>1?' (all stations)':' · '+codes[0]),codes,NOTE[city])}}
 const up=q.toUpperCase();if(byCode[up]!=null){const s=S[byCode[up]];push(up,s[1]+' · '+s[0],[up])}
 const cand=[];S.forEach((s,i)=>{const n=norm(s[1]);let sc=0;if(n===q)sc=3;else if(n.startsWith(q))sc=2;else if(q.length>=3&&n.includes(q))sc=1;if(sc)cand.push([sc,atStation[i].length,i])});
 cand.sort((a,b)=>b[0]-a[0]||b[1]-a[1]);cand.slice(0,limit).forEach(([,,i])=>push(S[i][0],S[i][1]+' · '+S[i][0]+(S[i][2]?', '+S[i][2]:''),[S[i][0]]));
 return out.slice(0,limit)};
// Seats & fares (synthetic / estimated)
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
const CLS={SL:{k:'S',km:0.42,res:20,sf:30,gst:0,min:140},'3A':{k:'3',km:1.07,res:40,sf:45,gst:.05,min:420},'2A':{k:'2',km:1.56,res:50,sf:45,gst:.05,min:620},'1A':{k:'1',km:2.6,res:60,sf:75,gst:.05,min:1050},CC:{k:'C',km:0.95,res:40,sf:45,gst:.05,min:260}};
R.CLS=CLS;
R.hasClass=(t,cls)=>t[3].includes(CLS[cls].k);
R.fare=function(t,km,cls){const c=CLS[cls];let f=Math.max(c.min,c.km*km);const prem=['Raj','Drnt','Shtb'].includes(t[2]);const sf=['SF','Raj','Drnt','Shtb','GR','JShtb'].includes(t[2]);
 if(prem)f*=1.3;f+=c.res+(sf?c.sf:0);f*=1+c.gst;return Math.round(f/5)*5};
R.avail=function(no,date,cls,from,to,isLeg){const h=hash(no+date+cls+from+to);
 if(isLeg){if(h<0.12)return {s:'WL',n:3+Math.floor(h*90)};if(h<0.2)return {s:'RAC',n:2+Math.floor(h*30)};return {s:'AVL',n:4+Math.floor(h*60)}}
 if(h<0.72)return {s:'WL',n:12+Math.floor(h*110)};if(h<0.84)return {s:'RAC',n:4+Math.floor(h*40)};return {s:'AVL',n:2+Math.floor(h*30)}};
const tod=m=>((m%1440)+1440)%1440;
R.hhmm=m=>{m=tod(Math.round(m));return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
R.dur=m=>Math.floor(m/60)+'h '+String(Math.round(m%60)).padStart(2,'0')+'m';
function leg(ti,i,j){const t=T[ti],a=t[4][i],b=t[4][j];const dep=a[2]!=null?a[2]:a[1];const arr=b[1]!=null?b[1]:b[2];
 return {ti,i,j,no:t[0],name:t[1],type:t[2],classes:t[3],from:S[a[0]][0],fromName:S[a[0]][1],to:S[b[0]][0],toName:S[b[0]][1],dep,arr,dur:arr-dep,km:Math.max(1,b[3]-a[3])}}
// MIT: junction size, long first leg, accessibility uplift, delay buffer (P80, synthetic)
R.mit=function(l1,help){const big=atStation[byCode[l1.to]].length>=80;let m=big?60:45;if(l1.km>=500)m+=30;if(help)m+=30;m+=Math.round(hash(l1.no+'p80')*20);return m};
R.search=function(fromCodes,toCodes,o){o=o||{};const cls=o.cls||'3A',date=o.date||'',help=!!o.help;
 const F=new Set(fromCodes),Tt=new Set(toCodes);const direct=[];const seenD=new Set();
 fromCodes.forEach(fc=>{const fi=byCode[fc];if(fi==null)return;atStation[fi].forEach(([ti,i])=>{const st=T[ti][4];for(let j=i+1;j<st.length;j++){if(Tt.has(S[st[j][0]][0])){if(!seenD.has(ti)){seenD.add(ti);direct.push(leg(ti,i,j))}break}}})});
 direct.forEach(d=>{d.hasCls=R.hasClass(T[d.ti],cls);d.av=R.avail(d.no,date,cls,d.from,d.to,false);d.fare=R.fare(T[d.ti],d.km,cls)});
 direct.sort((a,b)=>(b.hasCls-a.hasCls)||(a.dur-b.dur));
 // one change
 const reachX=new Map();
 fromCodes.forEach(fc=>{const fi=byCode[fc];if(fi==null)return;atStation[fi].forEach(([ti,i])=>{if(!R.hasClass(T[ti],cls))return;const st=T[ti][4];for(let j=i+1;j<st.length;j++){const x=st[j][0];const xc=S[x][0];if(F.has(xc)||Tt.has(xc))continue;if(atStation[x].length<25)continue;(reachX.get(x)||reachX.set(x,[]).get(x)).push([ti,i,j])}})});
 const best=[];const minDirect=direct.filter(d=>d.hasCls).reduce((m,d)=>Math.min(m,d.dur),Infinity);
 toCodes.forEach(tc=>{const toi=byCode[tc];if(toi==null)return;atStation[toi].forEach(([ti2,j2])=>{if(!R.hasClass(T[ti2],cls))return;const st=T[ti2][4];for(let i2=0;i2<j2;i2++){const x=st[i2][0];const l1s=reachX.get(x);if(!l1s)continue;
   const l2=leg(ti2,i2,j2);
   for(const [ti,i,j] of l1s){if(ti===ti2)continue;const l1=leg(ti,i,j);const mit=R.mit(l1,help);let wait=tod(tod(l2.dep)-tod(l1.arr));if(wait<mit)wait+=0;if(wait>10*60)continue;
    const total=l1.dur+wait+l2.dur;best.push({l1,l2,wait,mit,total,tight:wait<mit})}}})});
 const lim=isFinite(minDirect)?minDirect*1.8+240:Infinity;
 let cands=best.filter(c=>c.total<=lim);
 cands.forEach(c=>{c.l1.av=R.avail(c.l1.no,date,cls,c.l1.from,c.l1.to,true);c.l2.av=R.avail(c.l2.no,date,cls,c.l2.from,c.l2.to,true);
  c.l1.fare=R.fare(T[c.l1.ti],c.l1.km,cls);c.l2.fare=R.fare(T[c.l2.ti],c.l2.km,cls);c.fare=c.l1.fare+c.l2.fare;c.via=c.l1.to;c.viaName=c.l1.toName;
  const avOk=c.l1.av.s==='AVL'&&c.l2.av.s==='AVL';c.ok=avOk&&!c.tight;
  const buffer=c.wait-c.mit;c.score=c.total+(c.tight?1e5:0)+(avOk?0:5e4)+(buffer<30?60:0)+c.fare*0.02});
 cands.sort((a,b)=>a.score-b.score);
 const pick=[];const usedVia=new Set();for(const c of cands){if(usedVia.has(c.via))continue;usedVia.add(c.via);pick.push(c);if(pick.length>=3)break}
 // one tight example (to show the safety rule) if none of the picks is tight
 if(!pick.some(c=>c.tight)){const t=cands.find(c=>c.tight&&c.l1.av.s==='AVL'&&c.l2.av.s==='AVL');if(t)pick.push(t)}
 // Guarantee: if the timetable has nothing usable, simulate plausible trains (clearly flagged sim:true)
 let simulated=false;
 const directOk=direct.some(d=>d.hasCls);
 if(!directOk){const sd=simLeg(fromCodes[0],toCodes[0],cls,date,'d');if(sd){sd.av=R.avail(sd.no,date,cls,sd.from,sd.to,false);direct.unshift(sd);simulated=true}}
 if(!pick.some(c=>c.ok)){const sc=simConn(fromCodes[0],toCodes[0],cls,date,help);if(sc){pick.unshift(sc);simulated=true}}
 return {direct:direct.slice(0,6),conns:pick.slice(0,4),cls,simulated}};
function km(a,b){const A=S[byCode[a]],B=S[byCode[b]];if(!A||!B||A[3]==null||B[3]==null)return null;const r=Math.PI/180;const x=Math.sin((B[3]-A[3])*r/2)**2+Math.cos(A[3]*r)*Math.cos(B[3]*r)*Math.sin((B[4]-A[4])*r/2)**2;return 2*6371*Math.asin(Math.sqrt(x))*1.25}
function simLeg(a,b,cls,date,salt,afterMin){const d=km(a,b);if(!d)return null;const h=hash(a+b+salt);const no=String(2+Math.floor(h*2))+String(1000+Math.floor(hash(b+a+salt)*8999)).padStart(4,'0');
 const dep=afterMin!=null?afterMin:Math.round((5*60+h*16*60)/5)*5;const dur=Math.round((d/52+0.5)*60/5)*5;
 const fake=[no,'','SF',cls==='CC'?'C':'123S',null];
 return {ti:-1,sim:true,no,name:S[byCode[a]][1].replace(/ (Jn|Junction|Cant|Cantt|Central|Terminus)$/i,'')+' – '+S[byCode[b]][1].replace(/ (Jn|Junction|Cant|Cantt|Central|Terminus)$/i,'')+' Express',type:'SF',classes:fake[3],from:a,fromName:S[byCode[a]][1],to:b,toName:S[byCode[b]][1],dep,arr:dep+dur,dur,km:Math.round(d),hasCls:true,fare:R.fare(fake,d,cls)}}
function simConn(a,b,cls,date,help){let best=null;S.forEach((s,i)=>{if(atStation[i].length<60||s[0]===a||s[0]===b)return;const d1=km(a,s[0]),d2=km(s[0],b),dd=km(a,b);if(!d1||!d2||!dd)return;if(d1<150||d2<80)return;const sc=d1+d2-dd;if(!best||sc<best[0])best=[sc,s[0]]});
 if(!best)return null;const H=best[1];
 // try a real first leg, else simulate
 let l1=null;const fi=byCode[a];if(fi!=null){for(const [ti,i] of atStation[fi]){if(!R.hasClass(T[ti],cls))continue;const st=T[ti][4];for(let j=i+1;j<st.length;j++){if(S[st[j][0]][0]===H){const L=leg(ti,i,j);if(!l1||L.dur<l1.dur)l1=L;break}}}}
 if(l1){l1.fare=R.fare(T[l1.ti],l1.km,cls)}else l1=simLeg(a,H,cls,date,'c1');
 if(!l1)return null;const mit=R.mit(l1,help);const l2=simLeg(H,b,cls,date,'c2',null);
 l2.dep=Math.round((tod(l1.arr)+mit+40+Math.floor(hash(a+b)*60))/5)*5;l2.arr=l2.dep+l2.dur;
 const wait=tod(l2.dep-tod(l1.arr));l1.av={s:'AVL',n:6+Math.floor(hash(l1.no+date)*40)};l2.av={s:'AVL',n:4+Math.floor(hash(l2.no+date)*30)};
 return {l1,l2,wait,mit,total:l1.dur+wait+l2.dur,tight:false,fare:l1.fare+l2.fare,via:H,viaName:S[byCode[H]][1],ok:true,sim:true}}
R.stops=function(l){if(l.ti<0||l.ti==null)return [{code:l.from,name:l.fromName,arr:null,dep:l.dep,km:0},{code:l.to,name:l.toName,arr:l.arr,dep:null,km:l.km}];
 const st=T[l.ti][4];const out=[];for(let k=l.i;k<=l.j;k++){const x=st[k];out.push({code:S[x[0]][0],name:S[x[0]][1],arr:k===l.i?null:x[1],dep:k===l.j?null:x[2],km:x[3]-st[l.i][3]})}return out};
R.hasPantry=l=>['Raj','Drnt','Shtb'].includes(l.type)||(l.ti>=0&&/(Exp|SF|Mail)/.test(l.type)&&l.km>800);
root.RAIL=R;
})(typeof window!=='undefined'?window:globalThis);
