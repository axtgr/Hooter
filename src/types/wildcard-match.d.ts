declare module 'wildcard-match' {
  export = wildcardMatch

  function wildcardMatch(delimiter: string, sample1: string, sample2: string): boolean
  function wildcardMatch(sample1: string | string[], sample2: string | string[]): boolean
}
