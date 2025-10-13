import {execSync} from 'child_process';

function mapArch(nodeArch: string) {
  switch (nodeArch) {
    case `x64`:
    case `ia32`:
      return `x64`;
    case `arm64`:
      return `aarch64`;
    case `arm`:
      return `arm`;
    case `riscv64`:
      return `riscv64`;
    default:
      return nodeArch;
  }
}

function detectMusl(): boolean {
  try {
    // ldd --version prints musl on musl-based systems; this is a pragmatic
    // heuristic that works in most containers and distributions.
    const out = execSync(`ldd --version 2>&1`, {encoding: `utf8`});
    return /musl/i.test(out);
  } catch (err) {
    // If ldd isn't available or the command fails, conservatively assume glibc.
    return false;
  }
}

/**
 * Returns a platformTag string used by @oven bun package names, e.g.
 * - linux-x64
 * - linux-x64-musl
 * - darwin-aarch64
 * - windows-x64
 */
export function resolvePlatformTag(): string {
  // Allow an explicit override for emergency/backwards-compatibility
  const override = process.env.COREPACK_BUN_PLATFORM_TAG || process.env.COREPACK_BUN_PACKAGE;
  if (override && override.trim() !== ``)
    return override;

  const plat = process.platform;
  const arch = mapArch(process.arch);

  if (plat === `linux`) {
    const musl = detectMusl();
    return `linux-${arch}${musl ? `-musl` : ``}`;
  }

  if (plat === `darwin`)
    return `darwin-${arch}`;


  if (plat === `win32`)
    return `windows-${arch}`;

  console.log(`platform resolver log: plat is ${plat}-arch is ${arch} `);


  // Fallback to a generic tag
  return `${plat}-${arch}`;
}
