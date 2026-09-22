export type Language = "en" | "ms" | "zh";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "zh", label: "中文 (Mandarin)" },
];

type Dictionary = {
  chooseLanguage: string;
  chooseLanguageHint: string;
  back: string;
  next: string;
  proceed: string;
  submit: string;
  submitting: string;
  uploading: string;
  required: string;
  selectPlaceholder: string;
  thankYou: string;
  submissionReceived: string;
  uploadedFiles: string;
  alreadySubmitted: string;
  alreadySubmittedDesc: string;
  viewAdSamples: string;
  disclaimerAgree: string;
  campaignSetup: string;
  beforeWeStart: string;
  campaignIntakeHint: string;
  preferredLanguage: string;
  fullName: string;
  agentId: string;
  continueToMaterials: string;
  saving: string;
  liveAdPreview: string;
  feed: string;
  story: string;
  storyImage: string;
  storyVideo: string;
  visualGuide: string;
  previewPlaceholder: string;
  uploadCreativeHint: string;
  campaignCaptionHint: string;
  learnMore: string;
  paragraphHint: string;
  campaignWorkspace: string;
  yourCampaign: string;
  campaignAds: string;
  completed: string;
  ready: string;
  campaignAd: string;
  notStarted: string;
  addCampaign: string;
  reviewSubmission: string;
  materialsReady: string;
  addCampaignDetails: string;
  campaignBriefHint: string;
  imageNeedsResizing: string;
  videoNeedsResizing: string;
  placementNeedsSize: string;
  videosCannotCrop: string;
  resizeAutomatically: string;
  cropManually: string;
  removeThisFile: string;
  fileHasDimensions: string;
  requiredSize: string;
};

