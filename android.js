/* Beero web - replaces the Android app's bridge (window.Android) inside the browser.
   The pages are the same HTML/JS as in the Android app (app/src/main/assets); everything the Kotlin
   code did (BeerStore, BeerCatalog, Settings, Reminders, BeerTracker, MapyApi) is done here instead:
   data in localStorage, location from the browser, reminders as web notifications.
   Must be loaded before ui.js. */
(function(){
'use strict';
var BEERS_KEY='beero_beers',PREFS_KEY='beero_prefs';
var PAGES={today:'index.html',map:'map.html',pubs:'pubs.html',awards:'awards.html',stats:'stats.html',settings:'settings.html',catalog:'catalog.html'};
var page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
window.BEERO_WEB=true;

/* ---------- storage ---------- */
function readJson(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function writeJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var prefs=readJson(PREFS_KEY,{});
function P(k,d){return prefs[k]===undefined?d:prefs[k]}
function setP(k,v){prefs=readJson(PREFS_KEY,{});if(v===undefined||v===null)delete prefs[k];else prefs[k]=v;writeJson(PREFS_KEY,prefs)}
function beers(){return readJson(BEERS_KEY,[])}
function saveBeers(a){writeJson(BEERS_KEY,a)}

function pad(n){return n<10?'0'+n:''+n}
function today(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function tz(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch(e){return 'UTC'}}
function uuid(){if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})}
function dayOf(ts){var d=new Date(ts);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function countToday(){var t=today(),n=0;beers().forEach(function(b){if(b.local_date===t)n++});return n}
/* alcoholic beers today - the mascot and the reminders go by these (non-alcoholic ones do not count) */
function countAlc(){var t=today(),n=0;beers().forEach(function(b){if(b.local_date===t&&!b.nonalc)n++});return n}
var DEFAULT_VOL=500,PAST_MAX_DAYS=400;
function update(id,fields){var a=beers();for(var i=0;i<a.length;i++)if(a[i].id===id){for(var k in fields)a[i][k]=fields[k];saveBeers(a);return true}return false}

/* ---------- settings (Settings.kt) ---------- */
var THEMES=['night','daylight','hop','stout','auto'],BG={night:'#11141B',daylight:'#F6F1E6',hop:'#13221A',stout:'#0E0B0A'};
function themeChoice(){var t=P('theme','night');return THEMES.indexOf(t)>=0?t:'night'}
function theme(){var t=themeChoice();if(t!=='auto')return t;var h=new Date().getHours();return h>=7&&h<=18?'daylight':'night'}
function lang(){var l=P('lang',null);if(l==='cs'||l==='en')return l;return (navigator.language||'').toLowerCase().indexOf('cs')===0?'cs':'en'}
function cs(){return lang()==='cs'}
function beersWord(n){return cs()?n+' '+(n===1?'pivo':n>=2&&n<=4?'piva':'piv'):n+' '+(n===1?'beer':'beers')}
var MOOD_DEFAULTS=[2,3,4,5,6,7,9,11,12];
function userName(){return String(P('user_name','')||'').trim()}
function setUserName(name){var n=String(name||'').trim().replace(/\s+/g,' ').slice(0,24);if(!n)return false;setP('user_name',n);return true}
function onboarded(){return !!P('adult_ok',false)&&userName().length>0}

/* first start: welcome screen first (name + 18+), like WelcomeActivity */
if(page!=='welcome.html'&&!onboarded()){location.replace('welcome.html');return}
if(page==='welcome.html'&&onboarded()){location.replace('index.html');return}

/* browser bar / background in the theme colour */
(function(){var c=BG[theme()]||BG.night;var m=document.querySelector('meta[name=theme-color]');
 if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=c;
 document.documentElement.style.background=c})();

/* ---------- catalog (BeerCatalog.kt) ---------- */
var seedCache=null;
function seed(){
 if(seedCache)return seedCache;
 try{var x=new XMLHttpRequest();x.open('GET','beers.json',false);x.send(null);
  if(x.status===200||x.status===0)seedCache=JSON.parse(x.responseText).beers||[]}catch(e){}
 if(!seedCache)seedCache=readJson('beero_seed_cache',[]);else writeJson('beero_seed_cache',seedCache);
 return seedCache}
function custom(){return readJson('beero_custom',[])}
function catalogAll(){return seed().concat(custom())}
function findBeer(id){var a=catalogAll();for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function label(k){
 var brand=k.brand,name=k.name,deg=k.degree==null?null:k.degree,c=cs();
 var base=name.toLowerCase()===brand.toLowerCase()?brand:name.toLowerCase().indexOf(brand.toLowerCase())===0?name:brand+' '+name;
 if(k.nonalc)return base+(c?' (nealko)':' (non-alc)');
 if(deg==null)return base;
 if(new RegExp('(^|\\s)'+escRe(deg)+'(°|\\s|$)').test(name))return base;
 return base+' '+deg+'°'}
function activeId(){return P('active_beer',null)}
/* kind stored with every beer (BeerCatalog.kind): abv missing -> estimated from the degree (~0.4 % per degree) */
function kindOf(k){if(!k)return null;var abv=k.abv!=null?+k.abv:(k.degree!=null?k.degree*0.4:null);
 return {id:k.id,label:label(k),abv:abv,nonalc:!!k.nonalc||(abv!=null&&abv<=0.5)}}
function kindById(id){return id?kindOf(findBeer(id)):null}
/* beers saved before the web app knew nonalc/abv/vol (BeerDb.fillKind) */
function fillKind(a){var ch=false;a.forEach(function(b){if(b.nonalc!=null)return;ch=true;
 var k=b.beer_id?kindById(b.beer_id):null;if(k&&k.abv!=null&&b.abv==null)b.abv=k.abv;
 b.nonalc=(k&&k.nonalc)||(b.abv!=null&&b.abv<=0.5)?1:0});return ch}
(function(){var a=beers();if(a.length&&fillKind(a))saveBeers(a)})();
/* one beer at time ts (also in the past); the day comes from ts in local time */
function newBeer(ts,k,vol){var b={id:uuid(),ts:ts,local_date:dayOf(ts),tz:tz(),vol:vol,nonalc:k&&k.nonalc?1:0};
 if(k){b.beer_id=k.id;b.beer=k.label;if(k.abv!=null)b.abv=k.abv}return b}

/* ---------- reminders (Reminders.kt) ---------- */
var LEVELS=[
 {key:'water',def:4,en:['Water break 💧',"That's %s. Grab a glass of water before the next one."],cs:['Pauza na vodu 💧','Už máš %s. Před dalším si dej sklenici vody.']},
 {key:'slow',def:6,en:['Easy there 🐢','%s today. How about a slower one, or water in between?'],cs:['Zvolni 🐢','Dnes už %s. Co takhle pomaleji, nebo mezi pivy vodu?']},
 {key:'home',def:8,en:['Time to head home? 🏠',"%s is a great night. Get home safely – and don't drive."],cs:['Nechceš už domů? 🏠','%s je skvělý večer. Dostaň se domů v pořádku – a neřiď.']}];
var UBER_URL='https://m.uber.com/ul/?action=setPickup&pickup=my_location';
function remOn(){return P('rem_on',true)!==false}
function th(key){var l=LEVELS.filter(function(x){return x.key===key})[0];return +P('rem_'+key,l.def)}
function canNotify(){return 'Notification' in window&&Notification.permission==='granted'}
function remCheck(n){
 if(!remOn()||n<=0)return;
 var t=today(),fired=P('rem_day',null)===t?String(P('rem_fired','')).split(',').filter(Boolean):[];
 var cand=LEVELS.filter(function(l){return n>=th(l.key)&&fired.indexOf(l.key)<0});
 if(!cand.length)return;
 var lvl=cand.reduce(function(a,b){return th(b.key)>th(a.key)?b:a});
 LEVELS.forEach(function(l){if(th(l.key)<=th(lvl.key)&&fired.indexOf(l.key)<0)fired.push(l.key)});
 setP('rem_day',t);setP('rem_fired',fired.join(','));
 showReminder(lvl,n)}
function remAfterUndo(n){
 if(P('rem_day',null)!==today())return;
 var fired=String(P('rem_fired','')).split(',').filter(Boolean),keep=fired.filter(function(k){return th(k)<=n});
 if(keep.length!==fired.length)setP('rem_fired',keep.join(','))}
function showReminder(l,n){
 if(!canNotify())return;
 var t=cs()?l.cs:l.en,body=t[1].replace('%s',beersWord(n));
 var opt={body:body,icon:'icons/icon-192.png',badge:'icons/badge-96.png',tag:'beero-reminder',renotify:true,data:{url:'index.html'}};
 if(l.key==='home'){opt.actions=[{action:'uber',title:cs()?'Objednat Uber':'Get an Uber'}];opt.data.uber=UBER_URL}
 if(navigator.serviceWorker&&navigator.serviceWorker.ready){
  navigator.serviceWorker.ready.then(function(r){return r.showNotification(t[0],opt)}).catch(function(){try{new Notification(t[0],opt)}catch(e){}})}
 else{try{new Notification(t[0],opt)}catch(e){}}}

/* ---------- location (LocationHelper.kt + BeerTracker.kt) ---------- */
var geoState=P('geo_state','prompt');   // granted / denied / prompt (remembered for the synchronous bridge calls)
function setGeo(s){if(s!==geoState){geoState=s;setP('geo_state',s);if(window.syncCount)window.syncCount()}}
if(navigator.permissions&&navigator.permissions.query){
 navigator.permissions.query({name:'geolocation'}).then(function(st){setGeo(st.state);st.onchange=function(){setGeo(st.state)}}).catch(function(){})}
function lastLoc(){return P('last_loc',null)}
function getPos(cb){
 if(!navigator.geolocation){cb(null);return}
 var done=false;function fin(p){if(!done){done=true;cb(p)}}
 setTimeout(function(){fin(null)},9000);
 navigator.geolocation.getCurrentPosition(function(p){
  var l={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy||50,time:p.timestamp||Date.now()};
  setP('last_loc',l);setGeo('granted');fin(l)},
  function(e){if(e&&e.code===1)setGeo('denied');fin(null)},
  {enableHighAccuracy:true,timeout:8000,maximumAge:15*60*1000})}
function dist(a1,o1,a2,o2){var R=6371000,r=Math.PI/180,dA=(a2-a1)*r,dO=(o2-o1)*r;
 var h=Math.sin(dA/2)*Math.sin(dA/2)+Math.cos(a1*r)*Math.cos(a2*r)*Math.sin(dO/2)*Math.sin(dO/2);
 return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
function mapyKey(){return String(P('mapy_key','')||(window.BEERO_CONFIG&&window.BEERO_CONFIG.mapyKey)||'').trim()}
function fetchJson(url,ms){
 var ctl=window.AbortController?new AbortController():null;var t=setTimeout(function(){if(ctl)ctl.abort()},ms||5000);
 return fetch(url,{signal:ctl?ctl.signal:undefined,headers:{Accept:'application/json'}}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}

/* city + country for the beer (Android used its Geocoder) */
function cityFor(id,l){
 var key=mapyKey(),u;
 if(key){
  u='https://api.mapy.com/v1/rgeocode?lon='+l.lng+'&lat='+l.lat+'&lang=en&apikey='+encodeURIComponent(key);
  fetchJson(u).then(function(j){var it=(j.items||[])[0];if(!it)return;var city=null,country=null;
   (it.regionalStructure||[]).forEach(function(r){if(!city&&r.type==='regional.municipality')city=r.name;if(r.type==='regional.country')country=r.name});
   if(city||country)update(id,{place:city||null,country:country||null});refresh()}).catch(function(){})}
 else{
  u='https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=en&lat='+l.lat+'&lon='+l.lng;
  fetchJson(u).then(function(j){var a=j.address||{},city=a.city||a.town||a.village||a.municipality||a.county||a.state||null;
   if(city||a.country)update(id,{place:city,country:a.country||null});refresh()}).catch(function(){})}}

/* pub for the beer via Mapy.com (MapyApi.kt) - same rules as BeerTracker.resolveVenue */
var QUERIES=['hospoda','pivnice','restaurace','pub','bar'];
function nearbyVenues(lat,lng,radius){
 var key=mapyKey();if(!key)return Promise.resolve([]);
 var dLat=(radius*1.3)/111320,dLng=dLat/Math.max(0.1,Math.cos(lat*Math.PI/180));
 var box='BOX('+(lng-dLng).toFixed(6)+','+(lat-dLat).toFixed(6)+','+(lng+dLng).toFixed(6)+','+(lat+dLat).toFixed(6)+')';
 return Promise.all(QUERIES.map(function(q){
  var u='https://api.mapy.com/v1/geocode?apikey='+encodeURIComponent(key)+'&lang=cs&query='+encodeURIComponent(q)+'&type=poi&limit=15&locality='+encodeURIComponent(box);
  return fetchJson(u).then(function(j){return (j.items||[]).map(function(o){var p=o.position||{};
   if(p.lat==null||p.lon==null||!o.name)return null;return {name:o.name,lat:p.lat,lng:p.lon,d:dist(lat,lng,p.lat,p.lon)}}).filter(Boolean)}).catch(function(){return []})
 })).then(function(lists){var seen={},out=[];
  lists.forEach(function(l){l.forEach(function(v){if(v.d>radius)return;var k=v.name.toLowerCase()+'|'+v.lat.toFixed(4)+'|'+v.lng.toFixed(4);if(!seen[k]){seen[k]=1;out.push(v)}})});
  out.sort(function(a,b){return a.d-b.d});return out})}
function saveVenue(id,v){update(id,{venue:v.name,vlat:v.lat,vlng:v.lng});setP('last_venue',{name:v.name,lat:v.lat,lng:v.lng,ts:Date.now()});refresh()}
function venueFor(id,l){
 var lv=P('last_venue',null),recent=lv&&Date.now()-lv.ts<=4*3600*1000;
 if(recent&&dist(l.lat,l.lng,lv.lat,lv.lng)<=35){saveVenue(id,lv);return}
 if(!mapyKey())return;
 var radius=Math.min(150,Math.max(60,(l.acc||50)*1.5));
 nearbyVenues(l.lat,l.lng,radius).then(function(c){
  if(!c.length)return;
  if(recent){var same=c.filter(function(v){return v.name===lv.name&&dist(v.lat,v.lng,lv.lat,lv.lng)<30})[0];if(same){saveVenue(id,same);return}}
  saveVenue(id,c[0])})}
function locate(id){
 if(geoState==='denied'||!navigator.geolocation)return;
 var l=lastLoc();
 if(l&&Date.now()-l.time<15*60*1000&&geoState==='granted'){attach(id,l);return}
 getPos(function(p){if(p)attach(id,p)})}
function attach(id,l){update(id,{lat:l.lat,lng:l.lng});cityFor(id,l);venueFor(id,l);refresh()}
var rt=null;function refresh(){clearTimeout(rt);rt=setTimeout(function(){if(window.syncCount)window.syncCount()},300)}

/* ---------- backup (SettingsActivity) ---------- */
var COLS=['id','ts','local_date','tz','lat','lng','place','country','venue','vlat','vlng','beer_id','beer','nonalc','abv','vol'];
function row(b){var o={};COLS.forEach(function(c){if(b[c]!=null)o[c]=b[c]});return o}
/* insert rows (backup / undo of a delete); ids already here are skipped */
function insertRows(rows){var a=beers(),have={},added=0;a.forEach(function(b){have[b.id]=1});
 (rows||[]).forEach(function(o){if(!o||!o.id||o.ts==null||!o.local_date||have[o.id])return;var b=row(o);
  if(!b.tz)b.tz=tz();a.push(b);have[b.id]=1;added++});
 fillKind(a);saveBeers(a);return added}
function exportJson(){
 var arr=beers().slice().sort(function(x,y){return x.ts-y.ts}).map(row);
 return JSON.stringify({app:'beero',version:3,beers:arr,catalog:custom()})}
function importJson(text){
 var root;try{root=JSON.parse(text)}catch(e){return -1}
 if(!root||root.app!=='beero'||!Array.isArray(root.beers))return -1;
 if(Array.isArray(root.catalog)){var cu=custom(),ids={};cu.forEach(function(c){ids[c.id]=1});
  root.catalog.forEach(function(o){if(o&&String(o.id).indexOf('c-')===0&&o.brand&&o.name&&!ids[o.id]){o.custom=true;cu.push(o);ids[o.id]=1}});
  writeJson('beero_custom',cu)}
 return insertRows(root.beers)}
function download(name,text){
 var blob=new Blob([text],{type:'application/json'}),f;
 try{f=new File([blob],name,{type:'application/json'})}catch(e){}
 if(f&&navigator.canShare&&navigator.canShare({files:[f]})&&/Android|iPhone|iPad/i.test(navigator.userAgent)){
  return navigator.share({files:[f],title:name}).then(function(){return true},function(e){return e&&e.name==='AbortError'?null:false})}
 var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();
 setTimeout(function(){URL.revokeObjectURL(u);a.remove()},1000);return Promise.resolve(true)}

/* ---------- the bridge ---------- */
var A={
 /* BaseBridge */
 getBeers:function(){return JSON.stringify(beers().slice().sort(function(x,y){return x.ts-y.ts}).map(function(b){var o={id:b.id,ts:b.ts,d:b.local_date};
  if(b.place)o.city=b.place;if(b.country)o.country=b.country;if(b.lat!=null&&b.lng!=null){o.lat=b.lat;o.lng=b.lng}
  if(b.venue&&b.vlat!=null&&b.vlng!=null){o.venue=b.venue;o.vlat=b.vlat;o.vlng=b.vlng}
  else if(b.venue)o.venue=b.venue;   /* own place of a beer without location: not on the map */
  if(b.beer_id)o.bid=b.beer_id;if(b.beer)o.beer=b.beer;if(b.nonalc)o.na=true;if(b.abv!=null)o.abv=b.abv;if(b.vol!=null)o.vol=b.vol;return o}))},
 getCount:countToday,
 getAlcCount:countAlc,
 /* body for the blood alcohol estimate (Settings.bodyJson / setBody) */
 getBody:function(){var b=P('body',{})||{};return JSON.stringify({sex:b.sex==='m'||b.sex==='f'?b.sex:null,age:b.age||null,h:b.h||null,w:b.w||null})},
 setBody:function(json){var o;try{o=JSON.parse(json)}catch(e){return}var b={};
  if(o.sex==='m'||o.sex==='f')b.sex=o.sex;
  [['age',18,100],['h',120,230],['w',35,250]].forEach(function(x){var v=o[x[0]]==null?0:parseInt(o[x[0]],10);if(v>=x[1]&&v<=x[2])b[x[0]]=v});
  setP('body',b)},
 go:function(tab){var p=PAGES[tab]||'index.html';if(p===page)return;
  if(tab==='settings'||tab==='catalog'||page==='index.html')location.href=p;else location.replace(p)},
 close:function(){if(history.length>1&&document.referrer&&document.referrer.indexOf(location.origin)===0)history.back();else location.replace('index.html')},
 hasLocationPermission:function(){return geoState==='granted'},
 requestLocation:function(){getPos(function(){refresh()})},
 getSeenAwards:function(){return P('seen_awards',null)},
 setSeenAwards:function(ids){setP('seen_awards',String(ids))},
 openUrl:function(url){if(/^https:\/\/(mapy\.com|mapy\.cz|api\.mapy\.com|www\.openstreetmap\.org)\//.test(url))window.open(url,'_blank','noopener')},
 getTheme:theme,getThemeChoice:themeChoice,
 setTheme:function(t){if(THEMES.indexOf(t)>=0)setP('theme',t)},
 getLang:lang,
 setLang:function(l){if(l==='cs'||l==='en')setP('lang',l)},
 getMoods:function(){var m=P('mood_th',null);return JSON.stringify(Array.isArray(m)&&m.length===MOOD_DEFAULTS.length?m:MOOD_DEFAULTS)},
 setMoods:function(json){try{var a=JSON.parse(json);if(a.length!==MOOD_DEFAULTS.length)return;var prev=1,out=[];
  a.forEach(function(v){v=Math.min(60,Math.max(prev,parseInt(v,10)||prev));out.push(v);prev=v});setP('mood_th',out)}catch(e){}},
 getMapPeriod:function(){var p=P('map_period','month');return ['day','month','year'].indexOf(p)>=0?p:'month'},
 setMapPeriod:function(p){if(['day','month','year'].indexOf(p)>=0)setP('map_period',p)},
 getReminders:function(){var o={on:remOn()};LEVELS.forEach(function(l){o[l.key]=th(l.key)});o.notifOk=canNotify();return JSON.stringify(o)},
 setReminders:function(json){try{var o=JSON.parse(json);setP('rem_on',o.on!==false);
  LEVELS.forEach(function(l){var v=parseInt(o[l.key],10);setP('rem_'+l.key,Math.min(50,Math.max(1,isNaN(v)?l.def:v)))})}catch(e){}},
 requestNotifications:function(){if(!('Notification' in window)){alert(cs()?'Tento prohlížeč upozornění neumí. Na iPhonu nejdřív přidej Beero na plochu.':'This browser cannot show notifications. On iPhone, add Beero to the home screen first.');return}
  Notification.requestPermission().then(function(){if(window.refresh)window.refresh()})},
 setMapFocus:function(json){setP('map_focus',String(json))},
 takeMapFocus:function(){var v=P('map_focus',null);if(v!=null)setP('map_focus',null);return v},
 getUserName:userName,setUserName:setUserName,
 getCatalog:function(){
  var c=cs(),all=catalogAll(),uses={},last={};
  beers().forEach(function(b){if(b.beer_id){uses[b.beer_id]=(uses[b.beer_id]||0)+1;last[b.beer_id]=Math.max(last[b.beer_id]||0,b.ts)}});
  var arr=all.map(function(k){var o={id:k.id,brand:k.brand,name:k.name,nonalc:!!k.nonalc,custom:!!k.custom,label:label(k),uses:uses[k.id]||0,craft:!!k.craft};
   if(k.degree!=null)o.degree=k.degree;if(k.abv!=null)o.abv=k.abv;if(k.logo)o.logo=k.logo;if(last[k.id])o.last=last[k.id];
   if(k.style)o.style=k.style;if(k.country)o.country=k.country;return o});
  arr.sort(function(a,b){var x=a.brand.localeCompare(b.brand,undefined,{sensitivity:'base'});if(x)return x;
   var da=a.degree==null?-1:a.degree,db=b.degree==null?-1:b.degree;if(da!==db)return da-db;return a.name.localeCompare(b.name,undefined,{sensitivity:'base'})});
  var act=activeId();if(act&&!findBeer(act))act=null;
  return JSON.stringify({active:act,beers:arr})},
 getActiveBeer:function(){var id=activeId();if(!id)return null;var k=findBeer(id);if(!k)return null;
  var o={id:id,brand:k.brand,label:label(k)};if(k.logo)o.logo=k.logo;return JSON.stringify(o)},
 setActiveBeer:function(id){if(!id){setP('active_beer',null);return}if(findBeer(id))setP('active_beer',id)},
 addCustomBeer:function(json){var o;try{o=JSON.parse(json)}catch(e){return null}
  var brand=String(o.brand||'').trim().slice(0,40),name=String(o.name||'').trim().slice(0,40)||brand;if(!brand)return null;
  var deg=o.degree==null?null:parseInt(o.degree,10),abv=o.abv==null?null:parseFloat(o.abv);
  if(!(deg>=1&&deg<=30))deg=null;if(!(abv>=0&&abv<=20))abv=null;
  var k={id:'c-'+uuid(),brand:brand,name:name,degree:deg,abv:abv,nonalc:!!o.nonalc,custom:true,
   style:String(o.style||'').trim().slice(0,40)||null,country:o.foreign?'INT':'CZ',craft:!!o.craft};
  var cu=custom();cu.push(k);writeJson('beero_custom',cu);return k.id},
 deleteCustomBeer:function(id){writeJson('beero_custom',custom().filter(function(k){return k.id!==id}));if(activeId()===id)setP('active_beer',null)},
 /* Today (MainActivity) */
 addBeer:function(){
  var b=newBeer(Date.now(),kindById(activeId()),DEFAULT_VOL);
  var a=beers();a.push(b);saveBeers(a);
  if(!b.nonalc)remCheck(countAlc());locate(b.id);return countToday()},
 /* the last saved beer of today (order of saving, so a beer added earlier for today can be undone too) */
 undo:function(){var a=beers(),t=today();
  for(var i=a.length-1;i>=0;i--)if(a[i].local_date===t){a.splice(i,1);saveBeers(a);break}
  remAfterUndo(countAlc());return countToday()},
 /* earlier beers {ts:[ms...], beer: catalog id or '', vol: ml} (BeerStore.addPast); JSON ids or 'null' */
 addPast:function(json){var o;try{o=JSON.parse(json)}catch(e){return 'null'}
  var ts=o&&o.ts;if(!Array.isArray(ts)||ts.length<1||ts.length>20)return 'null';
  var now=Date.now(),oldest=now-PAST_MAX_DAYS*864e5;
  if(ts.some(function(t){return typeof t!=='number'||!isFinite(t)||t<oldest||t>now+6e4}))return 'null';
  var bid=String(o.beer||'').trim(),k=null;if(bid){k=kindById(bid);if(!k)return 'null'}
  var vol=Math.min(2000,Math.max(100,parseInt(o.vol,10)||DEFAULT_VOL));
  var a=beers(),ids=[],t=today(),alcToday=false;
  ts.forEach(function(x){var b=newBeer(Math.round(x),k,vol);a.push(b);ids.push(b.id);if(b.local_date===t&&!b.nonalc)alcToday=true});
  saveBeers(a);if(alcToday)remCheck(countAlc());return JSON.stringify(ids)},
 /* delete beers by id; returns the deleted rows for restoreBeers */
 deleteBeers:function(json){var ids;try{ids=JSON.parse(json)}catch(e){return '[]'}if(!Array.isArray(ids))return '[]';
  var set={};ids.forEach(function(i){if(i)set[i]=1});var gone=[],a=beers().filter(function(b){if(set[b.id]){gone.push(row(b));return false}return true});
  saveBeers(a);remAfterUndo(countAlc());return JSON.stringify(gone)},
 restoreBeers:function(json){var rows;try{rows=JSON.parse(json)}catch(e){return 0}return Array.isArray(rows)?insertRows(rows):0},
 /* own place for beers {ids, name (null = remove), lat?, lng?}; remembered for the next beers if it is the newest one from the last 4 hours */
 setVenue:function(json){var o;try{o=JSON.parse(json)}catch(e){return false}
  var ids=Array.isArray(o.ids)?o.ids.filter(Boolean):[];if(!ids.length||ids.length>200)return false;
  var name=o.name==null?'':String(o.name).trim().replace(/\s+/g,' ').slice(0,60);
  var lat=typeof o.lat==='number'&&isFinite(o.lat)?o.lat:null,lng=typeof o.lng==='number'&&isFinite(o.lng)?o.lng:null;
  if(lat===null||lng===null){lat=null;lng=null}
  var set={};ids.forEach(function(i){set[i]=1});var a=beers();
  a.forEach(function(b){if(!set[b.id])return;
   if(!name){delete b.venue;delete b.vlat;delete b.vlng}
   else{b.venue=name;if(lat!==null){b.vlat=lat;b.vlng=lng}else{delete b.vlat;delete b.vlng}}});
  saveBeers(a);
  var last=a[a.length-1];
  if(last&&set[last.id]&&Date.now()-last.ts<4*36e5){
   if(name&&lat!==null)setP('last_venue',{name:name,lat:lat,lng:lng,ts:Date.now()});else setP('last_venue',null)}
  return true},
 hasPoses:function(){return true},savePose:function(){},
 /* Map */
 getMapyKey:mapyKey,
 getMyLocation:function(){var l=lastLoc();if(geoState==='granted'&&l)return '['+l.lat+','+l.lng+']';return ''},
 /* Welcome */
 finishWelcome:function(name){if(!setUserName(name))return false;setP('adult_ok',true);setP('adult_ts',Date.now());location.replace('index.html');return true},
 quit:function(){try{window.close()}catch(e){}},
 reload:function(){location.reload()},
 /* Settings */
 backup:function(){var d=new Date();
  download('beero-backup-'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'.json',exportJson())
   .then(function(ok){if(ok!==null&&window.onBackupDone)window.onBackupDone(!!ok)})},
 restore:function(){var i=document.createElement('input');i.type='file';i.accept='application/json,.json,text/plain';
  i.onchange=function(){var f=i.files&&i.files[0];if(!f)return;var r=new FileReader();
   r.onload=function(){var n=importJson(String(r.result||''));if(window.onRestoreDone)window.onRestoreDone(n)};
   r.onerror=function(){if(window.onRestoreDone)window.onRestoreDone(-1)};r.readAsText(f)};
  i.click()},
 /* web only */
 setMapyKey:function(k){setP('mapy_key',String(k||'').trim()||null)}
};
window.Android=A;

/* the page comes back to the front (like onResume): redraw today's count, it may be a new day */
document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh()});
window.addEventListener('pageshow',function(e){if(e.persisted)refresh()});

/* first start of Today: ask for location once, like the Android app did */
if(page==='index.html'&&geoState==='prompt'&&!P('geo_asked',false)){setP('geo_asked',true);setTimeout(function(){getPos(function(){refresh()})},1500)}

/* home-screen shortcut "+1 beer" (manifest shortcuts) and index.html?add=1 */
if(page==='index.html'&&/[?&]add=1/.test(location.search)){
 history.replaceState(null,'',location.pathname);
 window.addEventListener('load',function(){setTimeout(function(){if(window._add3d)window._add3d();else{A.addBeer();refresh()}},400)})}

/* offline + installable */
if('serviceWorker' in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
})();
