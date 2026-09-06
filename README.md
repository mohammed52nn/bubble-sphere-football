# Player Bubbles

FOOTBALL BUBBLES



بناء تطبيق كرة قدم تفاعلي Premium من الصفر



أريد منك إنشاء تطبيق جديد بالكامل من الصفر.



لا تعتمد على مشروع سابق.

لا تحاول ترميم Prototype قديم.

لا تبنِ نسخة بسيطة ثم تتوقف.



أريد تطبيقًا متكاملًا وقابلًا للتطوير، Mobile First، عربيًا من البداية، ذو هوية بصرية مميزة جدًا، ويجمع بين:



- اكتشاف لاعبي كرة القدم

- واجهة فقاعات زجاجية عائمة

- معلومات اللاعب

- بحث ذكي حقيقي

- AI للبحث والتحقق والتحليل والتنظيم

- أخبار حديثة من الإنترنت

- مصادر واضحة

- صور حقيقية للاعبين مع نظام fallback قوي

- تجربة انتقال سينمائية

- أداء ممتاز على الهاتف

- بنية تقنية منظمة وقابلة للتوسع



اسم التطبيق المبدئي:



FOOTBALL BUBBLES



الوصف المختصر:



"تجربة ذكية لاكتشاف عالم كرة القدم من خلال اللاعبين أنفسهم."



---



01 — القاعدة الذهبية



لا تبنِ تطبيق أخبار رياضية تقليدي.



لا تبنِ Dashboard.



لا تبنِ جدول لاعبين.



لا تبنِ Chatbot عام.



لا تجعل الـAI مجرد نافذة محادثة.



الفكرة هي:



PLAYER

→ DISCOVERY

→ PROFILE

→ STORY

→ NEWS

→ SOURCE



المستخدم لا يشعر أنه يدخل إلى قاعدة بيانات.



بل يشعر أنه يدخل إلى عالم حي من لاعبي كرة القدم، ويستكشفهم واحدًا تلو الآخر.



---



02 — المنصة والهدف



التطبيق Mobile First.



الأولوية:



1. Android

2. iPhone

3. Portrait mode



يجب أن يكون ممتازًا على الهواتف المتوسطة أيضًا.



استخدم بنية حديثة قابلة للتوسع.



افصل بوضوح بين:



- UI

- state

- player data

- image resolution

- search

- AI

- news

- caching

- animations

- API layer

- error handling



لا تضع كل المنطق داخل Component واحد.



لا تستخدم أسرار API داخل frontend.



أي مفاتيح سرية أو credentials يجب أن تبقى في بيئة آمنة server-side.



---



03 — اللغة



العربية هي اللغة الأساسية للتطبيق.



يجب أن يكون:



RTL حقيقيًا.



ليس مجرد ترجمة.



كل شيء عربي:



- أزرار

- عناوين

- رسائل

- بحث

- ملفات اللاعبين

- الأخبار

- حالات التحميل

- الأخطاء

- التنقل

- النصوص المساعدة



أمثلة:



بحث



ابحث عن لاعب أو اسأل عن لاعب...



آخر الأخبار



معلومات أساسية



المسيرة



أهم الإنجازات



النادي الحالي



الجنسية



المركز



تاريخ الميلاد



العمر



القدم المفضلة



التقييم



القيمة السوقية



آخر تحديث



تحديث المعلومات



عرض التفاصيل



الذهاب إلى المصدر



جارٍ البحث...



جارٍ جمع المعلومات...



جارٍ التحقق من المصادر...



جارٍ ترتيب النتائج...



لا توجد أخبار موثوقة حديثة متاحة.



تعذر إتمام البحث.



إعادة المحاولة



مع الحفاظ على دعم أسماء اللاعبين والأندية باللغة الإنجليزية عند الحاجة.



مثال:



محمد صلاح

Mohamed Salah



ولا تجعل RTL يقلب صورة اللاعب أو المحتوى البصري.



---



04 — الهوية البصرية



أريد لغة بصرية Premium جدًا.



الهوية:



- أزرق

- فضي

- سماوي

- زجاج شفاف

- ضباب

- إضاءة باردة

- توهج ناعم

- عمق

- هدوء

- ثقة

- تقنية

