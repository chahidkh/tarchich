import { createContext, useContext, useMemo, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "ar", label: "العربية", dir: "rtl" as const },
  { code: "en", label: "English", dir: "ltr" as const },
  { code: "fr", label: "Français", dir: "ltr" as const },
  { code: "it", label: "Italiano", dir: "ltr" as const },
  { code: "pt", label: "Português — BR", dir: "ltr" as const },
  { code: "ja", label: "日本語", dir: "ltr" as const },
  { code: "zh", label: "中文", dir: "ltr" as const },
  { code: "ru", label: "Русский", dir: "ltr" as const },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export type TransKey =
  | "nav.home"
  | "nav.store"
  | "nav.gazette"
  | "nav.majlis"
  | "nav.contact"
  | "nav.privacy"
  | "nav.terms"
  | "nav.account"
  | "nav.admin"
  | "nav.join"
  | "cart.title"
  | "settings.title"
  | "settings.language"
  | "settings.theme"
  | "settings.theme.gold"
  | "settings.theme.parchment"
  | "settings.typography"
  | "settings.font.naskh"
  | "settings.font.kufi"
  | "settings.zen"
  | "settings.zen.hint"
  | "settings.lowdata"
  | "settings.lowdata.hint"
  | "settings.currency"
  | "settings.admin"
  | "contact.title"
  | "contact.lead"
  | "contact.name"
  | "contact.email"
  | "contact.subject"
  | "contact.message"
  | "contact.send"
  | "contact.sent"
  | "contact.support";

type Dict = Record<TransKey, string>;

const ar: Dict = {
  "nav.home": "الرئيسية",
  "nav.store": "متجر الكتب",
  "nav.gazette": "الجريدة",
  "nav.majlis": "المجلس الثقافي",
  "nav.contact": "تواصل معنا",
  "nav.privacy": "سياسة الخصوصية",
  "nav.terms": "الشروط والأحكام",
  "nav.account": "حسابي",
  "nav.admin": "الإشراف",
  "nav.join": "انضم إلينا",
  "cart.title": "السلة",
  "settings.title": "الإعدادات",
  "settings.language": "اللغة",
  "settings.theme": "نمط القراءة",
  "settings.theme.gold": "الوضع الذهبي الملكي",
  "settings.theme.parchment": "وضع المخطوطة القديمة",
  "settings.typography": "الخط وحجمه",
  "settings.font.naskh": "نسخ ملكي",
  "settings.font.kufi": "كوفي",
  "settings.zen": "وضع التركيز",
  "settings.zen.hint": "إخفاء الشريط العلوي أثناء القراءة",
  "settings.lowdata": "توفير البيانات",
  "settings.lowdata.hint": "تحميل صور مضغوطة للاتصال البطيء",
  "settings.currency": "العملة",
  "settings.admin": "لوحة الإشراف",
  "contact.title": "تواصل معنا",
  "contact.lead": "نسعد برسائلكم واقتراحاتكم، ونجيب في أقرب وقت.",
  "contact.name": "الاسم",
  "contact.email": "بريدك الإلكتروني",
  "contact.subject": "الموضوع",
  "contact.message": "الرسالة",
  "contact.send": "إرسال الرسالة",
  "contact.sent": "وصلتنا رسالتك، شكراً لك.",
  "contact.support": "بريد الدعم",
};

const en: Dict = {
  "nav.home": "Home",
  "nav.store": "Bookstore",
  "nav.gazette": "The Gazette",
  "nav.majlis": "Cultural Forum",
  "nav.contact": "Contact",
  "nav.privacy": "Privacy Policy",
  "nav.terms": "Terms & Conditions",
  "nav.account": "Account",
  "nav.admin": "Admin",
  "nav.join": "Join us",
  "cart.title": "Cart",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.theme": "Reading theme",
  "settings.theme.gold": "Royal Dark Gold",
  "settings.theme.parchment": "Vintage Parchment",
  "settings.typography": "Typography",
  "settings.font.naskh": "Royal Naskh",
  "settings.font.kufi": "Kufic",
  "settings.zen": "Zen / Focus mode",
  "settings.zen.hint": "Hide navigation while reading",
  "settings.lowdata": "Low data mode",
  "settings.lowdata.hint": "Load compressed images on slow connections",
  "settings.currency": "Currency",
  "settings.admin": "Admin panel",
  "contact.title": "Contact us",
  "contact.lead": "We welcome your messages and suggestions.",
  "contact.name": "Name",
  "contact.email": "Your email",
  "contact.subject": "Subject",
  "contact.message": "Message",
  "contact.send": "Send message",
  "contact.sent": "Your message has been received. Thank you.",
  "contact.support": "Support email",
};

