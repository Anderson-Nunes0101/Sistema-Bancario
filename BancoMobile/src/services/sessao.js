import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";


const CHAVE = "banco.sessao";
let memoria = null;

export function tokenAtual() {
    return memoria?.token ?? null;
}

export async function guardarSessao(sessao) {
    memoria = sessao;
    if (Platform.OS === "web") return;
    try {
        await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessao));
    } catch (e) {
        console.log("Não foi possível guardar a sessão:", e.message);
    }
}

export async function lerSessao() {
    if (Platform.OS !== "web") {
        try {
            const bruto = await SecureStore.getItemAsync(CHAVE);
            memoria = bruto ? JSON.parse(bruto) : null;
        } catch (e) {
            memoria = null;
        }
    }
    if (memoria && memoria.expiraEm && Date.parse(memoria.expiraEm) <= Date.now()) {
        await limparSessao();
    }
    return memoria;
}

export async function limparSessao() {
    memoria = null;
    if (Platform.OS === "web") return;
    try {
        await SecureStore.deleteItemAsync(CHAVE);
    } catch (e) {
        // ignorar
    }
}