- كرة قدم



استخدم Glassmorphism لكن ليس بالشكل التقليدي المبتذل.



يجب أن تبدو الفقاعات وكأنها أجسام زجاجية/ضوئية تطفو في بيئة حقيقية.



لا تجعل التصميم طفوليًا.



لا تستخدم ألوانًا كثيرة.



لا تملأ الشاشة بعناصر.



المبدأ:



Elegant > Excessive



---



05 — خلفية ملعب كرة القدم



الشاشة الرئيسية يجب أن تحتوي على خلفية ملعب كرة قدم واضحة.



المشكلة التي أريد تجنبها:



أن تصبح الخلفية مظلمة أو مخفية لدرجة لا يُفهم منها وجود ملعب.



يجب أن يكون الملعب واضحًا عند النظرة الأولى.



لكن لا ينافس الفقاعات.



التوازن المطلوب:



FOOTBALL STADIUM

+

MODERATE BLUR

+

ATMOSPHERIC HAZE

+

BLUE/SILVER GRADING

+

FOREGROUND GLASS BUBBLES



استخدم:



- Blur معتدل

- Depth of field

- إضاءة الملعب

- ضباب خفيف

- طبقة لونية زرقاء

- vignette خفيف



لا تستخدم Blur مفرط.



يمكن إضافة حركة بطيئة جدًا للخلفية:



- camera drift

- light drift

- subtle parallax



لكن لا تجعل الحركة واضحة أو سريعة.



---



06 — الصفحة الرئيسية



عند فتح التطبيق:



تظهر الخلفية أولًا بتدرج هادئ.



ثم تظهر الفقاعات واحدة تلو الأخرى.



لا تظهر كل العناصر فجأة.



التكوين الرئيسي:



- Logo صغير/هوية

- عنوان بسيط

- Research Box

- 5–8 Player Bubbles

- تلميح صغير للمستخدم



الواجهة يجب أن تكون نظيفة جدًا.



---



07 — الفقاعات



الفقاعات هي أهم عنصر في المنتج.



كل فقاعة تمثل لاعبًا.



كل فقاعة تحتوي على:



- صورة اللاعب

- اسم اللاعب

- النادي بصورة صغيرة جدًا عند الحاجة

- NEW عندما توجد مستجدات

- glass texture

- border فضي/أزرق

- reflection

- glow

- depth



---



08 — حجم الفقاعات



لا تجعل الفقاعات ضخمة.



يجب أن يكون هناك مساحة كافية لرؤية الخلفية.



ويجب أن يستطيع المستخدم رؤية 5–8 لاعبين بدون ازدحام.



الحجم يتكيف Responsive مع الشاشة.



الصورة داخل الفقاعة يجب أن تبقى واضحة.



لا تجعل اسم اللاعب يغطي الصورة.



---



09 — حركة الفقاعات



الحركة:



بطيئة جدًا.



مريحة.



ناعمة.



عضوية.



كل فقاعة لها اختلاف بسيط في:



- speed

- drift

- direction

- scale

- phase

- depth



لا تستخدم random teleportation.



لا تغيّر الإحداثيات بشكل مفاجئ.



استخدم interpolation / easing / deterministic floating motion.



الفقاعة يجب أن تشبه شيئًا يطفو.



وليست لعبة arcade.



---



10 — عدد الفقاعات



المعدل الطبيعي:



5–8 فقاعات.



لا يوجد أكثر من 8.



لا يوجد أقل من 5 في الوضع الطبيعي.



لكن لا تغيّر المجموعة باستمرار.



---



11 — مدة بقاء الفقاعة



هذه قاعدة أساسية:



لا تستبدل الفقاعات كل 4 ثوانٍ.



كل فقاعة يجب أن تبقى تقريبًا:



35–50 ثانية.



هذا ضروري حتى:



- يلاحظ المستخدم اللاعب

- يقرأ الاسم

- يرى الصورة

- يلاحظ NEW

- يقرر الضغط



عند انتهاء عمر فقاعة:



1. تخرج فقاعة واحدة فقط.

2. تختفي بطريقة ناعمة.

3. انتظر تقريبًا 1–3 ثوانٍ.

4. أدخل فقاعة جديدة واحدة فقط.