function make(over: Partial<Dict>): Dict {
  return { ...en, ...over };
}

const fr = make({
  "nav.home": "Accueil",
  "nav.store": "Librairie",
  "nav.gazette": "La Gazette",
  "nav.majlis": "Forum culturel",
  "nav.contact": "Contact",
  "nav.privacy": "Politique de confidentialité",
  "nav.terms": "Conditions générales",
  "nav.account": "Mon compte",
  "nav.admin": "Administration",
  "nav.join": "Rejoignez-nous",
  "cart.title": "Panier",
  "settings.title": "Paramètres",
  "settings.language": "Langue",
  "settings.theme": "Thème de lecture",
  "settings.theme.gold": "Or royal sombre",
  "settings.theme.parchment": "Parchemin ancien",
  "settings.typography": "Typographie",
  "settings.zen": "Mode focus",
  "settings.lowdata": "Économiseur de données",
  "settings.currency": "Devise",
  "settings.admin": "Panneau d'administration",
  "contact.title": "Contactez-nous",
  "contact.name": "Nom",
  "contact.email": "Votre e-mail",
  "contact.subject": "Sujet",
  "contact.message": "Message",
  "contact.send": "Envoyer",
  "contact.sent": "Votre message a bien été reçu. Merci.",
  "contact.support": "E-mail d'assistance",
});

const it = make({
  "nav.home": "Home",
  "nav.store": "Libreria",
  "nav.gazette": "La Gazzetta",
  "nav.majlis": "Forum culturale",
  "nav.contact": "Contatti",
  "nav.privacy": "Informativa sulla privacy",
  "nav.terms": "Termini e condizioni",
  "nav.account": "Account",
  "nav.admin": "Amministrazione",
  "nav.join": "Unisciti a noi",
  "cart.title": "Carrello",
  "settings.title": "Impostazioni",
  "settings.language": "Lingua",
  "settings.theme": "Tema di lettura",
  "settings.theme.gold": "Oro reale scuro",
  "settings.theme.parchment": "Pergamena antica",
  "settings.typography": "Tipografia",
  "settings.zen": "Modalità focus",
  "settings.lowdata": "Risparmio dati",
  "settings.currency": "Valuta",
  "settings.admin": "Pannello admin",
  "contact.title": "Contattaci",
  "contact.name": "Nome",
  "contact.email": "La tua email",
  "contact.subject": "Oggetto",
  "contact.message": "Messaggio",
  "contact.send": "Invia messaggio",
  "contact.sent": "Messaggio ricevuto. Grazie.",
  "contact.support": "Email di supporto",
});

const pt = make({
  "nav.home": "Início",
  "nav.store": "Livraria",
  "nav.gazette": "A Gazeta",
  "nav.majlis": "Fórum cultural",
  "nav.contact": "Contato",
  "nav.privacy": "Política de privacidade",
  "nav.terms": "Termos e condições",
  "nav.account": "Minha conta",
  "nav.admin": "Administração",
  "nav.join": "Junte-se a nós",
  "cart.title": "Carrinho",
  "settings.title": "Configurações",
  "settings.language": "Idioma",
  "settings.theme": "Tema de leitura",
  "settings.theme.gold": "Ouro real escuro",
  "settings.theme.parchment": "Pergaminho antigo",
  "settings.typography": "Tipografia",
  "settings.zen": "Modo foco",
  "settings.lowdata": "Economia de dados",
  "settings.currency": "Moeda",
  "settings.admin": "Painel do admin",
  "contact.title": "Fale conosco",
  "contact.name": "Nome",
  "contact.email": "Seu e-mail",
  "contact.subject": "Assunto",
  "contact.message": "Mensagem",
  "contact.send": "Enviar mensagem",
  "contact.sent": "Recebemos sua mensagem. Obrigado.",
  "contact.support": "E-mail de suporte",
});

