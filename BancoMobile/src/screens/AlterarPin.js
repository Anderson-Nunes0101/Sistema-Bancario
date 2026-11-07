import React, { useState } from "react";

import {
    View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator
} from "react-native";

import { MinhaContaAPI, mensagemErro } from "../services/api";
import { soDigitos } from "../utils/formato";

export default function AlterarPin() {

    const [atual, setAtual] = useState("");
    const [novo, setNovo] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [aGuardar, setAGuardar] = useState(false);

    async function guardar() {
        if (atual.length !== 4 || novo.length !== 4) {
            Alert.alert("Aviso", "O PIN deve ter exatamente 4 dígitos.");
            return;
        }
        if (novo !== confirmar) {
            Alert.alert("Aviso", "A confirmação não coincide com o novo PIN.");
            return;
        }

        setAGuardar(true);
        try {
            await MinhaContaAPI.alterarPin(atual, novo);
            Alert.alert("Sucesso", "PIN alterado. Use-o no próximo acesso.");
            setAtual("");
            setNovo("");
            setConfirmar("");
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        } finally {
            setAGuardar(false);
        }
    }

    const campo = (placeholder, valor, setValor) => (
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={valor}
            onChangeText={(t) => setValor(soDigitos(t))}
        />
    );

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Alterar PIN</Text>

            {campo("PIN atual", atual, setAtual)}
            {campo("Novo PIN (4 dígitos)", novo, setNovo)}
            {campo("Confirmar novo PIN", confirmar, setConfirmar)}

            <TouchableOpacity style={styles.botao} onPress={guardar} disabled={aGuardar}>
                {aGuardar
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.botaoTexto}>Guardar novo PIN</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    titulo: { fontSize: 23, fontWeight: "bold", marginBottom: 15 },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 10 },
    botao: { backgroundColor: "#1455a0", padding: 15, borderRadius: 8, alignItems: "center" },
    botaoTexto: { color: "#fff", fontWeight: "bold" }
});
