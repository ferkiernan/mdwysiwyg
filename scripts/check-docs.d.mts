export interface DocWarning {
  kind: string;
  name: string;
  where: string;
}

export interface DocEntry {
  owner?: string;
  name: string;
  text: string;
  tags: string[];
}

export function analyzeTypes(source: string): {
  props: DocEntry[];
  items: Array<DocEntry & { kind: string }>;
};
export function checkJsDoc(analysis: ReturnType<typeof analyzeTypes>): DocWarning[];
export function checkPropsInDoc(propNames: string[], docText: string, where: string): DocWarning[];
export function checkTokens(cssText: string, guideText: string): DocWarning[];
export function runChecks(
  read?: (path: string) => string,
  exists?: (path: string) => boolean,
): DocWarning[];
