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
  ,mala_mind:{ kicker:'A STORY INSIDE THE MIND', tagline:'تاي لا تنقصه القوة... لكنه اختار الصمت.', worldTitle:'المشكلة ليست في القوة.', worldText:'تاي يعرف أنه قادر على الرد، لكنه يخوض معركته الخاصة لفهم مشاعره ومعرفة لماذا يحتاج إلى اهتمام لم يطلبه يومًا.', charactersTitle:'تاي', charactersText:'شاب هادئ، قوي أكثر مما يظن الآخرون، ويعيش معظم معاركه داخل رأسه.', chaptersTitle:'سجل الفصول', chaptersText:'يوميات تاي، أفكاره، واللقاءات التي تبدأ في أكثر اللحظات عادية.', finalTitle:'بعض الأشياء لا تنتهي عندما نصمت عنها.', finalText:'بل تبدأ في رؤوسنا.', start:'ابدأ الفصل الأول', chapterKicker:'THE FIRST RECORD' }
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
  if(t.includes('ما لا ينتهي في رأسي')||t.includes('mala')) return THEME_TEXT_PRESETS.mala_mind;
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
  const isDecision=/قرار\s*الذكريات/i.test(title); const isAgent=/العميل\s*صفر|مطاردة\s*صفر/i.test(title); const isNerval=/نيرفال|زافيريون/i.test(title); const isMala=/ما\s*لا\s*ينتهي\s*في\s*رأسي/i.test(title);
  set('themePrimaryColor',x.primaryColor||(isMala?'#b89b79':isDecision?'#8d7cff':isNerval?'#e8752d':isAgent?'#d9e0e8':'#e8b45d')); set('themeSecondaryColor',x.secondaryColor||(isMala?'#d9cbb9':isDecision?'#9cc8ff':isNerval?'#d9d6ce':isAgent?'#b8c2cc':'#d9d6ce')); set('themeCursorColor',x.cursorColor||(isMala?'#5e5449':isDecision?'#d9e7ff':isNerval?'#ff7b2f':'#eeeeee'));
  set('themeCursorStyle',x.cursorStyle||(isMala?'pen':isDecision?'memory':isNerval?'dragon':isAgent?'crosshair':'dragon')); set('themeBackgroundUrl',x.backgroundUrl); set('themeEffects',x.effects||'on');
}
function clearThemeForm(){fillThemeForm({}, $('themeNovel')?.selectedOptions?.[0]?.textContent||'');}
function loadThemeNovel(id){ const n=themeNovelsCache.get(id); if(!n){clearThemeForm();return;} $('novelId').value=id; fillThemeForm(n.theme||{},n.title||''); setStatus('themeStatus','جاري تعديل ثيم: '+(n.title||'')); }

function normalizeImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(?:\.\/)?images\//i.test(url)) return url.replace(/^\.\//,'');
  return '';
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


