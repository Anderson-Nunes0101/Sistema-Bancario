import React, { useEffect, useState } from "react";

import {
    View, Text, TextInput, FlatList,
    TouchableOpacity, Alert, StyleSheet
} from "react-native";

import { TransacaoAPI, mensagemErro } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { moeda, dataHora, soDigitos, lerValor } from "../utils/formato";

const TAMANHO = 30;

// Funcionário: depósitos + histórico completo (somente leitura; as transações não se alteram nem apagam)
export default function Transacoes() {

    const { tem } = useAuth();

    const [transacoes, setTransacoes] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [temMais, setTemMais] = useState(false);

    const [destino, setDestino] = useState("");
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");

    async function carregar() {
        try {
            const res = await TransacaoAPI.listar(0, TAMANHO);
            setTransacoes(res.data);
            setPagina(0);
            setTemMais(res.data.length === TAMANHO);
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    async function maisAntigas() {
        try {
            const prox = pagina + 1;
            const res = await TransacaoAPI.listar(prox, TAMANHO);
            setTransacoes((atual) => [...atual, ...res.data]);
            setPagina(prox);
            setTemMais(res.data.length === TAMANHO);
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    async function depositar() {
        const v = lerValor(valor);

        if (!destino || v === null) {
            Alert.alert("Aviso", "Indique a conta e um valor válido (máx. 2 casas decimais).");
            return;
        }

        try {
            const res = await TransacaoAPI.depositar({
                contaDestino: destino,
                valor: v,
                descricao: descricao.trim() || null
            });

            Alert.alert(
                "Depósito efetuado",
                `Referência: ${res.data.referencia}\nNovo saldo: ${moeda(res.data.saldoDestinoApos)}`
            );

            setDestino("");
            setValor("");
            setDescricao("");
            carregar();

        } catch (e) {
            Alert.alert("Erro no depósito", mensagemErro(e));
        }
    }

    useEffect(() => {
        if (tem("TRANSACAO_CONSULTAR")) carregar();
    }, []);

    return (
        <View style={styles.container}>

            <Text style={styles.titulo}>Transações</Text>

            {tem("DEPOSITO_REALIZAR") && (
                <>
                    <Text style={styles.subtitulo}>Novo depósito</Text>

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

                    <TouchableOpacity style={styles.botao} onPress={depositar}>
                        <Text style={styles.botaoTexto}>Depositar</Text>
                    </TouchableOpacity>
                </>
            )}

            {tem("TRANSACAO_CONSULTAR") && (
                <>
                    <View style={styles.linhaTitulo}>
                        <Text style={styles.subtitulo}>Histórico</Text>
                        <TouchableOpacity onPress={carregar}>
                            <Text style={styles.link}>Atualizar</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={transacoes}
                        keyExtractor={(item) => item.referencia}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <Text style={styles.referencia}>Ref: {item.referencia}</Text>
                                <Text>Tipo: {item.tipo}</Text>
                                <Text>Origem: {item.contaOrigem || "—"}</Text>
                                <Text>Destino: {item.contaDestino}</Text>
                                <Text>Valor: {moeda(item.valor)}</Text>
                                <Text>Data: {dataHora(item.dataHora)}</Text>
                                <Text>Estado: {item.estado}</Text>
                                {!!item.executadoPor && <Text>Por: {item.executadoPor}</Text>}
                                {!!item.descricao && <Text>Descrição: {item.descricao}</Text>}
                            </View>
                        )}
                        ListEmptyComponent={<Text>Sem transações registadas.</Text>}
                        ListFooterComponent={
                            temMais ? (
                                <TouchableOpacity onPress={maisAntigas}>
                                    <Text style={styles.link}>Carregar mais antigas</Text>
                                </TouchableOpacity>
                            ) : null
                        }
                    />
                </>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    titulo: { fontSize: 23, fontWeight: "bold", marginBottom: 10 },
    subtitulo: { fontSize: 17, fontWeight: "bold", marginVertical: 10 },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 10 },
    botao: { backgroundColor: "#1455a0", padding: 15, borderRadius: 8, alignItems: "center" },
    botaoTexto: { color: "#fff", fontWeight: "bold" },
    link: { color: "#1455a0", marginVertical: 10, fontWeight: "bold" },
    linhaTitulo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    card: { backgroundColor: "#eee", padding: 15, borderRadius: 10, marginBottom: 12 },
    referencia: { fontWeight: "bold", fontSize: 14, marginBottom: 8 }
});