5. لا تغيّر بقية الفقاعات.

6. لا تعِد إنشاء المجموعة كلها.



لا تستخدم timer مستقل لكل فقاعة إذا كان يمكن إدارة الدورة من Controller مركزي.



---



12 — تجميد النظام عند فتح اللاعب



هذه نقطة أساسية جدًا.



عندما يضغط المستخدم على فقاعة:



أوقف:



- bubble expiration

- bubble replacement

- إعادة توزيع اللاعبين

- تغيير المجموعة



لا يجب أن تختفي أو تتغير فقاعة أثناء قراءة المستخدم للاعب.



عند العودة:



استأنف timers من حيث توقفت.



لا تبدأ اللعبة من الصفر.



لا تعِد إنشاء المجموعة.



---



13 — Bubble Entrance



عند ظهور فقاعة جديدة:



لا تظهر فجأة.



استخدم:



- blur

- opacity

- scale

- slight movement

- soft glow



التسلسل:



small

→ blurred

→ entering

→ sharp

→ settled



الرسوم يجب أن تكون بطيئة وجميلة.



---



14 — Bubble Exit



عند خروج الفقاعة:



- slight fade

- slight blur

- tiny shrink

- movement toward edge



لا تجعلها تختفي فجأة.



---



15 — NEW Badge



إذا كان لدى اللاعب خبر حديث أو حدث مهم:



أظهر:



"جديد"



بدل NEW إذا كانت الواجهة عربية، مع إمكانية استخدام NEW صغيرة إن كان ذلك أجمل بصريًا.



العلامة:



- صغيرة

- لا تصرخ بصريًا

- glow خفيف

- pulse بطيء



ولا تستخدم NEW إذا لم توجد مستجدات حقيقية.



في النسخة الأولى يمكن أن تستخدم بيانات تجريبية داخليًا فقط أثناء بناء النظام، لكن البنية النهائية يجب أن تعتمد على البيانات الحقيقية.



---



16 — Research Box



أضف Research Box واضحًا وPremium.



المستخدم يستطيع كتابة:



اسم لاعب



أو:



لاعب + نادي



أو:



لاعب + دوري



أو:



لاعب + جنسية



أو:



سؤال طبيعي



أمثلة:



محمد صلاح



Mo Salah



صلاح ليفربول



آخر أخبار محمد صلاح



أفضل الأجنحة الشباب



لاعب برازيلي صاعد



أفضل لاعبي الدوري الإيطالي



---



17 — Research حقيقي



Research ليس Mock Search.



لا تعُد بنتائج ثابتة محفوظة إلا في fallback عند انقطاع الخدمات.



البحث يجب أن يكون قادرًا على:



- تحديد اللاعب

- البحث عن معلوماته

- البحث عن الأخبار الحالية

- العثور على المصادر

- فهم السؤال الطبيعي

- ترتيب النتائج

- استخراج لاعبين مرتبطين



إذا كان المستخدم يبحث عن لاعب:

اعرض اللاعب بوضوح.



إذا كان يبحث عن موضوع:

أنشئ مجموعة اكتشاف من اللاعبين المرتبطين بالموضوع.



---



18 — AI



استخدم AI كطبقة Research Intelligence.



لا أريد AI Chatbot تقليدي.



لا تجعل هناك صندوق:

"اسألني أي شيء"



الـAI يعمل خلف الواجهة.



وظيفته:



- فهم الاستعلام

- تحديد المقصود

- جمع المعلومات

- البحث عن المصادر

- تحليل النتائج

- إزالة التكرارات

- التحقق

- تنظيم البيانات

- تلخيص الأخبار

- استخراج التفاصيل

- اختيار لاعبين للاكتشاف

- تقييم relevance



---



19 — AI Accuracy



AI يجب أن يركز على:



Accuracy

Structure

Completeness

Freshness

Source Verification



عند بناء ملف لاعب:



حاول جمع:



- الاسم الكامل

- الاسم المعروف

- تاريخ الميلاد

- العمر

- الجنسية

- النادي الحالي

- المركز

- القدم المفضلة

- الرقم

- الطول

- القيمة السوقية إذا توفرت

- التقييم إذا كان مصدره موثوقًا

