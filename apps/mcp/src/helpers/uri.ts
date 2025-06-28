// Assumes that uris follow the format of
export const BASE_URI = "acme://acme";

// Splits up incoming URI [protocol]://[host]/[resource]?args
export default function splitURI(uri: string): {
  protocol: string;
  host: string;
  path: string;
  args: {
    [key: string]: string;
  };
} {
  const split = uri.split("://");
  const protocol = split[0];

  if (!protocol || !split[1]) {
    throw new Error("Bad URI");
  }
  const split2 = split[1].split("/");
  const host = split2.splice(0, 1)[0];
  const split3 = split2.join("/");
  const path = split3.split("?")[0];
  const vars = split3.split("?")[1];

  if (!vars || !host || !path) {
    throw new Error("Bad URI");
  }

  const args = parseVars(vars);
  return { protocol, host, path, args };
}

function parseVars(vars: string) {
  const args: { [key: string]: string } = {};
  for (const arg of vars.split("&")) {
    const seperator = arg.indexOf("=");
    const key = arg.slice(0, seperator);
    const val = arg.slice(seperator + 1);
    args[key] = val;
  }
  return args;
}

export function buildURI(resourceName: string, params: string[]): string {
  const baseURI = `${BASE_URI}/${resourceName}${params.length > 0 ? "?" : ""}`;
  return (
    baseURI +
    params
      .reduce((prev, curr) => {
        return `${prev}&${curr}={${curr}}`;
      }, "")
      .substring(1)
  );
}
