import React, { useEffect, useState } from "react";

import {
    View, Text, TextInput, FlatList,
    TouchableOpacity, Alert, StyleSheet
} from "react-native";

import { ClienteAPI, mensagemErro } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Clientes() {

    const { tem } = useAuth();

    const [clientes, setClientes] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [nome, setNome] = useState("");
    const [bi, setBi] = useState("");
    const [numero, setNumero] = useState("");
    const [email, setEmail] = useState("");

    async function carregar() {
        try {
            const res = await ClienteAPI.listar();
            setClientes(Array.isArray(res.data) ? res.data : res.data.content || []);
        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    function limpar() {
        setEditandoId(null);
        setNome("");
        setBi("");
        setNumero("");
        setEmail("");
    }

    function editar(item) {
        setEditandoId(item.id);
        setNome(item.nome);
        setBi(item.bi);
        setNumero(item.numero);
        setEmail(item.email);
    }

    async function guardar() {
        if (!nome || !bi || !numero || !email) {
            Alert.alert("Aviso", "Preencha todos os campos.");
            return;
        }

        try {
            const dados = { nome, bi, numero, email, estado: "ATIVO" };

            if (editandoId) {
                await ClienteAPI.atualizar(editandoId, dados);
                Alert.alert("Sucesso", "Cliente atualizado!");
            } else {
                await ClienteAPI.criar(dados);
                Alert.alert("Sucesso", "Cliente registado!");
            }

            limpar();
            carregar();

        } catch (e) {
            Alert.alert("Erro", mensagemErro(e));
        }
    }

    function eliminar(id) {
        Alert.alert(
            "Eliminar cliente",
            "Deseja realmente eliminar este cliente?",
            [
                { text: "Cancelar" },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        try {
                            await ClienteAPI.eliminar(id);
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

    const podeEscrever = editandoId ? tem("CLIENTE_ATUALIZAR") : tem("CLIENTE_CRIAR");

    return (
        <View style={styles.container}>

            <Text style={styles.titulo}>Gestão de Clientes</Text>

            {(tem("CLIENTE_CRIAR") || tem("CLIENTE_ATUALIZAR")) && (
                <>
                    <TextInput style={styles.input} placeholder="Nome completo" value={nome} onChangeText={setNome} />
                    <TextInput style={styles.input} placeholder="Nr bi" value={bi} onChangeText={setBi} />
                    <TextInput style={styles.input} placeholder="Numero" value={numero} onChangeText={setNumero} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {podeEscrever && (
                        <TouchableOpacity style={styles.botao} onPress={guardar}>
                            <Text style={styles.botaoTexto}>
                                {editandoId ? "Guardar alterações" : "Registar cliente"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {editandoId && (
                        <TouchableOpacity onPress={limpar}>
                            <Text style={styles.atualizar}>Cancelar edição</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            <TouchableOpacity onPress={carregar}>
                <Text style={styles.atualizar}>Atualizar lista</Text>
            </TouchableOpacity>

            <FlatList
                data={clientes}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.nome}>{item.nome} (ID {item.id})</Text>
                        <Text>Email: {item.email}</Text>
                        <Text>Numero: {item.numero}</Text>
                        <Text>Bi: {item.bi}</Text>
                        <Text>Estado: {item.estado}</Text>

                        <View style={styles.acoes}>
                            {tem("CLIENTE_ATUALIZAR") && (
                                <TouchableOpacity onPress={() => editar(item)}>
                                    <Text style={styles.editar}>Editar</Text>
                                </TouchableOpacity>
                            )}
                            {tem("CLIENTE_ELIMINAR") && (
                                <TouchableOpacity onPress={() => eliminar(item.id)}>
                                    <Text style={styles.excluir}>Eliminar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text>Não existem clientes registados.</Text>}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    titulo: { fontSize: 23, fontWeight: "bold", marginBottom: 15 },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 10 },
    botao: { backgroundColor: "#1455a0", padding: 14, borderRadius: 8, alignItems: "center" },
    botaoTexto: { color: "#fff", fontWeight: "bold" },
    atualizar: { color: "#1455a0", marginVertical: 12 },
    card: { backgroundColor: "#eee", padding: 15, borderRadius: 10, marginBottom: 10 },
    nome: { fontSize: 18, fontWeight: "bold" },
    acoes: { flexDirection: "row", gap: 20, marginTop: 10 },
    editar: { color: "#1455a0" },
    excluir: { color: "red" }
});
//hacker-chefao