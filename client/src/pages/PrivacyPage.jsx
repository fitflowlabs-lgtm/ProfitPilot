export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      color: '#e8eaf0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="7" fill="#3b82f6"/>
            <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#6b7a99', letterSpacing: '0.12em', marginTop: 3 }}>PROFITABILITY ENGINE</div>
          </div>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, color: '#e8eaf0' }}>Privacy Policy</h1>
        <p style={{ color: '#6b7a99', fontSize: '0.875rem', marginBottom: 40 }}>Last updated: April 2026</p>

        {[
          {
            title: 'Introduction',
            body: 'This Privacy Policy describes how Margin Pilot ("we," "us," or "our") collects, uses, and protects your information when you use our Service.',
          },
          {
            title: 'Information We Collect',
            body: 'Information you provide directly:',
            list: [
              'Name and email address when creating an account',
              'Cost of goods (COGS) data you manually enter for your products',
              'Communications you send to our support team',
            ],
          },
          {
            title: 'Information Collected from Shopify',
            body: 'When you connect your Shopify store, we access and store:',
            list: [
              'Product and variant data including titles, SKUs, and prices',
              'Order history including quantities, revenue, and timestamps',
              'Inventory levels',
              'Your store name and domain',
            ],
            after: 'We do not access customer personal data, payment card information, or any Shopify data beyond what is necessary to provide the Service.',
          },
          {
            title: 'Information Collected Automatically',
            list: [
              'Session data to keep you logged in',
              'Basic usage data to maintain and improve the Service',
            ],
          },
          {
            title: 'How We Use Your Information',
            body: 'We use the information we collect to:',
            list: [
              'Provide, maintain, and improve the Service',
              'Generate margin analysis, pricing recommendations, and inventory insights',
              'Process your subscription payments through Stripe',
              'Respond to your support requests',
              'Send you service-related communications',
              'Comply with legal obligations',
            ],
            after: 'We do not sell your personal information or your store data to third parties.',
          },
          {
            title: 'AI Processing',
            body: 'Margin Pilot uses OpenAI\'s API to generate insights and recommendations. When you request AI analysis, relevant store data is sent to OpenAI for processing. This data is used solely to generate your analysis and is subject to OpenAI\'s data usage policies. We do not use your data to train AI models.',
          },
          {
            title: 'Payment Processing',
            body: 'Payments are processed by Stripe. We do not store your credit card or payment details. Stripe\'s handling of your payment information is governed by Stripe\'s own Privacy Policy.',
          },
          {
            title: 'Data Sharing',
            body: 'We do not sell your personal information. We may share your information only in the following circumstances:',
            list: [
              'With service providers who help us operate the Service (Stripe, OpenAI, our hosting provider), under confidentiality obligations',
              'If required by law, court order, or governmental authority',
              'In connection with a merger, acquisition, or sale of assets, with notice to you',
              'To protect the rights, safety, or property of Margin Pilot or others',
            ],
          },
          {
            title: 'Data Retention',
            body: 'We retain your account and store data for as long as your account is active. If you cancel your account, we retain your data for 30 days before permanent deletion. You may request earlier deletion by contacting us.',
          },
          {
            title: 'Your Rights',
            body: 'You have the right to:',
            list: [
              'Access the personal information we hold about you',
              'Request correction of inaccurate information',
              'Request deletion of your account and associated data',
              'Disconnect your Shopify store at any time through your Shopify admin',
              'Opt out of non-essential communications',
            ],
            after: 'To exercise these rights, contact us at support@marginpilot.co.',
          },
          {
            title: 'Security',
            body: 'We implement industry-standard security measures including encrypted sessions, secure HTTPS connections, and restricted access to your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
          },
          {
            title: 'Shopify Data',
            body: 'Our access to your Shopify store data is governed by Shopify\'s API terms. You can revoke our access at any time by uninstalling the Margin Pilot app from your Shopify admin. Upon revocation, we will cease syncing new data from your store.',
          },
          {
            title: "Children's Privacy",
            body: 'The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors.',
          },
          {
            title: 'Changes to This Policy',
            body: 'We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service. Continued use after changes are posted constitutes your acceptance.',
          },
          {
            title: 'Contact Us',
            body: 'If you have questions about this Privacy Policy or your data:\n\nEmail: support@marginpilot.co\nWebsite: marginpilot.co',
          },
        ].map(({ title, body, list, after }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e8eaf0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {title}
            </h2>
            {body && body.split('\n\n').map((para, i) => (
              <p key={i} style={{ color: '#9aa3b8', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: 8 }}>{para}</p>
            ))}
            {list && (
              <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                {list.map((item) => (
                  <li key={item} style={{ color: '#9aa3b8', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            )}
            {after && <p style={{ color: '#9aa3b8', fontSize: '0.9rem', lineHeight: 1.75, marginTop: 8 }}>{after}</p>}
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'none' }}>Terms of Service</a>
          <a href="/" style={{ color: '#6b7a99', fontSize: '0.85rem', textDecoration: 'none' }}>Back to Margin Pilot</a>
        </div>
      </div>
    </div>
  )
}
