# Reducción del peso de `.git` (fase 22) — medición y plan

> **Estado: solo medición y plan. No se ejecutó nada en el repositorio real ni en GitHub.**
> Todas las pruebas se hicieron en copias descartables (`git clone --mirror` en la box). No hubo push de historial, ni force-push, ni cambios en ramas remotas, ni Firebase.
> Medido sobre `main` = `9e6e45f` (22 PRs unidos, 1 abierto: el PR 12).

## 1. Resumen corto

- El «`.git` pesa 88 MB» que dijimos antes era solo el archivo comprimido principal (`size-pack`, 87 MiB). El `.git` completo en disco pesa **138 MiB** (hay ~50 MiB de objetos sueltos). Un clon nuevo desde GitHub pesa **130 MiB** de `.git` (más ~24 MiB de archivos de trabajo).
- Hacer `git gc` (también agresivo) **casi no ayuda**: 138 → 130 MiB (normal) o 127 MiB (agresivo).
- Lo que pesa de verdad es historia vieja que ya no se usa. Se puede purgar sin cambiar nada de lo que hay hoy en `main`: el árbol de `main` queda **idéntico** (mismo hash de árbol `58e142cd00331488860593686ca16d3180581060`).
- **Recomendación honesta: hoy no vale la pena reescribir el historial.** El ahorro es real pero solo para clones nuevos, la web no mejora en nada, y el costo es que cambian todos los SHA y hay que re-clonar. Para un clon liviano ya existe una alternativa sin riesgo: `git clone --depth=1` (21,5 MiB). Ver sección 7.

## 2. Qué ocupa el peso (medido)

Repo: 339 commits alcanzables, 1.525 objetos, 658 versiones de archivos (blobs).

| Concepto | Peso en el pack | Existe en `main` hoy |
|---|---:|---|
| `index.html` — 164 versiones históricas (antes tenía todo el código dentro, 3–13 MB cada versión) | 32,3 MiB | Sí, pero hoy mide solo 11 KB |
| `catalogo_default.zip` — 2 versiones | 23,1 MiB | Solo la nueva (12,1 MB, `b831cb41…`) |
| `video-assets/*.png` — 18 archivos × 2 versiones (original y recomprimida) | **61,6 MiB** | **No** (se retiró en el PR 4; está en el Release `respaldo-video-assets`) |
| `apps/modelos.html` (7 versiones) + `apps/modelos.js` | 2,4 MiB | Sí |
| `assets/`, `icon-*.png`, `banners/*.jpg`, `js/app.js` (69 versiones), otros | ~10 MiB | Sí |

Total de rutas que ya **no** existen en `main`: ~61,6 MiB, casi todo `video-assets/`.

### Candidatos a purgar

| Candidato | Peso aprox. | Seguro | Por qué |
|---|---:|---|---|
| Carpeta `video-assets/` (todas sus versiones) | ~61 MiB | **Sí** | No está en `main` HEAD. Respaldada en el Release `respaldo-video-assets` (`video-assets-backup.zip`, 31 MB) |
| Blob viejo de `catalogo_default.zip` `c42dfde8ff6f08ace32758d21d2f07012451f300` (13,2 MB) | ~11,6 MiB | **Sí** | `main` usa otro blob (`b831cb41…`). Respaldado en el Release `respaldo-fase-8` (`respaldo-fase-8.zip`) |
| Versiones viejas de `index.html` mayores de 1 MB (100 blobs) | ~30 MiB | **No recomendado** | Cada commit viejo quedaría sin `index.html`: no se podrían ver ni abrir esas versiones antiguas. Se midió solo para comparar |

Nota: `js/js/app.js` (0,13 MiB) está fuera de `main` pero es insignificante; no se incluye.

## 3. Resultados de las simulaciones

Todas con `git filter-repo`, luego `git gc --prune=now --aggressive`. Se borraron antes los `refs/pull/*` de la copia (GitHub no los acepta de vuelta).

