// DTM Test Platform - Main JavaScript

const API_URL = import.meta.env.VITE_API_URL || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const LANG_KEY = 'dtm_lang';
const DEFAULT_LANG = 'uz';
const SUPPORTED_LANGS = ['uz', 'en', 'ru', 'tg', 'kaa'];

const TRANSLATIONS = {
    uz: {
        'lang.uz': "O'zbek",
        'lang.en': 'English',
        'lang.ru': 'Русский',
        'lang.tg': 'Тоҷикӣ',
        'lang.kaa': 'Qaraqalpaq',
        'google.login': 'Google bilan kirish',
        'alert.google_client_missing': 'Google login uchun VITE_GOOGLE_CLIENT_ID sozlanmagan',
        'alert.google_token_missing': 'Google token olinmadi',
        'alert.google_login_error': "Google orqali kirishda xatolik",
        'alert.login_success': 'Muvaffaqiyatli kirish!',
        'alert.generic_error': 'Xatolik yuz berdi',
        'alert.server_error': "Serverga ulanishda xatolik. API ishlamayapti bo'lishi mumkin.",
        'alert.password_mismatch': 'Parollar mos kelmadi!',
        'alert.password_short': "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
        'alert.signup_success': "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
        'nav.my_page': 'Mening Sahifam',
        'nav.home': 'Bosh sahifa',
        'nav.services': 'Xizmatlar',
        'nav.login': 'Kirish',
        'nav.signup': "Ro'yxatdan o'tish",
        'nav.logout': 'Chiqish',
        'nav.profile': 'Profil',
        'common.back': '← Orqaga',
        'common.close': 'Yopish',
        'auth.email_label': 'Email manzili',
        'auth.email_placeholder': 'email@example.com',
        'auth.password_label': 'Parol',
        'auth.or': 'yoki',
        'auth.back_home': 'Bosh sahifaga qaytish',
        'login.page_title': 'Kirish - DTM Test Platform',
        'login.heading': 'Xush kelibsiz!',
        'login.subtitle': "Hisobingizga kirish uchun ma'lumotlaringizni kiriting",
        'login.password_placeholder': 'Parolingizni kiriting',
        'login.no_account': "Hisobingiz yo'qmi?",
        'signup.page_title': "Ro'yxatdan o'tish - DTM Test Platform",
        'signup.heading': "Ro'yxatdan o'tish",
        'signup.subtitle': "Yangi hisob yaratish uchun ma'lumotlaringizni kiriting",
        'signup.full_name': "To'liq ism",
        'signup.full_name_placeholder': 'Ism Familiyangiz',
        'signup.password_placeholder': 'Kamida 6 ta belgi',
        'signup.confirm_password': 'Parolni tasdiqlash',
        'signup.confirm_password_placeholder': 'Parolingizni qayta kiriting',
        'signup.has_account': 'Allaqachon hisobingiz bormi?',
        'index.page_title': "DTM Test Platform - Bilimlaringizni Sinab Ko'ring",
        'index.badge_new': 'YANGI',
        'index.badge_text': 'Eng zamonaviy test platformasi',
        'index.badge_action': 'HARAKAT',
        'index.badge_action_text': 'Testlarni ishlashni boshlang',
        'index.hero_title': "<span>Bilimlaringizni</span> Sinab Ko'ring va Rivojlaning",
        'index.hero_desc': "DTM Test Platform orqali turli fanlardan testlar ishlang, natijalaringizni kuzating va o'z bilimlaringizni oshiring.",
        'index.logged_hero_title': "Bilimlaringizni Sinab Ko'ring",
        'index.logged_hero_desc': "DTM Test Platform orqali bilimlaringizni sinab ko'ring va rivojlaning. Endi siz testlarni ishlashingiz mumkin!",
        'index.start_now': 'Hozir Boshlash',
        'index.start_tests': 'Testlarni boshlash',
        'index.stat_tests': 'Testlar',
        'index.stat_students': "O'quvchilar",
        'index.stat_satisfaction': 'Mamnuniyat',
        'index.welcome_prefix': 'Xush kelibsiz,',
        'index.dashboard_subtitle': 'Quyidagi imkoniyatlardan birini tanlang',
        'index.card_tests': 'Testlar',
        'index.card_tests_desc': 'Turli fanlardan testlarni ishlang',
        'index.card_tests_btn': "Testlarni ko'rish",
        'index.card_results': 'Natijalarim',
        'index.card_results_desc': "Oldingi test natijalarini ko'ring",
        'index.card_results_btn': "Natijalarni ko'rish",
        'index.card_progress': 'Mening Progressim',
        'index.card_progress_desc': "O'z bilimingizni rivojlanishini kuzating",
        'index.card_progress_btn': "Progressni ko'rish",
        'index.features_title': 'Nega Bizni Tanlash kerak?',
        'index.features_subtitle': 'Bizning platforma sizga eng yaxshi tajribani taqdim etadi',
        'index.feature1_title': 'Keng Qamrovli Testlar',
        'index.feature1_desc': "Turli fanlar va mavzular bo'yicha ko'plab testlar. Har bir test diqqat bilan tayyorlangan va sifat nazoratidan o'tgan.",
        'index.feature2_title': 'Tez va Aniq Natijalar',
        'index.feature2_desc': "Testni topshirishingiz bilan darhol natijangizni ko'ring. To'g'ri va noto'g'ri javoblar batafsil tahlil qilingan.",
        'index.feature3_title': 'Batafsil Analitika',
        'index.feature3_desc': "Har bir test bo'yicha o'z progressiyingizni kuzating. Kuchli va zaif tomonlaringizni aniqlang va yaxshilaning.",
        'index.feature4_title': 'Shaxsiylashtirilgan Yondashuv',
        'index.feature4_desc': "Har bir foydalanuvchi uchun moslashgan ta'lim strategiyasi. O'zingizga mos tezlik va qiyinlik darajasini tanlang.",
        'index.feature5_title': 'Xavfsiz va Ishonchli',
        'index.feature5_desc': "Ma'lumotlaringiz xavfsiz saqlanadi. Shaxsiy ma'lumotlaringiz maxfiylik siyosatiga muvofiq himoyalangan.",
        'index.feature6_title': "24/7 Qo'llab-quvvatlash",
        'index.feature6_desc': "Har qanday savol yoki muammo bo'yicha qo'llab-quvvatlash jamoamiz yordam berishga tayyor.",
        'index.footer_brand_desc': "Eng yaxshi test platformasi. O'z bilimlaringizni sinab ko'ring va rivojlaning.",
        'footer.links': 'Havolalar',
        'footer.help': 'Yordam',
        'footer.faq': 'FAQ',
        'footer.support': "Qo'llab-quvvatlash",
        'footer.privacy': 'Maxfiylik siyosati',
        'footer.copyright': '&copy; 2026 DTM Test Platform. Barcha huquqlar himoyalangan.',
        'home.page_title': 'Mening Sahifam - DTM Test Platform',
        'home.welcome_prefix': 'Xush kelibsiz,',
        'home.welcome_desc': "DTM Test Platform orqali bilimlaringizni sinab ko'ring va rivojlaning.",
        'home.profile_title': 'Mening Profilim',
        'home.coins': 'Coinlar',
        'home.coins_desc': "Test topshirib coin to'plang!",
        'home.stats': 'Statistika',
        'home.total_tests': 'Jami testlar:',
        'home.correct_answers': "To'g'ri javoblar:",
        'home.total_score': 'Umumiy ball:',
        'home.no_activity': "Hozircha faoliyat yo'q",
        'home.test': 'Test',
        'home.subject': 'Fan',
        'home.question': 'Savol',
        'home.time': 'Vaqt',
        'home.prev': 'Oldingi',
        'home.next': 'Keyingi',
        'home.finish': 'Yakunlash',
        'home.my_results': 'Mening Natijalarim',
        'home.analytics': 'Analitika',
        'home.total_tests_short': 'Jami testlar',
        'home.subjects': 'Fanlar',
        'home.my_progress': 'Mening Progressim',
        'home.results_dynamics': 'Natijalar dinamikasi',
        'home.blocks': 'Bloklar',
        'home.loading': 'Yuklanmoqda...',
        'home.blocks_loading': 'Bloklar olinmoqda',
        'home.block_subjects': "Blok bo'yicha fanlar",
        'home.view_subjects': "Fanlarni ko'rish",
        'home.subject_not_found': 'Fan topilmadi',
        'home.no_subjects_in_block': "Bu blok uchun hozircha fanlar kiritilmagan.",
        'home.test_ready': 'Test ishlash uchun tayyor',
        'home.start': 'Boshlash',
        'home.error': 'Xatolik',
        'home.blocks_load_error': "Bloklarni yuklashda xatolik yuz berdi.",
        'home.subjects_suffix': 'fanlari',
        'home.subjects_loading': 'Fanlar olinmoqda',
        'home.subjects_load_error': "Fanlarni yuklashda xatolik yuz berdi.",
        'home.no_tests': "Bu fanda hali testlar yo'q",
        'home.tests_load_error': 'Testlarni yuklashda xatolik',
        'home.modal_excellent': 'Ajoyib natija! Davom eting!',
        'home.modal_good': "Yaxshi natija! Ko'proq mashq qiling.",
        'home.modal_need_work': "Yanada ko'proq o'rganishingiz kerak.",
        'home.test_finished': 'Test yakunlandi!',
        'direction.exact': 'Aniq fanlar',
        'direction.natural': 'Tabiiy fanlar',
        'direction.social': 'Ijtimoiy fanlar',
        'direction.language': 'Til va adabiyot fanlari',
        'direction.professional': 'Kasbiy ijodiy imtihon',
        'subject.math': 'Matematika',
        'subject.physics': 'Fizika',
        'subject.chemistry': 'Kimyo',
        'subject.biology': 'Biologiya',
        'subject.history': 'Tarix',
        'subject.geography': 'Geografiya',
        'subject.law': 'Huquq',
        'subject.native_language': 'Ona tili va adabiyoti',
        'subject.karakalpak': 'Qoraqalpoq tili',
        'subject.english': 'Ingliz tili',
        'subject.german': 'Nemis tili',
        'subject.french': 'Fransuz tili',
        'subject.russian': 'Rus tili'
    },
    en: {
        'lang.uz': 'Uzbek',
        'lang.en': 'English',
        'lang.ru': 'Russian',
        'lang.tg': 'Tajik',
        'lang.kaa': 'Karakalpak',
        'google.login': 'Sign in with Google',
        'alert.google_client_missing': 'VITE_GOOGLE_CLIENT_ID is not configured for Google login',
        'alert.google_token_missing': 'Google token was not received',
        'alert.google_login_error': 'Google sign-in failed',
        'alert.login_success': 'Login successful!',
        'alert.generic_error': 'An error occurred',
        'alert.server_error': 'Server connection error. API might be down.',
        'alert.password_mismatch': 'Passwords do not match!',
        'alert.password_short': 'Password must be at least 6 characters',
        'alert.signup_success': 'Registration successful!',
        'nav.my_page': 'My Page',
        'nav.home': 'Home',
        'nav.services': 'Services',
        'nav.login': 'Login',
        'nav.signup': 'Sign Up',
        'nav.logout': 'Logout',
        'nav.profile': 'Profile',
        'common.back': '← Back',
        'common.close': 'Close',
        'auth.email_label': 'Email',
        'auth.email_placeholder': 'email@example.com',
        'auth.password_label': 'Password',
        'auth.or': 'or',
        'auth.back_home': 'Back to home',
        'login.page_title': 'Login - DTM Test Platform',
        'login.heading': 'Welcome!',
        'login.subtitle': 'Enter your credentials to sign in',
        'login.password_placeholder': 'Enter your password',
        'login.no_account': "Don't have an account?",
        'signup.page_title': 'Sign Up - DTM Test Platform',
        'signup.heading': 'Sign Up',
        'signup.subtitle': 'Enter your details to create a new account',
        'signup.full_name': 'Full name',
        'signup.full_name_placeholder': 'Your full name',
        'signup.password_placeholder': 'At least 6 characters',
        'signup.confirm_password': 'Confirm password',
        'signup.confirm_password_placeholder': 'Re-enter your password',
        'signup.has_account': 'Already have an account?',
        'index.page_title': 'DTM Test Platform - Test Your Knowledge',
        'index.badge_new': 'NEW',
        'index.badge_text': 'Modern testing platform',
        'index.badge_action': 'ACTION',
        'index.badge_action_text': 'Start taking tests',
        'index.hero_title': '<span>Test your</span> knowledge and improve',
        'index.hero_desc': 'Practice tests across subjects, track your results, and improve your knowledge.',
        'index.logged_hero_title': 'Test your knowledge',
        'index.logged_hero_desc': 'Test your knowledge and improve with DTM Test Platform. You can start tests now!',
        'index.start_now': 'Start Now',
        'index.start_tests': 'Start tests',
        'index.stat_tests': 'Tests',
        'index.stat_students': 'Students',
        'index.stat_satisfaction': 'Satisfaction',
        'index.welcome_prefix': 'Welcome,',
        'index.dashboard_subtitle': 'Choose one of the options below',
        'index.card_tests': 'Tests',
        'index.card_tests_desc': 'Solve tests from various subjects',
        'index.card_tests_btn': 'View tests',
        'index.card_results': 'My Results',
        'index.card_results_desc': 'View your previous test results',
        'index.card_results_btn': 'View results',
        'index.card_progress': 'My Progress',
        'index.card_progress_desc': 'Track your learning progress',
        'index.card_progress_btn': 'View progress',
        'index.features_title': 'Why Choose Us?',
        'index.features_subtitle': 'Our platform gives you the best experience',
        'index.feature1_title': 'Comprehensive Tests',
        'index.feature1_desc': 'A large set of tests across many subjects and topics.',
        'index.feature2_title': 'Fast and Accurate Results',
        'index.feature2_desc': 'Get your result instantly after finishing a test.',
        'index.feature3_title': 'Detailed Analytics',
        'index.feature3_desc': 'Track your progress and identify strengths and weaknesses.',
        'index.feature4_title': 'Personalized Approach',
        'index.feature4_desc': 'Choose the pace and difficulty level that suits you.',
        'index.feature5_title': 'Secure and Reliable',
        'index.feature5_desc': 'Your personal data is kept secure and protected.',
        'index.feature6_title': '24/7 Support',
        'index.feature6_desc': 'Our support team is always ready to help.',
        'index.footer_brand_desc': 'The best testing platform. Test your knowledge and improve.',
        'footer.links': 'Links',
        'footer.help': 'Help',
        'footer.faq': 'FAQ',
        'footer.support': 'Support',
        'footer.privacy': 'Privacy policy',
        'footer.copyright': '&copy; 2026 DTM Test Platform. All rights reserved.',
        'home.page_title': 'My Page - DTM Test Platform',
        'home.welcome_prefix': 'Welcome,',
        'home.welcome_desc': 'Test your knowledge and grow with DTM Test Platform.',
        'home.profile_title': 'My Profile',
        'home.coins': 'Coins',
        'home.coins_desc': 'Collect coins by taking tests!',
        'home.stats': 'Statistics',
        'home.total_tests': 'Total tests:',
        'home.correct_answers': 'Correct answers:',
        'home.total_score': 'Total score:',
        'home.no_activity': 'No activity yet',
        'home.test': 'Test',
        'home.subject': 'Subject',
        'home.question': 'Question',
        'home.time': 'Time',
        'home.prev': 'Previous',
        'home.next': 'Next',
        'home.finish': 'Finish',
        'home.my_results': 'My Results',
        'home.analytics': 'Analytics',
        'home.total_tests_short': 'Total tests',
        'home.subjects': 'Subjects',
        'home.my_progress': 'My Progress',
        'home.results_dynamics': 'Result dynamics',
        'home.blocks': 'Blocks',
        'home.loading': 'Loading...',
        'home.blocks_loading': 'Loading blocks',
        'home.block_subjects': 'Subjects in this block',
        'home.view_subjects': 'View subjects',
        'home.subject_not_found': 'Subject not found',
        'home.no_subjects_in_block': 'No subjects have been added for this block yet.',
        'home.test_ready': 'Ready to start test',
        'home.start': 'Start',
        'home.error': 'Error',
        'home.blocks_load_error': 'Failed to load blocks.',
        'home.subjects_suffix': 'subjects',
        'home.subjects_loading': 'Loading subjects',
        'home.subjects_load_error': 'Failed to load subjects.',
        'home.no_tests': 'No tests available for this subject yet',
        'home.tests_load_error': 'Failed to load tests',
        'home.modal_excellent': 'Excellent result! Keep going!',
        'home.modal_good': 'Good result! Practice more.',
        'home.modal_need_work': 'You need to study more.',
        'home.test_finished': 'Test completed!',
        'direction.exact': 'Exact sciences',
        'direction.natural': 'Natural sciences',
        'direction.social': 'Social sciences',
        'direction.language': 'Language and literature',
        'direction.professional': 'Professional creative exam',
        'subject.math': 'Mathematics',
        'subject.physics': 'Physics',
        'subject.chemistry': 'Chemistry',
        'subject.biology': 'Biology',
        'subject.history': 'History',
        'subject.geography': 'Geography',
        'subject.law': 'Law',
        'subject.native_language': 'Native language and literature',
        'subject.karakalpak': 'Karakalpak language',
        'subject.english': 'English language',
        'subject.german': 'German language',
        'subject.french': 'French language',
        'subject.russian': 'Russian language'
    },
    ru: {
        'lang.uz': 'Узбекский',
        'lang.en': 'Английский',
        'lang.ru': 'Русский',
        'lang.tg': 'Таджикский',
        'lang.kaa': 'Каракалпакский',
        'google.login': 'Войти через Google',
        'alert.google_client_missing': 'VITE_GOOGLE_CLIENT_ID не настроен для входа Google',
        'alert.google_token_missing': 'Токен Google не получен',
        'alert.google_login_error': 'Ошибка входа через Google',
        'alert.login_success': 'Вход выполнен успешно!',
        'alert.generic_error': 'Произошла ошибка',
        'alert.server_error': 'Ошибка подключения к серверу. Возможно, API не работает.',
        'alert.password_mismatch': 'Пароли не совпадают!',
        'alert.password_short': 'Пароль должен содержать минимум 6 символов',
        'alert.signup_success': 'Регистрация прошла успешно!',
        'nav.my_page': 'Моя страница',
        'nav.home': 'Главная',
        'nav.services': 'Сервисы',
        'nav.login': 'Вход',
        'nav.signup': 'Регистрация',
        'nav.logout': 'Выход',
        'nav.profile': 'Профиль',
        'common.back': '← Назад',
        'common.close': 'Закрыть',
        'auth.email_label': 'Email',
        'auth.email_placeholder': 'email@example.com',
        'auth.password_label': 'Пароль',
        'auth.or': 'или',
        'auth.back_home': 'Вернуться на главную',
        'login.page_title': 'Вход - DTM Test Platform',
        'login.heading': 'Добро пожаловать!',
        'login.subtitle': 'Введите данные для входа',
        'login.password_placeholder': 'Введите пароль',
        'login.no_account': 'Нет аккаунта?',
        'signup.page_title': 'Регистрация - DTM Test Platform',
        'signup.heading': 'Регистрация',
        'signup.subtitle': 'Введите данные для создания аккаунта',
        'signup.full_name': 'Полное имя',
        'signup.full_name_placeholder': 'Имя и фамилия',
        'signup.password_placeholder': 'Минимум 6 символов',
        'signup.confirm_password': 'Подтвердите пароль',
        'signup.confirm_password_placeholder': 'Повторите пароль',
        'signup.has_account': 'Уже есть аккаунт?',
        'index.page_title': 'DTM Test Platform - Проверьте свои знания',
        'index.badge_new': 'НОВОЕ',
        'index.badge_text': 'Современная платформа тестов',
        'index.badge_action': 'ДЕЙСТВИЕ',
        'index.badge_action_text': 'Начните решать тесты',
        'index.hero_title': '<span>Проверьте</span> знания и развивайтесь',
        'index.hero_desc': 'Проходите тесты по разным предметам, отслеживайте результаты и повышайте знания.',
        'index.logged_hero_title': 'Проверьте свои знания',
        'index.logged_hero_desc': 'Проверяйте знания и развивайтесь с DTM Test Platform. Теперь можете проходить тесты!',
        'index.start_now': 'Начать',
        'index.start_tests': 'Начать тесты',
        'index.stat_tests': 'Тесты',
        'index.stat_students': 'Ученики',
        'index.stat_satisfaction': 'Удовлетворенность',
        'index.welcome_prefix': 'Добро пожаловать,',
        'index.dashboard_subtitle': 'Выберите один из вариантов',
        'index.card_tests': 'Тесты',
        'index.card_tests_desc': 'Решайте тесты по разным предметам',
        'index.card_tests_btn': 'Смотреть тесты',
        'index.card_results': 'Мои результаты',
        'index.card_results_desc': 'Посмотрите предыдущие результаты',
        'index.card_results_btn': 'Смотреть результаты',
        'index.card_progress': 'Мой прогресс',
        'index.card_progress_desc': 'Отслеживайте свой прогресс',
        'index.card_progress_btn': 'Смотреть прогресс',
        'index.features_title': 'Почему выбирают нас?',
        'index.features_subtitle': 'Наша платформа дает лучший опыт',
        'index.feature1_title': 'Широкий выбор тестов',
        'index.feature1_desc': 'Множество тестов по разным предметам и темам.',
        'index.feature2_title': 'Быстрые и точные результаты',
        'index.feature2_desc': 'Сразу получайте результат после завершения теста.',
        'index.feature3_title': 'Подробная аналитика',
        'index.feature3_desc': 'Отслеживайте прогресс и определяйте слабые стороны.',
        'index.feature4_title': 'Персонализированный подход',
        'index.feature4_desc': 'Выбирайте удобный темп и уровень сложности.',
        'index.feature5_title': 'Безопасно и надежно',
        'index.feature5_desc': 'Ваши данные надежно защищены.',
        'index.feature6_title': 'Поддержка 24/7',
        'index.feature6_desc': 'Наша команда поддержки всегда готова помочь.',
        'index.footer_brand_desc': 'Лучшая тестовая платформа. Проверяйте знания и развивайтесь.',
        'footer.links': 'Ссылки',
        'footer.help': 'Помощь',
        'footer.faq': 'FAQ',
        'footer.support': 'Поддержка',
        'footer.privacy': 'Политика конфиденциальности',
        'footer.copyright': '&copy; 2026 DTM Test Platform. Все права защищены.',
        'home.page_title': 'Моя страница - DTM Test Platform',
        'home.welcome_prefix': 'Добро пожаловать,',
        'home.welcome_desc': 'Проверяйте знания и развивайтесь с DTM Test Platform.',
        'home.profile_title': 'Мой профиль',
        'home.coins': 'Монеты',
        'home.coins_desc': 'Набирайте монеты, проходя тесты!',
        'home.stats': 'Статистика',
        'home.total_tests': 'Всего тестов:',
        'home.correct_answers': 'Правильные ответы:',
        'home.total_score': 'Общий балл:',
        'home.no_activity': 'Пока нет активности',
        'home.test': 'Тест',
        'home.subject': 'Предмет',
        'home.question': 'Вопрос',
        'home.time': 'Время',
        'home.prev': 'Предыдущий',
        'home.next': 'Следующий',
        'home.finish': 'Завершить',
        'home.my_results': 'Мои результаты',
        'home.analytics': 'Аналитика',
        'home.total_tests_short': 'Всего тестов',
        'home.subjects': 'Предметы',
        'home.my_progress': 'Мой прогресс',
        'home.results_dynamics': 'Динамика результатов',
        'home.blocks': 'Блоки',
        'home.loading': 'Загрузка...',
        'home.blocks_loading': 'Загрузка блоков',
        'home.block_subjects': 'Предметы блока',
        'home.view_subjects': 'Смотреть предметы',
        'home.subject_not_found': 'Предмет не найден',
        'home.no_subjects_in_block': 'Для этого блока пока нет предметов.',
        'home.test_ready': 'Готов к тесту',
        'home.start': 'Начать',
        'home.error': 'Ошибка',
        'home.blocks_load_error': 'Не удалось загрузить блоки.',
        'home.subjects_suffix': 'предметы',
        'home.subjects_loading': 'Загрузка предметов',
        'home.subjects_load_error': 'Не удалось загрузить предметы.',
        'home.no_tests': 'Для этого предмета пока нет тестов',
        'home.tests_load_error': 'Не удалось загрузить тесты',
        'home.modal_excellent': 'Отличный результат! Продолжайте!',
        'home.modal_good': 'Хороший результат! Больше практики.',
        'home.modal_need_work': 'Нужно учиться больше.',
        'home.test_finished': 'Тест завершен!',
        'direction.exact': 'Точные науки',
        'direction.natural': 'Естественные науки',
        'direction.social': 'Социальные науки',
        'direction.language': 'Языки и литература',
        'direction.professional': 'Профессиональный творческий экзамен',
        'subject.math': 'Математика',
        'subject.physics': 'Физика',
        'subject.chemistry': 'Химия',
        'subject.biology': 'Биология',
        'subject.history': 'История',
        'subject.geography': 'География',
        'subject.law': 'Право',
        'subject.native_language': 'Родной язык и литература',
        'subject.karakalpak': 'Каракалпакский язык',
        'subject.english': 'Английский язык',
        'subject.german': 'Немецкий язык',
        'subject.french': 'Французский язык',
        'subject.russian': 'Русский язык'
    },
    tg: {
        'lang.uz': 'Ӯзбекӣ',
        'lang.en': 'Англисӣ',
        'lang.ru': 'Русӣ',
        'lang.tg': 'Тоҷикӣ',
        'lang.kaa': 'Қарақалпоқӣ',
        'google.login': 'Воридшавӣ бо Google',
        'alert.google_client_missing': 'VITE_GOOGLE_CLIENT_ID барои Google танзим нашудааст',
        'alert.google_token_missing': 'Токени Google гирифта нашуд',
        'alert.google_login_error': 'Хатогӣ ҳангоми воридшавӣ бо Google',
        'alert.login_success': 'Воридшавӣ муваффақ шуд!',
        'alert.generic_error': 'Хатогӣ рух дод',
        'alert.server_error': 'Хатогӣ дар пайвастшавӣ ба сервер. Эҳтимол API кор намекунад.',
        'alert.password_mismatch': 'Рамзҳо мувофиқат накарданд!',
        'alert.password_short': 'Рамз бояд ҳадди ақал 6 аломат дошта бошад',
        'alert.signup_success': 'Бақайдгирӣ муваффақ шуд!',
        'nav.my_page': 'Саҳифаи ман',
        'nav.home': 'Саҳифаи асосӣ',
        'nav.services': 'Хизматҳо',
        'nav.login': 'Воридшавӣ',
        'nav.signup': 'Бақайдгирӣ',
        'nav.logout': 'Баромад',
        'nav.profile': 'Профил',
        'common.back': '← Бозгашт',
        'common.close': 'Пӯшидан',
        'auth.email_label': 'Email',
        'auth.email_placeholder': 'email@example.com',
        'auth.password_label': 'Рамз',
        'auth.or': 'ё',
        'auth.back_home': 'Бозгашт ба саҳифаи асосӣ',
        'login.page_title': 'Воридшавӣ - DTM Test Platform',
        'login.heading': 'Хуш омадед!',
        'login.subtitle': 'Барои воридшавӣ маълумотро ворид кунед',
        'login.password_placeholder': 'Рамзро ворид кунед',
        'login.no_account': 'Ҳисоб надоред?',
        'signup.page_title': 'Бақайдгирӣ - DTM Test Platform',
        'signup.heading': 'Бақайдгирӣ',
        'signup.subtitle': 'Барои сохтани ҳисоби нав маълумотро ворид кунед',
        'signup.full_name': 'Ному насаб',
        'signup.full_name_placeholder': 'Ном ва насаб',
        'signup.password_placeholder': 'Камаш 6 аломат',
        'signup.confirm_password': 'Тасдиқи рамз',
        'signup.confirm_password_placeholder': 'Рамзро дубора ворид кунед',
        'signup.has_account': 'Аллакай ҳисоб доред?',
        'index.page_title': 'DTM Test Platform - Дониши худро бисанҷед',
        'index.badge_new': 'НАВ',
        'index.badge_text': 'Платформаи муосири тестӣ',
        'index.badge_action': 'ҲАРАКАТ',
        'index.badge_action_text': 'Ба супоридани тест оғоз кунед',
        'index.hero_title': '<span>Дониши худро</span> бисанҷед ва рушд кунед',
        'index.hero_desc': 'Аз фанҳои гуногун тест супоред, натиҷаҳоро бинед ва донишатонро баланд бардоред.',
        'index.logged_hero_title': 'Дониши худро бисанҷед',
        'index.logged_hero_desc': 'Бо DTM Test Platform донишатонро бисанҷед ва рушд кунед. Акнун метавонед тест супоред!',
        'index.start_now': 'Ҳозир оғоз кунед',
        'index.start_tests': 'Оғози тестҳо',
        'index.stat_tests': 'Тестҳо',
        'index.stat_students': 'Донишҷӯён',
        'index.stat_satisfaction': 'Қаноатмандӣ',
        'index.welcome_prefix': 'Хуш омадед,',
        'index.dashboard_subtitle': 'Яке аз имкониятҳоро интихоб кунед',
        'index.card_tests': 'Тестҳо',
        'index.card_tests_desc': 'Аз фанҳои гуногун тест супоред',
        'index.card_tests_btn': 'Дидани тестҳо',
        'index.card_results': 'Натиҷаҳои ман',
        'index.card_results_desc': 'Натиҷаҳои пешинаро бинед',
        'index.card_results_btn': 'Дидани натиҷаҳо',
        'index.card_progress': 'Пешрафти ман',
        'index.card_progress_desc': 'Пешрафти худро назорат кунед',
        'index.card_progress_btn': 'Дидани пешрафт',
        'index.features_title': 'Чаро моро интихоб кунед?',
        'index.features_subtitle': 'Платформаи мо таҷрибаи беҳтарин медиҳад',
        'index.feature1_title': 'Тестҳои фарогир',
        'index.feature1_desc': 'Тестҳои зиёд аз фанҳо ва мавзӯъҳои гуногун.',
        'index.feature2_title': 'Натиҷаҳои зуд ва дақиқ',
        'index.feature2_desc': 'Баъди анҷоми тест фавран натиҷаро гиред.',
        'index.feature3_title': 'Аналитикаи муфассал',
        'index.feature3_desc': 'Пешрафтро назорат кунед ва заъфҳоро ёбед.',
        'index.feature4_title': 'Равиши инфиродӣ',
        'index.feature4_desc': 'Суръат ва сатҳи душвориро интихоб кунед.',
        'index.feature5_title': 'Бехатар ва боэътимод',
        'index.feature5_desc': 'Маълумоти шахсии шумо ҳифз мешавад.',
        'index.feature6_title': 'Дастгирии 24/7',
        'index.feature6_desc': 'Гурӯҳи дастгирӣ ҳамеша барои кӯмак омода аст.',
        'index.footer_brand_desc': 'Беҳтарин платформаи тестӣ. Донишатонро бисанҷед ва рушд кунед.',
        'footer.links': 'Пайвандҳо',
        'footer.help': 'Кӯмак',
        'footer.faq': 'FAQ',
        'footer.support': 'Дастгирӣ',
        'footer.privacy': 'Сиёсати махфият',
        'footer.copyright': '&copy; 2026 DTM Test Platform. Ҳамаи ҳуқуқҳо ҳифз шудаанд.',
        'home.page_title': 'Саҳифаи ман - DTM Test Platform',
        'home.welcome_prefix': 'Хуш омадед,',
        'home.welcome_desc': 'Бо DTM Test Platform донишатонро бисанҷед ва рушд кунед.',
        'home.profile_title': 'Профили ман',
        'home.coins': 'Тангаҳо',
        'home.coins_desc': 'Бо супоридани тест танга ҷамъ кунед!',
        'home.stats': 'Омор',
        'home.total_tests': 'Ҳамаи тестҳо:',
        'home.correct_answers': 'Ҷавобҳои дуруст:',
        'home.total_score': 'Балли умумӣ:',
        'home.no_activity': 'Ҳоло фаъолият нест',
        'home.test': 'Тест',
        'home.subject': 'Фан',
        'home.question': 'Савол',
        'home.time': 'Вақт',
        'home.prev': 'Қаблӣ',
        'home.next': 'Баъдӣ',
        'home.finish': 'Анҷом',
        'home.my_results': 'Натиҷаҳои ман',
        'home.analytics': 'Аналитика',
        'home.total_tests_short': 'Ҳамаи тестҳо',
        'home.subjects': 'Фанҳо',
        'home.my_progress': 'Пешрафти ман',
        'home.results_dynamics': 'Динамикаи натиҷаҳо',
        'home.blocks': 'Блокҳо',
        'home.loading': 'Боргирӣ...',
        'home.blocks_loading': 'Блокҳо боргирӣ мешаванд',
        'home.block_subjects': 'Фанҳои блок',
        'home.view_subjects': 'Дидани фанҳо',
        'home.subject_not_found': 'Фан ёфт нашуд',
        'home.no_subjects_in_block': 'Барои ин блок ҳоло фан ворид нашудааст.',
        'home.test_ready': 'Ба тест омода',
        'home.start': 'Оғоз',
        'home.error': 'Хатогӣ',
        'home.blocks_load_error': 'Боргирии блокҳо ноком шуд.',
        'home.subjects_suffix': 'фанҳо',
        'home.subjects_loading': 'Фанҳо боргирӣ мешаванд',
        'home.subjects_load_error': 'Боргирии фанҳо ноком шуд.',
        'home.no_tests': 'Барои ин фан ҳоло тест нест',
        'home.tests_load_error': 'Боргирии тестҳо ноком шуд',
        'home.modal_excellent': 'Натиҷаи олӣ! Давом диҳед!',
        'home.modal_good': 'Натиҷаи хуб! Бештар машқ кунед.',
        'home.modal_need_work': 'Бояд бештар омӯзед.',
        'home.test_finished': 'Тест анҷом ёфт!',
        'direction.exact': 'Фанҳои дақиқ',
        'direction.natural': 'Фанҳои табиӣ',
        'direction.social': 'Фанҳои иҷтимоӣ',
        'direction.language': 'Забон ва адабиёт',
        'direction.professional': 'Имтиҳони касбии эҷодӣ',
        'subject.math': 'Математика',
        'subject.physics': 'Физика',
        'subject.chemistry': 'Химия',
        'subject.biology': 'Биология',
        'subject.history': 'Таърих',
        'subject.geography': 'Ҷуғрофия',
        'subject.law': 'Ҳуқуқ',
        'subject.native_language': 'Забони модарӣ ва адабиёт',
        'subject.karakalpak': 'Забони қарақалпоқӣ',
        'subject.english': 'Забони англисӣ',
        'subject.german': 'Забони немисӣ',
        'subject.french': 'Забони фаронсавӣ',
        'subject.russian': 'Забони русӣ'
    },
    kaa: {
        'lang.uz': "O'zbek",
        'lang.en': 'English',
        'lang.ru': 'Русский',
        'lang.tg': 'Тоҷикӣ',
        'lang.kaa': 'Qaraqalpaq',
        'google.login': 'Google arqali kiriw',
        'alert.google_client_missing': 'Google login ushin VITE_GOOGLE_CLIENT_ID sazlanbagan',
        'alert.google_token_missing': 'Google token alınbadı',
        'alert.google_login_error': 'Google arqali kiriwde qatelik',
        'alert.login_success': 'Tabıslı kirildi!',
        'alert.generic_error': 'Qatelik júz berdi',
        'alert.server_error': "Serverge ulanıwda qatelik. API islepey atırǵan bolıwı múmkin.",
        'alert.password_mismatch': 'Parollar birdey emes!',
        'alert.password_short': "Parol keminde 6 belgiden ibarat bolıwı kerek",
        'alert.signup_success': "Tabıslı dizimnen o'ttińiz!",
        'nav.my_page': 'Meniń betim',
        'nav.home': 'Bas bet',
        'nav.services': 'Xızmetler',
        'nav.login': 'Kiriw',
        'nav.signup': "Dizimnen o'tiw",
        'nav.logout': 'Shığıw',
        'nav.profile': 'Profil',
        'common.back': '← Artqa',
        'common.close': 'Jabıw',
        'auth.email_label': 'Email',
        'auth.email_placeholder': 'email@example.com',
        'auth.password_label': 'Parol',
        'auth.or': 'yamasa',
        'auth.back_home': 'Bas betke qaytıw',
        'login.page_title': 'Kiriw - DTM Test Platform',
        'login.heading': 'Xosh keldińiz!',
        'login.subtitle': "Accountıńızǵa kiriw ushın maǵlıwmatlarıńızdı kiritiń",
        'login.password_placeholder': 'Parolıńızdı kiritiń',
        'login.no_account': "Accountıńız joq pa?",
        'signup.page_title': "Dizimnen o'tiw - DTM Test Platform",
        'signup.heading': "Dizimnen o'tiw",
        'signup.subtitle': "Jańa account jaratıw ushın maǵlıwmatlarıńızdı kiritiń",
        'signup.full_name': 'Tolıq atıńız',
        'signup.full_name_placeholder': 'Atıńız familiyańız',
        'signup.password_placeholder': 'Keminde 6 belgi',
        'signup.confirm_password': 'Paroldı tastıyıqlaw',
        'signup.confirm_password_placeholder': 'Paroldı qayta kiritiń',
        'signup.has_account': 'Aldınnan accountıńız bar ma?',
        'index.page_title': 'DTM Test Platform - Bilimińizdi sınap kóriń',
        'index.badge_new': 'JAŃA',
        'index.badge_text': 'Zamannawiy test platforması',
        'index.badge_action': 'HÁREKET',
        'index.badge_action_text': 'Test islewdi baslań',
        'index.hero_title': "<span>Bilimińizdi</span> sınap kóriń hám rawajlandıriń",
        'index.hero_desc': "Hár qıylı pánlerden test isleń, nátiyjelerdi qadaǵalań hám bilimińizdi asırıń.",
        'index.logged_hero_title': 'Bilimińizdi sınap kóriń',
        'index.logged_hero_desc': 'DTM Test Platform arqalı bilimińizdi sınap kóriń hám rawajlandıriń. Endi testlerdi isley alasız!',
        'index.start_now': 'Házir baslań',
        'index.start_tests': 'Testlerdi baslaw',
        'index.stat_tests': 'Testler',
        'index.stat_students': "Oqıwshılar",
        'index.stat_satisfaction': 'Qanaat',
        'index.welcome_prefix': 'Xosh keldińiz,',
        'index.dashboard_subtitle': 'Tómendegi múmkinshiliklerden birin tańlań',
        'index.card_tests': 'Testler',
        'index.card_tests_desc': 'Hár qıylı pánlerden test isleń',
        'index.card_tests_btn': "Testlerdi kóriw",
        'index.card_results': 'Nátiyjelerim',
        'index.card_results_desc': "Aldınǵı test nátiyjelerin kóriń",
        'index.card_results_btn': "Nátiyjelerdi kóriw",
        'index.card_progress': 'Meniń progressim',
        'index.card_progress_desc': 'Bilimińiz rawajlanıwın baqlań',
        'index.card_progress_btn': 'Progressdi kóriw',
        'index.features_title': 'Nelikten bizdi tańlaw kerek?',
        'index.features_subtitle': 'Bizdiń platforma sizge eń jaqsı tájiriybeni beredi',
        'index.feature1_title': 'Keń qamrawlı testler',
        'index.feature1_desc': 'Hár qıylı pán hám tema boyınsha kóp testler.',
        'index.feature2_title': 'Tez hám anıq nátiyjeler',
        'index.feature2_desc': 'Testten keyin darhal nátiyje alasız.',
        'index.feature3_title': 'Tolıq analitika',
        'index.feature3_desc': 'Progressdi baqlań hám kúshli-álsiz jaqlarıńızdı biliń.',
        'index.feature4_title': 'Jekelestirilgen usıl',
        'index.feature4_desc': 'Ózińizge mas tezlik hám qıyınlıq dárejesin tańlań.',
        'index.feature5_title': 'Qáwipsiz hám isenimli',
        'index.feature5_desc': 'Jeke maǵlıwmatlarıńız qáwipsiz saqlanadı.',
        'index.feature6_title': '24/7 qollap-quwatlaw',
        'index.feature6_desc': 'Qollap-quwatlaw komandamız hárwaqıt járdemge tayar.',
        'index.footer_brand_desc': 'Eń jaqsı test platforması. Bilimińizdi sınap kóriń hám rawajlandıriń.',
        'footer.links': 'Siltemeler',
        'footer.help': 'Járdem',
        'footer.faq': 'FAQ',
        'footer.support': "Qollap-quwatlaw",
        'footer.privacy': 'Maxpiylik siyasatı',
        'footer.copyright': '&copy; 2026 DTM Test Platform. Barlıq huqıqlar qorǵalǵan.',
        'home.page_title': 'Meniń betim - DTM Test Platform',
        'home.welcome_prefix': 'Xosh keldińiz,',
        'home.welcome_desc': 'DTM Test Platform arqalı bilimińizdi sınap kóriń hám rawajlandıriń.',
        'home.profile_title': 'Meniń profilim',
        'home.coins': 'Coinlar',
        'home.coins_desc': "Test tapsırıp coin jıynań!",
        'home.stats': 'Statistika',
        'home.total_tests': 'Jami testler:',
        'home.correct_answers': 'Durıs juwaplar:',
        'home.total_score': 'Ulǵay bal:',
        'home.no_activity': "Házirge belsendilik joq",
        'home.test': 'Test',
        'home.subject': 'Pán',
        'home.question': 'Soralıq',
        'home.time': 'Waqıt',
        'home.prev': 'Aldınǵı',
        'home.next': 'Keyingi',
        'home.finish': 'Juwmaqlaw',
        'home.my_results': 'Meniń nátiyjelerim',
        'home.analytics': 'Analitika',
        'home.total_tests_short': 'Jami testler',
        'home.subjects': 'Pánler',
        'home.my_progress': 'Meniń progressim',
        'home.results_dynamics': 'Nátiyjeler dinamikası',
        'home.blocks': 'Bloklar',
        'home.loading': 'Júklenip atır...',
        'home.blocks_loading': 'Bloklar alınbaqta',
        'home.block_subjects': "Blok boyınsha pánler",
        'home.view_subjects': "Pánlerdi kóriw",
        'home.subject_not_found': 'Pán tabılmadı',
        'home.no_subjects_in_block': 'Bul blok ushın házirge pán kiritilmegen.',
        'home.test_ready': 'Test islewge tayar',
        'home.start': 'Baslaw',
        'home.error': 'Qatelik',
        'home.blocks_load_error': 'Bloklardı júklewde qatelik júz berdi.',
        'home.subjects_suffix': 'pánleri',
        'home.subjects_loading': 'Pánler alınbaqta',
        'home.subjects_load_error': 'Pánlerdi júklewde qatelik júz berdi.',
        'home.no_tests': "Bul pánde háli test joq",
        'home.tests_load_error': 'Testlerdi júklewde qatelik',
        'home.modal_excellent': 'Ajoyib nátiyje! Dawam etiń!',
        'home.modal_good': 'Jaqsı nátiyje! Kóbirek shınıǵıń.',
        'home.modal_need_work': "Taǵıda kóbirek úyreniw kerek.",
        'home.test_finished': 'Test juwmaqlandı!',
        'direction.exact': 'Anıq pánler',
        'direction.natural': 'Tabiiy pánler',
        'direction.social': 'Ijtimoiy pánler',
        'direction.language': 'Til hám ádebiyat pánleri',
        'direction.professional': 'Kásiplik dóretpeshilik imtihanı',
        'subject.math': 'Matematika',
        'subject.physics': 'Fizika',
        'subject.chemistry': 'Kimyo',
        'subject.biology': 'Biologiya',
        'subject.history': 'Tarix',
        'subject.geography': 'Geografiya',
        'subject.law': 'Huqıq',
        'subject.native_language': 'Ana tili hám ádebiyatı',
        'subject.karakalpak': 'Qaraqalpaq tili',
        'subject.english': 'Ingliz tili',
        'subject.german': 'Nemis tili',
        'subject.french': 'Fransuz tili',
        'subject.russian': 'Rus tili'
    }
};

