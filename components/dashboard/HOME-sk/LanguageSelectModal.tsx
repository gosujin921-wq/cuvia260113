import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, SupportedLanguage } from '@/src/i18n';

type Props = {
  onSelect: (lang: SupportedLanguage) => void;
};

const LanguageSelectModal = ({ onSelect }: Props) => {
  const { i18n } = useTranslation();

  const handleSelect = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // storage might be unavailable (private mode, etc.) — fall back silently
    }
    onSelect(lang);
  };

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-select-title"
    >
      <div
        className="gradient-border-right-bottom rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          minWidth: '420px',
        }}
      >
        <div className="px-7 pt-6 pb-2 text-center">
          <p
            id="language-select-title"
            className="text-gray-900 font-bold leading-relaxed"
            style={{ fontSize: '18px' }}
          >
            언어를 선택해주세요 / Please select a language
          </p>
          <p className="text-gray-700 text-xs leading-relaxed mt-2">
            CUVIA 튜토리얼에서 사용할 언어를 선택해주세요.
            <br />
            Choose the language you would like to use for the CUVIA tutorial.
          </p>
        </div>
        <div className="px-7 py-5 flex items-stretch gap-3 justify-center">
          <button
            type="button"
            onClick={() => handleSelect('ko')}
            className="flex-1 px-6 py-4 rounded-lg text-sm font-semibold bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 transition-colors flex flex-col items-center gap-1"
            aria-label="한국어 선택"
            tabIndex={0}
          >
            <span className="text-base">🇰🇷</span>
            <span>한국어</span>
            <span className="text-[11px] font-normal text-gray-500">Korean</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className="flex-1 px-6 py-4 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors flex flex-col items-center gap-1"
            aria-label="Select English"
            tabIndex={0}
          >
            <span className="text-base">🇺🇸</span>
            <span>English</span>
            <span className="text-[11px] font-normal text-white/80">영어</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectModal;