- المسيرة الاحترافية

- الانتقالات

- الإنجازات

- الإحصاءات

- الوضع الحالي

- الأخبار الحديثة



لا تملأ الحقول بالتخمين.



إذا لم توجد معلومة موثوقة:



"غير متوفر من مصدر موثوق."



---



20 — Static vs Current Data



افصل بين:



STATIC DATA



مثل:



- تاريخ الميلاد

- الجنسية

- المسيرة

- بعض الإنجازات



CURRENT DATA



مثل:



- النادي الحالي

- الإصابة

- الانتقال

- الأخبار

- الأداء

- التصريحات

- المشاركة الأخيرة



المعلومات الحالية تحتاج بحثًا حديثًا.



---



21 — News Engine



عند فتح لاعب:



اجلب أحدث الأخبار ذات الصلة.



رتبها حسب:



1. الحداثة

2. الأهمية

3. الموثوقية

4. صلة الخبر باللاعب



كل خبر:



- العنوان

- المصدر

- تاريخ النشر

- ملخص

- رابط المصدر



---



22 — News Sources



كل خبر يجب أن يوضح:



اسم المصدر



تاريخ النشر



الرابط الأصلي



زر:



فتح المصدر ↗



لا تعرض أخبارًا بلا مصدر.



لا تخترع مصدرًا.



لا تخترع رابطًا.



---



23 — AI Summaries



يمكن للـAI تلخيص المقال.



لكن يجب أن يحافظ على معنى المقال.



إذا كان الخبر:



"بحسب تقارير..."



يجب أن يبقى الملخص:



"بحسب تقارير..."



وليس:



"النادي أعلن..."



لا تحول الشائعة إلى حقيقة.



---



24 — No Hallucinations



AI يجب ألا يخترع:



- أخبار

- مصادر

- تواريخ

- إصابات

- انتقالات

- إحصائيات

- تصريحات

- إنجازات



إذا لم يمكن التحقق من المعلومة:

لا تعرضها كحقيقة.



---



25 — Player Image System



أولوية الصور مرتفعة جدًا.



إذا كان اللاعب مشهورًا:

ابحث بقوة عن صورة حقيقية موثوقة.



التسلسل:



1. صورة لاعب حقيقية موثوقة

2. مصدر صور رياضي موثوق

3. صورة النادي إذا كانت مناسبة

4. صورة المنتخب/الجنسية

5. توليد صورة بالـAI إذا تعذر كل ما سبق وكان ذلك متاحًا ومناسبًا

6. fallback icon احترافي



لا تظهر broken image.



لا تترك الفقاعة فارغة.



إذا لم توجد صورة أصلية:

أنشئ fallback جميلًا جدًا.



بالنسبة لأسماء مثل:



Cristiano Ronaldo

Mohamed Salah

Kylian Mbappé



يجب أن تكون صورة حقيقية متاحة غالبًا.



لا تقبل fallback نصيًا فورًا لهؤلاء.



---



26 — AI Generated Images



إذا تم استخدام توليد صور للاعب غير متوفر:



لا تقدمه للمستخدم كأنه صورة فوتوغرافية أصلية إذا كان مولدًا.



اجعل النظام قادرًا على تمييز الصورة المولدة داخليًا.



لكن:

لا تستخدم التوليد إذا كانت صورة حقيقية موثوقة متاحة.



---



27 — Player Bubble Information



داخل الفقاعة:



صورة + اسم + NEW.



لا تكثر المعلومات.



النادي يمكن أن يظهر صغيرًا.



---



28 — توزيع اللاعبين



عند تكوين مجموعة 5–8 لاعبين:



استهدف:



2 عالميين جدًا



2 متوسطي الشهرة



1–2 أقل شهرة



1–2 غير معروفين نسبيًا



لكن هذه النسب مرنة.



الأولوية دائمًا لـ relevance.



مثال:



إذا كان البحث:

"أفضل لاعبي المغرب"



اختر لاعبين مرتبطين بالمغرب.



إذا كان:

"أفضل لاعبي العالم"



اختر لاعبين عالميين.



---



29 — Discovery Diversity



لا تجعل نفس اللاعبين يتكررون باستمرار.



ضع في الحسبان:



