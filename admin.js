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

const THEME_TEXT_PRESETS = {
  aurora: {
    tagline:'حين تسقط الإمبراطوريات… لا تسقط ذكرياتها.',
    worldKicker:'The World', worldTitle:'قبل أن يسقط العرش', worldText:'في أورورا، لا تدور المعارك حول السيوف وحدها؛ كل تحالف وكل قرار يترك أثره على من سيأتي بعده.',
    charactersKicker:'Figures of the Era', charactersTitle:'وجوه صنعت عصرًا', charactersText:'ليست الشخصيات زينة للمشهد؛ لكل واحد منها علاقة مختلفة بالسلطة، والخسارة، وما سيبقى بعد انتهاء الحرب.',
    chaptersKicker:'Imperial Archives', chaptersTitle:'سجلات الإمبراطورية', chaptersText:'كل فصل هو سجل جديد في قصة السلطة، التمرد، والآثار التي لا تنتهي بمجرد انتهاء المعركة.',
    eraLabel:'The Imperial Era', eraMotto:'Power • Sacrifice • Legacy',
    mapLabels:'فيوري | جينوا | أندورا | إندلاند | مملكة السلام'
  },
  agent_zero: {
    kicker:'CLASSIFIED FILE 00 • EGYPTIAN SPY NOIR', tagline:'رجل أعمال في وضح النهار… وعميل لا يعرف أحد اسمه الحقيقي في الظلام.',
    missionBtn:'ملف المهمة', charactersBtn:'ملفات الشخصيات', status:'STATUS: ACTIVE', identity:'IDENTITY: ZERO → ONE', location:'LOCATION: EGYPT / LONDON',
    caseKicker:'CASE FILE', codenameLabel:'CODENAME', codename:'ZERO', coverLabel:'PUBLIC COVER', cover:'Horizon', leadLabel:'PRIMARY LEAD', lead:'إبراهيم عادل', threatLabel:'THREAT', threat:'المنظمة البريطانية',
    doubleKicker:'Double Life', doubleTitle:'حياتان لشخص واحد', doubleText:'هلال لا يترك حياته القديمة تمامًا؛ هو يتنقل بين العائلة، الشركة، والمهمات، وكل انتقال يكشف جانبًا مختلفًا منه.',
    publicIdentity:'PUBLIC IDENTITY', publicName:'هلال', publicText:'رجل أعمال شاب يقود شركة Horizon المتخصصة في الذكاء الاصطناعي والروبوتات والأنظمة الذكية، قريب من عائلته ويبحث عن مساحة لحياة طبيعية.',
    classifiedIdentity:'CLASSIFIED IDENTITY', agentName:'العميل صفر', agentText:'عميل ميداني يجمع بين القتال، اللغات، التقنية، والتحليل، ويتعامل مع المهام تحت ضغط مستمر دون أن يفقد علاقته بالناس من حوله.',
    personnelKicker:'Personnel Records', personnelTitle:'ملفات الشخصيات', personnelText:'كل شخصية مرتبطة بجانب من الصراع بين الحياة الطبيعية وعالم العملاء.',
    boardKicker:'Investigation Board', boardTitle:'القضية التي فتحت كل الأبواب', boardText:'اسم طفل عمره 11 عامًا يقود التحقيق إلى سلسلة جرائم، منظمة بريطانية، عينة غامضة، وصراع يتجاوز حدود مصر.',
    clueTitle:'إبراهيم عادل', clue1:'سبعة أشخاص قُتلوا باسم إبراهيم عادل.', clue2:'عينة غامضة أصبحت هدفًا لمنظمات متعددة.', clue3:'خطة مرتبطة بمياه النيل تكشف اتساع الخطر.', clue4:'ظهور العميل X يضع سؤالًا عن الماضي فوق كل مهمة جديدة.',
    orgTitle:'المنظمات', org1:'المنظمة المصرية السرية', org1Tag:'HOME', org2:'المنظمة البريطانية', org2Tag:'THREAT', org3:'كلاب أوساكا', org3Tag:'UNKNOWN', org4:'العميل X', org4Tag:'LEGACY',
    logsKicker:'Mission Logs', logsTitle:'سجلات المطاردة', logsText:'الفصول تُسحب مباشرة من Firestore وتُعرض كملفات مهمة بدل قائمة تقليدية.'
  },
  nerval: {
    worldKicker:'THE OTHER WORLD', worldTitle:'عالم لا ينتظر بطلًا مستعدًا', worldText1:'يبدأ كل شيء من المنصورة، مع آدم؛ شاب محطم يحاول الهروب من حياة أثقلته بالفشل والسخرية والخوف. ثم يفتح كتابًا غامضًا، فيجد نفسه في نيرفال، وسط حرب بين البشر والتنانين.', worldText2:'هنا لا تمنح النبوءة آدم القوة فقط، بل تضع أمامه سؤالًا أصعب: هل يصبح الإنسان قويًا لأنه اختير… أم لأنه يختار أن يتحمل المسؤولية؟', portal:'بوابة العبور', portalText:'كتاب غامض • نبوءة قديمة • التنين الأول',
    dragonKicker:'THE FIRST DRAGON', prophecyTitle:'نبوءة التنين الأول', prophecyText:'سيأتي شخص من عالم آخر يحمل قوة التنين الأول في داخله، ويكون قادرًا على إعادة التوازن بين قوى العالم.', carrierLabel:'الحامل', carrier:'زافيريون', balance:'التوازن', ancientKicker:'THE ANCIENT ONE', dragonTitle:'التنين الأول', dragonName:'زافيريون', dragonText:'تنين أسطوري رمادي بعينين ذهبيتين. لا يرى نفسه سلاحًا تابعًا لآدم، بل شريكًا يختبر استحقاقه. تظهر روحه بسبب اللعنة، بينما يبقى الجسد المفقود جزءًا من الطريق الذي ينتظر آدم.', traits:'حكمة | قوة | اختبار | رابط',
    chosenKicker:'THE CHOSEN & THE WITNESSES', chosenTitle:'سجلات نيرفال', chosenText:'وجوه صنعتها النبوءة، الحرب، والخيار.',
    adamRole:'THE CARRIER', adam:'آدم', adamText:'شاب من عالم آخر يحمل قوة التنين الأول، ويبدأ رحلته وهو خائف وغير واثق من نفسه.', lianaRole:'THE BELIEVER', liana:'ليانا', lianaText:'محاربة تؤمن بآدم قبل أن يؤمن هو بنفسه.', zariaRole:'QUEEN OF LIGHT', zaria:'زاريا', zariaText:'ملكة تنتظر ظهور الحامل وتتحمل مسؤولية مملكة النور.', aldRole:'THE WINGED', ald:'ألدريوس', aldText:'محارب غامض بقوة هائلة وأجنحة ضخمة، يرى ما لم يستيقظ في آدم بعد.', nirRole:'ROYAL GUARD', nir:'نيرافيا', nirText:'محاربة جديدة تمتلك تنينًا أرجوانيًا وتحاول إثبات نفسها.', ildRole:'THE RESISTANCE', ild:'إيلدار', ildText:'قائد مقاومة عجوز يؤمن بالنبوءة وبالطريق الذي ينتظر الحامل.',
    controlLabel:'السيطرة', controlText:'هل يصبح التنين مجرد أداة في يد الإنسان؟', pactTitle:'عهد الدم أم عهد الثقة؟', pactText:'آدم يرى أن التضحية الحقيقية تأتي من الثقة والصداقة، لا من إجبار كائن حي على الموت.', partnershipLabel:'الشراكة', partnershipText:'هل يمكن أن تكون القوة رابطة بين كائنين متساويين؟',
    chroniclesKicker:'CHRONICLES OF NERVAL', chroniclesTitle:'سجلات الفصول', chroniclesText:'رحلة آدم من الهروب… إلى أول وعد.', arrival:'THE ARRIVAL', arrivalTitle:'البداية', promise:'THE PROMISE', promiseTitle:'لن أعدك أنني سأصبح الأقوى.', promiseText:'لكنني سأبذل كل ما أستطيع.', start:'ابدأ الرحلة'
  }
  ,decision_memories:{
    kicker:'MEMORY FRACTURE', tagline:'بين ما نسيه الماضي… وما يختاره الحاضر.', worldKicker:'THE FRACTURED REALMS', worldTitle:'عالم انقسمت فيه الذكريات', worldText:'رحلة بين ممالك البشر والإلف والجحيم، حيث كل بوابة قد تكشف جزءًا من الحقيقة… أو تخفيها أكثر.', portal:'بوابة الذكريات', portalText:'ممالك متباعدة • حروب قديمة • أسرار لم تمت', heroAction:'ابدأ الرحلة', charactersAction:'سجلات الشخصيات', charactersKicker:'THE ONES WHO REMEMBER', charactersTitle:'وجوه تحمل آثار الماضي', charactersText:'شخصيات لا نعرف إن كانت تهرب من ماضيها… أم تتجه نحوه.', memoryKicker:'THE LOST SELF', memoryTitle:'من كان آريان؟', memoryText:'إمبراطور مملكة الجحيم وسيد النار… أم الرجل الذي اختار أن يبدأ من جديد؟', mahinTitle:'لغز ماهين', mahinText:'رجل فقد ذاكرته، لكن قوته ترفض أن تنسى.', dariusTitle:'داريوس', dariusText:'اسم من الحرب القديمة يعود كلما اقتربت الحقيقة.', dualityLeft:'الماضي', dualityLeftText:'أسرار، أخطاء، وذكريات لم تُدفن.', dualityRight:'الحاضر', dualityRightText:'اختيارات جديدة قد تغيّر معنى كل ما سبق.', chaptersKicker:'CHRONICLES OF MEMORY', chaptersTitle:'سجلات الرحلة', chaptersText:'كل فصل يفتح بابًا جديدًا… ولا يضمن أن تغلقه كما فتحته.', finalKicker:'THE FINAL QUESTION', finalTitle:'هل يحددك ماضيك؟', finalText:'أم أن ما تختاره الآن هو القرار الذي يصنع حقيقتك؟', start:'دخول السجلات', characterRole:'MEMORY RECORD', chapterKicker:'MEMORY CHRONICLE'
  }
};

