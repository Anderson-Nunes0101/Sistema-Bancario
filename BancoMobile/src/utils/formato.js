export function moeda(valor) {
    const n = Number(valor ?? 0);
    const [inteiro, decimais] = n.toFixed(2).split(".");
    return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + decimais + " MT";
}

// "2026-11-05T15:54:12.123" -> "05/11/2026 15:54"
export function dataHora(iso) {
    if (!iso) return "";
    const s = String(iso);
    return s.slice(0, 10).split("-").reverse().join("/") + " " + s.slice(11, 16);
}

export function soDigitos(texto) {
    return texto.replace(/\D/g, "");
}

// Aceita "10,5" ou "10.50"; devolve número ou null se inválido (máx. 2 casas decimais)
export function lerValor(texto) {
    const t = String(texto).trim().replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
    const n = Number(t);
    return n > 0 ? n : null;
}