- اللاعبين الذين ظهروا مؤخرًا

- النادي

- الدوري

- الجنسية

- المركز

- الشعبية

- الأخبار الحالية



أريد للمستخدم أن يجد أسماء جديدة.



---



30 — Player Profile Transition



عند الضغط:



لا تستخدم Navigation فجائي.



أريد:



Bubble

→ touch response

→ expand

→ blur surrounding world

→ portrait becomes dominant

→ profile appears



اجعل الانتقال:



Slow

Smooth

Confident

Cinematic



لا rapid.



---



31 — Touch Response



عند لمس الفقاعة:



- scale بسيط

- glow أقوى قليلًا

- compression خفيف

- reflection sweep

- ثم expansion



يجب أن يشعر المستخدم أنه لمس جسمًا حقيقيًا.



---



32 — Player Profile Hero



الصورة يجب أن تكون العنصر البصري الأكبر.



اجعلها تشغل تقريبًا:



70–85% من Visual Hierarchy



وليس بالضرورة 85% من الشاشة حرفيًا.



استخدم:



- portrait

- glow

- depth

- glass

- light

- background blur



---



33 — Player Information



أظهر:



الاسم الكامل



الاسم المعروف



الجنسية



تاريخ الميلاد



العمر



النادي الحالي



المركز



القدم المفضلة



الرقم



الطول



القيمة السوقية إن وجدت



التقييم إن وجد



الإحصاءات المهمة



المسيرة



الإنجازات



---



34 — المعلومات منظمة



لا تجعلها كتلة نصية.



استخدم بطاقات Glass صغيرة.



مثال:



معلومات أساسية



ثم:



المسيرة



ثم:



الإنجازات



ثم:



آخر الأخبار



---



35 — Achievements



اعرض أهم الإنجازات في بطاقات قصيرة.



لا تكرر نفس المعلومات.



مثال:



🏆 دوري أبطال أوروبا



🏆 دوري محلي



🏆 بطولة دولية



استخدم بيانات حقيقية إذا كانت متاحة.



---



36 — Latest News Section



في ملف اللاعب:



"آخر الأخبار"



كل خبر:



عنوان



مصدر



تاريخ



ملخص



زر:



عرض التفاصيل



زر:



الذهاب إلى المصدر ↗



---



37 — Last Update



أضف:



آخر تحديث



مع الوقت/التاريخ.



مثال:



آخر تحديث منذ 4 دقائق



أو:



22 أغسطس 2026، 18:05



---



38 — Manual Refresh



أضف:



"تحديث المعلومات"



لا تجعل الأخبار تتغير باستمرار أمام المستخدم.



التحديث يكون:



- عند الحاجة

- عند انتهاء cache

- عند الضغط يدويًا



---



39 — Caching



استخدم caching ذكي.



لا تبحث عن اللاعب نفسه كل مرة.



لكن لا تستخدم cache طويلًا للمعلومات التي تتغير بسرعة.



خصص TTL مناسبًا للأخبار.



السماح بالتحديث اليدوي يجب أن يبقى موجودًا.



---



40 — Loading Experience



أثناء البحث:



استخدم UI متناغم مع عالم الفقاعات.



بدل Spinner عادي:



Bubble + Sonar-like pulse



أمثلة:



جارٍ البحث...



جارٍ جمع المعلومات...



جارٍ التحقق من المصادر...



جارٍ ترتيب النتائج...



لكن لا تفرض تأخيرًا مصطنعًا إذا كانت النتيجة جاهزة بسرعة.



---



41 — Error Handling



إذا فشل الإنترنت:



اعرض رسالة عربية واضحة.



إذا فشل AI:



"تعذر إتمام البحث حاليًا."



زر:

"إعادة المحاولة"



إذا لم توجد أخبار:



"لا توجد أخبار موثوقة حديثة متاحة حاليًا."



إذا فشلت الصورة:

fallback.



إذا فشل مصدر خبر:

لا تكسر بقية الصفحة.



---



42 — Offline



إذا انقطع الإنترنت:



- لا تنهار الواجهة

- حافظ على الفقاعات الحالية

- اعرض البيانات المخزنة إن كانت صالحة

