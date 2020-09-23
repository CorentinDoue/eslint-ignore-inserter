import * as fs from "fs-extra"
import {
  buildEslintDisableInserter,
  executeEslintDisableInserterInExample,
  executeEslintInExample,
  indexTsPath,
  installExampleDependencies,
  legacyJsPath,
  linkEslintDisableInserter,
  parseEslintDisables,
} from "./lib"

describe("Integration test", () => {
  let originalIndexTsFile: Buffer
  let originalLegacyJsFile: Buffer
  let stdout: string | undefined
  let stderr: string | undefined
  let error: Error | undefined
  let processedIndexTsFile: string
  let processedLegacyJsFile: string
  beforeAll(async () => {
    originalIndexTsFile = await fs.readFile(indexTsPath)
    originalLegacyJsFile = await fs.readFile(legacyJsPath)

    await installExampleDependencies()
    await buildEslintDisableInserter()
    await linkEslintDisableInserter()
  })
  describe("classical usage", () => {
    beforeAll(async () => {
      ;({
        stdout,
        stderr,
        error,
      } = await executeEslintDisableInserterInExample())
      processedIndexTsFile = (await fs.readFile(indexTsPath)).toString()
      processedLegacyJsFile = (await fs.readFile(legacyJsPath)).toString()
    })
    afterAll(async () => {
      await fs.writeFile(indexTsPath, originalIndexTsFile)
      await fs.writeFile(legacyJsPath, originalLegacyJsFile)
    })
    it("triggers no error", async () => {
      expect(stderr).toEqual("")
      expect(error).not.toBeDefined()
    })
    it("adds eslint-ignore", async () => {
      const indexTsEslintDisables = parseEslintDisables(processedIndexTsFile)
      const legacyJsEslintDisables = parseEslintDisables(processedLegacyJsFile)
      expect(indexTsEslintDisables.length).toEqual(3)
      expect(legacyJsEslintDisables.length).toEqual(1)
    })
    it("fix eslint issues", async () => {
      const {
        stderr: eslintStderr,
        error: eslintError,
      } = await executeEslintInExample()
      expect(eslintStderr).toEqual("")
      expect(eslintError).not.toBeDefined()
    })
  })
  describe("dry-run usage", () => {
    beforeAll(async () => {
      ;({ stdout, stderr, error } = await executeEslintDisableInserterInExample(
        "--dry-run",
      ))
      processedIndexTsFile = (await fs.readFile(indexTsPath)).toString()
      processedLegacyJsFile = (await fs.readFile(legacyJsPath)).toString()
    })
    it("triggers no error", async () => {
      expect(stderr).toEqual("")
      expect(error).not.toBeDefined()
    })
    it("doesn't add eslint-disable", async () => {
      const indexTsEslintDisables = parseEslintDisables(processedIndexTsFile)
      const legacyJsEslintDisables = parseEslintDisables(processedLegacyJsFile)
      expect(indexTsEslintDisables.length).toEqual(0)
      expect(legacyJsEslintDisables.length).toEqual(0)
    })
  })
})