| Escenario | Tamaño del repo (pack) | Clon nuevo (`.git`) | Árbol de `main` | Commits en `main` |
|---|---:|---:|---|---:|
| Actual (clon desde GitHub) | 130,1 MiB | 130,3 MiB | — | 337 |
| Solo `git gc --aggressive` | 126,4 MiB | — | igual | 337 |
| **A.** Quitar `video-assets/` | 64,8 MiB | — | **IDÉNTICO** | 336 |
| **B.** A + blob viejo de `catalogo_default.zip` | **53,2 MiB** (−59 %) | **53,4 MiB** | **IDÉNTICO** | 336 |
| **C.** B + `index.html` viejos > 1 MB (no recomendado) | 22,8 MiB (−82 %) | 23,0 MiB | **IDÉNTICO** | 238 |

Verificado en A, B y C: `git rev-parse main^{tree}` da el mismo hash que el `main` actual (`58e142cd…`), y `git ls-tree -r main` también (`1f080a32…`). Es decir, **los archivos de `main` no cambian ni un byte**.

Detalles que se observaron:
- En B desaparece 1 commit (el que solo retiraba `video-assets/` queda vacío): `main` pasa de 337 a 336 commits. En C desaparecen ~99 commits porque solo cambiaban un `index.html` viejo.
- Las 13 ramas y las 2 etiquetas (`respaldo-fase-8`, `respaldo-video-assets`) se conservan, pero con SHA nuevos. La etiqueta `respaldo-video-assets` ya no contendría `video-assets/` (queda solo el Release como respaldo).
- Pasar `git repack -adf --window=250 --depth=250` al repo actual no ayuda (126 MiB).
- El peso de los `refs/pull/*` en el clon local es casi nulo: borrar esas referencias ahorra 0 MiB (los objetos son los mismos que los de las ramas).

## 4. Consecuencias reales de reescribir el historial

Qué pasaría si se ejecuta el escenario B:

1. **Todos los SHA de commits cambian** (también los de commits posteriores a lo purgado). Ejemplo: `main` pasaría de `9e6e45f` a un SHA nuevo (en la prueba, `a3b6270`). Los SHA citados en mensajes, issues y documentos dejarían de coincidir.
2. **PR 1–22 ya unidos:** siguen apareciendo en GitHub como «Merged», con su conversación. Pero apuntan a commits viejos que dejan de estar en `main`; GitHub los conserva por `refs/pull/N/head`, así que se pueden abrir por enlace directo, pero ya no son parte de la historia de la rama.
3. **PR 12 (abierto, banners):** su rama `banners-fase-12` se reescribiría junto con `main`, así que lo más probable es que siga funcionando, pero GitHub puede mostrarlo con diferencias raras o con conflictos. **No se probó.** Plan B: guardar su diff (`gh pr diff 12 > pr12.patch`) antes y, si falla, reabrirlo como PR nuevo.
4. **Releases `respaldo-video-assets` y `respaldo-fase-8`:** los archivos adjuntos (assets) no dependen de git y se conservan. Las etiquetas que los acompañan se moverían a SHA nuevos.
5. **GitHub Pages** despliega desde `main` (build «legacy»). Al empujar `main` se vuelve a desplegar solo en 1–2 min. El sitio queda igual, porque los archivos son idénticos.
6. **Clones locales de John:** deben **borrarse y volver a clonar**. Si alguien empuja desde un clon viejo, vuelve a subir toda la historia que se purgó. Las ramas locales sin empujar (por ejemplo, trabajos en curso) hay que rescatarlas como parche antes.
7. **Ahorro en GitHub no inmediato:** GitHub mantiene `refs/pull/*/head` con los commits viejos, y esos objetos viejos siguen guardados en el servidor. El tamaño que muestra el repo (`size` ≈ 134 MB en la API) **no bajaría** hasta que GitHub haga limpieza, y para borrar de verdad las referencias de los PR y vistas en caché hay que **pedir ayuda a GitHub Support**. Lo que sí baja de inmediato es lo que descarga un clon nuevo, porque `git clone` no baja `refs/pull/*`.
8. **Protección de ramas:** `main` **no** tiene protección (la API devuelve 404 «Branch not protected») ni reglas (rulesets vacío). El force-push no está bloqueado; no hay que cambiar ajustes.
9. Otros datos del repo: público, 0 forks, 13 ramas, ambiente `github-pages`, Dependabot activo. Dependabot volvería a abrir PRs solo si hay versiones nuevas.
10. **Se pierde** la posibilidad de abrir en el historial los PNG de `video-assets/` y el zip viejo desde git. Siguen en los Releases.

