type Value = string | Array<string>;

interface Options {
  input?: string;
}

async function run(
  templates: TemplateStringsArray,
  values: Array<Value>,
  { json = false, input }: Options & { json?: boolean } = {},
) {
  // Imported lazily: a top-level import breaks provider serialization (docs/learnings.md).
  const { execa, parseCommandString } = await import("execa");

  const argumentList = templates.flatMap((chunk, index) => [
    ...parseCommandString(chunk),
    ...(index < values.length ? [values[index]!].flat() : []),
  ]);

  try {
    const { stdout } = await execa("fly", json ? [...argumentList, "--json"] : argumentList, {
      input,
    });

    return stdout;
  } catch (error) {
    const { stderr, exitCode, message } = error as {
      stderr?: string;
      exitCode?: number;
      message: string;
    };

    // Interpolated values may be secret, so only the template's literal text is shown.
    const redacted = `fly ${templates.join("<value>").replaceAll(/\s+/gu, " ").trim()}`;
    const reason = exitCode === undefined ? message.split("\n")[0] : `exit code ${exitCode}`;

    throw new Error(
      stderr?.trim()
        ? `\`${redacted}\` failed with ${reason}.\n${stderr.trim()}`
        : `\`${redacted}\` failed with ${reason}.`,
    );
  }
}

export function fly(templates: TemplateStringsArray, ...values: Array<Value>): Promise<string>;
export function fly(
  options: Options,
): (templates: TemplateStringsArray, ...values: Array<Value>) => Promise<string>;
export function fly(first: TemplateStringsArray | Options, ...values: Array<Value>) {
  if (!Array.isArray(first)) {
    return (templates: TemplateStringsArray, ...rest: Array<Value>) =>
      run(templates, rest, first as Options);
  }

  return run(first as TemplateStringsArray, values);
}

export async function flyJson<T>(
  templates: TemplateStringsArray,
  ...values: Array<Value>
): Promise<T> {
  return JSON.parse(await run(templates, values, { json: true }));
}

export async function flyDelete(templates: TemplateStringsArray, ...values: Array<Value>) {
  try {
    await run(templates, values);
  } catch (error) {
    const missing = error instanceof Error && /not found|could not find/i.test(error.message);

    if (!missing) throw error;
  }
}
