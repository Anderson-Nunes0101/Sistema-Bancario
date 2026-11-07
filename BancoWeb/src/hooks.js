import { useEffect, useState } from "react";

/** Carrega dados ao montar e sempre que `deps` mudam; `recarregar()` repete o pedido. */
export function useCarregar(fn, deps = []) {
  const [estado, setEstado] = useState({ dados: null, erro: "", aCarregar: true });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let vivo = true;
    setEstado((e) => ({ ...e, aCarregar: true, erro: "" }));
    fn()
      .then((dados) => vivo && setEstado({ dados, erro: "", aCarregar: false }))
      .catch((e) => vivo && setEstado((s) => ({ ...s, erro: e.message, aCarregar: false })));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao, ...deps]);

  return { ...estado, recarregar: () => setVersao((v) => v + 1) };
}
