import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { cloudinaryConfig } from './cloudinary-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function getCloudinaryPreset() {
  return localStorage.getItem('ahmedNovelsCloudinaryPreset') || cloudinaryConfig.uploadPreset || '';
}

function setCloudinaryStatus(msg) {
  setStatus('cloudinaryStatus', msg);
}

function setupCloudinaryUpload(buttonId, inputId, previewId, label) {
  const btn = $(buttonId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const preset = getCloudinaryPreset().trim();
    if (!preset) {
      setCloudinaryStatus('اكتب Upload Preset أولًا في إعداد الصور.');
      $('cloudinaryPreset')?.focus();
      return;
    }
    if (!window.cloudinary) {
      setCloudinaryStatus('لم يتم تحميل Cloudinary. تأكد من اتصال الإنترنت ثم حدّث الصفحة.');
      return;
    }
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudinaryConfig.cloudName,
        uploadPreset: preset,
        sources: ['local'],
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxImageFileSize: 10000000,
        showAdvancedOptions: false,
        cropping: false,
        styles: { palette: { window: '#111111', windowBorder: '#444444', tabIcon: '#f0c75e', menuIcons: '#f0c75e', textDark: '#eeeeee', textLight: '#ffffff', link: '#f0c75e', action: '#f0c75e', inactiveTabIcon: '#888888', error: '#ff6b6b', inProgress: '#f0c75e', complete: '#f0c75e', sourceBg: '#1c1c1c' } }
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error', error);
          setCloudinaryStatus('فشل رفع ' + label + ': ' + (error.statusText || error.message || 'خطأ غير معروف'));
          return;
        }
        if (result?.event === 'success' && result.info?.secure_url) {
          $(inputId).value = result.info.secure_url;
          setPreview(inputId, previewId);
          setCloudinaryStatus('تم رفع ' + label + ' بنجاح ✅');
        }
      }
    );
    widget.open();
  });
}

const $ = id => document.getElementById(id);
const setStatus = (id, msg) => { const el = $(id); if (el) el.textContent = msg; };

function normalizeImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return '';
  return url;
}

function setPreview(inputId, previewId) {
  const url = normalizeImageUrl($(inputId)?.value);
  const img = $(previewId);
  if (!img) return;
  if (url) {
    img.src = url;
    img.classList.remove('hidden');
  } else {
    img.removeAttribute('src');
    img.classList.add('hidden');
  }
}

async function loadAuthorBio() {
  const el = $('authorBio');
  if (!el) return;
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'about'));
    el.value = snap.exists() ? (snap.data().bio || '') : '';
  } catch (e) {
    console.error(e);
    setStatus('authorBioStatus', 'تعذر تحميل النبذة.');
  }
}

$('saveAuthorBio')?.addEventListener('click', async () => {
  try {
    const bio = $('authorBio')?.value.trim() || '';
    setStatus('authorBioStatus', 'جاري الحفظ...');
    await setDoc(doc(db, 'siteSettings', 'about'), { bio });
    setStatus('authorBioStatus', 'تم حفظ النبذة ✅');
  } catch (e) {
    console.error(e);
    setStatus('authorBioStatus', 'فشل حفظ النبذة: ' + (e.code || 'تأكد من الصلاحيات.'));
  }
});

