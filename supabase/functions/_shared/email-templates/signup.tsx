/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={logo}>Cap<span style={logoAccent}>i</span>mobi</Text></Section>
        <Section style={card}>
          <Heading style={h1}>Bem-vindo ao Capimobi! 🎉</Heading>
          <Text style={text}>
            Estamos felizes em ter você conosco. Para começar a usar a plataforma,
            confirme seu e-mail <strong>{recipient}</strong> clicando no botão abaixo:
          </Text>
          <Section style={buttonWrap}><Button style={button} href={confirmationUrl}>Confirmar meu e-mail</Button></Section>
          <Text style={textSmall}>Ou copie este link no navegador:</Text>
          <Text style={linkText}>{confirmationUrl}</Text>
          <Text style={footer}>Se você não criou esta conta, pode ignorar este e-mail.</Text>
        </Section>
        <Section style={brandFooter}><Text style={brandText}>Capimobi — Plataforma de corretores de imóveis</Text></Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f4f6fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '8px 0 24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#1e40af', margin: '0', letterSpacing: '-0.5px' }
const logoAccent = { color: '#f59e0b' }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 32px', boxShadow: '0 4px 24px rgba(30, 64, 175, 0.08)' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const textSmall = { fontSize: '13px', color: '#64748b', margin: '24px 0 8px' }
const linkText = { fontSize: '12px', color: '#1e40af', wordBreak: 'break-all' as const, backgroundColor: '#f1f5f9', padding: '10px 12px', borderRadius: '8px', margin: '0 0 24px', fontFamily: 'monospace' }
const buttonWrap = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#1e40af', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }
const footer = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }
const brandFooter = { textAlign: 'center' as const, padding: '24px 0 8px' }
const brandText = { fontSize: '13px', color: '#475569', fontWeight: '600' as const, margin: '0' }