- أخبر المستخدم أن البيانات قد لا تكون محدثة



---



43 — Search Errors



إذا كتب المستخدم اسمًا غامضًا:



لا تفترض مباشرة.



حاول:



- اكتشاف اللاعب المقصود

- إظهار أكثر من احتمال عند الحاجة



مثلاً إذا كان الاسم مشتركًا بين لاعبين:

اعرض خيارات واضحة.



---



44 — Navigation



العودة من ملف اللاعب يجب أن تعيد:



نفس المشهد



نفس الفقاعات



نفس أماكنها تقريبًا



نفس حالة timers



لا تعيد تكوين Home.



---



45 — Bubble Timer Architecture



ممنوع:



timer مستقل لكل bubble.



يفضل:



Central Bubble Lifecycle Manager



مسؤول عن:



- expiration

- replacement

- pause

- resume



هذا لتجنب:



- memory leaks

- duplicate timers

- race conditions



---



46 — Animation Architecture



لا تنشئ animation loop جديدًا كل مرة تفتح فيها صفحة.



أي loop يجب أن يكون:



- مركزيًا

- قابلًا للتوقف

- قابلًا للتنظيف



عند unmount:

cleanup.



---



47 — API Request Protection



منع:



- duplicate requests

- double submissions

- repeated searches

- parallel identical player research

- multiple refreshes



---



48 — Performance



أريد أداءً ممتازًا على الهاتف.



راقب:



- image sizes

- DOM size

- animation count

- blur effects

- particles

- network calls



لا تضف عشرات particles.



لا تجعل كل الفقاعات تستخدم effects ثقيلة جدًا.



استخدم CSS transforms عندما يكون مناسبًا.



لا تستخدم expensive canvas rendering بلا حاجة.



---



49 — Reduced Motion



إذا كان الجهاز يستخدم:



prefers-reduced-motion



خفف:



- floating

- parallax

- transition

- pulse



لكن حافظ على الوظائف.



---



50 — Micro-Interactions



أضف فقط ما يخدم التجربة:



- NEW pulse

- glass reflection

- touch compression

- light sweep

- subtle profile fade-up

- soft news entrances

- hover/focus على الأجهزة التي تدعمها

- subtle active states

- loading orb



لا تحول التطبيق إلى شاشة ألعاب.



---



51 — Visual Hierarchy



الأولوية البصرية:



1. Player

2. Player image

3. Player name

4. NEW/news activity

5. Main information

6. Latest news

7. Source



لا تجعل عناصر UI الصغيرة تنافس صورة اللاعب.



---



52 — UX Philosophy



التطبيق يجب أن يقول للمستخدم ضمنيًا:



"تعال واكتشف."



وليس:



"اقرأ هذه القائمة."



---



53 — Premium Detail



أضف تفاصيل دقيقة تعطي إحساسًا احترافيًا:



- glass reflections

- realistic depth

- subtle shadows

- restrained bloom

- soft gradients

- precise spacing

- consistent typography

- polished icons

- controlled motion

- smooth easing



لا تجعل أي عنصر عشوائيًا.



---



54 — Empty States



إذا لا توجد معلومات:



لا تعرض شاشة فارغة.



اعرض رسالة هادئة ومتناسقة مع الهوية.



مثال:



"لم نعثر على معلومات موثوقة كافية حاليًا."



---



55 — Data Quality



أنشئ data model واضح للاعب:



id

fullName

displayName

nationality

birthDate

age

club

position

preferredFoot

shirtNumber

height

marketValue

rating

career

achievements

image

imageSources

news

lastUpdated

sources

confidence



والأخبار:



id

title

source

sourceUrl

publishedAt

summary

relevance

reliability



لا تجعل البيانات عبارة عن strings عشوائية.



---



56 — Source Tracking



حيث يكون ذلك منطقيًا، احتفظ بمصدر المعلومة.



خصوصًا:



- الأخبار

- الإحصاءات

- القيمة السوقية

- التقييم

- المعلومات الحالية



حتى يمكن لاحقًا عرض:

"المصدر"



---



57 — AI Output Structure



اجعل AI يعيد structured output وليس نصًا حرًا فقط.



مثلاً:



Player object

+

News array

+

Sources

+

Confidence

+

