import { useTranslations } from 'next-intl';

export default function TermsOfServicePage() {
  const t = useTranslations('terms');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-gray-500 mb-8 pb-8 border-b">{t('lastUpdated')}</p>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-8">{t('content.intro')}</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{t('content.sections.0.title')}</h2>
          <p className="mb-8">{t('content.sections.0.text')}</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{t('content.sections.1.title')}</h2>
          <p className="mb-4">{t('content.sections.1.text')}</p>
          <ul className="list-disc pl-6 mb-8 space-y-2">
            <li><strong>{t('content.sections.1.bullets.0').split(':')[0]}:</strong> {t('content.sections.1.bullets.0').split(':')[1]}</li>
            <li><strong>{t('content.sections.1.bullets.1').split(':')[0]}:</strong> {t('content.sections.1.bullets.1').split(':')[1]}</li>
            <li><strong>{t('content.sections.1.bullets.2').split(':')[0]}:</strong> {t('content.sections.1.bullets.2').split(':')[1]}</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{t('content.sections.2.title')}</h2>
          <p className="mb-8">{t('content.sections.2.text')}</p>
        </div>
      </div>
    </div>
  );
}
