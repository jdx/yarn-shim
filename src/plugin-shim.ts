import type * as CLI from '@yarnpkg/cli';
import type * as Core from '@yarnpkg/core';
import type {
  Hooks as EssentialsHooks,
  suggestUtils,
} from '@yarnpkg/plugin-essentials';
import type * as Clipanion from 'clipanion';
import type * as Yup from 'yup';
import type * as FSLib from '@yarnpkg/fslib';

const VERSION = '1.0.0';

const plugin = {
  name: 'plugin-shim',

  factory(require: NodeJS.Require): Core.Plugin<EssentialsHooks & Core.Hooks> {
    const cli = require('@yarnpkg/cli') as typeof CLI;
    const core = require('@yarnpkg/core') as typeof Core;
    const fslib = require('@yarnpkg/fslib') as typeof FSLib;
    const yup = require('yup') as typeof Yup;

    return {
      hooks: {
        afterAllInstalled: plugin._afterAllInstalled(core, fslib),
        afterWorkspaceDependencyAddition: plugin._afterWorkspaceDependencyAddition(
          core,
        ),
        afterWorkspaceDependencyRemoval: plugin._afterWorkspaceDependencyRemoval(),
        afterWorkspaceDependencyReplacement: plugin._afterWorkspaceDependencyReplacement(),
      },
      commands: [plugin._buildShimCommand(cli, yup)],
    };
  },

  // shim [-v,--verbose] [-a,--all] <pkg>...
  _buildShimCommand(
    { BaseCommand: Command }: typeof CLI,
    yup: typeof Yup,
  ): Clipanion.CommandClass<Core.CommandContext> {
    const { object, array, string } = yup;
    class ShimCommand extends Command {
      @Command.Rest()
      public pkgs: string[] = [];

      @Command.Boolean('-a,--all')
      public all = false;

      @Command.Boolean('-v,--verbose')
      public verbose = false;

      static schema = object({
        pkgs: array()
          .of(string().required())
          .ensure()
          .when('all', (all: boolean, pkgs: Yup.ArraySchema<string>) =>
            all
              ? pkgs.max(0, 'you cannot specify --all alongside packages')
              : pkgs.min(
                  1,
                  'no packages specified. Use --all to add shims for all packages',
                ),
          ),
      });

      static usage = Command.Usage({
        description: `install bin shims for package scripts`,
        details: `
      With pnp in yarn2 it no longer creates a \`node_modules/.bin\` directory with symlinks to your dependencies.
      This will create that directory (or one in a similar location).

      plugin-yarn-shim: v${VERSION}`,
        examples: [
          [
            'Save the eslint bin to `./node_modules/.bin`',
            `$0 shim eslint
  ./node_modules/.bin/eslint`,
          ],
        ],
      });

      @Command.Path('shim')
      async execute() {
        if (this.all) this.pkgs = await this.fetchAllPackages();
        this.context.stdout.write('yay 2\n');
        console.dir(this.pkgs);
      }

      private async fetchAllPackages(): Promise<string[]> {
        return [];
      }
    }
    return ShimCommand;
  },

  _afterAllInstalled: (
    {
      MessageName,
      ThrowReport,
      ReportError,
      scriptUtils,
      structUtils,
    }: typeof Core,
    { xfs, ppath, Filename, toFilename }: typeof FSLib,
  ) => async (project: Core.Project) => {
    for (const workspace of project.workspaces) {
      console.log(workspace.locator);
      const bins = await scriptUtils.getWorkspaceAccessibleBinaries(workspace);
      for (const [bin, [cfg, dst]] of bins.entries()) {
        const binRoot = ppath.join(workspace.cwd, toFilename('bin'));
        await xfs.mkdirpPromise(binRoot);
        await xfs.writeFilePromise(
          ppath.join(binRoot, toFilename(bin)),
          `#!/bin/sh
yarn --cwd ${workspace.cwd} run ${bin} "$@"
`,
          {
            mode: 0o755,
          },
        );
      }
    }
    console.log('afterAllInstalled');
  },

  _afterWorkspaceDependencyAddition: ({
    MessageName,
    ThrowReport,
    ReportError,
    scriptUtils,
  }: typeof Core) => async (
    workspace: Core.Workspace,
    target: suggestUtils.Target,
    descriptor: Core.Descriptor,
    strategies: Array<suggestUtils.Strategy>,
  ) => {
    const { project, locator } = workspace;
    const { configuration } = project;

    console.log('x');

    // console.dir({ project });
  },

  _afterWorkspaceDependencyRemoval: () => async (
    workspace: Core.Workspace,
    target: suggestUtils.Target,
    descriptor: Core.Descriptor,
  ) => {
    console.log('remove');
    // console.dir({ project });
  },

  _afterWorkspaceDependencyReplacement: () => async (
    workspace: Core.Workspace,
    target: suggestUtils.Target,
    fromDescriptor: Core.Descriptor,
    toDescriptor: Core.Descriptor,
  ) => {
    // console.dir({ project });
  },
};

export = plugin;
