#!/bin/bash
# Uso: ./run.sh <archivo.rules> [archivo-de-prueba.test.js]   (EXPECT_ENVIO=0 para las reglas anteriores a la Fase 24)
# Requisitos FUERA del repo (ver README.md): Java (JRE), y en $PRUEBAS: npm i @firebase/rules-unit-testing firebase firebase-tools
PRUEBAS=${PRUEBAS:-/workspace/pruebas-reglas}
export HOME=${EMU_HOME:-/workspace/emu-home} PATH=${JAVA_BIN:-/workspace/tools/jdk/bin}:$PATH NODE_PATH=$PRUEBAS/node_modules
export RULES=$(realpath "$1")
AQUI=$(cd "$(dirname "$0")" && pwd)
cd "$PRUEBAS" && npx firebase emulators:exec --only firestore --project demo-tarjeteria "node --test ${AQUI}/${2:-reglas-pedido-envio.test.js}" 2>&1
