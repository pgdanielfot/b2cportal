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
  },
};