function getLanguage() {
    const lang = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

function interpolate(text, vars = {}) {
    return text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

function t(key, vars = {}) {
    const lang = getLanguage();
    const byLang = TRANSLATIONS[lang] || {};
    const fallback = TRANSLATIONS[DEFAULT_LANG] || {};
    return interpolate(byLang[key] || fallback[key] || key, vars);
}

function applyTranslations(root = document) {
    const lang = getLanguage();
    document.documentElement.setAttribute('lang', lang);

    root.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        const value = t(key);
        if (el.dataset.i18nHtml === 'true') {
            el.innerHTML = value;
        } else {
            el.textContent = value;
        }
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (!key) return;
        el.setAttribute('placeholder', t(key));
    });

    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        if (!key) return;
        el.setAttribute('title', t(key));
    });
}

function initLanguageSelectors() {
    const selectors = document.querySelectorAll('[data-language-select]');
    selectors.forEach((select) => {
        const current = getLanguage();
        select.innerHTML = '';
        SUPPORTED_LANGS.forEach((langCode) => {
            const option = document.createElement('option');
            option.value = langCode;
            option.textContent = t(`lang.${langCode}`);
            if (langCode === current) option.selected = true;
            select.appendChild(option);
        });

        select.onchange = (event) => {
            const selectedLang = event.target.value;
            localStorage.setItem(LANG_KEY, SUPPORTED_LANGS.includes(selectedLang) ? selectedLang : DEFAULT_LANG);
            applyTranslations();
            initLanguageSelectors();
            document.dispatchEvent(new CustomEvent('dtm:language-changed', { detail: { lang: getLanguage() } }));
        };
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    initLanguageSelectors();

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    initGoogleAuth();
});

async function initGoogleAuth() {
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.endsWith('/login.html') || path.endsWith('/signup.html') || path.endsWith('/login') || path.endsWith('/signup');
    if (!isAuthPage) return;

    const loginContainer = document.getElementById('googleLoginButton');
    const signupContainer = document.getElementById('googleSignupButton');
    if (!loginContainer && !signupContainer) return;

    if (!GOOGLE_CLIENT_ID) {
        [loginContainer, signupContainer]
            .filter(Boolean)
            .forEach(renderGooglePlaceholderButton);
        return;
    }

    try {
        await loadGoogleScript();

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential
        });

        if (loginContainer) {
            window.google.accounts.id.renderButton(loginContainer, {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'pill',
                width: getGoogleButtonWidth()
            });
        }

        if (signupContainer) {
            window.google.accounts.id.renderButton(signupContainer, {
                theme: 'outline',
                size: 'large',
                text: 'signup_with',
                shape: 'pill',
                width: getGoogleButtonWidth()
            });
        }

    } catch (error) {
        console.error('Google script load error:', error);
    }
}

