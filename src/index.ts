type DefSource = string // Source file the definitions is from
type Config = {
    modules: Array<DefSource>
    name: string
    enable: boolean
}
function init({
    typescript: ts,
}: {
    typescript: typeof import('typescript/lib/tsserverlibrary')
}) {
    try {
        let settings: Config = {
            modules: [],
            name: 'typescript-cleanup-definitions',
            enable: true,
        }

        function create(info: ts.server.PluginCreateInfo) {
            // Set up decorator object
            settings = info.config as Config
            const proxy: ts.LanguageService = Object.create(null)
            for (let k of Object.keys(info.languageService) as Array<
                keyof ts.LanguageService
            >) {
                const x = info.languageService[k]!
                // @ts-expect-error - JS runtime trickery which is tricky to type tersely
                proxy[k] = (...args: Array<{}>) =>
                    x.apply(info.languageService, args)
            }

            proxy.getDefinitionAndBoundSpan = (filename, position) => {
                const prior = info.languageService.getDefinitionAndBoundSpan(
                    filename,
                    position
                )
                if (!prior) {
                    return
                }
                if (settings.enable) {
                    prior.definitions = prior.definitions?.filter(
                        ({ fileName, textSpan, kind, name, containerName }) => {
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
                            if (kind === 'index' && name === '__index') {
                                const definitionNode = findNodeAtPosition(
                                    ts,
                                    info.languageService
                                        .getProgram()!
                                        .getSourceFile(fileName)!,
                                    textSpan.start
                                )
                                let moduleDeclaration:
                                    | ts.ModuleDeclaration
                                    | undefined
                                ts.findAncestor(definitionNode, (node) => {
                                    if (ts.isModuleDeclaration(node)) {
                                        moduleDeclaration = node
                                        return 'quit'
                                    }
                                    return false
                                })
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

            return proxy
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
