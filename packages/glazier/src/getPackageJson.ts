export type PackageJson = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

let glazierPackageJson: PackageJson | undefined;

export async function getPackageJson(): Promise<PackageJson> {
  if (!glazierPackageJson) {
    glazierPackageJson = (await Bun.file(
      require.resolve("@knyt/glazier/package.json"),
    ).json()) as PackageJson;
  }

  return glazierPackageJson;
}
