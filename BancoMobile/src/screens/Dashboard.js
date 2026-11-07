
import React, { useEffect, useState } from "react";

import {
    View, Text, StyleSheet,
    TouchableOpacity
} from "react-native";

import {
    ClienteAPI,
    ContaAPI,
    TransacaoAPI
} from "../services/api";

import { useAuth } from "../context/AuthContext";

export default function Dashboard() {

    const { tem } = useAuth();

    const [clientes, setClientes] = useState(0);
    const [contas, setContas] = useState(0);
    const [transacoes, setTransacoes] = useState(0);

    async function carregarResumo() {

       
        const tamanho = (res) => {
            if (res.status !== "fulfilled") return 0;
            const d = res.value.data;
            return (Array.isArray(d) ? d : d.content || []).length;
        };

        const [c, a, t] = await Promise.allSettled([
            tem("CLIENTE_CONSULTAR") ? ClienteAPI.listar() : Promise.reject(),
            tem("CONTA_CONSULTAR") ? ContaAPI.listar() : Promise.reject(),
            tem("TRANSACAO_CONSULTAR") ? TransacaoAPI.listar(0, 200) : Promise.reject()
        ]);

        setClientes(tamanho(c));
        setContas(tamanho(a));
        setTransacoes(tamanho(t));
    }

    useEffect(() => {
        carregarResumo();
    }, []);

    return (

        <View style={styles.container}>

            <Text style={styles.titulo}>
                Painel Principal
            </Text>

            <View style={styles.card}>
                <Text style={styles.label}>Clientes</Text>
                <Text style={styles.numero}>{clientes}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Contas bancárias</Text>
                <Text style={styles.numero}>{contas}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Transações (últimas 200)</Text>
                <Text style={styles.numero}>{transacoes}</Text>
            </View>

            <TouchableOpacity
                style={styles.botao}
                onPress={carregarResumo}
            >
                <Text style={styles.botaoTexto}>
                    Atualizar resumo
                </Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 20
    },

    titulo: {
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 25
    },

    card: {
        padding: 20,
        backgroundColor: "#e8eef7",
        marginBottom: 15,
        borderRadius: 12
    },

    label: {
        fontSize: 16
    },

    numero: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#1455a0"
    },

    botao: {
        backgroundColor: "#1455a0",
        padding: 15,
        borderRadius: 8,
        alignItems: "center"
    },

    botaoTexto: {
        color: "#fff",
        fontWeight: "bold"
    }

});