## 5. Ahorro real estimado vs. riesgo

| | Sin reescribir | Escenario B (recomendado si se hace) | Escenario C |
|---|---:|---:|---:|
| `.git` de un clon nuevo | 130 MiB | 53 MiB | 23 MiB |
| Clon completo con archivos | ~154 MiB | ~77 MiB | ~47 MiB |
| Ahorro por clon nuevo | — | ~77 MiB | ~107 MiB |
| Mejora en la web / Pages | — | Ninguna | Ninguna |
| Mejora en GitHub Actions | — | Ninguna: `actions/checkout` ya hace clon superficial | Ninguna |
| Riesgo | — | Medio: SHA cambian, re-clonar, PR 12 a revisar | **Alto**: se pierde la historia de `index.html` |
| Reversible | — | Sí, con el bundle (sección 8) | Sí, con el bundle |

Quién se beneficia: solo quien clone el repo completo desde cero (descarga ~77 MiB menos). Para un equipo de una persona con Pages, ese beneficio es chico.

## 6. Plan paso a paso (solo si John confirma)

Requisitos: un solo lugar de trabajo, nadie más empujando, el PR 12 sin cambios nuevos. Todo en una carpeta nueva fuera del repo de trabajo.

```bash
# 0. Instalar la herramienta (una vez)
pip install --user git-filter-repo
export PATH="$PATH:$HOME/.local/bin"

# 1. Respaldo completo (conservar fuera de GitHub)
mkdir -p ~/git-reduccion && cd ~/git-reduccion
git clone --mirror https://github.com/jhon01guevara/TARJETERIA-JHON.git original.git
git -C original.git bundle create ~/git-reduccion/respaldo-completo.bundle --all
git -C original.git bundle verify ~/git-reduccion/respaldo-completo.bundle   # debe decir "complete history"
git -C original.git rev-parse main^{tree} > arbol-main-antes.txt
gh pr diff 12 -R jhon01guevara/TARJETERIA-JHON > pr12.patch

# 2. Copia de trabajo y purga (escenario B)
git clone --mirror original.git trabajo.git
printf 'c42dfde8ff6f08ace32758d21d2f07012451f300\n' > ids-zip-viejo.txt
cd trabajo.git
git filter-repo --invert-paths --path video-assets --strip-blobs-with-ids ../ids-zip-viejo.txt
#   si se queja de que no es un clon "fresco", agregar --force (es una copia descartable)

# 3. Quitar refs de PR (GitHub no los acepta) y compactar
git for-each-ref --format='delete %(refname)' refs/pull | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git count-objects -vH            # size-pack esperado: ~53 MiB

# 4. VERIFICAR antes de subir: el árbol de main debe ser idéntico
test "$(git rev-parse main^{tree})" = "$(cat ../arbol-main-antes.txt)" && echo "ARBOL IDENTICO" || echo "STOP: DISTINTO"
git ls-tree -r --name-only main | grep -c '^video-assets/'    # debe dar 0

# 5. Subir (force) solo ramas y etiquetas
git remote add origin https://github.com/jhon01guevara/TARJETERIA-JHON.git
git push --force origin 'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*'

# 6. Comprobar
#    - Esperar 1–2 min el despliegue de Pages y abrir el sitio con Ctrl+Shift+R.
#    - gh run list -R jhon01guevara/TARJETERIA-JHON --limit 3  (las pruebas deben pasar)
#    - Revisar el PR 12; si se rompió, reabrirlo con pr12.patch.

# 7. Re-clonar
#    Borrar los clones locales viejos y clonar de nuevo.
#    Antes, guardar con `git diff > mis-cambios.patch` cualquier trabajo sin empujar.

# 8. (Opcional) Pedir a GitHub Support la limpieza de los refs/pull y vistas en caché
#    para que baje también el tamaño del repo en el servidor.
```

