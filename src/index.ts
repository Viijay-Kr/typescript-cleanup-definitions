type DefSource = string; // Source file the definitions is from
type Config = {
  modules: Array<DefSource>;
  name: string;
  enabled: boolean;
};
function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  try {
    let settings: Config = {
      modules: [],
      name: "typescript-cleanup-definitions",
      enabled: true,
    };

    function create(info: ts.server.PluginCreateInfo) {
      // Set up decorator object
      settings = info.config as Config;
      const proxy: ts.LanguageService = Object.create(null);
      for (let k of Object.keys(info.languageService) as Array<
        keyof ts.LanguageService
      >) {
        const x = info.languageService[k]!;
        // @ts-expect-error - JS runtime trickery which is tricky to type tersely
        proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
      }

      proxy.getDefinitionAndBoundSpan = (filename, position) => {
        const prior = info.languageService.getDefinitionAndBoundSpan(
          filename,
          position
        );
        if (!prior) {
          return;
        }
        if (settings.enabled) {
          prior.definitions = prior.definitions?.filter(({ fileName }) => {
            const matches = settings.modules.some((t) => fileName.includes(t));
            if (matches) return false;
            return true;
          });
        }
        return prior;
      };

      return proxy;
    }

    function onConfigurationChanged(_cfg: Config) {
      settings = _cfg;
    }
    return { create, onConfigurationChanged };
  } catch (e) {
    throw new Error("Cannot load `typescript-cleanup-definitions`");
  }
}

export = init;
