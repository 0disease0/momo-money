const $=id=>document.getElementById(id);
const today=new Date();
let viewDate=new Date(today.getFullYear(),today.getMonth(),1);
let manualType='expense',parsedEntries=[];

const META={
  RUB:['俄罗斯卢布','₽'],
  CNY:['人民币','¥'],
  USD:['美元','$'],
  JPY:['日元','¥'],
  EUR:['欧元','€'],
  GBP:['英镑','£'],
  KRW:['韩元','₩'],
  THB:['泰铢','฿'],
  HKD:['港币','HK$'],
  CAD:['加元','C$'],
  AUD:['澳元','A$'],
  CHF:['瑞士法郎','CHF']
};

const DEFAULT=['RUB','CNY','USD'];

let entries=JSON.parse(localStorage.getItem('momoEntries')||'null')||[
  {
    id:1,
    type:'expense',
    amount:200,
    currency:'RUB',
    category:'餐饮',
    memo:'咖啡',
    date:ds(today)
  },
  {
    id:2,
    type:'expense',
    amount:65,
    currency:'CNY',
    category:'购物',
    memo:'二手枕头',
    date:ds(today)
  },
  {
    id:3,
    type:'expense',
    amount:2400,
    currency:'RUB',
    category:'宠物',
    memo:'猫咪用品',
    date:ds(today)
  },
  {
    id:4,
    type:'income',
    amount:200,
    currency:'USD',
    category:'副业',
    memo:'卖账号',
    date:ds(today)
  }
];

let currencies=
  JSON.parse(localStorage.getItem('momoCurrencies')||'null')||
  DEFAULT.slice();

let defaultCurrency=
  localStorage.getItem('momoDefault')||
  currencies[0]||
  'RUB';

let theme=
  localStorage.getItem('momoTheme')||
  'pink';


function ds(d){
  return new Date(
    d.getTime()-d.getTimezoneOffset()*60000
  ).toISOString().slice(0,10);
}


function esc(s){
  return String(s??'').replace(
    /[&<>"']/g,
    m=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[m])
  );
}


function save(){
  localStorage.setItem(
    'momoEntries',
    JSON.stringify(entries)
  );

  localStorage.setItem(
    'momoCurrencies',
    JSON.stringify(currencies)
  );

  localStorage.setItem(
    'momoDefault',
    defaultCurrency
  );

  localStorage.setItem(
    'momoTheme',
    theme
  );
}


function toast(t){
  let x=$('toast');

  if(!x)return;

  x.textContent=t;
  x.classList.add('show');

  clearTimeout(window.tt);

  window.tt=setTimeout(
    ()=>x.classList.remove('show'),
    1800
  );
}


function money(n,c){
  return Number(n).toLocaleString(
    'zh-CN',
    {maximumFractionDigits:2}
  )+' '+c;
}


function sameMonth(s){
  let d=new Date(s);

  return (
    d.getFullYear()==viewDate.getFullYear() &&
    d.getMonth()==viewDate.getMonth()
  );
}


function icon(c){
  return ({
    餐饮:'☕',
    购物:'🛍️',
    交通:'🚌',
    住房:'🏠',
    宠物:'🐱',
    娱乐:'🎮',
    学习:'📚',
    医疗:'💊',
    工资:'💼',
    副业:'💰',
    退款:'↩️',
    其他:'🌷'
  })[c]||'🌷';
}


function init(){

  document.body.className='theme-'+theme;

  render();

  document
    .querySelectorAll('.theme-grid button')
    .forEach(b=>{
      b.classList.toggle(
        'selected',
        b.dataset.theme===theme
      );
    });

}


function render(){

  renderMonth();
  renderSummary();
  renderRecent();
  renderLedger();
  renderCurrencies();
  fillCurrencies();
  renderReferenceTotals();

}


function renderMonth(){

  $('monthTitle').textContent=
    `${viewDate.getFullYear()}年 ${viewDate.getMonth()+1}月`;

}


function monthEntries(){

  return entries
    .filter(e=>sameMonth(e.date))
    .sort(
      (a,b)=>
        b.date.localeCompare(a.date)||
        b.id-a.id
    );

}


function group(es){

  let m={};

  es.forEach(e=>{
    m[e.currency]=
      (m[e.currency]||0)+Number(e.amount);
  });

  return Object
    .entries(m)
    .map(
      ([c,n])=>
        `${n.toLocaleString(
          'zh-CN',
          {maximumFractionDigits:2}
        )} ${c}`
    )
    .join(' · ')||'0';

}


