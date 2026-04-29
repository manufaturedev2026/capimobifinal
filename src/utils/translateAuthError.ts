/**
 * Traduz mensagens de erro do Supabase Auth e relacionadas para PT-BR.
 * Usa correspondência por substring para cobrir variações.
 */
const MAP: Array<[RegExp, string]> = [
  // Senhas
  [/password.*(pwned|leaked|breach|data breach|compromis)/i, "Esta senha apareceu em vazamentos públicos. Escolha uma senha diferente para sua segurança."],
  [/password.*(short|too short|at least)/i, "A senha é muito curta. Use pelo menos 6 caracteres."],
  [/password.*(weak|strength|easy)/i, "Senha muito fraca. Combine letras, números e símbolos."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/password.*required/i, "A senha é obrigatória."],

  // Login
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."],
  [/email.*invalid|invalid.*email/i, "E-mail inválido."],
  [/user not found/i, "Usuário não encontrado."],
  [/email.*already.*registered|user already registered/i, "Este e-mail já está cadastrado. Faça login."],

  // Rate limit
  [/rate limit|too many requests|for security purposes/i, "Muitas tentativas. Aguarde alguns minutos e tente novamente."],
  [/email rate limit exceeded/i, "Limite de envio de e-mails atingido. Aguarde alguns minutos."],

  // Tokens / sessão
  [/token.*expired|expired token|otp.*expired/i, "O link expirou. Solicite um novo."],
  [/invalid.*token|token.*invalid|invalid.*otp/i, "Link inválido. Solicite um novo."],
  [/session.*missing|auth session missing/i, "Sessão expirada. Entre novamente."],
  [/jwt.*expired/i, "Sua sessão expirou. Entre novamente."],

  // Cadastro
  [/signup.*disabled|signups not allowed/i, "Cadastros temporariamente desativados."],
  [/anonymous sign-ins are disabled/i, "Cadastro anônimo desativado."],

  // Network
  [/failed to fetch|network ?error|networkerror/i, "Falha de conexão. Verifique sua internet e tente novamente."],
  [/timeout/i, "Tempo de resposta excedido. Tente novamente."],

  // Permissões
  [/permission denied|not allowed|unauthorized/i, "Você não tem permissão para realizar esta ação."],
  [/row.*level.*security|rls/i, "Acesso negado pela política de segurança."],

  // Genéricos
  [/database error/i, "Erro no banco de dados. Tente novamente em instantes."],
  [/internal server error/i, "Erro interno. Tente novamente em instantes."],
];

export function translateAuthError(message: unknown): string {
  if (!message) return "Ocorreu um erro inesperado. Tente novamente.";
  const text = typeof message === "string" ? message : (message as any)?.message || String(message);
  for (const [re, pt] of MAP) {
    if (re.test(text)) return pt;
  }
  // Já está em português? devolve como veio
  if (/[ãõçáéíóúâêô]/i.test(text) || /\b(senha|usuário|e-mail|conta|erro)\b/i.test(text)) {
    return text;
  }
  return "Não foi possível concluir. Tente novamente em instantes.";
}