const MALA_SEED = {
  title:'ما لا ينتهي في رأسي',
  description:'تاي لا تنقصه القوة... لكنه يختار الصمت. وبينما يظنه الجميع ضعيفًا، يخوض معركته الخاصة لفهم مشاعره، واكتشاف سبب حاجته للاهتمام الذي لم يطلبه يومًا.',
  coverUrl:'images/mala-cover.jpeg',
  theme:{texts:{kicker:'A STORY INSIDE THE MIND',tagline:'تاي لا تنقصه القوة... لكنه اختار الصمت.',worldTitle:'المشكلة ليست في القوة.',worldText:'تاي يعرف أنه قادر على الرد، لكنه يخوض معركته الخاصة لفهم مشاعره ومعرفة لماذا يحتاج إلى اهتمام لم يطلبه يومًا.',charactersTitle:'تاي',charactersText:'شاب هادئ، قوي أكثر مما يظن الآخرون، ويعيش معظم معاركه داخل رأسه.',chaptersTitle:'سجل الفصول',chaptersText:'يوميات تاي، أفكاره، واللقاءات التي تبدأ في أكثر اللحظات عادية.',finalTitle:'بعض الأشياء لا تنتهي عندما نصمت عنها.',finalText:'بل تبدأ في رؤوسنا.',start:'ابدأ الفصل الأول',chapterKicker:'THE FIRST RECORD'},primaryColor:'#b89b79',secondaryColor:'#d9cbb9',cursorColor:'#5e5449',cursorStyle:'pen',effects:'on'},
  chapterContent:"... \n\n\"تصرف بلطف...\n\nأكبح جماح غرائزك بطرف لسانك...\n\nأدخلها بعمق في حلقك وابتلعها...\n\nحتى بعد ذلك،\n\nيبدو أن أفكارك المظلمة قد تنكشف.\n\nحينها...\n\nفقط مت.\"\n\n.....\n\nيقولون إن مشكلة كبيرة قد وقعت بسبب ضربي لأحد متنمري الفصل...\n\nلكنهم لم يروا سوى النهاية.\n\nلم يروا ما حدث قبل ذلك.\n\nلم يروا كم مرة تمادى، وكم مرة حاولت أن أتجاهل الأمر...\n\nحتى جاءت اللحظة التي لم أعد أستطيع فيها كبح نفسي ، في العادة أدع الأمر يمر لأنني لا أحب المشاكل، لكن هذه المرة كان لا بد لي من حضور الأختبار، ولم يكن لدي سوى قلم واحد.\n\nحقًا، كيف يمكنهم أن يروا الحياة بتلك البساطة ، قلم واحد يمكنهم شرائه من أي مكتبة قريبة، وبأي مال يستولون عليه من الطلاب، ولكن حتى هذه لا يقومون بها ، وكأن التنمر يجري في عروقهم. \n\nوالآن...\n\nالجميع ينظر إلي وكأنني أنا المشكلة.\n\n.... \n\nلقد إنتهى الأختبار ، وها أنا ذاهب لذلك الزقاق. \n\nزقاق يجتمع به جميع المتنمرين، الملوثين ،والمدخنين. \n\nيتم إرسالنا - من يتم التنمر عليهم - أولًا لتنصيب المقاعد ، أما منافض السَّجائر، يمكن أن تكون في سلة المهملات أو الأرض أو \n\nنحن. \n\nلماذا ذلك؟\n\nلأننا إذا لم نفعل سيتم مضايقتنا وإزعاجنا في اليوم التالي، ثم الذي بعده.. أو ربما... بعضنا قد أختار ذلك الطريق سلفًا. \n\nعندما وصلت إلى ذلك الزقاق بينما كان المتنمرون خلفي ، وجدت اثنان يمارسون الحب هناك. \n\nالحب..، لم أجرب ذلك يومًا من شخص غير أمي، هناك العديد من الفتيات يطلبن التحدث معي أو طلب رقمي، لكني لم أجبهم يومًا. \n\nلا أعلم لماذا يطلبون ذلك، هل لأنني رزقت بقدر من الوسامة ، أهذا هو الحب المشروط... أؤمن أن الحب يجب أن يكون غير مشروط، ولكن كيف؟ في كل منا جزء أناني يشترط شيئًا يدفعنا لنكمل، آمل أن لا يكون هناك شيئ أناني كالجمال والمال بيني وبين من أحب، فإن المال يأتي ويذهب، وحتى الجمال في مرحلة ما، يذهب للأبد، عندما يحين ذلك الوقت... ماذا سيبقى لنكمل الطريق سويًا؟\n\n\" هيا هيا فالتفسحوا الطريق يا أزواج العصافير.\" \n\nها قد جاء المتنمرون يستولون على ذلك المكان الملوث، أكاد أجزم أن كل الأشياء الخاطئة والبذيئة قد أُرتكبت في هذا المكان. \n\n\" تعال أيها اللقيط، أأنت من ضربت جاك اليوم؟\n\nأتعلم ما الذي يحدث عندما يُصاب واحد منا؟\" \n\nنظرت إليه.. لم يكن السؤال يحتاج إلى إجابة.\n\nهو لم يأتِ ليسأل، بل جاء ليسمع ما يريد سماعه.\n\nفي عيون بعض الأشخاص، الحقيقة ليست مهمة...\n\nالمهم فقط أن يجدوا سببًا يجعلهم يفعلون ما يريدون.\n\n\"نعم.\" \n\nقلتها بهدوء، لم أكن أرى فائدة من الإنكار.\n\nحتى لو قلت لا، الجميع قد رآني على أي حال. \n\nتبادلوا النظرات بينهم، وكأن اعترافي أعطاهم سببًا إضافيًا للغضب.\n\n\"يبدو أنك نسيت مكانك.\" \n\nقالها أحدهم وهو يقترب، ممسكًا بمضرب كبير. \n\n\"مكانك...\"\n\nلطالما أحببت هذه الكلمة.\n\nلأنها تكشف الكثير عن طريقة تفكير البشر.\n\nالجميع يريد وضع الآخرين في أماكن محددة.\n\nهناك من يولد في مكان مرتفع، وهناك من يُجبر على البقاء في الأسفل.\n\nوالمشكلة تبدأ عندما يحاول أحدهم التحرك.\n\n... \n\nفي الحقيقة، لم أكن خائفًا، ليس لأنني لا أعرفهم.\n\nبل لأنني أعرف نفسي.\n\nكنت أستطيع الرد.\n\nجسدي لم يكن ضعيفًا كما يظنون.\n\nسنوات التدريب في الصالة الرياضية لم تكن من أجل استعراض القوة أو جذب انتباه أحد.\n\nكنت فقط أريد أن أعتني بشيء واحد أستطيع التحكم به.\n\nصحتي.\n\nكانت أمي دائمًا تقول:\n\n\"يكمن الرجل في صحته.\"\n\nلم أفهم معنى كلماتها عندما كنت أصغر.\n\nكنت أظن أنها تعني أن الرجل القوي هو من يستطيع هزيمة الآخرين.\n\nلكنني اكتشفت لاحقًا أنها كانت تعني شيئًا مختلفًا.\n\nأن الإنسان يحتاج إلى القوة كي يحمي نفسه ، ما يحبه، ويساعد من يحبه ، لأجل أن يعمل جيدًا ويوفر قوت يومه ...\n\nوليس كي يؤذي غيره.\n\n..\n\n\"ماذا تنتظرون؟\"\n\nقالها أحدهم.\n\nوفي اللحظة التالية...\n\nبدأ كل شيء.\n\nلم أتحرك.\n\nلم أرفع يدي.\n\nلم أحاول إيقافهم.\n\nليس لأنني لم أستطع.\n\nبل لأنني لم أرد.\n\nهناك فرق كبير بين العجز والاختيار.\n\nالعاجز لا يفعل شيئًا لأنه لا يستطيع.\n\nأما أنا...\n\nفكنت أستطيع.\n\nوهذا هو السبب الذي جعلني لا أفعل.\n\nكانت الضربات تأتي وتذهب.\n\nلكنها لم تكن الشيء الذي يشغل تفكيري.\n\nكنت أفكر في شيء آخر.\n\nفي الاختبار.\n\nفي الإجابات التي كتبتها.\n\nفي وجه أمي عندما ترى النتيجة.\n\nأحيانًا أعتقد أن الإنسان لا يحتاج إلى حلم خاص به كي يستمر.\n\nأحيانًا يكفي أن يحمل حلم شخص آخر.\n\nوربما...\n\nهذا هو السبب الوحيد الذي يجعلني أستمر.\n\nلأجل أمي. \n\n.....\n\nبعد فترة، بدأوا بالملل.\n\nلم يحصلوا على ما يريدون.\n\nلم أصرخ.\n\nلم أطلب منهم التوقف.\n\nكنت فقط أنتظر النهاية.\n\nمن المضحك أنهم لم يسمحوا لي الذهاب بعد كل هذا الضرب. \n\nرغم أن هناك المزيد مثلي في ذلك الزقاق، لكنني كنت الوحيد الواقف هناك. \n\nأهذا ما يسمونه عقابًا؟\n\nشعرت ببعض الضيق لسبب لا أفهمه...\n\nربما لأنني لم أختبر هذا الشعور من قبل.\n\nأمي لم تعاقبني يومًا بهذه الطريقة.\nليس لأنها لم تهتم عندما أخطئ، بل لأنها كانت دائمًا تعرف كيف تجعلني أفهم خطئي دون أن تجعلني أشعر أنني عدو لها.\n\nلذلك كان غريبًا أن يأتي أشخاص لا يعرفونني ليقرروا أن يعاقبوني.\n\nها قد بدأو بأسوأ فقرة في اليوم. \n\nفقرة النميمة. \n\nيمكنك في هذا المكان وهذا الوقت بالتحديد أن تعرف كل شيئ عن فتيان وفتيات هذه المدرسة. \n\nمن الغني. \n\nومن الفقير. \n\nمن يمكنه التسكع معهم ومن يمكنه أن يُضرب ويصبح كيس ملاكمة آخر. \n\nيمكنك أن تعرف تاريخ كل فتاة هنا، عائلتها، علاقتها العاطفية وطريقة ارتداءها للملابس. \n\nبسبب تلك الفتاة الشقراء، الذي كان شعرها مصبوغًا في الواقع،\nمساحيق تجميل كثيرة، بمكياج يجعلها تبدو كمهرج أحمق في سرك رديء. \n\nوملابس ضيقة... ضيقة للغاية ، تبدي تفاصيل أكثر مما يجب، تجعل جميع من في هذا الزقاق يقولون. \n\n\"أوه، أريد أن أواعد هذه.\" \n\nيتمنون ذلك، ربما أيضًا لأنها تجلب لهم كل معلومة عن كل فتاة في المدرسة، وتجلب صديقاتها إلى هذا الزقاق. \n\nعندما تذهب ينظر الجميع لها من الخلف، يتحدثون بشهوة ونميمة عنها.. \n\nأما أنا...\n\nفلم أرَ ما يرونه.\n\nلم أرَ فتاة يبحث الجميع عن الاقتراب منها.\n\nرأيت شخصًا اختار أن يجعل نظرات الآخرين هي الطريقة التي يثبت بها وجوده.\n\nشخصًا يبيع جزءًا من نفسه مقابل اهتمام مؤقت.\n\nولهذا...\n\nكنت أراها رخيصة.\n\nرخيصة للغاية...\n\nولم أكن أتحدث عن المال بالطبع.\n\n.....\n\nخرجت من الزقاق متجهًا إلى الشارع الرئيسي.\n\nلم أكن أشعر بالكثير.\n\nلا غضب.\n\nلا حزن.\n\nفقط رغبة في تناول شيء ما والعودة إلى المنزل.\n\nتفقدت ملابسي سريعًا.\n\nلم يكن هناك شيء خطير.\n\nربما لأنني اعتدت على الاهتمام بجسدي.\n\nأو لأنني ببساطة لم أكن أضعف مما يعتقدون.\n\nاتجهت إلى أحد المطاعم القريبة.\n\nكنت بحاجة إلى وجبة جيدة بعد يوم طويل.\n\nفالتمرين وحده لا يبني جسدًا قويًا...\n\nالغذاء جزء من الأمر أيضًا.\n\nدخلت المطعم وجلست في مكان هادئ.\n\nنظرت حولي.\n\nأصوات الناس.\n\nضحكاتهم.\n\nأحاديثهم العادية.\n\nكل شيء كان يبدو طبيعيًا.\n\nوهذا أكثر شيء كان يثير فضولي دائمًا.\n\nكيف يمكن للعالم أن يستمر بشكل طبيعي...\n\nبينما شخص ما في نفس اللحظة يعيش شيئًا مختلفًا تمامًا؟\n\n\" عمة ماري، لقد جئت.\" \n\nكالعادة،\n\nلم أحتج إلى قول شيئ. \n\nمنذ أشهر وأنا أطلب نفس الوجبة. \n\nوضعت يدي على الطاولة وانتظرت طلبي.\n\nكنت أظن أن هذا مجرد يوم آخر.\n\nلكنني لم أكن أعرف...\n\nأن بعض اللقاءات تبدأ في أكثر اللحظات التي لا نتوقعها.\n\n... \n\nبعد قليل من الوقت،\n\nجائت فتاة في مثل سني تضع أطباق الطعام برفق. \n\nرفعت وجهي لأرى وجهها، فإذا بها فتاة معي في الفصل... لينا. \n\n\" تاي!.\" \n\nرغم علو صوتها وهي تقول أسمي، إلا أنها قالته برقة وبقلق بالغين. \n\nتاي\n\nكيف يُمكن لذلك الأسم الحاد أن يُنطق بهذه الرقة. \n\nبدا اسمي جميلا عندما قالته هي. \n\n\" أهلا لينا.\" \n\n\" ما الذي حدث لوجهك!.\" \n\nآه، \n\nفهمت الآن،\n\nلهذا كان صوتها مرتفع،\n\nهي كانت قلقة. \n\nلماذا يا ترى... فهناك العديد من هم مثلي، هل لأن العمة ماري تهتم بي؟\n\n\" يجب أن تأتي وتعالج جروحك! \nستغضب العمة ماري على هذا المنوال!.\" \n\nصحيح. \n\nإذا رأتني العمة ماري هكذا قد تغضب مني، لا أُريد ذلك. \n\n\" دعيني انتهي من تناول طعامي أولا.\" \n\nكنت جائع للغاية. \n\nلم يتسنى لي الوقت لأكل شيئ ما هذا الصباح. \n\nذهبت لتحضر باقي الأطباق ، لقد جلبت صدرًا من الدجاج المشوي، مع الأرز وبعض الخضروات. \n\nأحيانًا أعتقد أن العمة ماري تعرف عني أكثر مما أعرف عن نفسي.\n\nلم أكن من الأشخاص الذين يهتمون كثيرًا بتغيير وجباتهم، طالما أنها جيدة وتكفيني.\n\nأخذت وقتي في الأكل بهدوء.\n\nكان المطعم هادئًا كعادته، بعيدًا عن ضجيج المدرسة وأصوات الزقاق.\n\nلأول مرة منذ بداية اليوم...\n\nلم أكن مضطرًا إلى التفكير في شيء.\n\nفقط الطعام.\n\nومكان هادئ.\n\nوبعض الوقت لأستعيد طاقتي.\n\nلاحظت أن لينا كانت تنظر إلى وجهي بين الحين والآخر، وكأنها تحاول التأكد من أنني بخير.\n\nوهي تنتظر الطلبات... وتوصل الطعام إلى الطاولات،\n\nلاحظت أنها لم تتوقف عن مراقبتي.\n\nلا أفهم السبب.\n\nلديها عمل يجب أن تهتم به، فلماذا تضيع وقتها في متابعة شخص مثلي؟\n\nبعد أن انتهيت من طعامي، دخلت الغرفة الصغيرة الموجودة خلف المطعم.\n\nأعلم عنها لأني آتي إلى هنا لمساعدة العمة ماري في عطلة نهاية الأسبوع. \n\nكانت الغرفة التي نستخدمها للراحة عندما يطول اليوم.\n\nوضعت العمة ماري حقيبة الإسعافات على الطاولة، ثم نظرت إلى لينا.\n\n\"اعتني به جيدًا، سأعود للعمل قبل أن تتراكم الطلبات.\" \n\nقالتها ثم خرجت، تاركة الباب مفتوحًا قليلًا.\n\nعاد صوت المطعم من الخارج.\n\nالأطباق.\n\nخطوات الزبائن.\n\nوصوت ماري وهي تتحدث معهم كعادتها.\n\nأما هنا...\n\nفكان الهدوء مختلفًا.\n\nجلست على الكرسي، بينما بدأت لينا تجهز الأدوات أمامها.\n\n\" لا تتحرك كثيرًا.\" \n\nقالتها وهي تقترب.\n\nنظرت إليها.\n\n\"أنتِ قلقة أكثر مما ينبغي، الأمر لا يستدعي كل هذا القلق.\"\n\nتوقفت للحظة، ثم نظرت إلى وجهي.\n\n\"لا، يجب أن تحافظ على نفسك يا تاي.\"\n\nلم أعرف ماذا أجيب.\n\nلأنها كانت محقة.\n\nلقد كنت أركز في وجهها كثيرًا. \n\nلقد كانت قريبة للغاية. \n\nعينيها.. جميلتين.\n\nمرسومتان بإتقان شديد. \n\nلونهما الأخضر ملفت للغاية. \n\nعقدت شعرها على هيئة كعكةٍ مرتبة. \n\nكان شعرها المنسدل على كتفها رائع للغاية. \n\nأظن أنها قامت برفعه لتستطيع التركيز على علاجي. \n\n\" إن عينيك جميلتين للغاية. \" \n\nها.. ما هذا الآن؟ \n\nلماذا قالت هذا تحديدا؟\n\nلماذا تحدثت عن عيني في هذا الوقت؟\n\nأهي تقرأ أفكاري؟\n\nأم أن هذا تخاطر ما؟\n\nلقد أحمر وجهها قليلًا.. لما؟\n\nلقد قالها لي الكثيرون لكن لم تحمر وجوههم أبدًا.\n\nهل من المحرج أن أتركها بلا رد؟ لذلك أحمر وجهها؟\n\n\"وعينيكِ أيضًا.\" \n\nلقد أحمر وجهها أكثر، لا أدري ماذا أقول، أظن أنني يجب أن أغير الموضوع. \n\nهناك كتاب على الطاولة، أهو كتابها؟ اتقرأ كتبًا في وقت استراحتها، لست مهتمًا بالكتب في الواقع، بل لم اقرأ كتابًا في حياتي. \n\n\" ما هذا الكتاب الذي هناك؟\" \n\n\" إنها رواية \"\n\nرواية... إذا قد تكون عن قصة ما، يبدو موضوعًا قابل للحديث عنه أكثر. \n\n\" عن ماذا يتحدث؟\" \n\nلا أريد أن أعطيها أمل زائف بأني مهتم بالروايات، ولكن أحسست أنه أفضل طريقة لتغيير الموضوع. \n\n\" عن فتى نبيل يريد تغيير إمبراطوريةٌ ،حيث يعيش النبلاء في رفاهية بينما يكافح الفقراء من أجل البقاء.\" \n\nيا لها من طاقة تتحدث بها عن تلك الرواية تبدو شغوفة بها. \n\nاقتربت من الطاولة ، أخذت الكتاب لأقرأ عنوانه بينما أكملت هي العلاج. \n\nيبدو أنه مكون من قسمين\n\nAurora.. \n\nألا تعني الشفق باللاتينية؟\n\nإذا ما علاقة العنوان بالقصة؟ ، هل لأن ذلك الفتى سيحضر الفجر للإمبراطورية والفقراء؟ هل لأنه سيحضر فجرًا حيث لا يصبح هناك أحد يكافح لأجل معيشة عادية أساسية؟\n\nإذا ماذا عن القسم الآخر؟ \n\nFall of empire.. \n\nسقوط الإمبراطورية.. \n\nيا له من تناقض غريب، لماذا قد تسقط الإمبراطورية مجددًا إذا كان سيحضر فجرًا جديدًا لها، هل سيحدث له شيئ؟\n\nأم أن الكاتب يقصد أنها كانت في الحضيض بالفعل حتى وُلد الفجر الجديد، أم... \n\nلا،\n\nلا يمكنني تحديد تلك الإجابة،\n\nلقد انتابني الفضول حقًا لمعرفة ماذا سيحدث من الآن. \n\nهل أطلب منها استعارته؟ كيف أطلب منها ذلك،\n\nبرسمية أم لا.؟\n\n\" هل يمكنني اقتراض هذا الكتاب من فضلك؟ \" \n\nلماذا قلتها بهذه الطريقة؟\n\nهل بدوت غريبًا جدا؟\n\n\" نعم، يمكنك ذلك ، لكن لا تنسى أن تعيده سالمًا. \" \n\nأن أعيدها سالمًا. \n\nما معنى هذا. \n\nأهي من ذلك النوع المهووس بالكتب، أم أن ما بداخل هذا الكتاب يستحق أن يحافظ عليه بالفعل. \n\nلم أتلف أشيائي من قبل، لذا لا أظن أن هذا الطلب قد يكون مشكلة. \n\n\" شكرا لكِ. \n\nلكِ ذلك. \"\n\n---\n\nبعد أن انتهيت من العلاج، أعدت الكتاب إلى يدي.\n\nلم يكن كبيرًا، لكنه كان أثقل مما توقعت.\n\nليس بسبب وزنه...\n\nبل بسبب الفضول الذي تركه بداخلي.\n\nخرجت من الغرفة، فوجدت العمة ماري تقف خلف الطاولة تستقبل أحد الزبائن.\n\n\"انتهيت؟\"\n\nنظرت إليّ ثم إلى وجهي.\n\n\" يبدو أفضل الآن.\"\n\nأومأت فقط.\n\n\"شكرًا لكِ يا عمة ماري.\"\n\nنظرت إليّ للحظة وكأنها تريد قول شيء، لكنها اكتفت بابتسامة صغيرة.\n\n\"لا تتأخر في العودة.\"\n\nكانت دائمًا تقولها بنفس الطريقة.\n\nكأنها لا تريد أن تعترف بأنها تقلق عليّ.\n\nخرجت من المطعم.\n\nكان الهواء في الخارج أبرد قليلًا من قبل.\n\nوضعت يدي في حقيبتي، وأخرجت الكتاب للحظة.\n\nAurora...\n\nوسقوط الإمبراطورية.\n\nحتى الآن لا أفهم كيف يمكن لشيء أن يكون فجرًا وسقوطًا في الوقت نفسه.\n\nأعدته إلى حقيبتي.\n\nربما سأعرف عندما أقرأه.\n\nأو ربما...\n\nسأجد تناقضًا آخر لا معنى له.\n\nبدأت السير نحو المنزل.\n\nلم يكن الطريق طويلًا، فقد اعتدت المشي فيه كل يوم.\n\nالناس تمر بجانبي دون اهتمام.\n\nالسيارات تتحرك في الشوارع.\n\nوالمدينة تستمر كأن شيئًا لم يحدث.\n\nيمكن أن تحدث أشياء كثيرة لشخص واحد في يوم واحد، ومع ذلك يبقى العالم كما هو.\n\nوصلت أخيرًا إلى المنزل.\n\nفتحت الباب بهدوء.\n\n\"لقد عدت.\"\n\nلم أسمع ردًا في البداية.\n\nثم جاء صوت أمي من الداخل:\n\n\"تاي؟ هل عدت؟\"\n\nدخلت، وأغلقت الباب خلفي.\n\n---\nلقد وصلتني رسالة للتو. \n\nإنها من هاري. \n\nإن صلتي بهاري أنه ابن خالتي. \n\nوأيضًا صديقي في الصالة الرياضية. \n\nدائماً ما نذهب معًا. \n\n\" سآتي بعد قليل، تجهز. \"\n\nحقًا.. \n\nكيف أخذني الوقت ولم ٱدرك أن الليل قد حل بالفعل. \n\nلقد تعاهدنا ألا نتكاسل أبدًا عن الصالة الرياضية. \n\nالعقل السليم في الجسم السليم. \n\nدائماً ما كانوا يقولون ذلك. \n\nبعد سنوات في المدرسة.. \n\nلا أرى ذلك المثل صحيحًا. \n\nيمكن أن يكون جسدك جيدًا للغاية. \n\nيمكن أن تحمل فتاتين في آن واحد. \n\nولكن عقلك لا يعمل. \n\nعندما نصوغها بطريقة صحيحة.\n\nفإنك لا تستخدمه بطريقة صحيحة.\n\nسأضع الرواية في درج المكتب حاليًا. \n\nفتحت درج المكتب لأضع الرواية. \n\nما هذا؟ \n\nهاتف. \n\nلم يُفتح بعد. \n\nلماذا يوجد هاتف في مكتبي. \n\nها قد دخلت أمي علي. \n\n\" تااي، ما رأيك في هديتي؟\" \n\nهدية. \n\nيا إلهي. \n\nلم تصل الاختبارات النهائية بعد. \n\nوها قد كافئتني. \n\n\" شكرا لك ِ، يا أمي.\" \n\nقلتها بإبتسامة عريضة. \n\nوبنبرة متحمسة. \n\nثم ذهبت لتتحدث مع أحد صديقاتها على الهاتف. \n\nأنا حقًا تعجبني ابتسامة أمي تلك. \n\nتجعلها تبدو وكأنها في غاية سعادتها لإسعاد ابنها العزيز.\n\nأريد أن أخبرها حقًا أنها لا تحتاج كل هذا لإسعادي. \n\nحقًا. \n\nلماذا قد اشترت هذا الهاتف في هذا الوقت؟\n\nهل لأنها تدري أني بذلت كل ما لدي؟\n\nلأن هذا كل ما نستطيع فعله. \n\nأم النتيجة فلا نستطيع التدخل بها. \n\nأنا حقًا لم أفعل شيئًا لأجل هذا الهاتف. \n\nبالفعل، أمي تحبني بلا سبب. \n\nأم ذلك لأنني ابنها؟\n\nلكن هل ذلك سبب؟ \n\nوهذا ما أقول عنه الحب غير المشروط. \n\nأرجوا أن يحبني شريك حياتي، كحب أمي لي. \n\nأعلم ٱننا من عائلة متوسطة. \n\nوأعلم أن الهواتف سعرها مرتفع، ويستمر سعرها في الزيادة. \n\nأنا ممتن جدًا لتلك الهدية. \n\nلكنني لم أكن أريدها حقًا. \n\nوالأهم،\n\nأنني لم أكن أحتاجها. \n\nلقد رن الجرس. \n\nيبدو أن هاري قد وصل. \n\n\" سوف أذهب للصالة الرياضية يا أمي.\" \n\nأخذت حافظتي الحرارية ثم ذهبت لمقابلة هاري. \n\n\" هل شاهدت المباراة؟\" \n\nقالها هاري بنبرة متحمسة. \n\nولكني قضيت الكثير من الوقت في المطعم. \n\n\" لقد كنت في المطعم في الواقع ونسيت ذلك تمامًا.\" \n\nلقد قلت حماسته قليلًا. \n\nالأمر طبيعي، لقد ذهب لمشاهدة المباراة مباشرة من الأستاد. \n\nهنا في مدينة مانشستر، الأستاد قريب قليلًا من منزلنا. \n\nحبنا لفريق مانشستر يونايتد كان في عام ٢٠١٣.\n\nمنذ ذلك الحين ونحن نادرًا ما نفوت مباراة. \n\nمن المؤسف أن ذلك الفريق جذبنا ذلك العام، ومنذ ذلك الوقت تعثر تمامًا. \n\n\" هل... فزنا؟\" \n\nسألته بتردد. \n\nإنه يصبح أكثر استيائاً مني عندما يخسر الفريق. \n\n\" لا، لقد فزنا، أخبرتك أننا سنفوز إذا لعب المدرب بالخطة التي خمنتها.\" \n\nحمدًا لله. \n\nلم أرد أن أراه حزينًا. \n\nرغم الفوز، قد انهال بسب الحكم لأنه طرد لاعب مهم في آخر الدقائق. \n\n\" أخبرتك!! لم يكن يستحق تلك البطاقة! لم يتبقى على انتهاء المباراه سوى ثلاث دقائق. \"\n\nذلك الحكم البذيئ.!\n\nمن الجيد أننا فزنا في النهاية. \n\n\" سأحرق ساقي اليوم في التمرين من الفرحة.\" \n\n\" وأنا كذلك هاري، دعنا نرى من سيقوم برفع أوزان أثقل هذه المرة!.\" \n\nتبًا. \n\nلقد نسيت.. \n\nإنه يوم تمرين الساقين. \n\nاليوم الذي لا تستطيع أقدامنا حملنا فيه. \n\nلكنني متحمس. \n\nربما يجب ٱن أحافظ على حماسة هاري أيضًا. \n\n\" إذا ما رأيك أن نقوم بالإحماء قبل الوصول؟\"\n\nكان هذا اقتراحي لهاري. \n\n\" ماذا تعني؟ \"\n\nضحكت. \n\nماذا تعني بماذا تعني يا هاري؟\n\nحسنًا فالنقم بذلك. \n\n\" آخر من يصل إلى الصالة الرياضية، يدعو الآخر إلى الطعام.\" \n\nآمل أن يعزز ذلك من حماسة هاري. \n\nبدأ هاري بالركض على الفور. \n\nبينما كنت أسير بهدوء، ممسكًا بحافظتي الحرارية، أحتسي من قهوتي قبل التوجه إلى صالة الرياضة.\n\nتوقف هاري. \n\nبالطبع لن يسعد إذا ربح بتلك الطريقة. \n\nنزيه يا هاري. \n\nلكن تلك كانت خطتي الاستراتيجية العميقة لنيل الفوز. \n\nوما إن بدأ هاري بالرجوع. \n\nبدأت أنا بالركض بسرعة كبيرة. \n\n...\n\nفي الصالة الرياضية يجتمع مختلف البشر.\n\nكلام قليل.\n\nتفكير أكثر.\n\nبينما يتحدث الناس عن التمارين والمجموعات.\n\nيفكرون في أمور أخرى.\n\nمن تركته حبيبته.\n\nمن يريد أن يثبت لأخرى أنه كفؤ.\n\nهناك أيضاً من يدخل مسابقات، ومن يحاول أن يخسر وزنًا.\n\nكل منا لديه سبب للإجتماع بمثل هذا المكان.\n\nدخلت المكان الذي أُغير فيه ملابسي.\n\nلقد اصطدمت برجل ببنية جسدية رهيبة.\n\nعندما رأيته كان فتى معي بالمدرسة.\n\nلقد كان في السنة الثالثة.\n\nلقد نسيت أن أذكر هذا النوع من الذين يذهبون إلى الصالة الرياضية.\n\nلقد رأيته يحمل فتاتين في آن واحد.\n\nلذلك أقول أنه يبني جسده ليلهوا.\n\nفي الواقع أنا أحترم من يملك بنية رياضية كتلك.\n\nفأولائك يضحون بوقت فراغهم ،أطعمة وأشياء يحبونها.\n\nولكن الغاية؟\n\nحسنًا ، ربما أكون مخطئًا بشأنه.\n\nلكن حقيقة ٱنني رأيت ذلك.\n\nتجعلني لا أتوقف عن التفكير بأن هذا هو السبب.\n\nجلس هاري أمام جهاز تمديد الساقين، وثبّت قدميه أسفل الوسادة المعدنية، ثم بدأ يدفع الوزن بإيقاع ثابت. \n\nانتهى هاري. \n\nوقد حان دوري. \n\nولكن هناك طالب قد جاء ليدخل معنا في التمرين. \n\nأنه ذلك الطالب في السنة الثالثة. \n\nجعلته يبدأ قبلي. \n\nيبدو أنه كان يهتم بجزئه العلوي أكثر من السفلي. \n\nهل كان حقًا يتمرن لجذب الفتيات؟\n\nلم يكن يلعب بطريقة صحيحة، كان إيقاعه سيئ للغاية. \n\nانتهى من مجموعته وبدأت أنا. \n\nلاحظت أنه يعامل الجميع بلطف. \n\nويساعد الجميع في التمارين. \n\nهل بدأ بالتغيير؟\n\nمن الممكن أنه لم يكن شخص سيئ تمامًا في المقام الأول. \n\nأحسست أنني يجب أن أقلل حكمي السطحي على الناس. \n\nلو كان لي أن أترك له نصيحة واحدة، لقلت:\n\nتصرّف كما لو أنك الشخص الذي تريد أن تكونه.\n\n---\n\nبعد انتهاء التمرين، لم أشعر بمرور الوقت.\n\nكالعادة...\n\nالجسد يتعب، لكن العقل يهدأ قليلًا.\n\nأخذت وقتي في تغيير ملابسي، بينما كان هاري يتحدث عن المباراة مرة أخرى وكأنها لم تنتهِ منذ ساعات.\n\n\"ما زلت أقول إن الحكم كان مخطئًا.\"\n\nنظرت إليه.\n\nثم حاولت أن أنسيه ذلك. \n\n\"لقد فزنا.\"\n\nلكنه كان مصراً. \n\n\"هذا لا يغير حقيقة أنه كان مخطئًا.\"\n\nابتسمت.\n\nغريب...\n\nهناك أشخاص يستطيعون الغضب من شيء بسيط، ثم ينسونه بعد دقائق.\n\nربما هذا أفضل من التفكير في كل شيء.\n\nخرجنا من الصالة الرياضية، وتفرقنا عند الطريق.\n\n\"أراك غدًا يا تاي.\"\n\n\"أراك غدًا يا هاري.\"\n\nبدأت السير نحو المنزل.\n\nكانت الشوارع أكثر هدوءًا من قبل.\n\nوضعت يدي في جيبي، ولمست هاتفي.\n\nلقد كانت هناك رسالة من لينا. \n\n- هل بدأت بقرأة الرواية؟\n\n-- لا. \n\nبالطبع لم اقرأها. \n\nلم يتوفر الوقت لذلك.\n\n- حسنًا. \n\nحسنًا؟\n\nأي نوع من الردود هذا؟\n\nأهي مستائة؟\n\n- سأبدأ بقرأته عند الرجوع من الصالة الرياضية. \n\nلقد وضعت قلبًا على الرسالة. \n\nهذا جيد. \n\nعندما عدت للمنزل أخذت حمامًا دافئًا. \n\nثم ذهبت لإنجاز الواجب المنزلي. \n\nألقيت نفسي على الفراش وأمسكت هاتفي. \n\n- هل انتهيتِ من أداء الواجب المنزلي؟ \n\nهل ستجيب؟\n\nلقد تأخر الوقت. \n\nلا أظن ان... \n\nلقد أجابت. \n\n-ينقصني فقط السؤال الأخير. \n\nهل هو صعب عليها أم أنها لم تبدأ فيه بعد؟ \n\nلقد تأخر الوقت. \n\nسأساعدها. \n\nأنا أرسله لأولائك الأوغاد على أي حال. \n\nسأقوم بإرساله لكِ... \n\nهل أرسلها هكذا؟\n\nأبدو كمن يعطف عليها. \n\n- سأقوم بإرساله لكِ ، إذا كنتِ تريدين ذلك. \n\nنعم. \n\nذلك أفضل. \n\n- أُفضّل أن أقوم به بنفسي ، سأبحث عن الإجابة. \n\nألا تريدني أن أرسل لها؟\n\nيبدو أنها تريد أن تقوم بحله بيدها، لتثبت المعلومة. \n\nهذا جيد. \n\nأنا احترم ذلك. \n\nوضعت قلبًا على رسالتها. \n\nلقد مضت ساعة وأنا أحاول النوم الآن. \n\nيبدو أنني سأقرأ القليل من الرواية. \n\nما إن فتحت الرواية، تفاجئت. \n\nلقد كانت البداية أهدأ بكثير مما اعتقد. \n\nكنت اظن انه سيبدأ بالكلام عن الصفات النبيلة والحالة التي تعوم بها البلاد. \n\nولكنه بدأ بإفطار السيد الشاب. \n\nوأنه لم يخرج من منزله منذ عام. \n\nكايدن. \n\nيقرأ كتابًا. \n\nلقد ألهمني حقًا حديث آرون. \n\nيبدو أنه يتسائل كثيرًا في رأسه. \n\nولكن إذا طرحت مثل هذه الأسئلة يجب أن تجد جوابًا صحيحًا. \n\nمن الجيد أن يكون لديك شخص كويليام بين الحين والآخر. \n\nثم الحفلة. \n\nتبدو فيونا قريبة من كايدن بشدة. \n\nبرغم أنه لم يقابل أحد لمدة عام كامل. \n\nلقد كانت تدعمه طول مدة الحفل. \n\nلكني لم أرَ من كايدن ردًا يليق بدعم فيونا.\n\nلماذا هي شغوفة هكذا إذًا؟\n\nلا يمكن أن يكون حبًا غير مشروط أليس كذلك؟\n\nليس هناك سبب. \n\nلا. \n\nبل يمكن أن يكون. \n\nبدأت استوعب شيئًا ما. \n\nلا يمكن أن يكون هناك سبب للحب الغير المشروط. \n\nلأنه بزوال السبب. \n\nسينتهي الحب. \n\nويصبح حينها مشروطًا. \n\nأظن أنني سأنهي القرأة الآن. \n\nسأتوقف عند قول كايدن حلمه. \n\nبأن يقضي على الظلم. \n\nهل أكتب هدف لي أيضًا؟\n\nماذا أريد أن أفعل حقًا؟\n\nلنقل أنني أريد أن أنام أربع إلى خمس ساعات. \n\nسأتخذ هذا الهدف كبداية. \n\nأجد صعوبة في النوم. \n\nلا أعلم إذا كان ذلك بسبب التفكير أم شيئًا آخر. \n\nاقتربت الساعة من الرابعة فجرًا. \n\nوقد بدأت أشعر بالنعاس. \n\nقضيت ساعات أفكر في قصة شخص آخر، ولم أفكر كثيرًا في مشاكلي.\n\nأغلقت الرواية، وتركتها بجانبي.\n\nثم أغمضت عيني.\n\n.... \n\nعلى الساعة السابعة ونص تقريبًا.\n\nاستيقظت لأبدأ إفطاري.\n\nخرجت إلى غرفة المعيشة.\n\nفوجدت أبي.\n\nيستيقظ باكرًا.\n\nوينام باكرًا.\n\nدائمًا.\n\nلقد قال لي ذات مرة : أكبح جماح غرائزك. \n\nلا يريدني أن أضرب أبدًا. \n\nلا يريدني أن أدع غضبي يسيطر علي. \n\nهل إذا علم ما يحدث في المدرسة، سيظل هذا رأيه؟\n\nفإن كلام أبي معقد للغاية. \n\nلا أفهم منه نصائحه في بعض الأحيان. \n\nوالتي افهمها. \n\nلا أفهم المغزى منها. \n\nوهو دائمًا هكذا في الصباح. \n\nيشرب كوبًا من الشاي. \n\nمرتديًا قميصًا أبيضًا وربطة عنق. \n\nثم يذهب للعمل. \n\nوقفت أمام المرآة لأتأكد من أن كل الأمور على ما يرام. \n\nأملك شعرًا أسود فوضويًا ينسدل حول وجهي. \n\nوعينين رماديتين تختبئان خلف نظارتي.\n\nعيناي. \n\nتذكرت كلام لينا في المطعم. \n\nهل حقًا عيناي جميلتان؟\n\nربما يجب أن أهتم بمظهري قليلًا. \n\nأرتدي ملابس سوداء بسيطة وفضفاضة، تمنحني مظهرًا هادئًا وغير ملفت.\n\nقدمي.\n\nتؤلمني للغاية.\n\nإن التمارين الرياضية تبدو وكأنها تخدعك.\n\nتقول: نعم يا له من تمرين سهل.\n\nسأقوم بمجموعات أكثر. \n\nثم تستيقظ في اليوم التالي. \n\nلتواجه ألم استهزائك بها. \n\nاليوم الجمعة.\n\nربما سأذهب لأساعد العمة ماي غدًا في عطلة نهاية الأسبوع. \n\nسأذهب للمدرسة الآن. \n\nهناك شيئ يخبرني والدي به أيضًا. \n\nأجده غريبًا في الواقع. \n\nوهو أن لا أحادث عمي أبدًا. \n\nلا يدعنا نذهب إليه. \n\nولا نحادثه. \n\nلا أعلم السبب حقًا. \n\nولكني، لم أسأل يومًا. \n\nلقد سلمنا الواجبات المنزلية وقد ذهب الأستاذ للتصحيح. \n\nفي الواقع كن....\n\nلماذا قد أتت تلك الشقراء لتجلس على مكتبي الدراسي؟\n\nطريقة جلوسها تلك ، يبدو أنها لا تحاول حتى أن تتستر على نفسها. \n\n\" أخبرني يا تاي، كيف أبدو؟\n\nأهذه هي طريقتك في تعزيز ثقتك في نفسك؟\n\nتحاولين إغراء الجميع ، وإذا لم تنجح تلك الخطة تجعلين من أغريتهم يقومون بما تريدين. \n\nجميع من في الفصل ينظر إلينا. \n\nماذا عن لينا؟ \n\nنظرت إليها. \n\nلقد كانت تبعد عني ثلاث صفوف تقريبًا. \n\nإنها لا تنظر. \n\nإنها تكتب شيئ ما. \n\nماذا تدون بالضبط؟\n\nالجميع ينظر. \n\nأهي مستائة مني؟\n\nهل لأن هذه الحمقاء بالقرب مني؟\n\nأتظن أني قد تجمعني علاقة بذلك النوع من الناس؟\n\n\" أغربي عن وجهي.\" \n\nلقد قلتها. \n\nلقد اتسعت عيون الشقراء. \n\nأصدور مثل هذه الكلمات مني أمر مفاجئ إلى هذا الحد؟ \n\nلا يهمني ما سيحدث فقط أبتعدي الآن. \n\n\"أهذا كلامك يا تاي ؟\n\nمن أعماق قلبي أستطيع أن أخبرك أنني لا أبالي إطلاقًا.\n\nلقد جاء شخص ما إلى الفصل. \n\n\" تاي المدير يريدك.\" \n\nحمدًا لله. \n\nتبًا. \n\nلقد نسيت أني قد ضربت جاك أمس. \n\nدخلت غرفة المدير. \n\nوجدت أمرأة تصرخ بحق ابنها. \n\nتريد اعتذارًا. \n\n\" لماذا لم تجلب ولي أمرك معك يا تاي؟\" \n\nحقاً. \n\nأنت لم تقل لي بأن أجلبه من الأساس. \n\nكل هذا فقط من أجل المظهر العام. \n\n\" إنهم مشغولون أيها المدير... في مرة قادمة.\" \n\nأمل ألا يطول هذا الأمر. \n\n\" أعتذر! يا تاي.\" \n\n\" أنا آسف يا جاك لن يحدث ذلك مرة أخرى. \" \n\nلقد غضبت أمه الآن. \n\nتطالب بتعويض. \n\nحقًا الإبن كأمه. \n\nلقد تفاجئ المدير بذلك. \n\nحاول أن يهدئ الوضع. \n\nمرت الأمور على ما يرام. \n\nوبالطبع ذهبت إلى الزقاق. \n\nلأنال الضرب. \n\nعلى موقف جاك. \n\nوعلى موقف الشقراء. \n\nكالعادة لم أهتم. \n\nولكنني قصدت أن يتم ضربي في وجهي هذه المرة. \n\nأعني بوضوح. \n\nلقد ذهبوا جميعًا هربًا. \n\nلقد جاء طالب السنة الثالثة. \n\n\" لماذا تريد أن يتم ضربك دائمًا، وأنت قادر على الردع؟\" \n\nلماذا يسأل هذا السؤال؟\n\nلماذا يهتم فجأة؟\n\n\" هذا.. ليس من شأنك.\" \n\nهذا صحيح. \n\nالأمور بخير. \n\nكل شخص يبقى في مكانه. \n\nهكذا أفضل. \n\nلأن المشكلة تبدأ عندما يحاول أحدهم التحرك. \n\nذهبت إلى المطعم. \n\nلقد صرخت لينا عندما رأت وجهي. \n\nكان وجه العمة ماري مقلق أيضًا. \n\nأمرت العمة ماري لينا بمساعدتي كما المرة السابقة حتى تنتهي من الطلبات. \n\nقالتها بنبرة غاضبة. \n\nهذا سيئ. \n\nستوبخني بشدة بالتأكيد. \n\nآمل أن لا يصل الأمر إلى أمي. \n\nفي غرفة الأستراحة، بدأت لينا بالكلام على الفور. \n\n\" يا إلهي! لماذا تتشاجر دائمًا، كيف ينتهي عراك طلاب بإصابات كهذه؟!\"\n\nوفجأة.\n\nأصبحت لينا من الأشخاص الذين أهتم لأمرهم. \n\nدون أن أشعر. \n\n\" ألا يمكنك أن تريحنا من القلق ولو لمرة؟\" \n\n\"حاضر.\" \n\nأجبتها بطمأنينة. \n\nوبدأت أتأملها مرة أخرى. \n\n\" تاي، أرجوك... لا تتشاجر مرة أخرى، ولا تعد إلينا بهذه الإصابات أبدًا. \"\n\nآسف. \n\nسامحيني يا لينا. \n\nلا أستطيع أن أتخلى عن ذلك الجزء منكِ الذي يضعف أمامي...\n\nإن التعرض للأذى. \n\nهو أرخص طريقة لأبقيكِ بجانبي. \n\nفقط عندما أتعرض للأذى تعود عيناكِ أخيراً للنظر لي. \n\nما زلتُ بحاجة لذلك."
};
async function ensureMalaNovelSeed(){
  try{
    const ns=await getDocs(query(collection(db,'novels'),where('title','==',MALA_SEED.title)));
    let novelId=ns.docs[0]?.id;
    if(!novelId){ const ref=await addDoc(collection(db,'novels'),{...MALA_SEED,createdAt:serverTimestamp()}); novelId=ref.id; }
    const cs=await getDocs(query(collection(db,'chapters'),where('novelId','==',novelId)));
    if(!cs.docs.some(d=>Number(d.data().number)===1)) await addDoc(collection(db,'chapters'),{novelId,number:1,title:'الفصل الأول',content:MALA_SEED.chapterContent,createdAt:serverTimestamp()});
    const chars=await getDocs(query(collection(db,'characters'),where('novelId','==',novelId)));
    if(!chars.docs.some(d=>String(d.data().name||'')==='تاي')) await addDoc(collection(db,'characters'),{novelId,name:'تاي',description:'شاب هادئ، قوي أكثر مما يظن الآخرون، ويخوض معظم معاركه داخل رأسه. يختار الصمت رغم قدرته على الرد، ويبحث عن معنى الحب والاهتمام.',imageUrl:'images/tai.jpeg',createdAt:serverTimestamp()});
  }catch(e){console.error('MALA seed failed',e);}
}

onAuthStateChanged(auth, async user=>{
  if(user){
    $('loginBox').classList.add('hidden');
    $('panel').classList.remove('hidden');
    await loadAuthorBio();
    await ensureMalaNovelSeed();
    await refreshNovels();
  }else{
    $('loginBox').classList.remove('hidden');
    $('panel').classList.add('hidden');
  }
});
