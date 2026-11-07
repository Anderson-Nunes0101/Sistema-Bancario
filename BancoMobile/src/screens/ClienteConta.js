import React, { useCallback, useEffect, useState } from "react";

import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";

import { MinhaContaAPI, mensagemErro } from "../services/api";
import { moeda, dataHora } from "../utils/formato";

const TAMANHO = 30;

export default function ClienteConta({ recarregar }) {

    const [conta, setConta] = useState(null);
    const [extrato, setExtrato] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [temMais, setTemMais] = useState(false);
    const [aCarregar, setACarregar] = useState(false);

    const carregar = useCallback(async () => {
        setACarregar(true);
        try {
            const [c, e] = await Promise.all([
                MinhaContaAPI.conta(),
                MinhaContaAPI.extrato(0, TAMANHO)
            ]);
            setConta(c.data);
            setExtrato(e.data);
            setPagina(0);
            setTemMais(e.data.length === TAMANHO);
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        } finally {
            setACarregar(false);
        }
    }, []);

    async function maisAntigas() {
        try {
            const prox = pagina + 1;
            const res = await MinhaContaAPI.extrato(prox, TAMANHO);
            setExtrato((atual) => [...atual, ...res.data]);
            setPagina(prox);
            setTemMais(res.data.length === TAMANHO);
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    
    useEffect(() => {
        carregar();
    }, [carregar, recarregar]);

    return (
        <View style={styles.container}>

            {conta && (
                <View style={styles.saldoCard}>
                    <Text style={styles.saldoLabel}>Conta {conta.numeroConta}</Text>
                    <Text style={styles.saldo}>{moeda(conta.saldo)}</Text>
                    <Text style={styles.saldoLabel}>Titular: {conta.titular}</Text>
                </View>
            )}

            <Text style={styles.subtitulo}>Extrato</Text>

            <FlatList
                data={extrato}
                keyExtractor={(item) => item.referencia}
                refreshing={aCarregar}
                onRefresh={carregar}
                renderItem={({ item }) => {
                    const credito = item.sentido === "CREDITO";
                    return (
                        <View style={styles.card}>
                            <View style={styles.linha}>
                                <Text style={styles.tipo}>
                                    {item.tipo === "DEPOSITO"
                                        ? "Depósito"
                                        : credito ? "Transferência recebida" : "Transferência enviada"}
                                </Text>
                                <Text style={credito ? styles.entrada : styles.saida}>
                                    {credito ? "+" : "-"}{moeda(item.valor)}
                                </Text>
                            </View>
                            {!!item.contraparte && (
                                <Text style={styles.detalhe}>
                                    {credito ? "De" : "Para"} conta {item.contraparte}
                                </Text>
                            )}
                            {!!item.descricao && <Text style={styles.detalhe}>{item.descricao}</Text>}
                            <Text style={styles.detalhe}>
                                {dataHora(item.dataHora)}{item.saldoApos != null ? ` · Saldo: ${moeda(item.saldoApos)}` : ""}
                            </Text>
                        </View>
                    );
                }}
                ListEmptyComponent={<Text>Ainda não existem movimentos.</Text>}
                ListFooterComponent={
                    temMais ? (
                        <TouchableOpacity onPress={maisAntigas}>
                            <Text style={styles.link}>Carregar mais antigas</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    saldoCard: { backgroundColor: "#123c70", padding: 20, borderRadius: 12, marginBottom: 10 },
    saldoLabel: { color: "#cfe0f5" },
    saldo: { color: "#fff", fontSize: 32, fontWeight: "bold", marginVertical: 6 },
    subtitulo: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
    card: { backgroundColor: "#eee", padding: 14, borderRadius: 10, marginBottom: 10 },
    linha: { flexDirection: "row", justifyContent: "space-between" },
    tipo: { fontWeight: "bold" },
    entrada: { color: "#15803d", fontWeight: "bold" },
    saida: { color: "#b91c1c", fontWeight: "bold" },
    detalhe: { color: "#555", marginTop: 3 },
    link: { color: "#1455a0", fontWeight: "bold", marginVertical: 12, textAlign: "center" }
});
//hacker-chefao