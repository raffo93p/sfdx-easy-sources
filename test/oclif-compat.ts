/**
 * Compatibility shim for @oclif/test v4.
 * Provides the v3 fluent API (test.stdout().do().command().it())
 * backed by v4's runCommand under the hood.
 */
import { runCommand } from '@oclif/test';
import { expect } from 'chai';
import { join } from 'path';

interface TestContext {
    stdout: string;
}

class TestChain {
    private doFns: (() => void)[] = [];

    stdout(): this {
        return this;
    }

    do(fn: () => void): this {
        this.doFns.push(fn);
        return this;
    }

    command(args: string[]) {
        const fns = [...this.doFns];
        // First element may contain the command path with spaces (topic separator),
        // which should be split. Remaining args with spaces need quoting.
        const cmdArgs = args.map((a, i) => {
            if (i === 0) return a;
            if (a.includes(' ')) return `"${a}"`;
            return a;
        }).join(' ');
        return {
            it: (desc: string, fn: (ctx: TestContext) => Promise<void> | void) => {
                it(desc, async () => {
                    for (const doFn of fns) doFn();
                    const root = join(process.cwd(), '..');
                    const { stdout } = await runCommand(cmdArgs, { root });
                    await fn({ stdout: stdout ?? '' });
                });
            }
        };
    }
}

export const test = {
    stdout() {
        return new TestChain().stdout();
    },
    do(fn: () => void) {
        return new TestChain().do(fn);
    }
};

export { expect };