function convertLive(amount,from,to){

  const rf=window.momoLiveRates?.[from];
  const rt=window.momoLiveRates?.[to];

  if(from===to)return amount;

  if(!rf||!rt)return null;

  return amount/rf*rt;

}


function renderSummary(){

  let es=monthEntries();

  let i=es.filter(
    e=>e.type==='income'
  );

  let o=es.filter(
    e=>e.type==='expense'
  );

  $('monthIncome').textContent=group(i);

  $('monthExpense').textContent=group(o);


  let m={};

  es.forEach(e=>{

    if(!m[e.currency]){
      m[e.currency]={
        i:0,
        o:0
      };
    }

    m[e.currency][
      e.type==='income'?'i':'o'
    ]+=+e.amount;

  });


  $('currencySummary').innerHTML=
    Object.entries(m)
    .map(([c,v])=>`

      <div class="currency-card">

        <div class="currency-head">
          <span>
            ${META[c]?.[1]||''} ${c}
          </span>

          <span>
            ${META[c]?.[0]||''}
          </span>
        </div>

        <div class="currency-lines">

          <div>
            <span>🌱 收入</span>
            <br>
            <b class="income-num">
              ${money(v.i,c)}
            </b>
          </div>

          <div>
            <span>🧸 支出</span>
            <br>
            <b class="expense-num">
              ${money(v.o,c)}
            </b>
          </div>

        </div>

      </div>

    `)
    .join('')||
    `
      <div class="empty">
        <div class="emoji">🌱</div>
        这个月还没有记录哦
      </div>
    `;

}


function row(e){

  return `

    <div class="entry">

      <div class="entry-icon">
        ${icon(e.category)}
      </div>

      <div class="entry-main">

        <div class="entry-name">
          ${esc(e.memo||e.category)}
        </div>

        <div class="entry-meta">
          ${esc(e.date)} · ${esc(e.category)}
        </div>

      </div>

      <div class="entry-amount ${e.type}">
        ${e.type==='income'?'+':'−'}
        ${money(e.amount,e.currency)}
      </div>

    </div>

  `;

}


function renderReferenceTotals(){

  const box=document.getElementById(
    'referenceTotal'
  );

  if(!box)return;

  const es=monthEntries();

  let total=0;
  let ok=true;

  es.forEach(e=>{

    const v=convertLive(
      +e.amount,
      e.currency,
      defaultCurrency
    );

    if(v==null){
      ok=false;
    }else{
      total+=
        e.type==='income'
          ?v
          :-v;
    }

  });

  box.textContent=
    ok&&es.length
      ?`参考净额：${total.toLocaleString(
          'zh-CN',
          {maximumFractionDigits:2}
        )} ${defaultCurrency}`
      :'参考净额：—';

}


function renderRecent(){

  let e=monthEntries().slice(0,6);

  $('recentList').innerHTML=
    e.length
      ?e.map(row).join('')
      :
      `
        <div class="empty">
          <div class="emoji">🫧</div>
          还没有记录，先记第一笔吧～
        </div>
      `;

}


function renderLedger(){

  let e=[...entries].sort(
    (a,b)=>
      b.date.localeCompare(a.date)||
      b.id-a.id
  );

  $('ledgerList').innerHTML=
    e.length
      ?e.map(row).join('')
      :
      `
        <div class="empty">
          暂无记录
        </div>
      `;

}


function changeMonth(n){

  viewDate=new Date(
    viewDate.getFullYear(),
    viewDate.getMonth()+n,
    1
  );

  render();

}


function showPage(id,b){

  document
    .querySelectorAll('.page')
    .forEach(x=>
      x.classList.remove('active')
    );

  $(id).classList.add('active');

  document
    .querySelectorAll('.nav-item')
    .forEach(x=>
      x.classList.remove('active')
    );

  b?.classList.add('active');

}


function openLedger(){

  showPage(
    'ledgerPage',
    document.querySelector(
      '[data-page=ledgerPage]'
    )
  );

}


function openSettings(){

  showPage(
    'settingsPage',
    document.querySelector(
      '[data-page=settingsPage]'
    )
  );

}


function closeModal(id){

  $(id).classList.remove('show');

}


function openManual(t='expense'){

  manualType=t;

  $('manualModal').classList.add('show');

  $('manualAmount').value='';
  $('manualMemo').value='';
  $('manualDate').value=ds(today);

  fillCurrencies();
  updateManual();

}


function setManualType(t){

  manualType=t;

  updateManual();

}