const ja = make({
  "nav.home": "ホーム",
  "nav.store": "書店",
  "nav.gazette": "ガゼット",
  "nav.majlis": "文化フォーラム",
  "nav.contact": "お問い合わせ",
  "nav.privacy": "プライバシーポリシー",
  "nav.terms": "利用規約",
  "nav.account": "アカウント",
  "nav.admin": "管理",
  "nav.join": "参加する",
  "cart.title": "カート",
  "settings.title": "設定",
  "settings.language": "言語",
  "settings.theme": "読書テーマ",
  "settings.theme.gold": "ロイヤルダークゴールド",
  "settings.theme.parchment": "古羊皮紙",
  "settings.typography": "文字設定",
  "settings.zen": "集中モード",
  "settings.lowdata": "低データモード",
  "settings.currency": "通貨",
  "settings.admin": "管理パネル",
  "contact.title": "お問い合わせ",
  "contact.name": "お名前",
  "contact.email": "メールアドレス",
  "contact.subject": "件名",
  "contact.message": "メッセージ",
  "contact.send": "送信",
  "contact.sent": "メッセージを受け付けました。ありがとうございます。",
  "contact.support": "サポートメール",
});

const zh = make({
  "nav.home": "首页",
  "nav.store": "书店",
  "nav.gazette": "报刊",
  "nav.majlis": "文化论坛",
  "nav.contact": "联系我们",
  "nav.privacy": "隐私政策",
  "nav.terms": "条款与条件",
  "nav.account": "我的账户",
  "nav.admin": "管理",
  "nav.join": "加入我们",
  "cart.title": "购物车",
  "settings.title": "设置",
  "settings.language": "语言",
  "settings.theme": "阅读主题",
  "settings.theme.gold": "皇家暗金",
  "settings.theme.parchment": "古典羊皮纸",
  "settings.typography": "字体设置",
  "settings.zen": "专注模式",
  "settings.lowdata": "省流量模式",
  "settings.currency": "货币",
  "settings.admin": "管理面板",
  "contact.title": "联系我们",
  "contact.name": "姓名",
  "contact.email": "您的邮箱",
  "contact.subject": "主题",
  "contact.message": "留言",
  "contact.send": "发送",
  "contact.sent": "我们已收到您的留言，谢谢。",
  "contact.support": "支持邮箱",
});

const ru = make({
  "nav.home": "Главная",
  "nav.store": "Книжный магазин",
  "nav.gazette": "Газета",
  "nav.majlis": "Культурный форум",
  "nav.contact": "Контакты",
  "nav.privacy": "Политика конфиденциальности",
  "nav.terms": "Условия использования",
  "nav.account": "Мой аккаунт",
  "nav.admin": "Админ",
  "nav.join": "Присоединиться",
  "cart.title": "Корзина",
  "settings.title": "Настройки",
  "settings.language": "Язык",
  "settings.theme": "Тема чтения",
  "settings.theme.gold": "Королевское тёмное золото",
  "settings.theme.parchment": "Старинный пергамент",
  "settings.typography": "Типографика",
  "settings.zen": "Режим фокуса",
  "settings.lowdata": "Экономия трафика",
  "settings.currency": "Валюта",
  "settings.admin": "Панель администратора",
  "contact.title": "Свяжитесь с нами",
  "contact.name": "Имя",
  "contact.email": "Ваш e-mail",
  "contact.subject": "Тема",
  "contact.message": "Сообщение",
  "contact.send": "Отправить",
  "contact.sent": "Ваше сообщение получено. Спасибо.",
  "contact.support": "Почта поддержки",
});

export const DICTS: Record<LangCode, Dict> = { ar, en, fr, it, pt, ja, zh, ru };

const Ctx = createContext<{ lang: LangCode; t: (k: TransKey) => string }>({
  lang: "ar",
  t: (k) => ar[k],
});

export function I18nProvider({ lang, children }: { lang: LangCode; children: ReactNode }) {
  const value = useMemo(
    () => ({ lang, t: (k: TransKey) => DICTS[lang][k] ?? ar[k] }),
    [lang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}
