// Tipos compartilhados entre frontend e backend
export interface DadosAluno {
  nome: string;
  matricula: string;
  curso: string;
  campus: string;
  nivel: string;
  periodoAtual: string;
  ira?: number;
}

export interface Disciplina {
  codigo: string;
  nome: string;
  turma: string;
  ch: number;
  situacao: string;
}

export interface Nota {
  disciplina: string;
  unidade: string;
  nota: number | null;
  falta: number;
}

export interface Frequencia {
  disciplina: string;
  totalAulas: number;
  faltas: number;
  frequenciaPercentual: number;
}

export interface Horario {
  dia: string;
  horario: string;
  disciplina: string;
  professor: string;
  sala: string;
}

export interface HistoricoItem {
  periodo: string;
  disciplina: string;
  nota: number;
  faltas: number;
  situacao: string;
}

export interface DadosCompletos {
  aluno: DadosAluno;
  disciplinas: Disciplina[];
  notas: Nota[];
  frequencia: Frequencia[];
  horarios: Horario[];
  historico: HistoricoItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  step?: string;
}