function updateManual(){

  $('expenseTab')
    .classList.toggle(
      'selected',
      manualType==='expense'
    );

  $('incomeTab')
    .classList.toggle(
      'selected',
      manualType==='income'
    );

  $('manualTitle').textContent=
    manualType==='income'
      ?'🌱 记一笔收入'
      :'🛍️ 记一笔支出';


  let c=
    manualType==='income'
      ?[
        '工资',
        '副业',
        '退款',
        '其他'
      ]
      :[
        '餐饮',
        '购物',
        '交通',
        '住房',
        '宠物',
        '娱乐',
        '学习',
        '医疗',
        '其他'
      ];


  $('manualCategory').innerHTML=
    c.map(
      x=>`<option>${x}</option>`
    ).join('');

}


function fillCurrencies(){

  let o=currencies
    .map(
      c=>`
        <option value="${c}">
          ${META[c]?.[1]||''}
          ${c}
          ·
          ${META[c]?.[0]||c}
        </option>
      `
    )
    .join('');


  $('manualCurrency').innerHTML=o;

  $('manualCurrency').value=
    currencies.includes(defaultCurrency)
      ?defaultCurrency
      :currencies[0];


  $('defaultCurrency').innerHTML=o;

  $('defaultCurrency').value=
    defaultCurrency;

}


function saveManual(){

  let n=+$('manualAmount').value;

  if(!n||n<0){
    return toast(
      '先输入金额呀 🥺'
    );
  }


  let entry={
    id:Date.now(),
    type:manualType,
    amount:n,
    currency:$('manualCurrency').value,
    category:$('manualCategory').value,
    memo:
      $('manualMemo').value.trim()||
      $('manualCategory').value,
    date:
      $('manualDate').value||
      ds(today)
  };


  entries.push(entry);

  save();

  syncOneToServer(entry);

  closeModal('manualModal');

  render();

  toast('记好啦！🌷');

}


function openAiParse(){

  $('aiModal').classList.add('show');

  $('aiText').value='';

  $('parseResult').classList.add(
    'hidden'
  );

  parsedEntries=[];

}


function fillAi(t){

  $('aiText').value=t;

}


function currency(s){

  let x=s.toLowerCase();

  if(
    /美元|美金|usd|\$/.test(x)
  ){
    return 'USD';
  }

  if(
    /人民币|rmb|cny|元|块钱|¥/.test(x)&&
    !/日元/.test(x)
  ){
    return 'CNY';
  }

  if(
    /卢布|руб|₽|\br\b|rub/.test(x)
  ){
    return 'RUB';
  }

  if(
    /日元|jpy/.test(x)
  ){
    return 'JPY';
  }

  if(
    /欧元|eur|€/.test(x)
  ){
    return 'EUR';
  }

  if(
    /英镑|gbp|£/.test(x)
  ){
    return 'GBP';
  }

  if(
    /韩元|krw|₩/.test(x)
  ){
    return 'KRW';
  }

  if(
    /港币|hkd/.test(x)
  ){
    return 'HKD';
  }

  if(
    /泰铢|thb|฿/.test(x)
  ){
    return 'THB';
  }

  return defaultCurrency;

}


function typeOf(s){

  let i=
    /收到|赚到|赚了|收入|工资|兼职|卖掉|出售|退款到账|返现|奖金|进账|入账|收款|提现|卖账号|卖出/
    .test(s);

  let o=
    /买|购买|花|消费|支出|付了|支付|打车|公交|地铁|房租|租金|吃|喝|咖啡|购物|缴费|交了|充值|医药|看病/
    .test(s);

  return i&&!o
    ?'income'
    :o&&!i
      ?'expense'
      :null;

}


function category(s,t){

  let a=[
    [
      '宠物',
      /猫|狗|宠物|猫粮|猫砂/
    ],
    [
      '交通',
      /公交|地铁|打车|出租车|滴滴|车费|火车|机票/
    ],
    [
      '餐饮',
      /咖啡|奶茶|吃|饭|早餐|午餐|晚餐|外卖|餐厅|买菜|食品/
    ],
    [
      '住房',
      /房租|租房|水电|燃气|物业/
    ],
    [
      '购物',
      /买|购买|购物|衣服|鞋|枕头|日用品|淘宝|二手/
    ],
    [
      '娱乐',
      /游戏|电影|娱乐|会员|steam/
    ],
    [
      '学习',
      /学费|课程|教材|书|学习/
    ],
    [
      '医疗',
      /医院|药|看病|医疗|保险/
    ]
  ];


  for(
    let [c,r] of a
  ){
    if(r.test(s)){
      return c;
    }
  }


  if(t==='income'){

    if(/工资|薪水/.test(s)){
      return '工资';
    }

    if(/卖|兼职|账号|副业/.test(s)){
      return '副业';
    }

    if(/退款|返现/.test(s)){
      return '退款';
    }

  }


  return '其他';

}


