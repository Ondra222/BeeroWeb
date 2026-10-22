/* Beero - shared helpers, bottom navigation, statistics and achievements.
   Every number on Today / Map / Awards / Stats is computed here from the beer history (window.Android.getBeers). */
(function(){
var A=window.Android||null;
var B=window.Beero={A:A};
/* theme from Settings (night / daylight / hop / stout; "auto" is resolved by the app) */
B.theme=(A&&A.getTheme&&A.getTheme())||window.DEMO_THEME||'night';
document.documentElement.setAttribute('data-theme',B.theme);

/* ---------- dates ---------- */
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function pad(n){return n<10?'0'+n:''+n}
function fmt(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function parse(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function dayNo(s){var p=s.split('-');return Math.round(Date.UTC(+p[0],+p[1]-1,+p[2])/864e5)}
var nice;
function hhmm(ts){var d=new Date(ts);return pad(d.getHours())+':'+pad(d.getMinutes())}
function mondayOf(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());var k=(x.getDay()+6)%7;x.setDate(x.getDate()-k);return x}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
B.pad=pad;B.fmt=fmt;B.parse=parse;B.nice=nice;B.hhmm=hhmm;B.mondayOf=mondayOf;B.esc=esc;B.MON=MON;B.MONTHS=MONTHS;B.DOW=DOW;

/* ---------- language (Settings: cs / en) ---------- */
B.lang=(A&&A.getLang&&A.getLang())||window.DEMO_LANG||'en';
var CS=B.lang==='cs';
document.documentElement.setAttribute('lang',B.lang);
/* Czech plural: 1 / 2-4 / 0 and 5+ */
var NOUNS={beer:['beer','beers','pivo','piva','piv'],visit:['visit','visits','návštěva','návštěvy','návštěv'],
 pub:['pub','pubs','hospoda','hospody','hospod'],day:['day','days','den','dny','dní']};
function word(n,k){var f=NOUNS[k];if(!CS)return n===1?f[0]:f[1];return n===1?f[2]:(n>=2&&n<=4)?f[3]:f[4]}
B.word=word;B.n=function(n,k){return n+' '+word(n,k)};
var CS_MON_GEN=['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
var CS_MON=['leden','únor','březen','duben','květen','červen','červenec','srpen','září','říjen','listopad','prosinec'];
var CS_MON_SHORT=['led','úno','bře','dub','kvě','čvn','čvc','srp','zář','říj','lis','pro'];
var CS_DOW=['ne','po','út','st','čt','pá','so'],CS_DOW_FULL=['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
var EN_DOW_FULL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
/* "12 Oct" / "12. října" (+ year when it is not this year) */
B.dm=function(d,withYear){var y=(withYear!==false&&d.getFullYear()!==new Date().getFullYear())?' '+d.getFullYear():'';
 return CS?d.getDate()+'. '+CS_MON_GEN[d.getMonth()]+y:d.getDate()+' '+MON[d.getMonth()]+y};
/* "Mon 12 Oct" / "po 12. října" */
nice=function(s){var d=typeof s==='string'?parse(s):s;return CS?CS_DOW[d.getDay()]+' '+B.dm(d,false):DOW[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()]};
B.nice=nice;
B.monthYear=function(d){return CS?cap(CS_MON[d.getMonth()])+' '+d.getFullYear():MONTHS[d.getMonth()]+' '+d.getFullYear()};
B.monShortYear=function(d){return CS?CS_MON_SHORT[d.getMonth()]+' '+d.getFullYear():MON[d.getMonth()]+' '+d.getFullYear()};
/* "21–27 Sep" / "21.–27. září" */
B.dayRange=function(a,e){if(a.getMonth()===e.getMonth())return CS?a.getDate()+'.–'+e.getDate()+'. '+CS_MON_GEN[e.getMonth()]:a.getDate()+'–'+e.getDate()+' '+MON[e.getMonth()];
 return B.dm(a,false)+' – '+B.dm(e,false)};
B.dowLetter=function(i){return CS?['N','P','Ú','S','Č','P','S'][i]:DOW[i].charAt(0)};
B.weekday=function(i){return CS?CS_DOW_FULL[i]:EN_DOW_FULL[i]};

/* fixed texts: English -> Czech. Text nodes and placeholder / aria-label that match exactly are translated
   automatically (also when a page adds them later); texts with numbers are built with B.n / B.dm / B.tr. */
var CSD={
 'Today':'Dnes','Map':'Mapa','Pubs':'Hospody','Awards':'Odznaky','Stats':'Statistiky','Settings':'Nastavení',
 'Add a beer':'Přidat pivo','This week':'Tento týden','Undo':'Zpět','Undo last beer':'Vrátit poslední pivo','Location':'Poloha',
 'location on':'poloha zapnutá','location off':'poloha vypnutá',
 'Could not load the 3D engine. Connect to the internet once, or put three.min.js (r152) into app/src/main/assets.':'3D se nepodařilo načíst. Jednou se připoj k internetu.',
 'Day':'Den','Month':'Měsíc','Year':'Rok','Range':'Období','to':'až','beers':'piv','venues':'podniků','first beer':'první pivo','active days':'aktivních dní',
 'Unknown place':'Neznámé místo','No beers':'Žádná piva','Open in Mapy.com':'Otevřít v Mapy.com','Directions':'Trasa',
 'Add a Mapy.com API key to see pubs':'Pro hospody přidej API klíč Mapy.com','Zoom in to see pubs':'Přibliž mapu, ukážou se hospody',
 'Loading pubs…':'Načítám hospody…','No pubs found here':'Tady žádné hospody nejsou','Location not available':'Poloha není k dispozici',
 'Location is off, so beers are not placed on the map. Allow location for Beero in the phone settings.':'Poloha je vypnutá, takže se piva na mapu neukládají. Povol polohu pro Beero v nastavení telefonu.',
 'Could not load the map. Check your internet connection.':'Mapu se nepodařilo načíst. Zkontroluj připojení k internetu.',
 'No beers here yet':'Tady ještě žádné pivo','Previous':'Předchozí','Next':'Další','My location':'Moje poloha',
 'Your pubs':'Tvoje hospody','Pubs visited':'Navštívené hospody','Beers in pubs':'Piv v hospodách','Favourite':'Oblíbená','Last visit':'Poslední návštěva',
 'Search pubs or cities':'Hledat hospodu nebo město','Most beers':'Nejvíc piv','Recent':'Nedávné','Most visits':'Nejvíc návštěv',
 'First visit':'První návštěva','Best night':'Nejlepší večer','Per visit':'Na návštěvu','Usual day':'Obvyklý den','Show on map':'Ukázat na mapě',
 'No pubs yet':'Zatím žádné hospody','Add a beer in a pub and it shows up here.':'Přidej pivo v hospodě a objeví se tady.',
 'All':'Vše','Unlocked':'Odemčené','Locked':'Zamčené','Achievement unlocked':'Odznak odemčen',
 'Add your first beer to unlock your first award.':'Přidej první pivo a získáš první odznak.','Nothing here yet.':'Zatím tu nic není.',
 'First Sip':'První lok','Your very first beer':'Tvoje úplně první pivo','Getting Started':'Rozjezd','10 beers in total':'Celkem 10 piv',
 'Beer Enthusiast':'Pivní nadšenec','50 beers in total':'Celkem 50 piv','Centurion':'Stovkař','100 beers in total':'Celkem 100 piv',
 'Beer Legend':'Pivní legenda','500 beers in total':'Celkem 500 piv','Big Round':'Velká runda','5 beers in one day':'5 piv za jeden den',
 'Legendary Night':'Legendární večer','10 beers in one day':'10 piv za jeden den','Night Owl':'Noční sova','A beer between midnight and 4 am':'Pivo mezi půlnocí a čtvrtou ráno',
 'Daily Ritual':'Denní rituál','Track beers on 7 days':'Piva v 7 různých dnech','Dedicated':'Vytrvalec','Track beers on 30 days':'Piva ve 30 různých dnech',
 'Hat Trick':'Hattrick','Beers 3 days in a row':'Pivo 3 dny po sobě','Week of Cheers':'Týden na zdraví','Beers 7 days in a row':'Pivo 7 dní po sobě',
 'Explorer':'Průzkumník','3 different pubs':'3 různé hospody','Pub Crawler':'Hospodský tulák','10 different pubs':'10 různých hospod',
 'Pub Hopper':'Hospodský skokan','3 pubs in one day':'3 hospody za jeden den','The Regular':'Štamgast','One pub on 10 different days':'Jedna hospoda v 10 různých dnech',
 'Beer Tourist':'Pivní turista','3 different cities':'3 různá města','City Collector':'Sběratel měst','10 different cities':'10 různých měst',
 'International':'Mezinárodní','2 different countries':'2 různé země','World Traveler':'Světoběžník','5 different countries':'5 různých zemí',
 'Border Hopper':'Přes hranice','2 countries within 24 h':'2 země během 24 hodin',
 'Statistics':'Statistiky','Total beers':'Piv celkem','This month':'Tento měsíc','Active days':'Aktivní dny','Longest streak':'Nejdelší série',
 'Last 12 weeks':'Posledních 12 týdnů','beers / week':'piv / týden','cities':'měst','countries':'zemí','locations':'míst','Top city':'Nejčastější město',
 'Appearance':'Vzhled','Dark, the default':'Tmavý, výchozí','Light, easy to read outside':'Světlý, čitelný venku','Green like a hop field':'Zelený jako chmelnice',
 'Black, copper and foam':'Černá, měď a pěna','Auto':'Automaticky','Daylight by day, Night Pub at night':'Ve dne Daylight, v noci Night Pub',
 'Language':'Jazyk',"Beero's moods":'Nálady Beera','Happy dance':'Taneček','Disco':'Diskotéka','Cheers':'Na zdraví','Bubbly':'Bublinky','In love':'Zamilovaný',
 'Overflowing':'Přetéká','Spinning':'Točí se','Feeling sick':'Je mu zle','Sleepy':'Ospalý','Hangover':'Kocovina','Skipped':'Přeskočeno','from 0':'od 0',
 'Beero changes mood as the beers add up. Set the same number as the next mood to skip one.':'Beero mění náladu, jak přibývají piva. Stejné číslo jako u další nálady ji přeskočí.',
 'Reset to default':'Obnovit výchozí','Reminders':'Upozornění','A nudge after a number of beers today':'Připomenutí po určitém počtu piv za den',
 "Notifications are off for Beero, so reminders can't pop up.":'Notifikace jsou pro Beero vypnuté, takže se upozornění neukážou.',
 'Allow notifications':'Povolit notifikace','Water break':'Pauza na vodu','Grab a glass of water':'Dej si sklenici vody','Slow down':'Zpomal',
 'Take it easy for a bit':'Trochu zvolni','Go home':'Jdi domů','With a button to get an Uber':'S tlačítkem na objednání Uberu',
 'Show on opening':'Po otevření ukázat','This year':'Tento rok','Your data':'Tvoje data',
 'Stored only on this phone. Back them up before you change phones.':'Uložená jen v tomto telefonu. Před výměnou telefonu si udělej zálohu.',
 'Back up':'Zálohovat','Restore':'Obnovit','Backup saved.':'Záloha uložena.','Could not save the backup. Try another place.':'Zálohu se nepodařilo uložit. Zkus jiné místo.',
 'That file is not a Beero backup.':'Tento soubor není záloha Beero.','Nothing new – all those beers are already here.':'Nic nového – všechna ta piva už tu jsou.',
 'Back':'Zpět','Fewer':'Méně','More':'Více','Reminders on or off':'Zapnout nebo vypnout upozornění','Settings button':'Nastavení',
 'today':'dnes','this week':'tento týden','Unknown':'Neznámé',
 'Beer catalogue':'Katalog piv','Pick what you drink. The app and the widget count this beer.':'Vyber, co piješ. Aplikace i widget budou čárkovat tohle pivo.',
 'Counting':'Čárkuje se','Change':'Změnit','Choose your beer':'Vyber pivo','Beers are counted without a kind.':'Piva se čárkují bez druhu.',
 'Search brand or beer':'Hledat značku nebo pivo','Non-alcoholic':'Nealko','My beers':'Moje','Recently drunk':'Naposledy pité',
 'No specific beer':'Žádné konkrétní pivo','Count beers without a kind':'Čárkovat piva bez druhu','Add your own beer':'Přidat vlastní pivo',
 'Brand':'Značka','Beer':'Pivo','Degree (°)':'Stupeň (°)','Alcohol (%)':'Alkohol (%)','Save and count':'Uložit a čárkovat','Cancel':'Zrušit',
 'Delete':'Smazat','No beer matches your search.':'Hledání neodpovídá žádné pivo.','Fill in the brand.':'Vyplň značku.',
 'No beers of your own yet. Add one with +.':'Zatím žádná vlastní piva. Přidej je tlačítkem +.',
 'Craft':'Řemeslná','Foreign':'Zahraniční','Craft beer':'Řemeslné pivo','Foreign beer':'Zahraniční pivo','Style (optional)':'Styl (nepovinné)',
 'Czechia':'Česko','Germany':'Německo','Belgium':'Belgie','Netherlands':'Nizozemsko','Ireland':'Irsko','Denmark':'Dánsko','Mexico':'Mexiko',
 'United Kingdom':'Velká Británie','Poland':'Polsko','Slovakia':'Slovensko','Austria':'Rakousko','USA':'USA',
 'Lager':'Ležák','Pale lager':'Světlý ležák','Dark lager':'Tmavý ležák','Draught':'Výčepní','Wheat beer':'Pšeničné','Witbier':'Belgické pšeničné',
 'Belgian blonde':'Belgické světlé',
 'Beer types':'Druhy piv','Beers':'Piva','Brands':'Značky','Degrees':'Stupně','Unspecified':'Neurčené','Other':'Ostatní',
 'Show all':'Ukázat vše','Show less':'Ukázat méně','No beers in this period.':'V tomto období žádná piva.','All time':'Celkem','No degree given':'Bez uvedeného stupně',
 'Taster':'Ochutnávač','5 different beers':'5 různých piv','Connoisseur':'Znalec','15 different beers':'15 různých piv',
 'Brand Collector':'Sběratel značek','Beers from 5 breweries':'Piva od 5 pivovarů','Full Scale':'Celá škála','A 10°, an 11° and a 12°':'Desítka, jedenáctka i dvanáctka',
 'Variety Night':'Pestrý večer','3 different beers in one day':'3 různá piva za jeden den','Craft Curious':'Řemeslný zvědavec','Your first craft beer':'Tvoje první řemeslné pivo',
 'Craft Fan':'Řemeslný fanoušek','10 craft beers':'10 řemeslných piv','Around the World':'Pivem kolem světa','Beers from 3 foreign countries':'Piva ze 3 zahraničních zemí',
 'Dark Side':'Temná strana','3 dark beers or stouts':'3 tmavá piva nebo stouty','Loyal Fan':'Věrný fanoušek','50 of the same beer':'50 stejných piv',
 'Clear Head':'Čistá hlava','5 non-alcoholic beers':'5 nealko piv',
 "Hi, I'm Beero":'Ahoj, já jsem Beero','I\'ll keep count of your beers, pubs and awards. First, a couple of quick things.':'Budu ti počítat piva, hospody a odznaky. Nejdřív dvě rychlé věci.',
 'What should I call you?':'Jak ti mám říkat?','Your name or nickname':'Tvoje jméno nebo přezdívka','I am 18 or older':'Je mi 18 let nebo víc',
 'Beero is about alcohol, so it is for adults only. Please drink responsibly.':'Beero je o alkoholu, takže je jen pro dospělé. Pij zodpovědně.',
 "Let's go":'Jdeme na to',"I'm under 18":'Je mi méně než 18','Sorry, Beero is for adults only':'Promiň, Beero je jen pro dospělé',
 'You need to be 18 or older to use this app. Come back when you are.':'Aplikaci můžeš používat od 18 let. Vrať se, až ti bude.',
 'Close the app':'Zavřít aplikaci','Profile':'Profil','Your name':'Tvoje jméno','Saved.':'Uloženo.'
};
B.dec=function(x,d){var s=x.toFixed(d);return CS?s.replace('.',','):s};
B.tr=function(t){return CS&&CSD.hasOwnProperty(t)?CSD[t]:t};
/* names of beers, brands and pubs are data, never translated: mark them with translate="no" */
function noTr(el){return !!(el&&el.closest&&el.closest('[translate="no"]'))}
function trNode(n){
 if(n.nodeType===3){if(noTr(n.parentNode))return;var v=n.nodeValue,k=v.trim();if(k&&CSD.hasOwnProperty(k)){var r=v.replace(k,CSD[k]);if(r!==v)n.nodeValue=r}return}
 if(n.nodeType!==1||n.tagName==='SCRIPT'||n.tagName==='STYLE'||noTr(n))return;
 ['placeholder','aria-label','title'].forEach(function(a){var v=n.getAttribute&&n.getAttribute(a);if(v&&CSD.hasOwnProperty(v))n.setAttribute(a,CSD[v])});
 for(var c=n.firstChild;c;c=c.nextSibling)trNode(c)}
if(CS){
 var startTr=function(){trNode(document.body);
  new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='characterData')trNode(m.target);else for(var i=0;i<m.addedNodes.length;i++)trNode(m.addedNodes[i])})})
   .observe(document.body,{childList:true,subtree:true,characterData:true})};
 if(document.body)startTr();else document.addEventListener('DOMContentLoaded',startTr)}
