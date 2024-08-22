type DefSource = string // Source file the definitions is from
type Config = {
    modules: Array<DefSource>
    name: string
    enable: boolean
}
let settings: Config = {
    modules: [],
    name: 'typescript-cleanup-definitions',
    enable: true,
}

function init({
    typescript: ts,
}: {
    typescript: typeof import('typescript/lib/tsserverlibrary')
}) {
    try {
        function create(info: ts.server.PluginCreateInfo) {
            const { proxy, initialize } = createProxyLanguageService(
                info.languageService,
                ts
            )
            info.languageService = proxy
            initialize()
            return info.languageService
        }

        function onConfigurationChanged(_cfg: Config) {
            settings = _cfg
        }

        return { create, onConfigurationChanged }
    } catch (e) {
        console.error(e)
        throw new Error('Cannot load `typescript-cleanup-definitions`')
    }
}

const createProxyLanguageService = (
    languageService: ts.LanguageService,
    ts: typeof import('typescript/lib/tsserverlibrary')
) => {
    const proxyCache = new Map<string | symbol, Function | undefined>()
    let getProxyMethod:
        | ((
              target: ts.LanguageService,
              p: string | symbol
          ) => Function | undefined)
        | undefined
    const proxy: ts.LanguageService = new Proxy(languageService, {
        get(target, p, receiver) {
            if (getProxyMethod) {
                if (!proxyCache.has(p)) {
                    proxyCache.set(p, getProxyMethod(target, p))
                }
                const proxyMethod = proxyCache.get(p)
                if (proxyMethod) {
                    return proxyMethod
                }
            }
            return Reflect.get(target, p, receiver)
        },
        set(target, p, value, receiver) {
            return Reflect.set(target, p, value, receiver)
        },
    })

    const initialize = () => {
        getProxyMethod = (target, p) => {
            switch (p) {
                case 'getDefinitionAndBoundSpan':
                    return (filename: string, position: number) => {
                        const prior = target.getDefinitionAndBoundSpan(
                            filename,
                            position
                        )
                        if (!prior) {
                            return
                        }
                        if (settings.enable) {
                            prior.definitions = prior.definitions?.filter(
                                ({
                                    fileName,
                                    textSpan,
                                    kind,
                                    name,
                                    containerName,
                                }) => {
                                    if (
                                        kind ===
                                            ts.ScriptElementKind
                                                .indexSignatureElement &&
                                        name === '__index'
                                    ) {
                                        if (
                                            containerName === 'CSSModule' ||
                                            containerName === 'CSSModuleClasses'
                                        ) {
                                            return false
                                        }
                                    }
                                    if (
                                        kind === 'index' &&
                                        name === '__index'
                                    ) {
                                        const definitionNode =
                                            findNodeAtPosition(
                                                ts,
                                                languageService
                                                    .getProgram()!
                                                    .getSourceFile(fileName)!,
                                                textSpan.start
                                            )
                                        let moduleDeclaration:
                                            | ts.ModuleDeclaration
                                            | undefined
                                        ts.findAncestor(
                                            definitionNode,
                                            (node) => {
                                                if (
                                                    ts.isModuleDeclaration(node)
                                                ) {
                                                    moduleDeclaration = node
                                                    return 'quit'
                                                }
                                                return false
                                            }
                                        )
                                        if (
                                            moduleDeclaration?.name.text &&
                                            settings.modules.includes(
                                                moduleDeclaration.name.text
                                            )
                                        ) {
                                            return false
                                        }
                                    }
                                    return true
                                }
                            )
                        }
                        return prior
                    }
            }
        }
    }

    return { proxy, initialize }
}

const findNodeAtPosition = (
    ts: typeof import('typescript/lib/tsserverlibrary'),
    sourceFile: ts.SourceFile,
    position: number
) => {
    function find(node: ts.Node): ts.Node | undefined {
        if (position >= node.getStart() && position <= node.getEnd()) {
            return ts.forEachChild(node, find) || node
        }

        return
    }
    return find(sourceFile)
}

export = init