async function refreshNovels() {
  let snap;
  try {
    snap = await getDocs(query(collection(db,'novels'), orderBy('createdAt','desc')));
  } catch {
    snap = await getDocs(collection(db,'novels'));
  }

  const list = $('novelsList');
  const select1 = $('chapterNovel');
  const select2 = $('characterNovel');
  list.innerHTML = '';
  select1.innerHTML = '<option value="">اختر الرواية</option>';
  select2.innerHTML = '<option value="">اختر الرواية</option>';

  if (snap.empty) {
    list.innerHTML = '<p style="color:#aaa">لا توجد روايات بعد.</p>';
    await refreshChaptersAndCharacters();
    return;
  }

  snap.forEach(d => {
    const n = d.data();
    select1.add(new Option(n.title || 'بدون اسم', d.id));
    select2.add(new Option(n.title || 'بدون اسم', d.id));

    const row = document.createElement('div'); row.className='item-row';
    row.innerHTML = `<div><strong>${escapeHtml(n.title||'بدون اسم')}</strong><div style="color:#aaa;font-size:14px">${escapeHtml(n.description||'')}</div></div>`;
    const actions = document.createElement('div'); actions.className='admin-actions';

    const edit = document.createElement('button'); edit.className='small-btn'; edit.textContent='تعديل';
    edit.onclick=()=>{
      $('novelId').value=d.id;
      $('novelTitle').value=n.title||'';
      $('novelDescription').value=n.description||'';
      $('novelCoverUrl').value=n.coverUrl||'';
      $('novelPreview').src=n.coverUrl||'';
      $('novelPreview').classList.toggle('hidden', !n.coverUrl);
      $('novelStatus').textContent='وضع التعديل: '+(n.title||'الرواية');
      window.scrollTo({top:0,behavior:'smooth'});
    };

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
  chapters.sort((a,b)=>{
    const an=Number.isFinite(Number(a.number)) && Number(a.number)>0 ? Number(a.number) : 999999;
    const bn=Number.isFinite(Number(b.number)) && Number(b.number)>0 ? Number(b.number) : 999999;
    if(an!==bn) return an-bn;
    return (a.createdAt?.seconds??0)-(b.createdAt?.seconds??0);
  });
  chList.innerHTML='';
  if(!chapters.length) chList.innerHTML='<p style="color:#aaa">لا توجد فصول بعد.</p>';
  for(const c of chapters){
    const row=document.createElement('div'); row.className='item-row';
    row.innerHTML=`<div><strong>${c.number ? 'الفصل '+escapeHtml(c.number)+' — ' : 'بدون رقم — '}${escapeHtml(c.title||'فصل')}</strong><div style="color:#aaa;font-size:14px">${escapeHtml(novelNames.get(c.novelId)||'رواية غير معروفة')}</div></div>`;
    const actions=document.createElement('div'); actions.className='admin-actions';
    const edit=document.createElement('button'); edit.className='small-btn'; edit.textContent='تعديل / ترقيم';
    edit.onclick=()=>editChapter(c);
    const del=document.createElement('button'); del.className='small-btn danger-btn'; del.textContent='حذف';
    del.onclick=()=>deleteChapter(c.id,c.title||'هذا الفصل');
    actions.appendChild(edit); actions.appendChild(del); row.appendChild(actions); chList.appendChild(row);
  }

  const charsSnap = await getDocs(collection(db,'characters'));
  const chars = charsSnap.docs.map(d=>({id:d.id,...d.data()}));
  chars.sort((a,b)=>(a.createdAt?.seconds??0)-(b.createdAt?.seconds??0));
  charList.innerHTML='';
  if(!chars.length) charList.innerHTML='<p style="color:#aaa">لا توجد شخصيات بعد.</p>';
  for(const c of chars){
    const row=document.createElement('div'); row.className='item-row';
    row.innerHTML=`<div><strong>${escapeHtml(c.name||'شخصية')}</strong><div style="color:#aaa;font-size:14px">${escapeHtml(novelNames.get(c.novelId)||'رواية غير معروفة')}</div></div>`;
    const actions=document.createElement('div'); actions.className='admin-actions';
    const edit=document.createElement('button'); edit.className='small-btn'; edit.textContent='تعديل';
    edit.onclick=()=>editCharacter(c);
    const del=document.createElement('button'); del.className='small-btn danger-btn'; del.textContent='حذف';
    del.onclick=()=>deleteCharacter(c.id,c.name||'هذه الشخصية');
    actions.appendChild(edit); actions.appendChild(del); row.appendChild(actions); charList.appendChild(row);
  }
}

function editCharacter(c) {
  $('characterId').value = c.id || '';
  $('characterNovel').value = c.novelId || '';
  $('characterName').value = c.name || '';
  $('characterDescription').value = c.description || '';
  $('characterImageUrl').value = c.imageUrl || '';
  setPreview('characterImageUrl','characterPreview');
  $('characterStatus').textContent = `وضع التعديل: ${c.name || 'الشخصية'}`;
  $('saveCharacter').textContent = 'حفظ التعديلات';
  $('characterFormTitle').textContent = 'تعديل شخصية';
  window.scrollTo({ top: Math.max(0, $('characterName').getBoundingClientRect().top + window.scrollY - 120), behavior: 'smooth' });
}

$('clearCharacter').onclick = () => {
  $('characterId').value = '';
  $('characterNovel').value = '';
  $('characterName').value = '';
  $('characterDescription').value = '';
  $('characterImageUrl').value = '';
  $('characterPreview').removeAttribute('src');
  $('characterPreview').classList.add('hidden');
  $('characterStatus').textContent = '';
  $('saveCharacter').textContent = 'حفظ الشخصية';
  $('characterFormTitle').textContent = 'إضافة / تعديل شخصية';
};

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

function editChapter(c) {
  $('chapterId').value = c.id || '';
  $('chapterNovel').value = c.novelId || '';
  $('chapterNumber').value = c.number ?? '';
  $('chapterTitle').value = c.title || '';
  $('chapterContent').value = c.content || '';
  $('chapterStatus').textContent = `وضع التعديل: ${c.title || 'الفصل'}`;
  $('saveChapter').textContent = 'حفظ التعديلات';
  window.scrollTo({ top: Math.max(0, $('chapterTitle').getBoundingClientRect().top + window.scrollY - 120), behavior: 'smooth' });
}

$('clearChapter').onclick = () => {
  $('chapterId').value = '';
  $('chapterNovel').value = '';
  $('chapterNumber').value = '';
  $('chapterTitle').value = '';
  $('chapterContent').value = '';
  $('chapterStatus').textContent = '';
  $('saveChapter').textContent = 'حفظ الفصل';
};

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

$('clearNovel').onclick=()=>{
  $('novelId').value='';
  $('novelTitle').value='';
  $('novelDescription').value='';
  $('novelCoverUrl').value='';
  $('novelPreview').removeAttribute('src');
  $('novelPreview').classList.add('hidden');
  $('novelStatus').textContent='';
};

$('novelCoverUrl').addEventListener('input', ()=>setPreview('novelCoverUrl','novelPreview'));
$('characterImageUrl').addEventListener('input', ()=>setPreview('characterImageUrl','characterPreview'));

$('cloudinaryPreset').value = getCloudinaryPreset();
$('saveCloudinaryPreset').onclick = ()=>{ const v=$('cloudinaryPreset').value.trim(); if(!v) return setCloudinaryStatus('اكتب Upload Preset.'); localStorage.setItem('ahmedNovelsCloudinaryPreset', v); setCloudinaryStatus('تم حفظ إعداد الصور على هذا المتصفح ✅'); };
setupCloudinaryUpload('uploadNovelCover','novelCoverUrl','novelPreview','غلاف الرواية');
setupCloudinaryUpload('uploadCharacterImage','characterImageUrl','characterPreview','صورة الشخصية');

$('saveNovel').onclick=async()=>{
  try{
    const title=$('novelTitle').value.trim();
    const description=$('novelDescription').value.trim();
    const id=$('novelId').value;
    const coverUrl=normalizeImageUrl($('novelCoverUrl').value);
    if(!title) return setStatus('novelStatus','اكتب اسم الرواية أولًا.');
    if($('novelCoverUrl').value.trim() && !coverUrl) return setStatus('novelStatus','رابط صورة الغلاف لازم يبدأ بـ https:// أو http://');
    setStatus('novelStatus','جاري الحفظ...');
    if(id){
      await updateDoc(doc(db,'novels',id),{title,description,coverUrl});
    } else {
      await addDoc(collection(db,'novels'),{title,description,coverUrl,createdAt:serverTimestamp()});
    }
    setStatus('novelStatus','تم حفظ الرواية ✅');
    $('clearNovel').click();
    await refreshNovels();
  }catch(e){console.error(e);setStatus('novelStatus','حدث خطأ أثناء الحفظ: '+(e.code||'تأكد من الصلاحيات.'));}
};

$('saveChapter').onclick=async()=>{
  try{
    const chapterId=$('chapterId').value;
    const novelId=$('chapterNovel').value;
    const numberRaw=$('chapterNumber').value.trim();
    const title=$('chapterTitle').value.trim();
    const content=$('chapterContent').value.trim();
    const number=Number(numberRaw);
    if(!novelId||!numberRaw||!Number.isInteger(number)||number<1||!title||!content)return setStatus('chapterStatus','أكمل البيانات وأدخل رقم فصل صحيح (1 أو أكثر).');
    setStatus('chapterStatus',chapterId?'جاري حفظ التعديلات...':'جاري الحفظ...');

    // منع تكرار رقم الفصل داخل نفس الرواية مع إعطاء فرصة للاستمرار عند تعديل نفس الفصل.
    const existingSnap = await getDocs(query(collection(db,'chapters'), where('novelId','==',novelId)));
    const duplicate = existingSnap.docs.some(d => d.id !== chapterId && Number(d.data().number) === number);
    if (duplicate) {
      const ok = confirm(`الفصل رقم ${number} موجود بالفعل لهذه الرواية. هل تريد المتابعة رغم ذلك؟`);
      if (!ok) { setStatus('chapterStatus','تم إلغاء الحفظ لتجنب تكرار رقم الفصل.'); return; }
    }

    const payload={novelId,number,title,content};
    if(chapterId){
      await updateDoc(doc(db,'chapters',chapterId),payload);
      setStatus('chapterStatus','تم حفظ تعديلات الفصل ✅');
    } else {
      await addDoc(collection(db,'chapters'),{...payload,createdAt:serverTimestamp()});
      setStatus('chapterStatus','تم حفظ الفصل ✅');
    }
    $('clearChapter').click();
    await refreshChaptersAndCharacters();
  }catch(e){console.error(e);setStatus('chapterStatus','حدث خطأ أثناء الحفظ: '+(e.code||'تأكد من الصلاحيات.'));}
};

$('saveCharacter').onclick=async()=>{
  try{
    const characterId=$('characterId').value;
    const novelId=$('characterNovel').value,name=$('characterName').value.trim(),description=$('characterDescription').value.trim();
    const imageUrl=normalizeImageUrl($('characterImageUrl').value);
    if(!novelId||!name)return setStatus('characterStatus','أكمل البيانات أولًا.');
    if($('characterImageUrl').value.trim() && !imageUrl) return setStatus('characterStatus','رابط صورة الشخصية لازم يبدأ بـ https:// أو http://');
    setStatus('characterStatus',characterId?'جاري حفظ التعديلات...':'جاري الحفظ...');
    const payload={novelId,name,description,imageUrl};
    if(characterId){
      await updateDoc(doc(db,'characters',characterId),payload);
      setStatus('characterStatus','تم حفظ تعديلات الشخصية ✅');
    } else {
      await addDoc(collection(db,'characters'),{...payload,createdAt:serverTimestamp()});
      setStatus('characterStatus','تم حفظ الشخصية ✅');
    }
    $('clearCharacter').click();
    await refreshChaptersAndCharacters();
  }catch(e){console.error(e);setStatus('characterStatus','حدث خطأ أثناء الحفظ: '+(e.code||'تأكد من الصلاحيات.'));}
};

onAuthStateChanged(auth, async user=>{
  if(user){
    $('loginBox').classList.add('hidden');
    $('panel').classList.remove('hidden');
    await loadAuthorBio();
    await refreshNovels();
  }else{
    $('loginBox').classList.remove('hidden');
    $('panel').classList.add('hidden');
  }
});