Related players



حتى تكون الواجهة مستقرة.



---



58 — Security



لا تضع:



OpenAI API key



Google API key



Search API key



أو أي secret



داخل frontend.



استخدم:



- backend

- serverless functions

- secure secrets

- Lovable Cloud/server functions حسب البيئة المناسبة



---



59 — No Fake Live Data



في النسخة النهائية:



لا تستخدم:



- fake news

- fake dates

- fake source names



يمكن استخدام seed data فقط أثناء تطوير الواجهة، ويجب تمييزه داخليًا.



عند اتصال البيانات الحقيقية:

استبدلها بالبيانات الفعلية.



---



60 — Search Result Bubble Generation



بعد Research:



أنشئ 5–8 فقاعات جديدة.



إذا كانت النتائج كثيرة:

اختر الأكثر صلة.



حافظ على التنوع.



أعطِ أولوية:



- اللاعب المطلوب

- لاعبين مرتبطين

- لاعبين مشابهين

- لاعبين من نفس النادي/الدوري

- لاعبين أقل شهرة لكن ذوي صلة

- لاعبين لديهم قصص أو أخبار حديثة



---



61 — AI Discovery Logic



الـAI يمكن أن يستخدم:



- popularity

- novelty

- recency

- relevance

- diversity

- source quality



ولا يعتمد على popularity فقط.



---



62 — Background / Foreground Balance



مرة أخرى:



الملعب يجب أن يبقى واضحًا.



الفقاعات يجب أن تكون واضحة.



لكن لا يجب أن يطغى أحدهما على الآخر.



المستخدم يجب أن يشعر:



"أنا داخل بيئة كرة قدم"



وفي المقدمة:



"هذه هي الأسماء التي يمكنني اكتشافها."



---



63 — التطبيق ليس News Feed



لا تجعل الأخبار تظهر على Home.



Home = Discovery.



Player Profile = Information + News.



هذا الفصل مهم.



---



64 — الصفحة الرئيسية لا تتغير بعنف



لا تجعل كل بضع ثوانٍ شخصًا جديدًا يظهر.



التغيير بطيء.



المشهد يتنفس.



وهذا جزء من هوية التطبيق.



---



65 — User Trust



الثقة أساسية.



إذا كان هناك شك:

اعرضه.



إذا لم توجد معلومات:

قل ذلك.



إذا كانت البيانات قديمة:

أظهر وقت آخر تحديث.



إذا كان الخبر تقريرًا:

استخدم صيغة "بحسب تقارير".



---



66 — Final Product Feeling



بعد الانتهاء أريد التطبيق أن يعطي الإحساس التالي:



ملعب كرة قدم هادئ وضبابي في الخلفية.



فقاعات زجاجية فضية/زرقاء صغيرة تطفو ببطء.



داخلها لاعبين مختلفين.



2 معروفين جدًا.



2 متوسطين.



1–2 أقل شهرة.



1–2 قد لا يعرفهم المستخدم.



ثم:



المستخدم يرى لاعبًا.



يضغط.



العالم يهدأ.



الفقاعة تكبر.



الصورة تظهر.



التفاصيل تظهر.



ثم الأخبار.



ثم المصدر.



ثم يعود إلى عالم الفقاعات.



كل شيء هادئ.



دقيق.



ذكي.



فخم.



---



67 — اختبار الجودة النهائي



بعد البناء، اختبر فعليًا:



اللغة



- العربية كاملة

- RTL كامل

- mixed Arabic/English يعمل

- النصوص لا تتداخل



الفقاعات



- 5–8

- صغيرة

- بطيئة

- واضحة

- 35–50 ثانية

- خروج واحد في كل مرة

- دخول واحد في كل مرة

- لا تغير كامل المجموعة



التجميد



فتح اللاعب:



- إيقاف lifetime

- إيقاف replacement

- حفظ الحالة



العودة:



- resume

- لا إعادة إنشاء



الصور



- صور حقيقية

- fallback

- لا broken images

- loading state



البحث



- Arabic query

- English query

- player query

- natural language query

- no duplicate request



AI



- structured data

- source awareness

- no hallucinations

- current data

- news research

- related players



الأخبار



- عنوان

- مصدر

