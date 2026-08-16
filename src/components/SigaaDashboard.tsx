import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DadosCompletos, ApiResponse, Nota, Disciplina, Frequencia, Horario, HistoricoItem } from "../types/sigaa";

const API_BASE = "/api/sigaa";

// ─── Helpers ────────────────────────────────────────────────────
function gradeColor(nota: number | null): string {
  if (nota === null) return "var(--color-text-tertiary)";
  if (nota >= 7) return "#10b981";
  if (nota >= 5) return "#f59e0b";
  return "#ef4444";
}

function freqColor(pct: number): string {
  if (pct >= 75) return "#10b981";
  if (pct >= 60) return "#f59e0b";
  return "#ef4444";
}

function situacaoBadge(s: string): { bg: string; text: string } {
  const lower = s.toLowerCase();
  if (lower.includes("aprov")) return { bg: "rgba(16,185,129,0.12)", text: "#10b981" };
  if (lower.includes("reprov") || lower.includes("reprov")) return { bg: "rgba(239,68,68,0.12)", text: "#ef4444" };
  if (lower.includes("cursan") || lower.includes("matricul")) return { bg: "rgba(10,114,239,0.12)", text: "#0a72ef" };
  return { bg: "rgba(255,255,255,0.06)", text: "var(--color-text-secondary)" };
}

