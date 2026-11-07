import React, { useState } from "react";

import {
    View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator
} from "react-native";

import { MinhaContaAPI, mensagemErro } from "../services/api";
import { moeda, soDigitos, lerValor } from "../utils/formato";

export default function Transferir({ aoConcluir }) {

    const [destino, setDestino] = useState("");
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [aEnviar, setAEnviar] = useState(false);

    function pedirConfirmacao() {
        const v = lerValor(valor);

        if (!destino || v === null) {
            Alert.alert("Aviso", "Indique a conta de destino e um valor válido (máx. 2 casas decimais).");
            return;
        }

        Alert.alert(
            "Confirmar transferência",
            `Transferir ${moeda(v)} para a conta ${destino}?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Confirmar", onPress: () => enviar(v) }
            ]
        );
    }

    async function enviar(v) {
        setAEnviar(true);
        try {
            const res = await MinhaContaAPI.transferir({
                contaDestino: destino,
                valor: v,
                descricao: descricao.trim() || null
            });

            Alert.alert(
                "Transferência concluída",
                `Referência: ${res.data.referencia}\nNovo saldo: ${moeda(res.data.saldoOrigemApos)}`
            );

            setDestino("");
            setValor("");
            setDescricao("");
            aoConcluir && aoConcluir();

        } catch (e) {
            Alert.alert("Não foi possível transferir", mensagemErro(e));
        } finally {
            setAEnviar(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Transferir dinheiro</Text>

            <TextInput
                style={styles.input}
                placeholder="Conta de destino"
                keyboardType="number-pad"
                value={destino}
                onChangeText={(t) => setDestino(soDigitos(t))}
            />
            <TextInput
                style={styles.input}
                placeholder="Valor (MT)"
                keyboardType="decimal-pad"
                value={valor}
                onChangeText={setValor}
            />
            <TextInput
                style={styles.input}
                placeholder="Descrição (opcional)"
                maxLength={140}
                value={descricao}
                onChangeText={setDescricao}
            />

            <TouchableOpacity style={styles.botao} onPress={pedirConfirmacao} disabled={aEnviar}>
                {aEnviar
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.botaoTexto}>Transferir</Text>}
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
