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

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Subscription Switch, Refund Settlement & Timing</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 text-sm">
            <ul className="list-disc pl-5 space-y-2">
              <li>When you switch paid subscription plans (tier upgrade or billing-cycle switch), the new subscription takes effect upon successful payment confirmation.</li>
              <li>Your previous subscription may be canceled and settled automatically according to remaining refundable credits under our current refund policy.</li>
              <li>Refund settlement is processed through payment channels and typically arrives within 3-7 business days, subject to provider and issuer processing.</li>
              <li>If automatic settlement cannot be completed immediately due to payment-channel issues, we may retry processing and/or route the case for manual review.</li>
              <li>For mistaken upgrades, contacting support within 24 hours enables priority review, but does not guarantee instant channel settlement.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
