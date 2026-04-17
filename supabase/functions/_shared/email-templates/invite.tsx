/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}><Text style={logo}>Cap<span style={logoAccent}>i</span>mobi</Text></Section>
        <Section style={card}>
          <Heading style={h1}>Você foi convidado! 🎊</Heading>
          <Text style={text}>
            Você recebeu um convite para fazer parte do <strong>{siteName}</strong>.
            Clique no botão abaixo para aceitar e criar sua conta.
          </Text>
          <Section style={buttonWrap}><Button style={button} href={confirmationUrl}>Aceitar convite</Button></Section>
          <Text style={footer}>Se você não esperava este convite, pode ignorar este e-mail.</Text>
        </Section>
        <Section style={brandFooter}><Text style={brandText}>Capimobi — Plataforma de corretores de imóveis</Text></Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#f4f6fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif', padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const header = { textAlign: 'center' as const, padding: '8px 0 24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#1e40af', margin: '0', letterSpacing: '-0.5px' }
const logoAccent = { color: '#f59e0b' }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 32px', boxShadow: '0 4px 24px rgba(30, 64, 175, 0.08)' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const buttonWrap = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: '#1e40af', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }
const footer = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }
const brandFooter = { textAlign: 'center' as const, padding: '24px 0 8px' }
const brandText = { fontSize: '13px', color: '#475569', fontWeight: '600' as const, margin: '0' }
