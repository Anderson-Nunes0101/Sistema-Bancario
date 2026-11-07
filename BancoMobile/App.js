import React, { useState } from "react";

import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator
} from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";

import Login from "./src/screens/Login";
import Dashboard from "./src/screens/Dashboard";
import Clientes from "./src/screens/Clientes";
import Contas from "./src/screens/Contas";
import Transacoes from "./src/screens/Transacoes";
import ClienteConta from "./src/screens/ClienteConta";
import Transferir from "./src/screens/Transferir";
import AlterarPin from "./src/screens/AlterarPin";

export default function App() {
    return (
        <AuthProvider>
            <Raiz />
        </AuthProvider>
    );
}

function Raiz() {

    const { sessao, carregando, sair, tem } = useAuth();
    const eCliente = sessao?.tipo === "CLIENTE";

    const [tela, setTela] = useState(null);
    // incrementa para forçar o recarregamento do saldo/extrato depois de uma transferência
    const [versao, setVersao] = useState(0);

    if (carregando) {
        return (
            <View style={styles.centro}>
                <ActivityIndicator size="large" color="#1455a0" />
            </View>
        );
    }

    if (!sessao) {
        return <Login />;
    }

    // Menus conforme o perfil e as permissões
    const itens = eCliente
        ? [
            { nome: "conta", titulo: "Minha conta" },
            { nome: "transferir", titulo: "Transferir" },
            { nome: "pin", titulo: "Alterar PIN" }
        ]
        : [
            { nome: "dashboard", titulo: "Início" },
            tem("CLIENTE_CONSULTAR") && { nome: "clientes", titulo: "Clientes" },
            tem("CONTA_CONSULTAR") && { nome: "contas", titulo: "Contas" },
            (tem("TRANSACAO_CONSULTAR") || tem("DEPOSITO_REALIZAR"))
                && { nome: "transacoes", titulo: "Transações" }
        ].filter(Boolean);

    const atual = tela && itens.some((i) => i.nome === tela) ? tela : itens[0].nome;

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.logo}>BANCO MOBILE</Text>
                    <Text style={styles.sublogo}>
                        {sessao.nome}{eCliente ? ` · Conta ${sessao.numeroConta}` : ""}
                    </Text>
                </View>
                <TouchableOpacity onPress={sair}>
                    <Text style={styles.sair}>Sair</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.menu}
            >
                {itens.map((i) => (
                    <TouchableOpacity
                        key={i.nome}
                        style={[styles.menuItem, atual === i.nome && styles.ativo]}
                        onPress={() => setTela(i.nome)}
                    >
                        <Text style={[styles.menuTexto, atual === i.nome && styles.textoAtivo]}>
                            {i.titulo}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.conteudo}>
                {atual === "dashboard" && <Dashboard />}
                {atual === "clientes" && <Clientes />}
                {atual === "contas" && <Contas />}
                {atual === "transacoes" && <Transacoes />}

                {atual === "conta" && <ClienteConta recarregar={versao} />}
                {atual === "transferir" && (
                    <Transferir aoConcluir={() => setVersao((v) => v + 1)} />
                )}
                {atual === "pin" && <AlterarPin />}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    centro: { flex: 1, justifyContent: "center", alignItems: "center" },

    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 45
    },

    header: {
        padding: 18,
        backgroundColor: "#123c70",
        flexDirection: "row",
        alignItems: "center"
    },

    logo: {
        fontSize: 23,
        fontWeight: "bold",
        color: "#fff"
    },

    sublogo: {
        color: "#ddd",
        marginTop: 4
    },

    sair: {
        color: "#fff",
        fontWeight: "bold"
    },

    menu: {
        maxHeight: 55,
        backgroundColor: "#f0f0f0"
    },

    menuItem: {
        paddingHorizontal: 18,
        justifyContent: "center"
    },

    ativo: {
        backgroundColor: "#d6e6fa",
        borderBottomWidth: 3,
        borderBottomColor: "#1455a0"
    },

    menuTexto: {
        fontWeight: "500",
        color: "#555"
    },

    textoAtivo: {
        color: "#1455a0",
        fontWeight: "bold"
    },

    conteudo: {
        flex: 1
    }

});