function dateOf(s){

  let d=new Date;

  if(/前天/.test(s)){
    d.setDate(
      d.getDate()-2
    );
  }

  else if(
    /昨天|昨日/.test(s)
  ){
    d.setDate(
      d.getDate()-1
    );
  }

  else if(
    /今天|今日/.test(s)
  ){
  }

  else{

    let m=s.match(
      /(\d{1,2})月(\d{1,2})[日号]?/
    );

    if(m){

      d=new Date(
        d.getFullYear(),
        +m[1]-1,
        +m[2]
      );

    }

  }

  return ds(d);

}


function parseAiSentence(){

  let text=
    $('aiText').value.trim();

  if(!text){
    return toast(
      '说点什么呀～ 🥺'
    );
  }


  let date=dateOf(text);


  let parts=
    text
      .replace(
        /[；;。！？!\n]+/g,
        '，'
      )
      .split(/[，,]+/)
      .flatMap(
        p=>
          p.split(
            /(?:然后|还有|以及|另外)(?=[^，]*\d)/
          )
      )
      .map(
        x=>x.trim()
      )
      .filter(Boolean);


  let out=[];


  for(
    let p of parts
  ){

    let nums=[
      ...p.matchAll(
        /(\d+(?:\.\d+)?)/g
      )
    ];


    for(
      let n of nums
    ){

      let t=
        typeOf(p)||
        typeOf(text)||
        'expense';


      let c=
        category(
          p,
          t
        );


      let memo=
        p
          .replace(
            /\d+(?:\.\d+)?/g,
            ''
          )
          .replace(
            /人民币|元|块钱|卢布|美元|美金|欧元|英镑|日元|韩元|港币|泰铢|rmb|cny|rub|usd|eur|gbp|jpy|krw|hkd|thb|₽|¥|\$|€|£|₩|฿/gi,
            ''
          )
          .trim();


      out.push({
        id:'p'+out.length,
        type:t,
        amount:+n[1],
        currency:currency(p),
        category:c,
        memo:
          memo&&memo.length<28
            ?memo
            :c,
        date
      });

    }

  }


  parsedEntries=out;

  renderParsed();

}


function renderParsed(){

  $('parseResult')
    .classList.remove(
      'hidden'
    );


  $('parsedEntries').innerHTML=
    parsedEntries.length
      ?parsedEntries.map(
        e=>`

          <div class="parsed-row ${e.type}">

            <div class="picon">
              ${icon(e.category)}
            </div>

            <div class="ptext">

              <b>
                ${
                  e.type==='income'
                    ?'🌱 收入'
                    :'🧸 支出'
                }
                ·
                ${esc(e.memo)}
              </b>

              <div class="pmeta">
                ${e.date}
                ·
                ${e.category}
              </div>

            </div>

            <div class="pamt">
              ${
                e.type==='income'
                  ?'+'
                  :'−'
              }
              ${money(
                e.amount,
                e.currency
              )}
            </div>

          </div>

        `
      ).join('')
      :
      `
        <div class="empty">
          我没有找到明确的金额 🥺
        </div>
      `;

}


function confirmAiEntries(){

  parsedEntries.forEach(
    e=>{
      let entry={
        ...e,
        id:Date.now()+Math.random()
      };

      entries.push(entry);

      syncOneToServer(entry);
    }
  );


  save();

  closeModal('aiModal');

  render();

  toast(
    `已经记下 ${parsedEntries.length} 笔啦！✨`
  );

}


function startVoice(
  target='aiText'
){

  let SR=
    window.SpeechRecognition||
    window.webkitSpeechRecognition;


  if(!SR){

    return toast(
      '这个浏览器暂时不支持语音输入 🎙️'
    );

  }


  let r=new SR;

  r.lang='zh-CN';
  r.interimResults=false;


  r.onstart=()=>{
    toast(
      '我在听啦…🎙️'
    );
  };


  r.onresult=e=>{

    $(target).value+=
      (
        $(target).value
          ?' '
          :''
      )+
      e.results[0][0].transcript;

  };


  r.onerror=()=>{
    toast(
      '没听清，再说一次试试～'
    );
  };


  r.start();

}


function setTheme(t){

  theme=t;

  document.body.className=
    'theme-'+t;

  save();


  document
    .querySelectorAll(
      '.theme-grid button'
    )
    .forEach(b=>
      b.classList.toggle(
        'selected',
        b.dataset.theme===t
      )
    );


  toast(
    '换好啦 🌷'
  );

}


