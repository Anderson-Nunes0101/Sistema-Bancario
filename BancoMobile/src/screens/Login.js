import React, { useState } from "react";

import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { mensagemErro } from "../services/api";
import { soDigitos } from "../utils/formato";

export default function Login() {

    const { entrarCliente, entrarFuncionario } = useAuth();

    const [modo, setModo] = useState("CLIENTE");
    const [numeroConta, setNumeroConta] = useState("");
    const [pin, setPin] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [aEntrar, setAEntrar] = useState(false);

    async function entrar() {
        setErro("");

        if (modo === "CLIENTE") {
            if (!numeroConta.trim() || pin.length !== 4) {
                setErro("Indique o número da conta e o PIN de 4 dígitos.");
                return;
            }
        } else if (!email.trim() || !senha) {
            setErro("Indique o email e a senha.");
            return;
        }

        setAEntrar(true);
        try {
            if (modo === "CLIENTE") {
                await entrarCliente(numeroConta, pin);
            } else {
                await entrarFuncionario(email, senha);
            }
        } catch (e) {
            setErro(mensagemErro(e));
            setPin("");
            setSenha("");
        } finally {
            setAEntrar(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Text style={styles.logo}>BANCO MOBILE</Text>
            <Text style={styles.sub}>Aceda à sua conta</Text>

            <View style={styles.tipos}>
                <TouchableOpacity
                    style={[styles.tipoBotao, modo === "CLIENTE" && styles.selecionado]}
                    onPress={() => { setModo("CLIENTE"); setErro(""); }}
                >
                    <Text style={modo === "CLIENTE" && styles.textoSel}>Cliente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tipoBotao, modo === "FUNCIONARIO" && styles.selecionado]}
                    onPress={() => { setModo("FUNCIONARIO"); setErro(""); }}
                >
                    <Text style={modo === "FUNCIONARIO" && styles.textoSel}>Funcionário</Text>
                </TouchableOpacity>
            </View>

            {modo === "CLIENTE" ? (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Número da conta"
                        keyboardType="number-pad"
                        value={numeroConta}
                        onChangeText={(t) => setNumeroConta(soDigitos(t))}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="PIN (4 dígitos)"
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={4}
                        value={pin}
                        onChangeText={(t) => setPin(soDigitos(t))}
                    />
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        secureTextEntry
                        autoCapitalize="none"
                        value={senha}
                        onChangeText={setSenha}
                    />
                </>
            )}

            {!!erro && <Text style={styles.erro}>{erro}</Text>}

            <TouchableOpacity style={styles.botao} onPress={entrar} disabled={aEntrar}>
                {aEntrar
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.botaoTexto}>Entrar</Text>}
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
    logo: { fontSize: 28, fontWeight: "bold", color: "#123c70", textAlign: "center" },
    sub: { textAlign: "center", color: "#666", marginBottom: 25, marginTop: 4 },
    tipos: { flexDirection: "row", gap: 10, marginBottom: 15 },
    tipoBotao: { flex: 1, padding: 12, backgroundColor: "#ddd", alignItems: "center", borderRadius: 8 },
    selecionado: { backgroundColor: "#9bc4f5" },
    textoSel: { fontWeight: "bold" },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 10 },
    erro: { color: "#c00", marginBottom: 10 },
    botao: { backgroundColor: "#1455a0", padding: 15, borderRadius: 8, alignItems: "center" },
    botaoTexto: { color: "#fff", fontWeight: "bold" }
});