export const translations: Record<Language, Dictionary> = {
  en: {
    chooseLanguage: "Choose your language",
    chooseLanguageHint: "Pilih bahasa anda · 请选择您的语言",
    back: "Back",
    next: "Next",
    proceed: "Proceed",
    submit: "Submit",
    submitting: "Submitting...",
    uploading: "Uploading...",
    required: "required",
    selectPlaceholder: "Select...",
    thankYou: "Thank you!",
    submissionReceived: "Your submission has been received.",
    uploadedFiles: "Uploaded files",
    alreadySubmitted: "Already submitted",
    alreadySubmittedDesc: "This form has already been completed.",
    viewAdSamples: "View ad samples",
    disclaimerAgree: "I have read and agreed to the above.",
    campaignSetup: "Campaign setup",
    beforeWeStart: "Before we start",
    campaignIntakeHint: "Choose your language and provide your details once. They will be used for all campaign material submissions.",
    preferredLanguage: "Preferred language",
    fullName: "Full name",
    agentId: "Agent ID",
    continueToMaterials: "Continue to campaign materials",
    saving: "Saving...",
    liveAdPreview: "Live Ad Preview",
    feed: "Feed",
    story: "Story",
    storyImage: "Story image",
    storyVideo: "Story video",
    visualGuide: "Live visual guide only. The final display can vary by device and platform settings.",
    previewPlaceholder: "Preview placeholder",
    uploadCreativeHint: "Upload creative to see your ad",
    campaignCaptionHint: "Your campaign caption will appear here.",
    learnMore: "Learn More",
    paragraphHint: "You can write multiple paragraphs — press Enter to start a new line.",
    campaignWorkspace: "Campaign workspace",
    yourCampaign: "Your Campaign",
    campaignAds: "Campaign ads",
    completed: "Completed",
    ready: "Ready",
    campaignAd: "Campaign ad",
    notStarted: "Not started",
    addCampaign: "Add campaign",
    reviewSubmission: "Review submission",
    materialsReady: "Your materials are ready to review.",
    addCampaignDetails: "Add your campaign details and creative materials.",
    campaignBriefHint: "Complete the required details below to prepare your campaign.",
    imageNeedsResizing: "Image needs resizing",
    videoNeedsResizing: "Video needs a different size",
    placementNeedsSize: "This placement needs",
    videosCannotCrop: "Videos cannot be cropped here.",
    resizeAutomatically: "Resize automatically",
    cropManually: "Crop manually",
    removeThisFile: "Remove this file",
    fileHasDimensions: "has dimensions",
    requiredSize: "Required size",
  },
  ms: {
    chooseLanguage: "Pilih bahasa anda",
    chooseLanguageHint: "Choose your language · 请选择您的语言",
    back: "Kembali",
    next: "Seterusnya",
    proceed: "Teruskan",
    submit: "Hantar",
    submitting: "Menghantar...",
    uploading: "Memuat naik...",
    required: "wajib",
    selectPlaceholder: "Pilih...",
    thankYou: "Terima kasih!",
    submissionReceived: "Penyerahan anda telah diterima.",
    uploadedFiles: "Fail dimuat naik",
    alreadySubmitted: "Sudah dihantar",
    alreadySubmittedDesc: "Borang ini telah pun lengkap dihantar.",
    viewAdSamples: "Lihat contoh iklan",
    disclaimerAgree: "Saya telah membaca dan bersetuju dengan perkara di atas.",
    campaignSetup: "Persediaan kempen",
    beforeWeStart: "Sebelum kita bermula",
    campaignIntakeHint: "Pilih bahasa anda dan berikan maklumat anda sekali sahaja. Ia akan digunakan untuk semua penyerahan bahan kempen.",
    preferredLanguage: "Bahasa pilihan",
    fullName: "Nama penuh",
    agentId: "ID ejen",
    continueToMaterials: "Teruskan ke bahan kempen",
    saving: "Menyimpan...",
    liveAdPreview: "Pratonton Iklan Langsung",
    feed: "Suapan",
    story: "Cerita",
    storyImage: "Imej cerita",
    storyVideo: "Video cerita",
    visualGuide: "Panduan visual langsung sahaja. Paparan akhir mungkin berbeza mengikut peranti dan tetapan platform.",
    previewPlaceholder: "Ruang pratonton",
    uploadCreativeHint: "Muat naik bahan kreatif untuk melihat iklan anda",
    campaignCaptionHint: "Kapsyen kempen anda akan dipaparkan di sini.",
    learnMore: "Ketahui Lebih Lanjut",
    paragraphHint: "Anda boleh menulis beberapa perenggan — tekan Enter untuk memulakan baris baharu.",
    campaignWorkspace: "Ruang kerja kempen",
    yourCampaign: "Kempen Anda",
    campaignAds: "Iklan kempen",
    completed: "Selesai",
    ready: "Sedia",
    campaignAd: "Iklan kempen",
    notStarted: "Belum bermula",
    addCampaign: "Tambah kempen",
    reviewSubmission: "Semak penyerahan",
    materialsReady: "Bahan anda sedia untuk disemak.",
    addCampaignDetails: "Tambahkan butiran kempen dan bahan kreatif anda.",
    campaignBriefHint: "Lengkapkan butiran yang diperlukan di bawah untuk menyediakan kempen anda.",
    imageNeedsResizing: "Imej perlu diubah saiz",
    videoNeedsResizing: "Video memerlukan saiz yang berbeza",
    placementNeedsSize: "Penempatan ini memerlukan",
    videosCannotCrop: "Video tidak boleh dipangkas di sini.",
    resizeAutomatically: "Ubah saiz secara automatik",
    cropManually: "Pangkas secara manual",
    removeThisFile: "Buang fail ini",
    fileHasDimensions: "mempunyai dimensi",
    requiredSize: "Saiz diperlukan",
  },
  zh: {
    chooseLanguage: "请选择您的语言",
    chooseLanguageHint: "Choose your language · Pilih bahasa anda",
    back: "上一步",
    next: "下一步",
    proceed: "继续",
    submit: "提交",
    submitting: "提交中...",
    uploading: "上传中...",
    required: "必填",
    selectPlaceholder: "请选择...",
    thankYou: "谢谢！",
    submissionReceived: "您的提交已收到。",
    uploadedFiles: "已上传的文件",
    alreadySubmitted: "已提交",
    alreadySubmittedDesc: "此表格已完成提交。",
    viewAdSamples: "查看广告示例",
    disclaimerAgree: "我已阅读并同意以上内容。",
    campaignSetup: "广告设置",
    beforeWeStart: "开始前",
    campaignIntakeHint: "请选择您的语言，并一次性填写您的资料。这些资料将用于所有广告素材提交。",
    preferredLanguage: "首选语言",
    fullName: "姓名",
    agentId: "经纪人编号",
    continueToMaterials: "继续填写广告素材",
    saving: "保存中...",
    liveAdPreview: "实时广告预览",
    feed: "动态",
    story: "快拍",
    storyImage: "快拍图片",
    storyVideo: "快拍视频",
    visualGuide: "此为实时视觉指引，最终展示可能因设备和平台设置而异。",
    previewPlaceholder: "预览占位图",
    uploadCreativeHint: "上传广告素材以预览您的广告",
    campaignCaptionHint: "您的广告文案将显示在这里。",
    learnMore: "了解更多",
    paragraphHint: "您可以输入多个段落，按 Enter 键开始新的一行。",
    campaignWorkspace: "广告工作区",
    yourCampaign: "您的广告活动",
    campaignAds: "广告数量",
    completed: "已完成",
    ready: "待完成",
    campaignAd: "广告",
    notStarted: "未开始",
    addCampaign: "添加广告",
    reviewSubmission: "查看提交内容",
    materialsReady: "您的素材已准备好供您查看。",
    addCampaignDetails: "填写广告详情并上传创意素材。",
    campaignBriefHint: "请填写以下必填资料以准备您的广告活动。",
    imageNeedsResizing: "图片需要调整尺寸",
    videoNeedsResizing: "视频尺寸不符合要求",
    placementNeedsSize: "此广告位需要",
    videosCannotCrop: "视频无法在此处裁剪。",
    resizeAutomatically: "自动调整尺寸",
    cropManually: "手动裁剪",
    removeThisFile: "移除此文件",
    fileHasDimensions: "尺寸为",
    requiredSize: "所需尺寸",
  },
};