function getGoogleButtonWidth() {
    return Math.min(320, Math.max(220, window.innerWidth - 56));
}

function renderGooglePlaceholderButton(container) {
    container.innerHTML = `
        <button type="button" class="btn-secondary" style="width:min(100%,320px);background:#fff;color:#111827;border:1px solid #d1d5db;"
            id="googleFallbackBtn">
            <span style="font-weight:700;color:#4285F4;">G</span>
            ${t('google.login')}
        </button>
    `;

    const btn = container.querySelector('#googleFallbackBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            alert(t('alert.google_client_missing'));
        });
    }
}

function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function handleGoogleCredential(response) {
    if (!response?.credential) {
        alert(t('alert.google_token_missing'));
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || data.message || t('alert.google_login_error'));
            return;
        }

        localStorage.setItem('token', data.token || data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/home';
    } catch (error) {
        console.error('Google auth error:', error);
        alert(t('alert.google_login_error'));
    }
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token || data.accessToken);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert(t('alert.login_success'));
            window.location.href = '/home';
        } else {
            alert(data.error || data.message || t('alert.generic_error'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(t('alert.server_error'));
    }
}

// Signup handler
async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Password validation
    if (password !== confirmPassword) {
        alert(t('alert.password_mismatch'));
        return;
    }

    if (password.length < 6) {
        alert(t('alert.password_short'));
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token || data.accessToken);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert(t('alert.signup_success'));
            window.location.href = '/home';
        } else {
            alert(data.error || data.message || t('alert.generic_error'));
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert(t('alert.server_error'));
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Protect routes
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Refresh token bilan access tokenni yangilash
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.accessToken) {
            localStorage.setItem('token', data.accessToken);
        }
        if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
        }
        return data.accessToken;
    } catch {
        return null;
    }
}

// API helper functions
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // 401 bo'lsa refresh token bilan yangilash
    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(url, { ...options, headers });
        }
        logout();
    }

    return response;
}

// Get subjects
async function getSubjects() {
    try {
        const response = await fetch(`${API_URL}/api/subjects`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
    }
}

// Get tests by subject
async function getTests(subjectId) {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/tests/${subjectId}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching tests:', error);
        return [];
    }
}

// Save result
async function saveResult(subjectId, score, total, answers) {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/results`, {
            method: 'POST',
            body: JSON.stringify({ subjectId, score, total, answers })
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving result:', error);
        return null;
    }
}

// Get results
async function getResults() {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/results`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching results:', error);
        return [];
    }
}

// Get stats
async function getStats() {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/stats`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

// Export functions for use in other modules
window.DTM = {
    API_URL,
    t,
    getLanguage,
    logout,
    isLoggedIn,
    getCurrentUser,
    getToken,
    requireAuth,
    getSubjects,
    getTests,
    saveResult,
    getResults,
    getStats
};