const diasOrdenados = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ─── Componente Principal ───────────────────────────────────────
export default function SigaaDashboard() {
  const [step, setStep] = useState<"login" | "loading" | "dashboard" | "error">("login");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<DadosCompletos | null>(null);
  const [aba, setAba] = useState<"visao" | "notas" | "frequencia" | "horarios" | "historico">("visao");
  const [salvarCredenciais, setSalvarCredenciais] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Carregar credenciais salvas
  useEffect(() => {
    const saved = localStorage.getItem("sigaa_matricula");
    if (saved) {
      setMatricula(saved);
      setSalvarCredenciais(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula.trim() || !senha.trim()) {
      setErro("Preencha matrícula e senha.");
      return;
    }
    setErro("");
    setStep("loading");

    try {
      if (salvarCredenciais) {
        localStorage.setItem("sigaa_matricula", matricula);
      } else {
        localStorage.removeItem("sigaa_matricula");
      }

      // Timeout de 120s (Puppeteer pode demorar)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);

      const res = await fetch(`${API_BASE}/dados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula: matricula.trim(), senha }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const texto = await res.text().catch(() => "");
        throw new Error(texto || `Erro ${res.status} do servidor`);
      }

      const json: ApiResponse<DadosCompletos> = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error ?? "Erro ao buscar dados.");
      }

      setDados(json.data);
      setStep("dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro de conexão com o servidor.";
      setErro(msg);
      setStep("error");
    }
  };

  const handleLogout = () => {
    setDados(null);
    setSenha("");
    setStep("login");
  };

  // ─── Tela de Login ───────────────────────────────────────────
  if (step === "login" || step === "error") {
    return (
      <section id="sigaa" className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />
        <div className="mx-auto max-w-[480px] px-6 py-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-3">
              IFC Dashboard
            </h2>
            <p className="text-[clamp(24px,4vw,36px)] font-black tracking-[-0.03em] mb-2">
              Seu SIGAA,{" "}
              <span className="font-[family-name:var(--font-cinzel)] text-[--color-accent]">
                simplificado
              </span>
              .
            </p>
            <p className="text-[14px] text-[--color-text-secondary]">
              Notas, frequência, horários e histórico — tudo num lugar só.
            </p>
          </motion.div>

          {/* Card de login */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-8"
          >
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Matrícula */}
              <div>
                <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                  Matrícula
                </label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Sua matrícula do SIGAA"
                  className="sigaa-input"
                  autoFocus
                />
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Senha do SIGAA"
                    className="sigaa-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-tertiary] hover:text-[--color-text] transition-colors"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.79 11.79 0 013.875-5.325M6.58 6.58L3 3m3.58 3.58l1.42 1.42m0 0A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.37 4.87M9.88 9.88a3 3 0 104.24 4.24" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-[--color-text-tertiary] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={salvarCredenciais}
                    onChange={(e) => setSalvarCredenciais(e.target.checked)}
                    className="rounded border-[--color-border] bg-transparent accent-[--color-accent]"
                  />
                  Lembrar matrícula
                </label>
                <span className="text-[--color-text-tertiary]">
                  🔒 Seus dados nunca são armazenados no servidor
                </span>
              </div>

              {/* Erro */}
              <AnimatePresence>
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400"
                  >
                    {erro}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão */}
              <button type="submit" className="btn-primary w-full justify-center text-sm py-3">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Acessar Dashboard
              </button>
            </form>

            <p className="mt-5 text-[11px] text-center text-[--color-text-tertiary] leading-relaxed">
              Este sistema faz login no SIGAA do IFC usando Puppeteer e exibe
              seus dados de forma simplificada. Suas credenciais não são armazenadas.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <section id="sigaa" className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />
        <div className="mx-auto max-w-[480px] px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10"
          >
            <div className="sigaa-spinner mx-auto mb-6" />
            <p className="text-sm text-[--color-text-secondary] mb-1">Conectando ao SIGAA...</p>
            <p className="text-[11px] text-[--color-text-tertiary]">
              Isso pode levar alguns segundos. Estamos burlando o Radware e coletando seus dados.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────────
  if (!dados) return null;

  const { aluno, disciplinas, notas, frequencia, horarios, historico } = dados;
  const ira = aluno.ira ?? calcularIRA(notas);

  const tabs = [
    { key: "visao", label: "Visão Geral", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
    { key: "notas", label: "Notas", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { key: "frequencia", label: "Frequência", icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { key: "horarios", label: "Horários", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "historico", label: "Histórico", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M16 3H8L7 7h10l-1-4z" },
  ] as const;

  return (
    <section id="sigaa" className="relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-2">
                IFC Dashboard
              </h2>
              <p className="text-[clamp(22px,3vw,32px)] font-black tracking-[-0.03em]">
                Olá, {aluno.nome.split(" ")[0]} 👋
              </p>
            </div>
            <button onClick={handleLogout} className="btn-secondary text-xs !py-2 !px-4">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
          <p className="text-sm text-[--color-text-secondary]">
            {aluno.curso} • {aluno.matricula} • {aluno.periodoAtual}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 mb-8 overflow-x-auto scrollbar-none"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              className={`sigaa-tab ${aba === t.key ? "active" : ""}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Conteúdo das Abas */}
        <AnimatePresence mode="wait">
          {aba === "visao" && <VisaoGeral key="visao" aluno={aluno} disciplinas={disciplinas} frequencia={frequencia} ira={ira} />}
          {aba === "notas" && <NotasTab key="notas" notas={notas} disciplinas={disciplinas} />}
          {aba === "frequencia" && <FrequenciaTab key="frequencia" frequencia={frequencia} />}
          {aba === "horarios" && <HorariosTab key="horarios" horarios={horarios} />}
          {aba === "historico" && <HistoricoTab key="historico" historico={historico} />}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Calcular IRA ───────────────────────────────────────────────
function calcularIRA(notas: Nota[]): number | null {
  const validas = notas.filter((n) => n.nota !== null).map((n) => n.nota!);
  if (validas.length === 0) return null;
  return Math.round((validas.reduce((a, b) => a + b, 0) / validas.length) * 10) / 10;
}

// ─── Visão Geral ────────────────────────────────────────────────
function VisaoGeral({
  aluno,
  disciplinas,
  frequencia,
  ira,
}: {
  aluno: DadosCompletos["aluno"];
  disciplinas: DadosCompletos["disciplinas"];
  frequencia: DadosCompletos["frequencia"];
  ira: number | null;
}) {
  const freqGeral = frequencia.length > 0
    ? Math.round(frequencia.reduce((a, f) => a + f.frequenciaPercentual, 0) / frequencia.length)
    : null;

  const cards = [
    {
      label: "IRA",
      valor: ira !== null ? ira.toFixed(1) : "--",
      cor: ira !== null && ira >= 7 ? "#10b981" : ira !== null ? "#f59e0b" : "var(--color-text-tertiary)",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      label: "Frequência",
      valor: freqGeral !== null ? `${freqGeral.toFixed(1)}%` : "--",
      cor: freqGeral !== null && freqGeral >= 75 ? "#10b981" : "#ef4444",
      icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      label: "Disciplinas",
      valor: String(disciplinas.length),
      cor: "#0a72ef",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
    {
      label: "Período",
      valor: aluno.periodoAtual || "--",
      cor: "var(--color-accent)",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-8"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[--color-text-tertiary]">
                {c.label}
              </span>
              <svg className="h-4 w-4" style={{ color: c.cor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
              </svg>
            </div>
            <p className="text-2xl font-black tracking-[-0.02em]" style={{ color: c.cor }}>
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Disciplinas atuais */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold mb-4">Disciplinas do Período</h3>
        <div className="space-y-2">
          {disciplinas.length === 0 && (
            <p className="text-sm text-[--color-text-tertiary]">Nenhuma disciplina encontrada.</p>
          )}
          {disciplinas.map((d) => (
            <div
              key={d.codigo}
              className="flex items-center justify-between py-2 border-b border-[--color-border] last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{d.nome}</p>
                <p className="text-[11px] text-[--color-text-tertiary]">
                  {d.codigo} • {d.ch}h
                </p>
              </div>
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: situacaoBadge(d.situacao).bg,
                  color: situacaoBadge(d.situacao).text,
                }}
              >
                {d.situacao}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Notas ──────────────────────────────────────────────────────
function NotasTab({ notas, disciplinas }: { notas: Nota[]; disciplinas: Disciplina[] }) {
  if (notas.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center">
        <p className="text-sm text-[--color-text-tertiary]">Nenhuma nota disponível no momento.</p>
      </motion.div>
    );
  }

  // Agrupa notas por disciplina
  const porDisciplina = new Map<string, Nota[]>();
  notas.forEach((n) => {
    const existente = porDisciplina.get(n.disciplina) ?? [];
    existente.push(n);
    porDisciplina.set(n.disciplina, existente);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="grid gap-4 md:grid-cols-2"
    >
      {[...porDisciplina.entries()].map(([disc, notasDisc]) => (
        <div key={disc} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">{disc}</h3>
          <div className="space-y-2">
            {notasDisc.map((n, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[--color-text-secondary]">{n.unidade}</span>
                <span className="font-mono font-semibold" style={{ color: gradeColor(n.nota) }}>
                  {n.nota !== null ? n.nota.toFixed(1) : "--"}
                </span>
              </div>
            ))}
            {/* Média */}
            {notasDisc.filter((n) => n.nota !== null).length > 0 && (
              <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-[--color-border]">
                <span className="font-semibold">Média</span>
                <span className="font-mono font-bold text-sm" style={{
                  color: gradeColor(
                    notasDisc.filter((n) => n.nota !== null).reduce((a, b) => a + (b.nota ?? 0), 0) /
                    notasDisc.filter((n) => n.nota !== null).length
                  ),
                }}>
                  {(
                    notasDisc.filter((n) => n.nota !== null).reduce((a, b) => a + (b.nota ?? 0), 0) /
                    notasDisc.filter((n) => n.nota !== null).length
                  ).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Frequência ─────────────────────────────────────────────────
function FrequenciaTab({ frequencia }: { frequencia: Frequencia[] }) {
  if (frequencia.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center">
        <p className="text-sm text-[--color-text-tertiary]">Nenhum dado de frequência disponível.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="glass-card p-6"
    >
      <div className="space-y-5">
        {frequencia.map((f, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{f.disciplina}</span>
              <span className="text-xs font-mono font-semibold" style={{ color: freqColor(f.frequenciaPercentual) }}>
                {f.frequenciaPercentual.toFixed(1)}%
              </span>
            </div>
            <div className="sigaa-progress">
              <div
                className="sigaa-progress-fill"
                style={{
                  width: `${Math.min(f.frequenciaPercentual, 100)}%`,
                  background: freqColor(f.frequenciaPercentual),
                }}
              />
            </div>
            <p className="text-[11px] text-[--color-text-tertiary] mt-1">
              {f.faltas} faltas em {f.totalAulas} aulas
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Horários ───────────────────────────────────────────────────
function HorariosTab({ horarios }: { horarios: Horario[] }) {
  if (horarios.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center">
        <p className="text-sm text-[--color-text-tertiary]">Nenhum horário disponível.</p>
      </motion.div>
    );
  }

  // Agrupa por dia
  const porDia = new Map<string, Horario[]>();
  horarios.forEach((h) => {
    const existente = porDia.get(h.dia) ?? [];
    existente.push(h);
    porDia.set(h.dia, existente);
  });

  const dias = diasOrdenados.filter((d) => porDia.has(d));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {dias.map((dia) => (
        <div key={dia} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3 text-[--color-accent]">{dia}</h3>
          <div className="space-y-3">
            {(porDia.get(dia) ?? []).map((h, i) => (
              <div key={i} className="text-xs border-l-2 border-[--color-border] pl-3">
                <p className="font-medium text-[--color-text]">{h.disciplina || "—"}</p>
                <p className="text-[--color-text-tertiary]">{h.horario}</p>
                {(h.professor || h.sala) && (
                  <p className="text-[--color-text-tertiary]">
                    {[h.professor, h.sala ? `Sala ${h.sala}` : ""].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Histórico ──────────────────────────────────────────────────
function HistoricoTab({ historico }: { historico: HistoricoItem[] }) {
  if (historico.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-10 text-center">
        <p className="text-sm text-[--color-text-tertiary]">Nenhum histórico disponível.</p>
      </motion.div>
    );
  }

  // Agrupa por período (ordem reversa)
  const periodos = new Map<string, HistoricoItem[]>();
  historico.forEach((h) => {
    const existente = periodos.get(h.periodo) ?? [];
    existente.push(h);
    periodos.set(h.periodo, existente);
  });

  const periodosOrdenados = [...periodos.keys()].sort().reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6"
    >
      {periodosOrdenados.map((periodo) => (
        <div key={periodo} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3 text-[--color-accent]">{periodo}</h3>
          <div className="overflow-x-auto">
            <table className="sigaa-table">
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th className="text-right">Nota</th>
                  <th className="text-right">Faltas</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {(periodos.get(periodo) ?? []).map((h, i) => (
                  <tr key={i}>
                    <td className="font-medium">{h.disciplina}</td>
                    <td className="text-right font-mono" style={{ color: gradeColor(h.nota) }}>
                      {h.nota.toFixed(1)}
                    </td>
                    <td className="text-right font-mono text-[--color-text-tertiary]">
                      {h.faltas}
                    </td>
                    <td>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: situacaoBadge(h.situacao).bg,
                          color: situacaoBadge(h.situacao).text,
                        }}
                      >
                        {h.situacao}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