B.today=function(){return fmt(new Date())};
/* brand logo tile: the brewery's picture from assets (e.g. brands/kozel.png) when the file exists,
   otherwise a monogram badge (1-2 initials) in a colour derived from the brand name */
var MONO=['#C4572E','#2E6E8E','#5B7F2A','#8A4FA3','#B7861B','#2F7D6B','#A33F55','#41579E','#7A5A3A','#4F7A9A'];
function mono(brand){var w=String(brand||'?').replace(/[^\p{L}\p{N} ]/gu,' ').trim().split(/\s+/).filter(Boolean);
 var t=w.length>1?w[0].charAt(0)+w[1].charAt(0):(w[0]||'?').slice(0,1);
 var h=0,k=String(brand||'');for(var i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;
 return {t:t.toUpperCase(),c:MONO[h%MONO.length]}}
B.logo=function(brand,logo,size){size=size||48;var m=mono(brand);
 return '<span class="blogo" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*(m.t.length>1?.36:.46))+'px;background:'+m.c+'" aria-hidden="true">'+
  '<i class="ring"></i>'+esc(m.t)+(logo?'<img src="'+esc(logo)+'" alt="" onerror="this.remove()">':'')+'</span>'};

/* ---------- data ---------- */
B.load=function(){
 var list=[];
 try{list=A?JSON.parse(A.getBeers()):(window.DEMO_BEERS||[])}catch(e){list=[]}
 list.sort(function(a,b){return a.ts-b.ts});
 B.beers=list;return list};
function venueKey(b){return b.venue&&b.vlat!=null?b.venue.toLowerCase()+'|'+b.vlat.toFixed(4)+'|'+b.vlng.toFixed(4):null}
/* a "location" = a pub, or a ~100 m cell for beers without a pub */
function placeKey(b){var v=venueKey(b);if(v)return v;if(b.lat!=null)return 'c|'+(Math.round(b.lat*900))+'|'+(Math.round(b.lng*600));return null}
function cityKey(b){return b.city?b.city+'|'+(b.country||''):null}
B.venueKey=venueKey;B.placeKey=placeKey;
B.inRange=function(list,from,to){return list.filter(function(b){return b.d>=from&&b.d<=to})};

/* ---------- statistics ---------- */
B.stats=function(list){
 list=list||B.beers||[];
 var t=B.today(),month=t.slice(0,7),days={},cities={},countries={},places={},venues={};
 var s={total:list.length,month:0,today:0,activeDays:0,longest:0,current:0,cities:0,countries:0,places:0,venues:0,topCity:null,topCityN:0};
 list.forEach(function(b){
  days[b.d]=(days[b.d]||0)+1;
  if(b.d.slice(0,7)===month)s.month++;
  if(b.d===t)s.today++;
  var c=cityKey(b);if(c)cities[c]=(cities[c]||0)+1;
  if(b.country)countries[b.country]=1;
  var p=placeKey(b);if(p)places[p]=1;
  var v=venueKey(b);if(v)venues[v]=1});
 var ds=Object.keys(days).sort(),run=0,prev=null;
 ds.forEach(function(d){var n=dayNo(d);run=(prev!==null&&n===prev+1)?run+1:1;prev=n;if(run>s.longest)s.longest=run});
 /* current streak: ends today or yesterday */
 var tn=dayNo(t);if(prev!==null&&(prev===tn||prev===tn-1))s.current=run;
 s.days=days;s.activeDays=ds.length;
 s.cities=Object.keys(cities).length;s.countries=Object.keys(countries).length;
 s.places=Object.keys(places).length;s.venues=Object.keys(venues).length;
 Object.keys(cities).forEach(function(k){if(cities[k]>s.topCityN){s.topCityN=cities[k];s.topCity=k.split('|')[0]}});
 return s};

/* beers per day for the 7 days of the current week (Mon..Sun) */
B.week=function(days){var m=mondayOf(new Date()),out=[];
 for(var i=0;i<7;i++){var d=new Date(m);d.setDate(m.getDate()+i);var k=fmt(d);out.push({d:k,n:days[k]||0,label:B.dowLetter(d.getDay()),today:k===B.today()})}
 return out};
/* beers per week for the last n weeks, oldest first */
B.weeks=function(days,n){var m=mondayOf(new Date()),out=[];
 for(var w=n-1;w>=0;w--){var s=new Date(m);s.setDate(m.getDate()-7*w);var c=0;
  for(var i=0;i<7;i++){var d=new Date(s);d.setDate(s.getDate()+i);c+=days[fmt(d)]||0}
  out.push({from:fmt(s),n:c,now:w===0})}
 return out};

/* ---------- achievements ---------- */
/* cat: count | night | habit | place | travel | kind  (travel ones are blue, kind (beer types) copper, the rest gold) */
B.AWARDS=[
 {id:'first',t:'First Sip',d:'Your very first beer',goal:1,cat:'count',f:function(s){return s.total}},
 {id:'ten',t:'Getting Started',d:'10 beers in total',goal:10,cat:'count',f:function(s){return s.total}},
 {id:'fifty',t:'Beer Enthusiast',d:'50 beers in total',goal:50,cat:'count',f:function(s){return s.total}},
 {id:'hundred',t:'Centurion',d:'100 beers in total',goal:100,cat:'count',f:function(s){return s.total}},
 {id:'legend',t:'Beer Legend',d:'500 beers in total',goal:500,cat:'count',f:function(s){return s.total}},
 {id:'round5',t:'Big Round',d:'5 beers in one day',goal:5,cat:'night',f:function(s){return s.maxDay}},
 {id:'round10',t:'Legendary Night',d:'10 beers in one day',goal:10,cat:'night',f:function(s){return s.maxDay}},
 {id:'owl',t:'Night Owl',d:'A beer between midnight and 4 am',goal:1,cat:'night',f:function(s){return s.owl}},
 {id:'ritual',t:'Daily Ritual',d:'Track beers on 7 days',goal:7,cat:'habit',f:function(s){return s.activeDays}},
 {id:'regular',t:'Dedicated',d:'Track beers on 30 days',goal:30,cat:'habit',f:function(s){return s.activeDays}},
 {id:'streak3',t:'Hat Trick',d:'Beers 3 days in a row',goal:3,cat:'habit',f:function(s){return s.longest}},
 {id:'streak7',t:'Week of Cheers',d:'Beers 7 days in a row',goal:7,cat:'habit',f:function(s){return s.longest}},
 {id:'venues3',t:'Explorer',d:'3 different pubs',goal:3,cat:'place',f:function(s){return s.venues}},
 {id:'venues10',t:'Pub Crawler',d:'10 different pubs',goal:10,cat:'place',f:function(s){return s.venues}},
 {id:'hop3',t:'Pub Hopper',d:'3 pubs in one day',goal:3,cat:'place',f:function(s){return s.maxVenuesDay}},
 {id:'local',t:'The Regular',d:'One pub on 10 different days',goal:10,cat:'place',f:function(s){return s.pubDays}},
 {id:'cities3',t:'Beer Tourist',d:'3 different cities',goal:3,cat:'travel',f:function(s){return s.cities}},
 {id:'cities10',t:'City Collector',d:'10 different cities',goal:10,cat:'travel',f:function(s){return s.cities}},
 {id:'countries2',t:'International',d:'2 different countries',goal:2,cat:'travel',f:function(s){return s.countries}},
 {id:'countries5',t:'World Traveler',d:'5 different countries',goal:5,cat:'travel',f:function(s){return s.countries}},
 {id:'border',t:'Border Hopper',d:'2 countries within 24 h',goal:2,cat:'travel',f:function(s){return s.border}},
 /* beer types: the kind picked in the beer catalogue, stored with every beer */
 {id:'kinds5',t:'Taster',d:'5 different beers',goal:5,cat:'kind',f:function(s){return s.kinds}},
 {id:'kinds15',t:'Connoisseur',d:'15 different beers',goal:15,cat:'kind',f:function(s){return s.kinds}},
 {id:'brands5',t:'Brand Collector',d:'Beers from 5 breweries',goal:5,cat:'kind',f:function(s){return s.brands}},
 {id:'scale',t:'Full Scale',d:'A 10°, an 11° and a 12°',goal:3,cat:'kind',f:function(s){return s.scale}},
 {id:'variety',t:'Variety Night',d:'3 different beers in one day',goal:3,cat:'kind',f:function(s){return s.maxKindsDay}},
 {id:'craft1',t:'Craft Curious',d:'Your first craft beer',goal:1,cat:'kind',f:function(s){return s.craft}},
 {id:'craft10',t:'Craft Fan',d:'10 craft beers',goal:10,cat:'kind',f:function(s){return s.craft}},
 {id:'world3',t:'Around the World',d:'Beers from 3 foreign countries',goal:3,cat:'kind',f:function(s){return s.foreign}},
 {id:'dark3',t:'Dark Side',d:'3 dark beers or stouts',goal:3,cat:'kind',f:function(s){return s.dark}},
 {id:'loyal50',t:'Loyal Fan',d:'50 of the same beer',goal:50,cat:'kind',f:function(s){return s.loyal}},
 {id:'sober5',t:'Clear Head',d:'5 non-alcoholic beers',goal:5,cat:'kind',f:function(s){return s.nonalc}}
];
/* catalogue by id (kind of each beer); loaded once per page */
var CATALOG=null;
B.catalog=function(){if(CATALOG)return CATALOG;CATALOG={};
 try{var c=A&&A.getCatalog?JSON.parse(A.getCatalog()):(window.DEMO_CATALOG||{beers:[]});(c.beers||[]).forEach(function(b){CATALOG[b.id]=b})}catch(e){}
 return CATALOG};
/* Replays the history beer by beer, so every award also gets the time it was unlocked. */
B.awards=function(list){
 list=list||B.beers||[];
 var st={total:0,maxDay:0,owl:0,activeDays:0,longest:0,venues:0,maxVenuesDay:0,pubDays:0,cities:0,countries:0,border:0,
  kinds:0,brands:0,scale:0,maxKindsDay:0,craft:0,foreign:0,dark:0,loyal:0,nonalc:0};
 var dayN={},dayV={},venues={},venueDays={},cities={},countries={},lastC={},run=0,prevDay=null;
 var cat=B.catalog(),kindN={},brandS={},degS={},dayK={},fcS={};
 var res=B.AWARDS.map(function(a){return {id:a.id,t:a.t,d:a.d,goal:a.goal,cat:a.cat,cur:0,at:null}});
 function check(ts){for(var i=0;i<res.length;i++){var r=res[i],v=B.AWARDS[i].f(st);r.cur=Math.min(v,r.goal);if(r.at===null&&v>=r.goal)r.at=ts}}
 list.forEach(function(b){
  st.total++;
  dayN[b.d]=(dayN[b.d]||0)+1;if(dayN[b.d]>st.maxDay)st.maxDay=dayN[b.d];
  if(dayN[b.d]===1){st.activeDays++;var n=dayNo(b.d);run=(prevDay!==null&&n===prevDay+1)?run+1:1;prevDay=n;if(run>st.longest)st.longest=run}
  if(new Date(b.ts).getHours()<4)st.owl=1;
  var v=venueKey(b);
  if(v){if(!venues[v]){venues[v]=1;st.venues++}
   var vd=venueDays[v]||(venueDays[v]={});if(!vd[b.d]){vd[b.d]=1;var nd=Object.keys(vd).length;if(nd>st.pubDays)st.pubDays=nd}
   var dv=dayV[b.d]||(dayV[b.d]={});if(!dv[v]){dv[v]=1;var k=Object.keys(dv).length;if(k>st.maxVenuesDay)st.maxVenuesDay=k}}
  var c=cityKey(b);if(c&&!cities[c]){cities[c]=1;st.cities++}
  if(b.country){
   if(!countries[b.country]){countries[b.country]=1;st.countries++}
   st.border=Math.max(st.border,1);
   for(var o in lastC)if(o!==b.country&&b.ts-lastC[o]<=864e5)st.border=2;
   lastC[b.country]=b.ts}
  /* beer types */
  var kid=b.bid||(b.beer?'n:'+b.beer:null),k=b.bid?cat[b.bid]:null;
  if(kid){
   if(!kindN[kid]){kindN[kid]=0;st.kinds++}
   kindN[kid]++;if(kindN[kid]>st.loyal)st.loyal=kindN[kid];
   var dk=dayK[b.d]||(dayK[b.d]={});if(!dk[kid]){dk[kid]=1;var nk=Object.keys(dk).length;if(nk>st.maxKindsDay)st.maxKindsDay=nk}
   var br=k?k.brand:null;if(br&&!brandS[br]){brandS[br]=1;st.brands++}}
  if(k){
   if(!k.nonalc&&(k.degree===10||k.degree===11||k.degree===12)&&!degS[k.degree]){degS[k.degree]=1;st.scale++}
   if(k.craft)st.craft++;
   if(k.country&&k.country!=='CZ'&&!fcS[k.country]){fcS[k.country]=1;st.foreign++}
   if(k.style==='Stout'||k.style==='Dark lager'||/černé|černý|tmav|dark|stout|porter/i.test(k.name))st.dark++;
   if(k.nonalc)st.nonalc++}
  check(b.ts)});
 if(!list.length)check(null);
 return res};
B.unlocked=function(res){return res.filter(function(r){return r.at!==null})};
/* awards unlocked since the user last saw them (first run: everything counts as seen) */
B.newAwards=function(res){
 var un=B.unlocked(res).map(function(r){return r.id}),seen=A&&A.getSeenAwards?A.getSeenAwards():null;
 if(seen===null||seen===undefined){B.markSeen(res);return []}
 var s={};seen.split(',').forEach(function(x){if(x)s[x]=1});
 return B.unlocked(res).filter(function(r){return !s[r.id]})};
B.markSeen=function(res){if(A&&A.setSeenAwards)A.setSeenAwards(B.unlocked(res).map(function(r){return r.id}).join(','))};
/* badges look like bottle caps (kronky): crimped edge, inner ring and an icon for each award */
var BADGE_ICON={
 pint:'<path d="M6.8 9.6h9l-1.1 9.7a1.7 1.7 0 0 1-1.7 1.5H9.6a1.7 1.7 0 0 1-1.7-1.5z" fill="currentColor"/><path d="M15.6 11.2h1.5a2 2 0 0 1 2 2v2.1a2 2 0 0 1-2 2h-1.9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7.35 10.6V9.4a1.75 1.75 0 0 1 2.1-1.7 2.3 2.3 0 0 1 4.1-.2 1.7 1.7 0 0 1 1.7 1.9v1.2z" fill="#FFF8EA" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><circle cx="10.2" cy="14.2" r=".75" fill="var(--cap)" opacity=".75"/><circle cx="12.4" cy="16.6" r=".6" fill="var(--cap)" opacity=".75"/><circle cx="11" cy="18.4" r=".45" fill="var(--cap)" opacity=".75"/>',
 cheers:'<path d="M4 8.5h6.4l-.8 8.2a1.3 1.3 0 0 1-1.3 1.1H6.1a1.3 1.3 0 0 1-1.3-1.1z" fill="currentColor" transform="rotate(-12 7 13)"/><path d="M13.6 8.5H20l-.8 8.2a1.3 1.3 0 0 1-1.3 1.1h-2.2a1.3 1.3 0 0 1-1.3-1.1z" fill="currentColor" transform="rotate(12 17 13)"/><path d="M12 3.2v2.6M9.2 4.4l1.2 1.8M14.8 4.4l-1.2 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
 moon:'<path d="M15.5 4.5a7.8 7.8 0 1 0 4 13.4A6.3 6.3 0 0 1 15.5 4.5z" fill="currentColor"/><circle cx="18.5" cy="6" r="1" fill="currentColor"/>',
 calendar:'<rect x="4.5" y="6" width="15" height="13.5" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 10.2h15M8.5 4v3.6M15.5 4v3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m9.3 14.6 2 1.9 3.6-3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
 flame:'<path d="M12 3.5c.6 3.2 4.8 5 4.8 9.6a4.8 4.8 0 0 1-9.6 0c0-2.4 1.3-3.6 2.4-4.6.2 1.6 1 2.5 1.8 2.8-.4-3 .3-5.6.6-7.8z" fill="currentColor"/>',
 pin:'<path d="M12 20.5s-5.8-5.1-5.8-9.8a5.8 5.8 0 0 1 11.6 0c0 4.7-5.8 9.8-5.8 9.8z" fill="currentColor"/><circle cx="12" cy="10.6" r="2.2" fill="var(--cap)"/>',
 route:'<circle cx="6.5" cy="17.5" r="2.2" fill="currentColor"/><circle cx="17.5" cy="6.5" r="2.2" fill="currentColor"/><path d="M8.6 17.5h6.2a2.8 2.8 0 0 0 0-5.6H9.2a2.8 2.8 0 0 1 0-5.6h6.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="2.2 2"/>',
 city:'<path d="M4 20V10.5l4.5-3v12.5M8.5 20V5.5h7V20M15.5 20v-8.5H20V20M3 20h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10.7 9h2.6M10.7 12h2.6M10.7 15h2.6" stroke="currentColor" stroke-width="1.6"/>',
 globe:'<circle cx="12" cy="12" r="7.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.4 12h15.2M12 4.4c-3.4 4.4-3.4 10.8 0 15.2M12 4.4c3.4 4.4 3.4 10.8 0 15.2" fill="none" stroke="currentColor" stroke-width="1.5"/>',
 plane:'<path d="M20.2 4.2c.8.8.1 2.3-.9 3.3l-2.9 2.9 1.8 8.3-1.6 1.6-3.6-6.6-3 3 .4 2.6-1.3 1.3-1.7-3.3-3.3-1.7 1.3-1.3 2.6.4 3-3L4.4 8.1 6 6.5l8.3 1.8 2.9-2.9c1-1 2.5-1.7 3.3-.9z" fill="currentColor"/>',
 pub:'<path d="M4.5 10.5 6.5 5h11l2 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 10.5h15c0 1.4-1.1 2.2-2.5 2.2s-2.5-.8-2.5-2.2c0 1.4-1.1 2.2-2.5 2.2s-2.5-.8-2.5-2.2c0 1.4-1.1 2.2-2.5 2.2S4.5 11.9 4.5 10.5z" fill="currentColor"/><path d="M6 13.5V20h12v-6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.2 20v-4.2h3.6V20" fill="currentColor"/>',
 star:'<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor"/>',
 flight:'<path d="M3.5 18.5h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 9h3.6l-.5 8H5.5zM10.2 7h3.6l-.5 10h-2.6zM15.4 10.5H19l-.5 6.5h-2.6z" fill="currentColor"/>',
 tag:'<path d="M4.5 11.6V5.2a.7.7 0 0 1 .7-.7h6.4l8 8a1.4 1.4 0 0 1 0 2l-4.4 4.4a1.4 1.4 0 0 1-2 0z" fill="currentColor"/><circle cx="8.4" cy="8.4" r="1.6" fill="var(--cap)"/>',
 scale:'<path d="M5 19V13M12 19V9M19 19V5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
 hop:'<path d="M12 4.2c2.6 1.4 4.4 4 4.4 7.6 0 4-2 7.4-4.4 8-2.4-.6-4.4-4-4.4-8 0-3.6 1.8-6.2 4.4-7.6z" fill="currentColor"/><path d="M8.2 9.8c1.2.9 2.4 1.3 3.8 1.3s2.6-.4 3.8-1.3M8 13.6c1.3.9 2.6 1.3 4 1.3s2.7-.4 4-1.3M9 17c1 .6 2 .9 3 .9s2-.3 3-.9" fill="none" stroke="var(--cap)" stroke-width="1.2" stroke-linecap="round"/><path d="M12 4.2V2.6M12 2.6c1.4-.6 2.6-.2 3.2.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
 dark:'<path d="M6.8 9.6h9l-1.1 9.7a1.7 1.7 0 0 1-1.7 1.5H9.6a1.7 1.7 0 0 1-1.7-1.5z" fill="currentColor"/><path d="M15.6 11.2h1.5a2 2 0 0 1 2 2v2.1a2 2 0 0 1-2 2h-1.9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7.35 10.6V9.4a1.75 1.75 0 0 1 2.1-1.7 2.3 2.3 0 0 1 4.1-.2 1.7 1.7 0 0 1 1.7 1.9v1.2z" fill="#E8D3B0" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>',
 heart:'<path d="M12 19.6s-7.4-4.4-7.4-9.6a4.1 4.1 0 0 1 7.4-2.4 4.1 4.1 0 0 1 7.4 2.4c0 5.2-7.4 9.6-7.4 9.6z" fill="currentColor"/>',
 drop:'<path d="M12 3.8s5.6 6.2 5.6 10.4a5.6 5.6 0 0 1-11.2 0C6.4 10 12 3.8 12 3.8z" fill="currentColor"/><path d="M9.4 14.6a2.7 2.7 0 0 0 2.2 2.6" fill="none" stroke="var(--cap)" stroke-width="1.4" stroke-linecap="round"/>'
};
var BADGE_FOR={first:'pint',ten:'pint',fifty:'pint',hundred:'pint',legend:'star',round5:'cheers',round10:'cheers',owl:'moon',
 ritual:'calendar',regular:'calendar',streak3:'flame',streak7:'flame',venues3:'pin',venues10:'pin',hop3:'route',local:'pub',
 cities3:'city',cities10:'city',countries2:'globe',countries5:'globe',border:'plane',
 kinds5:'flight',kinds15:'flight',brands5:'tag',scale:'scale',variety:'cheers',craft1:'hop',craft10:'hop',world3:'globe',
 dark3:'dark',loyal50:'heart',sober5:'drop'};
/* cap colour for an unlocked award */
function capState(r){return r.cat==='travel'?'travel':r.cat==='kind'?'kind':'gold'}
B.capState=capState;
var CAP_PATH=(function(){var n=21,pts=[];for(var i=0;i<n*2;i++){var a=i/(n*2)*Math.PI*2-Math.PI/2,r=i%2?44:50;pts.push((50+Math.cos(a)*r).toFixed(2)+' '+(50+Math.sin(a)*r).toFixed(2))}return 'M'+pts.join('L')+'Z'})();
B.cap=function(icon,state,size){
 var C={gold:['#F2B233','#C98F18','#1A1D24'],travel:['#8EC3DA','#5E9DB8','#1A1D24'],kind:['#E8873A','#B8662A','#1A1D24'],locked:['#3A404D','#2C313B','#7A818E']}[state];
 return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 100 100" style="--cap:'+C[0]+';color:'+C[2]+'" aria-hidden="true">'+
  '<path d="'+CAP_PATH+'" fill="'+C[0]+'"/>'+
  '<circle cx="50" cy="50" r="35" fill="none" stroke="'+C[1]+'" stroke-width="4"/>'+
  (state==='locked'?'':'<path d="M27 38a26 26 0 0 1 16-14" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>')+
  '<g transform="translate(26 26) scale(2)"'+(state==='locked'?' opacity=".9"':'')+'>'+BADGE_ICON[icon||'star']+'</g>'+
  (state==='locked'?'<g transform="translate(78 78)"><circle r="15" fill="#1B1F28"/><rect x="-6" y="-2.5" width="12" height="9.5" rx="2.2" fill="#7A818E"/><path d="M-3.8-2.5v-3a3.8 3.8 0 0 1 7.6 0v3" fill="none" stroke="#7A818E" stroke-width="2.2"/></g>':'')+
  '</svg>'};
B.awardIcon=function(r,size){size=size||44;
 var st=r.at===null?'locked':capState(r);
 return '<div class="aw-ic" style="width:'+size+'px;height:'+size+'px">'+B.cap(BADGE_FOR[r.id],st,size)+'</div>'};
B.toast=function(r){
 var el=document.createElement('div');el.className='unlock toast';
 el.innerHTML='<div class="cap">'+B.cap(BADGE_FOR[r.id],capState(r),48)+'</div>'+
  '<div><div class="k">Achievement unlocked</div><div class="t">'+esc(r.t)+'</div><div class="d">'+esc(r.d)+'</div></div>';
 document.body.appendChild(el);
 requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('show')})});
 setTimeout(function(){el.classList.remove('show');setTimeout(function(){el.remove()},500)},3600)};