let themeNovelsCache = new Map();
function themePresetFor(title=''){
  const t=String(title).toLowerCase();
  if(t.includes('نيرفال')||t.includes('زافيريون')||t.includes('nerval')) return THEME_TEXT_PRESETS.nerval;
  if(t.includes('العميل صفر')||t.includes('مطاردة صفر')||t.includes('agent zero')) return THEME_TEXT_PRESETS.agent_zero;
  if(t.includes('قرار الذكريات')||t.includes('decision memories')) return THEME_TEXT_PRESETS.decision_memories;
  return THEME_TEXT_PRESETS.aurora;
}
function renderThemeEditor(texts={}, title=''){
  const preset=themePresetFor(title); const merged={...preset,...(texts||{})}; const wrap=$('themeEditor'); if(!wrap) return;
  wrap.innerHTML='';
  Object.entries(merged).forEach(([key,value])=>{
    const box=document.createElement('div'); box.dataset.themeTextKey=key;
    const label=document.createElement('label'); label.textContent=key;
    const area=document.createElement('textarea'); area.rows=String(value).length>90?3:2; area.value=value||''; area.dataset.themeTextKey=key;
    box.append(label,area); wrap.appendChild(box);
  });
}
function readThemeTexts(){ const out={}; document.querySelectorAll('#themeEditor textarea[data-theme-text-key]').forEach(el=>out[el.dataset.themeTextKey]=el.value.trim()); return out; }
function readThemeForm(){
  return { texts:readThemeTexts(),
    primaryColor:$('themePrimaryColor')?.value||'', secondaryColor:$('themeSecondaryColor')?.value||'', cursorColor:$('themeCursorColor')?.value||'',
    cursorStyle:$('themeCursorStyle')?.value||'dragon', backgroundUrl:normalizeImageUrl($('themeBackgroundUrl')?.value), effects:$('themeEffects')?.value||'on' };
}
function fillThemeForm(t, title=''){
  const x=t||{}; renderThemeEditor(x.texts||{},title);
  const set=(id,v)=>{if($(id)) $(id).value=v||''};
  const isDecision=/قرار\s*الذكريات/i.test(title); const isAgent=/العميل\s*صفر|مطاردة\s*صفر/i.test(title); const isNerval=/نيرفال|زافيريون/i.test(title);
  set('themePrimaryColor',x.primaryColor||(isDecision?'#8d7cff':isNerval?'#e8752d':isAgent?'#d9e0e8':'#e8b45d')); set('themeSecondaryColor',x.secondaryColor||(isDecision?'#9cc8ff':isNerval?'#d9d6ce':isAgent?'#b8c2cc':'#d9d6ce')); set('themeCursorColor',x.cursorColor||(isDecision?'#d9e7ff':isNerval?'#ff7b2f':'#eeeeee'));
  set('themeCursorStyle',x.cursorStyle||(isDecision?'memory':isNerval?'dragon':isAgent?'crosshair':'dragon')); set('themeBackgroundUrl',x.backgroundUrl); set('themeEffects',x.effects||'on');
}
function clearThemeForm(){fillThemeForm({}, $('themeNovel')?.selectedOptions?.[0]?.textContent||'');}
function loadThemeNovel(id){ const n=themeNovelsCache.get(id); if(!n){clearThemeForm();return;} $('novelId').value=id; fillThemeForm(n.theme||{},n.title||''); setStatus('themeStatus','جاري تعديل ثيم: '+(n.title||'')); }

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
  const themeSelect = $('themeNovel');
  themeNovelsCache = new Map();
  list.innerHTML = '';
  if(themeSelect) themeSelect.innerHTML = '<option value="">اختر الرواية</option>';
  select1.innerHTML = '<option value="">اختر الرواية</option>';
  select2.innerHTML = '<option value="">اختر الرواية</option>';

  if (snap.empty) {
    list.innerHTML = '<p style="color:#aaa">لا توجد روايات بعد.</p>';
    await refreshChaptersAndCharacters();
    return;
  }

  snap.forEach(d => {
    const n = d.data();
    themeNovelsCache.set(d.id,{id:d.id,...n});
    if(themeSelect) themeSelect.add(new Option(n.title || 'بدون اسم', d.id));
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
      if($('themeNovel')) $('themeNovel').value=d.id; fillThemeForm(n.theme || {}, n.title || '');
      $('novelPreview').src=n.coverUrl||'';
      $('novelPreview').classList.toggle('hidden', !n.coverUrl);
      $('novelStatus').textContent='وضع التعديل: '+(n.title||'الرواية');
      window.scrollTo({top:0,behavior:'smooth'});
    };

    const del = document.createElement('button'); del.className='small-btn danger-btn'; del.textContent='حذف';
    del.onclick=()=>deleteNovel(d.id, n.title || 'هذه الرواية');
    actions.appendChild(edit); actions.appendChild(del); row.appendChild(actions); list.appendChild(row);
  });
  if(themeSelect){ themeSelect.onchange=()=>loadThemeNovel(themeSelect.value); if(themeSelect.value) loadThemeNovel(themeSelect.value); }
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
  clearThemeForm();
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

