/**
 * MISIÓN 404 · servidor de aula / Google Apps Script.
 * Vinculado exclusivamente a la HDC del docente. No incluir claves en este código.
 *
 * Se debe crear en Propiedades del script: MISION404_ADMIN_PIN = contraseña docente
 * aleatoria de 16+ caracteres. Configurar la web app como "Ejecutar como yo".
 *
 * Sólo este servidor tiene permisos para leer/escribir la HDC.
 * La web app se sirve con HtmlService: google.script.run evita problemas CORS.
 */
const M404 = Object.freeze({
  spreadsheetId: '17DlGd_smFvJ5wJ6z3lc34DlNZOVOH4is2f83mbESEvI',
  access: '01_Accesos', events: '03_Eventos',
  teams: '06_Sync_equipos', users: '07_Sync_alumnos',
  control: '08_Sync_control',
  teamNames: ['ALFA','BRAVO','CHARLIE','DELTA'],
  roles: ['Marketing','Seguridad','Operaciones'],
  tokenTTL: 21600,
  maxText: 3000
});

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('MISIÓN 404 · Centro de operaciones')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function sheet_(name) {
  const tab=SpreadsheetApp.openById(M404.spreadsheetId).getSheetByName(name);
  if(!tab)throw Error('Falta la pestaña '+name+' en la HDC.');
  return tab;
}
function now_() {return Date.now();}
function random_() {return (Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').toUpperCase();}
function clean_(x,max) {return String(x===undefined||x===null?'':x).trim().slice(0,max||M404.maxText);}
function safeCell_(x) {const s=clean_(x,5000);return /^[=+\-@\t\r]/.test(s)?"'"+s:s;}
function parseState_(value) {try{const x=JSON.parse(String(value||'{}'));return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(e){return {}}}
function session_(token,type) {
  if(typeof token!=='string'||!(/^[0-9A-F]{64}$/.test(token)))throw Error('Sesión inválida. Vuelve a identificarte.');
  const c=CacheService.getScriptCache(),str=c.get('m404_'+token);
  if(!str)throw Error('La sesión ha caducado. Vuelve a identificarte.');
  const s=JSON.parse(str);
  if(type&&s.type!==type)throw Error('No tienes permisos para esa acción.');
  c.put('m404_'+token,str,M404.tokenTTL);
  return s;
}
function newSession_(data) {
  const token=random_();
  CacheService.getScriptCache().put('m404_'+token,JSON.stringify(data),M404.tokenTTL);
  return token;
}
function clockRow_() {
  const row=sheet_(M404.control).getRange(2,1,1,3).getValues()[0];
  const c=parseState_(row[1]);
  return {elapsed:Math.min(18000,Math.max(0,Number(c.elapsed)||0)),running:!!c.running,startedAt:Number(c.startedAt)||null,revision:Number(c.revision)||0};
}
function effectiveClock_(c) {
  const delta=c.running&&c.startedAt?Math.max(0,Math.floor((now_()-c.startedAt)/1000)):0;
  return {elapsed:Math.min(18000,c.elapsed+delta),running:!!c.running&&c.elapsed+delta<18000};
}
function writeClock_(c) {
  c.revision=(Number(c.revision)||0)+1;
  sheet_(M404.control).getRange(2,2,1,2).setValues([[JSON.stringify(c),new Date()]]);
}
function teamRow_(team) {
  const idx=M404.teamNames.indexOf(team);
  if(idx<0)throw Error('Célula no reconocida.');
  return idx+2;
}
function personRow_(personalCode) {
  const values=sheet_(M404.users).getRange(2,1,12,6).getValues();
  const index=values.findIndex(x=>String(x[0]).toUpperCase()===personalCode);
  if(index<0)throw Error('Operador no incluido en la HDC.');
  return index+2;
}
function readTeam_(team) {
  const values=sheet_(M404.teams).getRange(teamRow_(team),1,1,4).getValues()[0];
  return {data:parseState_(values[1]),rev:Number(values[2])||0};
}
function writeTeam_(team,data,rev) {
  sheet_(M404.teams).getRange(teamRow_(team),2,1,3).setValues([[JSON.stringify(data),rev+1,new Date()]]);
}
function readPerson_(personalCode) {
  const row=personRow_(personalCode);
  const values=sheet_(M404.users).getRange(row,1,1,6).getValues()[0];
  return {row:row,data:parseState_(values[3]),rev:Number(values[4])||0};
}
function writePerson_(row,data,rev) {
  sheet_(M404.users).getRange(row,4,1,3).setValues([[JSON.stringify(data),rev+1,new Date()]]);
}
function writeEvent_(s,act,phase,type,decision,reason,auth) {
  const date=Utilities.formatDate(new Date(),'Europe/Madrid','yyyy-MM-dd HH:mm:ss');
  const line=[date,s.team||'DIRECCIÓN',s.personalCode||'',s.name||'',
              act,phase,type,safeCell_(decision),safeCell_(reason),'',auth||'',Utilities.getUuid()];
  sheet_(M404.events).appendRow(line);
}
function roleKey_(team,role) {
  const i=M404.roles.indexOf(role);
  if(i<0||M404.teamNames.indexOf(team)<0)throw Error('Rol no reconocido.');
  return team.charAt(0)+'0'+(i+1);
}
function lookupCredential_(code,team) {
  const rows=sheet_(M404.access).getRange(2,1,12,8).getValues();
  const found=rows.find(r=>String(r[3]).trim().toUpperCase()===code);
  if(!found||found[0]!==team)throw Error('Código de acceso incorrecto para esta célula.');
  const role=clean_(found[4],40);
  return {type:'student',team:team,personalCode:code,name:clean_(found[2],120),role:role,code:roleKey_(team,role)};
}
function snapshot_(session) {
  const c=effectiveClock_(clockRow_());
  const state={elapsed:c.elapsed,running:c.running,teams:{},users:{},events:[],phase:null};
  let revision='';
  if(session.type==='teacher') {
    for(const t of M404.teamNames){const r=readTeam_(t);state.teams[t]=r.data;revision+=r.rev+'-'}
    const entries=sheet_(M404.users).getRange(2,1,12,6).getValues();
    for(const row of entries){state.users[roleKey_(String(row[1]),String(row[2]))]=parseState_(row[3]);revision+=String(row[4]||0)+'-'}
    const approvals=sheet_(M404.control).getRange(3,1,4,2).getValues();
    const approvalCodes={};for(const r of approvals)approvalCodes[String(r[0]).replace('approval_','')]=String(r[1]||'');
    return {state:state,revision:clockRow_().revision+'-'+revision,approvalCodes:approvalCodes,mode:'teacher'};
  }
  const team=readTeam_(session.team),user=readPerson_(session.personalCode);
  state.teams[session.team]=team.data;
  state.users[session.code]=user.data;
  revision=clockRow_().revision+'-'+team.rev+'-'+user.rev;
  return {state:state,revision:revision,mode:'student',
    actor:{team:session.team,code:session.code,name:session.name,role:session.role}};
}
function apiLogin(team,code) {
  team=clean_(team,20).toUpperCase();code=clean_(code,40).toUpperCase();
  if(!/^MD-[A-Z0-9]{7}$/.test(code))throw Error('El código individual debe tener el formato entregado por el docente.');
  const s=lookupCredential_(code,team),token=newSession_(s);
  const snapshot=snapshot_(s);
  writeEvent_(s,'ACCESO','Login','login','Inicio de sesión','','');
  return {token:token,snapshot:snapshot};
}
function apiAdminLogin(pin) {
  const saved=PropertiesService.getScriptProperties().getProperty('MISION404_ADMIN_PIN');
  if(!saved||saved.length<16)throw Error('Configura antes MISION404_ADMIN_PIN (16+ caracteres) en las propiedades del proyecto.');
  if(clean_(pin,200)!==saved)throw Error('Clave docente incorrecta.');
  const s={type:'teacher',team:'DIRECCIÓN',name:'Docente'};
  const token=newSession_(s);
  ensureApprovals_();
  return {token:token,snapshot:snapshot_(s)};
}
function apiSnapshot(token) {return snapshot_(session_(token));}
function approvals_() {
  const rows=sheet_(M404.control).getRange(3,1,4,2).getValues();
  const byTeam={};
  for(const row of rows){byTeam[String(row[0]).replace('approval_','')]=String(row[1]||'').trim().toUpperCase()}
  return byTeam;
}
function ensureApprovals_() {
  const tab=sheet_(M404.control),rows=tab.getRange(3,1,4,3).getValues();
  let dirty=false;
  for(let i=0;i<4;i++){
    if(!rows[i][1]){rows[i][1]='AUT-'+random_().slice(0,10);rows[i][2]=new Date();dirty=true}
  }
  if(dirty)tab.getRange(3,1,4,3).setValues(rows);
}
const M404_EXCHANGE = Object.freeze({
  I:{ALFA:'A-DR17',BRAVO:'B-PERMISOS',CHARLIE:'C-CRM',DELTA:'D-FLUJO'},
  II:{ALFA:'C-VALIDA-ELENA',BRAVO:'C-REGISTRO-23',CHARLIE:'C-MINIMIZA-23',DELTA:'C-PERMISOS-23'},
  III:{ALFA:'III-CORREO',BRAVO:'III-SESION',CHARLIE:'III-DATOS',DELTA:'III-BRIEF'}
});
function verifyExchange_(act,other,code) {
  const expected=M404_EXCHANGE[act]&&M404_EXCHANGE[act][other];
  if(!expected||clean_(code,80).toUpperCase()!==expected)throw Error('Código de intercambio incorrecto. Contrástalo con el otro equipo.');
}
function allowedExternal_(team,foreignTeam) {
  return M404.teamNames.includes(foreignTeam)&&foreignTeam!==team;
}
function addUnique_(array,item,key) {
  if(array.some(x=>(typeof x==='string'?x:x[key])===(typeof item==='string'?item:item[key])))return false;
  array.push(item);return true;
}
function choice_(value) {
  const num=Number(value);if(!Number.isInteger(num)||num<0||num>2)throw Error('Opción de respuesta no válida.');return num;
}
function mustText_(value,min,max) {
  const str=clean_(value,max||2000);
  if(str.length<min)throw Error('Falta justificar la respuesta con suficiente información.');
  return str;
}
function docId_(team,id,act) {
  const prefix=team.charAt(0)+'-'+String(act);
  return new RegExp('^'+prefix+'[1-3]$').test(String(id||''));
}
function verifyRefs_(refs,own,contacts,phase,team) {
  if(!Array.isArray(refs)||refs.length<2||refs.length>8)throw Error('Debes citar entre dos y ocho referencias.');
  const ownOk=refs.some(x=>own.includes(x));
  const otherOk=refs.some(x=>contacts.some(c=>x===c.source+'@'+c.team));
  if(!ownOk||!otherOk)throw Error('Faltan fuentes propias y otra célula verificada.');
  return refs.map(x=>clean_(x,50));
}
function runOperation_(s,op,p,c) {
  const team=s.team,code=s.code,td=readTeam_(team),ud=readPerson_(s.personalCode);
  const a=td.data,u=ud.data;
  let updateTeam=false,updateUser=false,act='',phase='',decision='',reason='',authorization='';
  const elapsed=effectiveClock_(clockRow_()).elapsed,min=Math.floor(elapsed/60);
  const requireMinute=n=>{if(min<n)throw Error('Esta fase todavía no está disponible.')};
  const ownDoc=(id,part)=>docId_(team,id,part);
  const requirePersonal=()=>{if(!u.individual)throw Error('Registra antes tu primera respuesta personal.')};
  switch(op){
    case 'individual': {
      const ch=choice_(p.choice);reason=mustText_(p.reason,25);
      if(u.individual)throw Error('Esta respuesta personal ya estaba registrada.');
      u.individual={choice:String(ch),reason:reason,at:elapsed};updateUser=true;act='I';phase='Individual';decision=String(ch);break;
    }
    case 'document': {
      if(!ownDoc(p.doc,0))throw Error('Documento fuera de tu célula.');
      a.readDocs=Array.isArray(a.readDocs)?a.readDocs:[];
      if(!addUnique_(a.readDocs,String(p.doc)))return 'duplicate';
      updateTeam=true;act='I';phase='Expediente';decision=String(p.doc);break;
    }
    case 'cooperacion': {
      requireMinute(26);
      const other=clean_(p.team,20).toUpperCase();
      if(!allowedExternal_(team,other))throw Error('El intercambio debe proceder de otra célula.');
      verifyExchange_('I',other,p.exchangeCode);
      a.contacts=Array.isArray(a.contacts)?a.contacts:[];
      if(!addUnique_(a.contacts,{team:other,at:elapsed},'team'))return 'duplicate';
      updateTeam=true;act='I';phase='Intercambio';decision=other;break;
    }
    case 'decision': {
      requireMinute(36);if(a.decision)throw Error('La célula ya ha registrado esta decisión.');
      const ch=choice_(p.choice);reason=mustText_(p.reason,60);const sources=p.sources;
      if(!Array.isArray(sources)||sources.length<1||sources.length>3)throw Error('Indica de una a tres evidencias.');
      const allowed=new Set([team.charAt(0)+'-01',team.charAt(0)+'-02',team.charAt(0)+'-03']);
      for(const x of (a.contacts||[]))allowed.add(x.team.charAt(0)+'-0'+1+'@'+x.team);
      if(!sources.every(x=>allowed.has(x)||/^[A-D]-0[1-3]@[A-Z]+$/.test(x)))throw Error('Evidencia no reconocida.');
      a.decision={choice:String(ch),sources:sources.map(x=>clean_(x,50)),reason:reason,at:elapsed,author:code};
      updateTeam=true;act='I';phase='Decisión';decision=String(ch);break;
    }
    case 'authorize': {
      requireMinute(46);if(!a.decision)throw Error('Antes necesitáis la decisión de célula.');
      const auth=approvals_()[team],received=clean_(p.approvalCode,40).toUpperCase();
      if(!auth||received!==auth)throw Error('Código de dirección incorrecto para la célula.');
      if(a.authorized)return 'duplicate';
      a.authorized={at:elapsed,by:code};updateTeam=true;act='I';phase='Autorización';authorization='Concedida';decision='OK';break;
    }
    case 'acto2-individual': {
      requireMinute(60);if(u.a2Individual)throw Error('Respuesta del Acto II ya registrada.');
      const ch=choice_(p.choice);reason=mustText_(p.reason,50);
      u.a2Individual={choice:String(ch),reason:reason,at:elapsed,by:code};
      updateUser=true;act='II';phase='Individual';decision=String(ch);break;
    }
    case 'acto2-documento': {
      requireMinute(60);if(!ownDoc(p.doc,2))throw Error('Documento no reconocido.');
      if(String(p.doc).endsWith('3')){requireMinute(80);if(!a.authorized)throw Error('La célula necesita autorización docente.')}
      a.a2Docs=Array.isArray(a.a2Docs)?a.a2Docs:[];
      if(!addUnique_(a.a2Docs,String(p.doc)))return 'duplicate';
      updateTeam=true;act='II';phase='Documentos';decision=String(p.doc);break;
    }
    case 'acto2-cooperacion': {
      requireMinute(80);if(!a.authorized)throw Error('Falta autorización docente.');
      const other=clean_(p.team,20).toUpperCase();
      if(!allowedExternal_(team,other))throw Error('La fuente debe pertenecer a otra célula.');
      verifyExchange_('II',other,p.exchangeCode);
      reason=mustText_(p.reason,30);
      a.a2Contacts=Array.isArray(a.a2Contacts)?a.a2Contacts:[];
      if(!addUnique_(a.a2Contacts,{team:other,reason:reason,at:elapsed,by:code,source:other.charAt(0)+'-23'},'team'))return 'duplicate';
      updateTeam=true;act='II';phase='Contraste';decision=other;break;
    }
    case 'acto2-decision': {
      requireMinute(88);if(!a.authorized)throw Error('Falta autorización docente.');
      if(!u.a2Individual)throw Error('Registra tu primera respuesta individual.');
      if(a.a2Decision)throw Error('La célula ya ha decidido.');
      const ch=choice_(p.choice),confidence=clean_(p.confidence,20);
      if(!['Alta','Media','Baja'].includes(confidence))throw Error('Indica nivel de certeza.');
      reason=mustText_(p.reason,80);
      const refs=verifyRefs_(p.sources,a.a2Docs||[],a.a2Contacts||[],2,team);
      a.a2Decision={choice:String(ch),sources:refs,confidence:confidence,reason:reason,at:elapsed,by:code};
      updateTeam=true;act='II';phase='Decisión';decision=String(ch);break;
    }
    case 'acto3-individual': {
      requireMinute(120);if(u.a3Individual)throw Error('Respuesta del Acto III ya registrada.');
      const ch=choice_(p.choice);reason=mustText_(p.reason,40);
      u.a3Individual={choice:String(ch),reason:reason,at:elapsed,by:code};
      updateUser=true;act='III';phase='Individual';decision=String(ch);break;
    }
    case 'acto3-documento': {
      requireMinute(120);if(!ownDoc(p.doc,3))throw Error('Documento no reconocido.');
      if(String(p.doc).endsWith('3'))requireMinute(140);
      a.a3Docs=Array.isArray(a.a3Docs)?a.a3Docs:[];
      if(!addUnique_(a.a3Docs,String(p.doc)))return 'duplicate';
      updateTeam=true;act='III';phase='Documentos';decision=String(p.doc);break;
    }
    case 'acto3-contraste': {
      requireMinute(140);if((a.a3Docs||[]).length!==3)throw Error('Primero revisad las tres evidencias.');
      const other=clean_(p.team,20).toUpperCase();
      if(!allowedExternal_(team,other))throw Error('La fuente debe pertenecer a otra célula.');
      verifyExchange_('III',other,p.exchangeCode);
      reason=mustText_(p.reason,40);
      a.a3Contacts=Array.isArray(a.a3Contacts)?a.a3Contacts:[];
      if(!addUnique_(a.a3Contacts,{team:other,reason:reason,at:elapsed,by:code,source:other.charAt(0)+'-33'},'team'))return 'duplicate';
      updateTeam=true;act='III';phase='Contraste';decision=other;break;
    }
    case 'acto3-decision': {
      requireMinute(155);if((a.a3Docs||[]).length!==3||(a.a3Contacts||[]).length<1)throw Error('Falta revisar y contrastar pruebas.');
      if(a.a3Decision)throw Error('La célula ya ha registrado su conclusión.');
      const ch=choice_(p.choice),fact=mustText_(p.fact,35),unknown=mustText_(p.unknown,35),measure=mustText_(p.measure,65);
      const refs=verifyRefs_(p.refs,a.a3Docs||[],a.a3Contacts||[],3,team);
      a.a3Decision={choice:String(ch),refs:refs,fact:fact,unknown:unknown,measure:measure,at:elapsed,by:code};
      updateTeam=true;act='III';phase='Decisión';decision=String(ch);reason=measure;break;
    }
    default:throw Error('Acción desconocida.');
  }
  if(updateTeam)writeTeam_(team,a,td.rev);
  if(updateUser)writePerson_(ud.row,u,ud.rev);
  writeEvent_(s,act,phase,op,decision,reason,authorization);
  return 'saved';
}
function apiCommit(token,op,payload) {
  const session=session_(token,'student');
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Solicitud no válida.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(12000))throw Error('Servidor ocupado. Vuelve a intentarlo.');
  try {
    const result=runOperation_(session,clean_(op,50),payload);
    return {result:result,snapshot:snapshot_(session)};
  } finally{lock.releaseLock()}
}
function apiAdminCommand(token,op,body) {
  const s=session_(token,'teacher');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('Servidor ocupado. Inténtalo de nuevo.');
  try {
    const clock=clockRow_(),effective=effectiveClock_(clock);
    if(op==='toggle') {
      if(clock.running){clock.elapsed=effective.elapsed;clock.startedAt=null;clock.running=false}
      else {clock.elapsed=effective.elapsed;clock.startedAt=now_();clock.running=true}
      writeClock_(clock);
    } else if(op==='advance') {
      const n=Number(body&&body.minutes);
      if(![1,10,20].includes(n))throw Error('Avance de reloj no permitido.');
      clock.elapsed=Math.min(18000,effective.elapsed+n*60);
      clock.startedAt=clock.running?now_():null;writeClock_(clock);
    } else if(op==='approve') {
      const t=clean_(body&&body.team,20).toUpperCase();
      const d=readTeam_(t);
      if(!d.data.decision)throw Error('El equipo debe entregar primero la decisión del Acto I.');
      if(!d.data.authorized){d.data.authorized={at:effective.elapsed,by:'DIRECCIÓN'};writeTeam_(t,d.data,d.rev);
        writeEvent_(s,'I','Autorización','approve',t,'Validación directa del docente','Concedida')}
    } else if(op==='rotateApprovals') {
      const tab=sheet_(M404.control);
      for(let i=0;i<4;i++)tab.getRange(i+3,2,1,2).setValues([['AUT-'+random_().slice(0,10),new Date()]]);
      writeEvent_(s,'CONTROL','Claves','rotate','Códigos renovados','','');
    } else if(op==='reset') {
      if(!body||body.confirm!=='REINICIAR')throw Error('Confirmación de reinicio incorrecta.');
      const teams=sheet_(M404.teams),students=sheet_(M404.users);
      teams.getRange(2,2,4,3).setValues(M404.teamNames.map(t=>['{}',0,new Date()]));
      students.getRange(2,4,12,3).setValues(Array.from({length:12},()=>['{}',0,new Date()]));
      clock.elapsed=0;clock.running=false;clock.startedAt=null;writeClock_(clock);
      writeEvent_(s,'CONTROL','Reinicio','reset','Reinicio del estado','Se conservan los registros históricos de 03_Eventos','');
    } else throw Error('Control docente no reconocido.');
    return {snapshot:snapshot_(s)};
  } finally {lock.releaseLock()}
}
