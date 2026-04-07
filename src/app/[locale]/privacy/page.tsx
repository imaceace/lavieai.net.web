import { useTranslations } from 'next-intl';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-gray-500 mb-8 pb-8 border-b">{t('lastUpdated')}</p>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-8">{t('content.intro')}</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{t('content.sections.0.title')}</h2>
          <p className="mb-4">{t('content.sections.0.text')}</p>
          <ul className="list-none pl-0 mb-8 space-y-4">
            <li className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <strong className="block text-gray-900 mb-2">{t('content.sections.0.bullets.0').split(':')[0]}</strong> 
              {t('content.sections.0.bullets.0').split(':')[1].split('Note:')[0]}
              {t('content.sections.0.bullets.0').includes('Note:') && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm flex items-start gap-2">
                  <span className="text-amber-500 font-bold">⚠️ Note:</span>
                  <span>{t('content.sections.0.bullets.0').split('Note:')[1]}</span>
                </div>
              )}
            </li>
            <li className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <strong className="block text-gray-900 mb-2">{t('content.sections.0.bullets.1').split(':')[0]}</strong> 
              {t('content.sections.0.bullets.1').split(':')[1]}
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{t('content.sections.1.title')}</h2>
          <p className="mb-8">{t('content.sections.1.text')}</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{t('content.sections.2.title')}</h2>
          <p className="mb-8">{t('content.sections.2.text')}</p>
        </div>
      </div>
    </div>
  );
}