$('saveTheme').onclick=async()=>{
  const id=$('themeNovel')?.value || $('novelId').value;
  if(!id) return setStatus('themeStatus','اختار الرواية من قائمة الثيم أولًا.');
  try{ setStatus('themeStatus','جاري حفظ الثيم...'); await updateDoc(doc(db,'novels',id),{theme:readThemeForm()}); setStatus('themeStatus','تم حفظ الثيم ✅'); await refreshNovels(); }
  catch(e){ console.error(e); setStatus('themeStatus','فشل حفظ الثيم: '+(e.code||'تأكد من الصلاحيات.')); }
};
$('clearTheme').onclick=()=>{ const n=themeNovelsCache.get($('themeNovel')?.value); fillThemeForm(n?.theme||{},n?.title||''); };

$('saveNovel').onclick=async()=>{
  try{
    const title=$('novelTitle').value.trim();
    const description=$('novelDescription').value.trim();
    const id=$('novelId').value;
    const coverUrl=normalizeImageUrl($('novelCoverUrl').value);
    const theme=readThemeForm();
    if(!title) return setStatus('novelStatus','اكتب اسم الرواية أولًا.');
    if($('novelCoverUrl').value.trim() && !coverUrl) return setStatus('novelStatus','رابط صورة الغلاف لازم يبدأ بـ https:// أو http://');
    setStatus('novelStatus','جاري الحفظ...');
    if(id){
      await updateDoc(doc(db,'novels',id),{title,description,coverUrl,theme});
    } else {
      await addDoc(collection(db,'novels'),{title,description,coverUrl,theme,createdAt:serverTimestamp()});
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