function renderCurrencies(){

  $('currencyCount').textContent=
    `${currencies.length}/10`;


  $('currencyManager').innerHTML=
    currencies
      .map(
        c=>`

          <div class="currency-row">

            <div class="code">
              ${c}
            </div>

            <div class="name">
              ${META[c]?.[0]||c}
            </div>

            ${
              currencies.length>1
                ?`
                  <button
                    class="remove"
                    onclick="removeCurrency('${c}')"
                  >
                    删除
                  </button>
                `
                :''
            }

          </div>

        `
      )
      .join('');

}


function addCurrency(){

  if(currencies.length>=10){
    return toast(
      '最多先放 10 种常用货币哦'
    );
  }


  let c=prompt(
    '输入货币代码，例如 RUB / CNY / USD'
  );


  if(!c)return;


  c=c.trim().toUpperCase();


  if(
    !META[c]||
    currencies.includes(c)
  ){
    return toast(
      '这个货币暂时不支持或已经添加啦'
    );
  }


  currencies.push(c);

  save();

  render();

  toast(
    `已添加 ${c} 💱`
  );

}


function removeCurrency(c){

  if(c===defaultCurrency){

    defaultCurrency=
      currencies.find(
        x=>x!==c
      )||
      'RUB';

  }


  currencies=
    currencies.filter(
      x=>x!==c
    );


  save();

  render();

}


function saveDefaultCurrency(c){

  defaultCurrency=c;

  save();

  renderReferenceTotals();

  toast(
    '默认货币换好啦 ✨'
  );

}


/* =========================
   实时汇率
========================= */

window.momoLiveRates={};


async function loadLiveRates(){

  const status=
    document.getElementById(
      'rateStatus'
    );

  try{

    let quotes=
      currencies
        .filter(c=>c!=='EUR')
        .join(',');


    let url=
      'https://api.frankfurter.dev/v2/rates?base=EUR&quotes='+
      encodeURIComponent(quotes);


    let r=
      await fetch(url,{
        cache:'no-store'
      });


    if(!r.ok){
      throw new Error(
        'rate request failed'
      );
    }


    let data=
      await r.json();


    let rates={
      EUR:1
    };


    if(Array.isArray(data)){

      data.forEach(x=>{
        if(x.currency&&x.rate){
          rates[x.currency]=x.rate;
        }
      });

    }


    window.momoLiveRates=
      rates;


    localStorage.setItem(
      'momoLiveRates',
      JSON.stringify(rates)
    );


    if(status){

      status.textContent=
        '💱 汇率已更新';

    }


    renderReferenceTotals();

  }catch(e){

    let old=
      JSON.parse(
        localStorage.getItem(
          'momoLiveRates'
        )||'{}'
      );


    if(old&&Object.keys(old).length){

      window.momoLiveRates=old;

      if(status){
        status.textContent=
          '💱 使用上次保存的汇率';
      }

    }else{

      if(status){
        status.textContent=
          '💱 暂时无法获取汇率';
      }

    }


    renderReferenceTotals();

  }

}


/* =========================
   Python 联网服务器
========================= */

async function checkServer(){

  const box=
    document.getElementById(
      'syncStatus'
    );

  if(!box)return;


  try{

    const r=
      await fetch(
        '/api/health',
        {
          cache:'no-store'
        }
      );


    if(!r.ok){
      throw new Error();
    }


    const data=
      await r.json();


    box.textContent=
      data.ok
        ?'🟢 已连接本地服务器'
        :'🟡 服务器响应异常';


  }catch(e){

    box.textContent=
      '⚪ 当前使用手机本地保存';

  }

}


async function syncOneToServer(entry){

  try{

    await fetch(
      '/api/entries',
      {
        method:'POST',

        headers:{
          'Content-Type':
            'application/json'
        },

        body:JSON.stringify(entry)
      }
    );

  }catch(e){

    /*
      如果没有运行 Python 服务器，
      就只使用手机本地保存。
    */

  }

}


async function loadServerEntries(){

  try{

    const r=
      await fetch(
        '/api/entries',
        {
          cache:'no-store'
        }
      );


    if(!r.ok)return;


    const remote=
      await r.json();


    const ids=
      new Set(
        entries.map(
          e=>String(e.id)
        )
      );


    let changed=false;


    remote.forEach(e=>{

      if(
        !ids.has(
          String(e.id)
        )
      ){

        entries.push(e);

        changed=true;

      }

    });


    if(changed){

      save();
      render();

    }


  }catch(_){

    /*
      没有 Python 服务器时，
      不做任何处理。
    */

  }

}


/* =========================
   启动
========================= */

init();

loadLiveRates();

checkServer();

loadServerEntries();
