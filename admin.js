import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = id => document.getElementById(id);
const setStatus = (id, msg) => $(id).textContent = msg;

async function uploadFile(file, folder) {
  if (!file) return '';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileRef = ref(storage, `${folder}/${Date.now()}_${safeName}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

async function refreshNovels() {
  const snap = await getDocs(query(collection(db,'novels'), orderBy('createdAt','desc'))).catch(async()=>await getDocs(collection(db,'novels')));
  const list = $('novelsList');
  const select1 = $('chapterNovel'), select2 = $('characterNovel');
  list.innerHTML = '';
  select1.innerHTML = ''; select2.innerHTML = '';
  if (snap.empty) {
    list.innerHTML = '<p style="color:#aaa">لا توجد روايات بعد.</p>';
    await refreshChaptersAndCharacters();
    return;
  }
  snap.forEach(d => {
    const n = d.data();
    const opt1 = new Option(n.title, d.id), opt2 = new Option(n.title, d.id);
    select1.add(opt1); select2.add(opt2);
    const row = document.createElement('div'); row.className='item-row';
    row.innerHTML = `<div><strong>${escapeHtml(n.title||'بدون اسم')}</strong><div style="color:#aaa;font-size:14px">${escapeHtml(n.description||'')}</div></div>`;
    const actions = document.createElement('div'); actions.className='admin-actions';
    const edit = document.createElement('button'); edit.className='small-btn'; edit.textContent='تعديل';
    edit.onclick=()=>{ $('novelId').value=d.id; $('novelTitle').value=n.title||''; $('novelDescription').value=n.description||''; $('novelStatus').textContent='وضع التعديل: '+n.title; window.scrollTo({top:0,behavior:'smooth'}); };
    const del = document.createElement('button'); del.className='small-btn danger-btn'; del.textContent='حذف';
    del.onclick=()=>deleteNovel(d.id, n.title || 'هذه الرواية');
    actions.appendChild(edit); actions.appendChild(del); row.appendChild(actions); list.appendChild(row);
  });
  await refreshChaptersAndCharacters();
}

async function refreshChaptersAndCharacters() {
  const chList = $('chaptersList');
  const charList = $('charactersList');
  if (!chList || !charList) return;
  chList.innerHTML = '<p style="color:#aaa">جارٍ التحميل...</p>';
  charList.innerHTML = '<p style="color:#aaa">جارٍ التحميل...</p>';

  const novelNames = new Map();
  const novelsSnap = await getDocs(collection(db,'novels'));
  novelsSnap.forEach(d => novelNames.set(d.id, d.data().title || 'بدون اسم'));

  const chaptersSnap = await getDocs(collection(db,'chapters'));
  const chapters = chaptersSnap.docs.map(d=>({id:d.id,...d.data()}));
  chapters.sort((a,b)=>(a.createdAt?.seconds??0)-(b.createdAt?.seconds??0));
  chList.innerHTML='';
  if(!chapters.length) chList.innerHTML='<p style="color:#aaa">لا توجد فصول بعد.</p>';
  for(const c of chapters){
    const row=document.createElement('div'); row.className='item-row';
    row.innerHTML=`<div><strong>${escapeHtml(c.title||'فصل')}</strong><div style="color:#aaa;font-size:14px">${escapeHtml(novelNames.get(c.novelId)||'رواية غير معروفة')}</div></div>`;
    const del=document.createElement('button'); del.className='small-btn danger-btn'; del.textContent='حذف';
    del.onclick=()=>deleteChapter(c.id,c.title||'هذا الفصل'); row.appendChild(del); chList.appendChild(row);
  }

  const charsSnap = await getDocs(collection(db,'characters'));
  const chars = charsSnap.docs.map(d=>({id:d.id,...d.data()}));
  chars.sort((a,b)=>(a.createdAt?.seconds??0)-(b.createdAt?.seconds??0));
  charList.innerHTML='';
  if(!chars.length) charList.innerHTML='<p style="color:#aaa">لا توجد شخصيات بعد.</p>';
  for(const c of chars){
    const row=document.createElement('div'); row.className='item-row';
    row.innerHTML=`<div><strong>${escapeHtml(c.name||'شخصية')}</strong><div style="color:#aaa;font-size:14px">${escapeHtml(novelNames.get(c.novelId)||'رواية غير معروفة')}</div></div>`;
    const del=document.createElement('button'); del.className='small-btn danger-btn'; del.textContent='حذف';
    del.onclick=()=>deleteCharacter(c.id,c.name||'هذه الشخصية'); row.appendChild(del); charList.appendChild(row);
  }
}

async function deleteNovel(id, title) {
  if(!confirm(`متأكد إنك عايز تحذف «${title}»؟\nسيتم حذف الفصول والشخصيات التابعة لها أيضًا.`)) return;
  try {
    setStatus('novelStatus','جاري الحذف...');
    const [chaptersSnap, charsSnap] = await Promise.all([
      getDocs(query(collection(db,'chapters'), where('novelId','==',id))),
      getDocs(query(collection(db,'characters'), where('novelId','==',id)))
    ]);
    await Promise.all(chaptersSnap.docs.map(d=>deleteDoc(d.ref)));
    await Promise.all(charsSnap.docs.map(d=>deleteDoc(d.ref)));
    await deleteDoc(doc(db,'novels',id));
    setStatus('novelStatus','تم حذف الرواية وكل محتواها ✅');
    $('clearNovel').click();
    await refreshNovels();
  } catch(e){ console.error(e); setStatus('novelStatus','فشل حذف الرواية: '+(e.code||'خطأ')); }
}

async function deleteChapter(id, title) {
  if(!confirm(`متأكد إنك عايز تحذف «${title}»؟`)) return;
  try { await deleteDoc(doc(db,'chapters',id)); await refreshChaptersAndCharacters(); }
  catch(e){ console.error(e); alert('فشل حذف الفصل: '+(e.code||'خطأ')); }
}

async function deleteCharacter(id, name) {
  if(!confirm(`متأكد إنك عايز تحذف شخصية «${name}»؟`)) return;
  try { await deleteDoc(doc(db,'characters',id)); await refreshChaptersAndCharacters(); }
  catch(e){ console.error(e); alert('فشل حذف الشخصية: '+(e.code||'خطأ')); }
}

function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

$('loginBtn').onclick = async()=>{
  try { await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value); setStatus('loginStatus','تم الدخول.'); }
  catch(e){ setStatus('loginStatus','فشل تسجيل الدخول: تأكد من البريد وكلمة المرور وإعداد Firebase.'); console.error(e); }
};
$('logoutBtn').onclick=()=>signOut(auth);
$('clearNovel').onclick=()=>{ $('novelId').value='';$('novelTitle').value='';$('novelDescription').value='';$('novelCover').value='';$('novelPreview').classList.add('hidden');$('novelStatus').textContent=''; };
$('saveNovel').onclick=async()=>{
  try{
    const title=$('novelTitle').value.trim(), description=$('novelDescription').value.trim(), id=$('novelId').value;
    if(!title) return setStatus('novelStatus','اكتب اسم الرواية أولًا.');
    setStatus('novelStatus','جاري الحفظ...');
    let coverUrl='';
    if($('novelCover').files[0]) coverUrl=await uploadFile($('novelCover').files[0],'novel-covers');
    if(id){ const data={title,description}; if(coverUrl)data.coverUrl=coverUrl; await updateDoc(doc(db,'novels',id),data); }
    else await addDoc(collection(db,'novels'),{title,description,coverUrl,createdAt:serverTimestamp()});
    setStatus('novelStatus','تم حفظ الرواية ✅'); $('clearNovel').click(); await refreshNovels();
  }catch(e){console.error(e);setStatus('novelStatus','حدث خطأ أثناء الحفظ.');}
};
$('saveChapter').onclick=async()=>{
  try{const novelId=$('chapterNovel').value,title=$('chapterTitle').value.trim(),content=$('chapterContent').value.trim(); if(!novelId||!title||!content)return setStatus('chapterStatus','أكمل البيانات أولًا.'); setStatus('chapterStatus','جاري الحفظ...'); await addDoc(collection(db,'chapters'),{novelId,title,content,createdAt:serverTimestamp()}); setStatus('chapterStatus','تم حفظ الفصل ✅'); $('chapterTitle').value='';$('chapterContent').value='';}
  catch(e){console.error(e);setStatus('chapterStatus','حدث خطأ أثناء الحفظ.');}
};
$('saveCharacter').onclick=async()=>{
  try{const novelId=$('characterNovel').value,name=$('characterName').value.trim(),description=$('characterDescription').value.trim(); if(!novelId||!name)return setStatus('characterStatus','أكمل البيانات أولًا.'); setStatus('characterStatus','جاري الحفظ...'); let imageUrl='';if($('characterImage').files[0])imageUrl=await uploadFile($('characterImage').files[0],'character-images'); await addDoc(collection(db,'characters'),{novelId,name,description,imageUrl,createdAt:serverTimestamp()}); setStatus('characterStatus','تم حفظ الشخصية ✅'); $('characterName').value='';$('characterDescription').value='';$('characterImage').value='';}
  catch(e){console.error(e);setStatus('characterStatus','حدث خطأ أثناء الحفظ.');}
};

onAuthStateChanged(auth, async user=>{ if(user){$('loginBox').classList.add('hidden');$('panel').classList.remove('hidden');await refreshNovels();}else{$('loginBox').classList.remove('hidden');$('panel').classList.add('hidden');} });