/* ---------- tap a bar to see its value ---------- */
/* el: the .bars element, tips: one html string per bar (in order) */
B.bindBars=function(el,tips){
 var bars=el.querySelectorAll('.b'),tip=null;
 function clear(){if(tip){tip.remove();tip=null}Array.prototype.forEach.call(bars,function(b){b.classList.remove('sel')})}
 Array.prototype.forEach.call(bars,function(b,i){
  b.onclick=function(ev){
   ev.stopPropagation();
   var was=b.classList.contains('sel');clear();if(was)return;
   b.classList.add('sel');
   tip=document.createElement('div');tip.className='tip';tip.innerHTML=tips[i];el.appendChild(tip);
   var bar=b.querySelector('i'),eb=el.getBoundingClientRect(),bb=bar.getBoundingClientRect();
   var x=bb.left-eb.left+bb.width/2-tip.offsetWidth/2;x=Math.max(0,Math.min(x,el.clientWidth-tip.offsetWidth));
   tip.style.left=x+'px';tip.style.top=(bb.top-eb.top-tip.offsetHeight-8)+'px'}});
 el._clearTip=clear;
 if(!el._docBound){el._docBound=1;document.addEventListener('click',function(){if(el._clearTip)el._clearTip()})}};

/* ---------- bottom navigation ---------- */
var ICONS={
 today:'<path d="M5 8h10v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M5 8c0-2 1.5-3 3-2.4C8.6 4 11.4 4 12 5.6c1.6-.6 3 .4 3 2.4"/>',
 map:'<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
 pubs:'<path d="M4 10 6 4.5h12L20 10"/><path d="M4 10h16c0 1.4-1.2 2.3-2.7 2.3S14.7 11.4 14.7 10c0 1.4-1.2 2.3-2.7 2.3S9.3 11.4 9.3 10c0 1.4-1.2 2.3-2.7 2.3S4 11.4 4 10z"/><path d="M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20"/>',
 awards:'<circle cx="12" cy="9" r="5.5"/><path d="M8.8 13.8 7.5 21l4.5-2.4 4.5 2.4-1.3-7.2"/>',
 stats:'<path d="M5 20V12"/><path d="M12 20V5"/><path d="M19 20v-6"/>'};
B.nav=function(active){
 var bar=document.createElement('nav');bar.id='tabbar';
 [['today','Today'],['map','Map'],['pubs','Pubs'],['awards','Awards'],['stats','Stats']].forEach(function(t){
  var b=document.createElement('button');b.className=t[0]===active?'on':'';
  b.innerHTML='<svg viewBox="0 0 24 24">'+ICONS[t[0]]+'</svg>'+t[1];
  b.onclick=function(){if(t[0]!==active&&A)A.go(t[0])};
  bar.appendChild(b)});
 document.body.appendChild(bar)};
})();