Si John confirma, hay que decir expresamente algo como: «Reescribe el historial (escenario B)». El escenario C no se recomienda.

## 7. Alternativas sin reescribir el historial (medidas)

| Alternativa | `.git` resultante | Total con archivos | Comentario |
|---|---:|---:|---|
| Clon normal (hoy) | 130,3 MiB | 154 MiB | Línea de base |
| `git gc` / `git gc --aggressive` en el clon | 130 / 127 MiB | — | Ahorro mínimo, sin riesgo. Solo limpia los 50 MiB de objetos sueltos del repo local |
| `git clone --depth=1` (superficial) | **21,5 MiB** | 45,6 MiB | Sin historial. Ideal para desplegar, probar o revisar. Se puede profundizar después con `git fetch --deepen=50` o `git fetch --unshallow` |
| `git clone --filter=blob:none` (parcial) | 21,9 MiB | 45,9 MiB | Tiene todo el historial de commits; baja los archivos viejos solo cuando se piden (necesita red) |
| `git clone --filter=tree:0` | 21,8 MiB | 45,9 MiB | Parecido, pero más lento al consultar historial |
| `--depth=1 --filter=blob:none --sparse` | 12,1 MiB | 24,0 MiB | Solo las carpetas que se pidan con `git sparse-checkout set <carpeta>` |

Comandos:

```bash
git clone --depth=1 https://github.com/jhon01guevara/TARJETERIA-JHON.git
git clone --filter=blob:none https://github.com/jhon01guevara/TARJETERIA-JHON.git
git clone --depth=1 --filter=blob:none --sparse https://github.com/jhon01guevara/TARJETERIA-JHON.git
git sparse-checkout set js apps tests docs     # dentro del clon sparse
```

Estas opciones logran el mismo tamaño de clon que el escenario C, sin tocar nada del historial y sin riesgo.

## 8. Plan de reversión

- **Respaldo ya creado en la box:** `/workspace/git-reduccion/respaldo-completo.bundle` (130,1 MiB, historia completa de todas las ramas y etiquetas, `bundle verify` OK). **No se subió a GitHub ni a ningún Release**; solo está en la box. Si John decide ejecutar el plan, conviene copiarlo a su computador.
- **Cómo revertir** (restaura los SHA originales):

```bash
git clone --mirror respaldo-completo.bundle restaurar.git
cd restaurar.git
git remote add origin https://github.com/jhon01guevara/TARJETERIA-JHON.git
git push --force origin 'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*'
```

- Como GitHub sigue conservando los objetos viejos por `refs/pull/*`, la reversión también es posible mientras no se pida la limpieza a Support. **Después de esa limpieza, el bundle será la única copia de la historia vieja.**
- Los PNG de `video-assets/` y el zip viejo quedan además en los Releases `respaldo-video-assets` y `respaldo-fase-8`.

## 9. Conclusión

- Hoy: **no hace falta**. El repo pesa ~134 MB en GitHub, muy por debajo de los límites recomendados (1 GB); la web publicada no depende del peso de `.git`.
- Para clonar liviano: usar `--depth=1` (21,5 MiB) o `--filter=blob:none`.
- Si algún día el tamaño empieza a molestar (por ejemplo, muchos colaboradores clonando), hacer el **escenario B** siguiendo la sección 6, pidiendo confirmación expresa y con el bundle guardado fuera de la box.