const commonContent: Record<Exclude<Language, "en">, Record<string, string>> = {
  ms: {
    "campaign details": "Butiran kempen",
    "materials submission": "Penyerahan bahan",
    "where would you like to advertise? — listing / agent profile url": "Di manakah anda ingin beriklan? — URL senarai hartanah / profil ejen",
    "platform": "Platform",
    "advertise as": "Beriklan sebagai",
    "start date": "Tarikh mula",
    "ad caption": "Kapsyen iklan",
    "feed image": "Imej suapan",
    "story image": "Imej cerita",
    "story video (optional)": "Video cerita (pilihan)",
    "additional notes": "Nota tambahan",
    "contact us": "Hubungi Kami",
    "sign up": "Daftar",
    "book now": "Tempah Sekarang",
    "get offer": "Dapatkan Tawaran",
    "get quote": "Dapatkan Sebut Harga",
  },
  zh: {
    "campaign details": "广告详情",
    "materials submission": "素材提交",
    "where would you like to advertise? — listing / agent profile url": "您想在哪里投放广告？— 房源 / 经纪人资料链接",
    "platform": "平台",
    "advertise as": "广告品牌",
    "start date": "开始日期",
    "ad caption": "广告文案",
    "feed image": "动态图片",
    "story image": "快拍图片",
    "story video (optional)": "快拍视频（可选）",
    "additional notes": "附加说明",
    "contact us": "联系我们",
    "sign up": "注册",
    "book now": "立即预订",
    "get offer": "获取优惠",
    "get quote": "获取报价",
  },
};

/** Translates standard campaign terminology when the FOT has not supplied a custom field translation. */
export function localizeCommonContent(value: string, language: Language): string {
  if (language === "en") return value;
  return commonContent[language][value.trim().toLowerCase()] ?? value;
}
