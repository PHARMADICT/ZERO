const DB_KEY = 'zeroFileQrDatabaseV1';
let qrData = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
let currentIndex = 0;
let autoTimer = null;

const titles = {
  homePage:'Home', zeroPage:'Zero File QR View', libraryPage:'QR Code Main Page', generatorPage:'QR Code Generator', settingsPage:'Master / Settings'
};

function saveDb(){ localStorage.setItem(DB_KEY, JSON.stringify(qrData)); renderAll(); }
function clearNode(node){ while(node.firstChild) node.removeChild(node.firstChild); }
function makeQr(target, text, size=220){
  clearNode(target);
  new QRCode(target, { text: text || 'EMPTY', width:size, height:size, correctLevel: QRCode.CorrectLevel.H });
}
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('pageTitle').textContent = titles[id] || 'Zero File QR';
  if(id==='zeroPage') renderZero();
}
window.showPage = showPage;

function renderZero(){
  const box = document.getElementById('zeroQrBox');
  const count = document.getElementById('counterText');
  if(!qrData.length){
    clearNode(box); box.classList.add('empty'); box.textContent='No QR added yet';
    document.getElementById('zeroName').textContent='No QR Selected';
    document.getElementById('zeroDesc').textContent='Generate QR codes from Master/Settings or QR Generator.';
    count.textContent='0 / 0'; return;
  }
  if(currentIndex >= qrData.length) currentIndex = 0;
  const item = qrData[currentIndex];
  box.classList.remove('empty');
  makeQr(box, item.text, 260);
  document.getElementById('zeroName').textContent = item.name;
  document.getElementById('zeroDesc').textContent = item.desc || item.text;
  count.textContent = `${currentIndex+1} / ${qrData.length}`;
}

function renderLibrary(){
  const grid = document.getElementById('qrGrid'); clearNode(grid);
  if(!qrData.length){ grid.innerHTML = '<p class="muted">No QR codes saved yet.</p>'; return; }
  qrData.forEach((item, index)=>{
    const card = document.createElement('div'); card.className='qr-card';
    const mini = document.createElement('div'); mini.className='qr-mini';
    const h = document.createElement('h4'); h.textContent = item.name;
    const p = document.createElement('p'); p.textContent = item.desc || item.text;
    card.append(mini,h,p); grid.appendChild(card); makeQr(mini,item.text,110);
    card.onclick = ()=>openFull(index);
  });
}
function renderMaster(){
  const list = document.getElementById('masterList'); clearNode(list);
  if(!qrData.length){ list.innerHTML = '<p class="muted">Master list is empty.</p>'; return; }
  qrData.forEach((item,index)=>{
    const row = document.createElement('div'); row.className='master-item';
    row.innerHTML = `<b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.text)}</small>`;
    const actions = document.createElement('div'); actions.className='master-actions';
    const edit = document.createElement('button'); edit.textContent='Edit';
    const open = document.createElement('button'); open.textContent='Open QR';
    const del = document.createElement('button'); del.textContent='Delete'; del.className='danger';
    edit.onclick=()=>editQr(index); open.onclick=()=>openFull(index); del.onclick=()=>{ qrData.splice(index,1); saveDb(); };
    actions.append(edit,open,del); row.appendChild(actions); list.appendChild(row);
  });
}
function renderAll(){ renderZero(); renderLibrary(); renderMaster(); }
function escapeHtml(s){return String(s||'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function openFull(index){
  const item = qrData[index]; if(!item) return;
  const full = document.getElementById('fullView'); full.classList.add('active');
  makeQr(document.getElementById('fullQr'), item.text, 290);
  document.getElementById('fullName').textContent = item.name;
  document.getElementById('fullDesc').textContent = item.desc || '';
  document.getElementById('fullText').textContent = item.text;
}
function editQr(index){
  const item = qrData[index];
  const name = prompt('Edit QR name', item.name); if(name === null) return;
  const text = prompt('Edit QR text/data', item.text); if(text === null) return;
  const desc = prompt('Edit QR description', item.desc || ''); if(desc === null) return;
  qrData[index] = {...item, name:name.trim() || 'Untitled QR', text:text.trim() || 'EMPTY', desc:desc.trim(), updatedAt:new Date().toISOString()};
  saveDb();
}

document.getElementById('saveQr').onclick = ()=>{
  const name = document.getElementById('qrName').value.trim();
  const text = document.getElementById('qrText').value.trim();
  const desc = document.getElementById('qrDesc').value.trim();
  if(!text){ alert('Please enter QR text/data first.'); return; }
  qrData.unshift({id:crypto.randomUUID(), name:name || text.slice(0,40), text, desc, createdAt:new Date().toISOString()});
  document.getElementById('qrName').value=''; document.getElementById('qrText').value=''; document.getElementById('qrDesc').value='';
  currentIndex = 0; saveDb(); showPage('zeroPage');
};
document.getElementById('prevQr').onclick=()=>{ if(qrData.length){ currentIndex=(currentIndex-1+qrData.length)%qrData.length; renderZero(); }};
document.getElementById('nextQr').onclick=()=>{ if(qrData.length){ currentIndex=(currentIndex+1)%qrData.length; renderZero(); }};
document.getElementById('autoBtn').onclick=()=>{
  if(autoTimer){ clearInterval(autoTimer); autoTimer=null; document.getElementById('autoBtn').textContent='Auto Scroll'; return; }
  autoTimer=setInterval(()=>{ if(qrData.length){ currentIndex=(currentIndex+1)%qrData.length; renderZero(); }},2500);
  document.getElementById('autoBtn').textContent='Stop Auto';
};
document.getElementById('closeFull').onclick=()=>document.getElementById('fullView').classList.remove('active');
document.getElementById('openZeroFile').onclick=()=>{document.getElementById('welcomeModal').classList.remove('active');document.getElementById('zeroToggle').checked=true;showPage('zeroPage');};
document.getElementById('openScanOnly').onclick=()=>{document.getElementById('welcomeModal').classList.remove('active');showPage('libraryPage');};
document.getElementById('zeroToggle').onchange=e=>{ if(e.target.checked) showPage('zeroPage'); else showPage('homePage'); };
document.getElementById('exportData').onclick=()=>{
  const blob = new Blob([JSON.stringify(qrData,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='zero-file-qr-backup.json'; a.click(); URL.revokeObjectURL(a.href);
};
document.getElementById('importData').onchange=e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader(); reader.onload=()=>{ try{ qrData=JSON.parse(reader.result); saveDb(); alert('Backup imported.'); }catch{ alert('Invalid backup file.'); }}; reader.readAsText(file);
};
document.getElementById('clearAll').onclick=()=>{ if(confirm('Delete all QR codes?')){ qrData=[]; saveDb(); }};

if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js'); }
renderAll();