- تاريخ

- summary

- source link



الأداء



- لا memory leaks

- لا duplicate loops

- لا duplicate timers

- لا duplicate API calls

- smooth mobile animation



الهاتف



- Android

- iPhone

- small screens

- tall screens

- safe area

- touch



---



68 — أهم تعليمات التنفيذ



لا تتعامل مع هذا كصفحة Landing Page.



ابنِ منتجًا حقيقيًا قابلًا للتطوير.



لا تختصر الميزات لأن المشروع كبير.



لكن أيضًا:



لا تجعل الكود فوضويًا.



نظّم المشروع.



قسّم components.



افصل logic.



استخدم typed/structured data حيث يكون مناسبًا.



أضف error boundaries وحالات فشل مناسبة.



نفّذ feature flags أو graceful fallbacks إذا كانت بعض الخدمات الخارجية غير متاحة.



---



69 — لا تضحِّ بالأداء من أجل الجمال



عند التعارض:



Performance + Usability

تأتي قبل

Visual Effects



إذا كان blur أو animation معين يضر بأجهزة الهاتف:

خففه.



لا تلغِ الهوية البصرية، بل نفذ نسخة أخف.



---



70 — لا تضحِّ بالدقة من أجل السرعة



عند التعارض:



Accuracy + Sources

قبل

إظهار معلومة سريعة غير مؤكدة.



لا تعرض معلومات غير موثوقة لمجرد ملء الشاشة.



---



71 — لا تضف Chatbot عام



لا أريد Chat Assistant عام في الواجهة.



Research هو الواجهة الذكية.



الذكاء يجب أن يعمل في الخلفية.



---



72 — لا تعيد اختراع التصميم أثناء التنفيذ



التزم بالهوية:



Football

+

Glass

+

Blue/Silver

+

Atmosphere

+

Discovery

+

AI Research



يمكنك الإبداع في التفاصيل، لكن لا تغيّر جوهر التجربة.



---



73 — النتيجة النهائية المطلوبة



أنشئ التطبيق كاملًا من الصفر الآن.



لا تكتفِ بوصف الخطة.



لا تعطيني mockup فقط.



لا تبنِ واجهة فارغة.



أريد:



- Home كاملة

- Bubble system

- Player profile

- Research UI

- AI/search architecture

- news architecture

- image resolution

- source handling

- Arabic RTL

- loading

- errors

- caching

- lifecycle

- animations

- responsive design

- mobile optimization

- secure API architecture

- polished micro-interactions



وإذا كانت بعض خدمات البحث/AI الخارجية تحتاج مفاتيح أو اتصالًا خارجيًا لا يمكن توفيره تلقائيًا:



ابنِ البنية كاملة لاستقبالها من environment secrets أو secure backend.



ولا تضع أي secret داخل frontend.



---



74 — قاعدة النهاية



بعد بناء المشروع:



راجع المشروع كاملًا بنفسك.



ابحث عن الأخطاء الشائعة:



- duplicate timers

- duplicate listeners

- stale state

- race conditions

- memory leaks

- unhandled async errors

- broken images

- API failures

- incorrect RTL

- overflow

- bad mobile spacing

- excessive animations

- oversized bubbles

- fast motion

- hidden background

- changing bubbles too often

- profile not freezing home

- source links not working

- fabricated data

- repeated API requests



اصلحها قبل اعتبار المشروع مكتملًا.



ثم قم بعمل final polish pass على:



- typography

- spacing

- motion

- depth

- color

- glass effects

- hierarchy

- mobile usability



لا أريد نسخة أولية تبدو كـtemplate.



أريد تجربة تشعر بأنها منتج مستقل له هوية.



FINAL CREATIVE DIRECTION



اجعل FOOTBALL BUBBLES يبدو وكأنه:



بوابة هادئة إلى عالم كرة القدم.



ليس تطبيقًا يصرخ بالأخبار.



بل تطبيق يجعل المستخدم يقترب من اللاعب أولًا،



ثم يعرف قصته،



ثم يكتشف ما يحدث حوله،



ثم يذهب إلى المصدر بنفسه.



Build it now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bubble-sphere-football.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7daa2f2f-24b5-4d12-80ea-d1f6382370a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
