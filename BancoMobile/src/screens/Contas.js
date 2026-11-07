import React, { useEffect, useState } from "react";

import {
    View, Text, TextInput, FlatList,
    TouchableOpacity, Alert, StyleSheet
} from "react-native";

import { ContaAPI, mensagemErro } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { moeda, soDigitos } from "../utils/formato";

export default function Contas() {

    const { tem } = useAuth();

    const [contas, setContas] = useState([]);
    const [clienteId, setClienteId] = useState("");
    const [pin, setPin] = useState("");

    
    const [pinContaId, setPinContaId] = useState(null);
    const [novoPin, setNovoPin] = useState("");

    async function carregar() {
        try {
            const res = await ContaAPI.listar();
            setContas(Array.isArray(res.data) ? res.data : res.data.content || []);
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    async function criar() {
        if (!clienteId || pin.length !== 4) {
            Alert.alert("Aviso", "Indique o ID do cliente e um PIN de 4 dígitos.");
            return;
        }

        try {
            const res = await ContaAPI.criar(Number(clienteId), pin);
            Alert.alert("Sucesso", `Conta ${res.data.numeroConta} criada!\nEntregue o PIN ao cliente.`);
            setClienteId("");
            setPin("");
            carregar();
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    async function alterarEstado(conta) {
        try {
            if (conta.estado === "ATIVA") {
                await ContaAPI.desativar(conta.id);
            } else {
                await ContaAPI.ativar(conta.id);
            }
            carregar();
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    async function reporPin(conta) {
        if (novoPin.length !== 4) {
            Alert.alert("Aviso", "O PIN deve ter 4 dígitos.");
            return;
        }
        try {
            await ContaAPI.reporPin(conta.id, novoPin);
            Alert.alert("Sucesso", "PIN reposto.");
            setPinContaId(null);
            setNovoPin("");
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    function eliminar(conta) {
        Alert.alert(
            "Eliminar conta",
            `Eliminar a conta ${conta.numeroConta}? Só é possível se não tiver saldo nem movimentos.`,
            [
                { text: "Cancelar" },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        try {
                            await ContaAPI.eliminar(conta.id);
                            carregar();
                        } catch (e) {
                            Alert.alert("Erro", mensagemErro(e));
                        }
                    }
                }
            ]
        );
    }

    useEffect(() => {
        carregar();
    }, []);

    return (
        <View style={styles.container}>

            <Text style={styles.titulo}>Gestão de Contas</Text>

            {tem("CONTA_CRIAR") && (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="ID do cliente"
                        value={clienteId}
                        onChangeText={(t) => setClienteId(soDigitos(t))}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="PIN da conta (4 dígitos)"
                        value={pin}
                        onChangeText={(t) => setPin(soDigitos(t))}
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={4}
                    />
                    <TouchableOpacity style={styles.botao} onPress={criar}>
                        <Text style={styles.botaoTexto}>Criar conta</Text>
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity onPress={carregar}>
                <Text style={styles.atualizar}>Atualizar contas</Text>
            </TouchableOpacity>

            <FlatList
                data={contas}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.numero}>Conta: {item.numeroConta}</Text>
                        <Text>Saldo: {moeda(item.saldo)}</Text>
                        <Text style={item.estado === "ATIVA" ? styles.ativa : styles.inativa}>
                            Estado: {item.estado === "ATIVA" ? "Ativa" : "Inativa"}
                        </Text>
                        <Text>Cliente: {item.clienteNome} (ID {item.clienteId})</Text>

                        <View style={styles.acoes}>
                            {item.estado === "ATIVA"
                                ? tem("CONTA_BLOQUEAR") && (
                                    <TouchableOpacity onPress={() => alterarEstado(item)}>
                                        <Text style={styles.excluir}>Desativar</Text>
                                    </TouchableOpacity>
                                )
                                : tem("CONTA_DESBLOQUEAR") && (
                                    <TouchableOpacity onPress={() => alterarEstado(item)}>
                                        <Text style={styles.ok}>Ativar</Text>
                                    </TouchableOpacity>
                                )}

                            {tem("CONTA_ATUALIZAR") && (
                                <TouchableOpacity onPress={() => { setPinContaId(item.id); setNovoPin(""); }}>
                                    <Text style={styles.link}>Repor PIN</Text>
                                </TouchableOpacity>
                            )}

                            {tem("CONTA_ELIMINAR") && (
                                <TouchableOpacity onPress={() => eliminar(item)}>
                                    <Text style={styles.excluir}>Eliminar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {pinContaId === item.id && (
                            <View style={{ marginTop: 10 }}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Novo PIN (4 dígitos)"
                                    value={novoPin}
                                    onChangeText={(t) => setNovoPin(soDigitos(t))}
                                    keyboardType="number-pad"
                                    secureTextEntry
                                    maxLength={4}
                                />
                                <TouchableOpacity style={styles.botao} onPress={() => reporPin(item)}>
                                    <Text style={styles.botaoTexto}>Guardar PIN</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={<Text>Não existem contas registadas.</Text>}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    titulo: { fontSize: 23, fontWeight: "bold", marginBottom: 15 },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 10, backgroundColor: "#fff" },
    botao: { backgroundColor: "#1455a0", padding: 14, borderRadius: 8, alignItems: "center" },
    botaoTexto: { color: "#fff", fontWeight: "bold" },
    atualizar: { color: "#1455a0", marginVertical: 15 },
    card: { backgroundColor: "#eee", padding: 15, borderRadius: 10, marginBottom: 10 },
    numero: { fontSize: 18, fontWeight: "bold" },
    ativa: { color: "#15803d", fontWeight: "bold" },
    inativa: { color: "#b91c1c", fontWeight: "bold" },
    acoes: { flexDirection: "row", gap: 20, marginTop: 10 },
    link: { color: "#1455a0" },
    ok: { color: "#15803d" },
    excluir: { color: "red" }
});
