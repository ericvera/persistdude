const fs = require("fs");

describe("persistdude", () => {
  beforeAll(async () => {
    // NOTE: Required ot navigate to a file. `window.crypto.subtle` is not available in 'new tab' context.
    await page.goto("file:///dev/null");

    // Load scripts into browser context
    await page.addScriptTag({
      content: `${fs.readFileSync("./dist/persistdude.js")}`
    });
    await page.addScriptTag({
      content: `${fs.readFileSync("./test/testdata.js")}`
    });
    await page.on("console", msg => {
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
    });
  });

  it("should generate an initiation vector", async () => {
    const iv = await page.evaluate(async () => {
      return persistdude.generateIV();
    });

    expect(iv).toHaveLength(16);
  });

  it("should generate a new key", async () => {
    const key = await page.evaluate(async () => {
      return persistdude.generateEncryptionDecryptionKey();
    });

    expect(typeof key).toEqual("object");
  });

  it("should be able to wrap a key", async () => {
    const wrappedKey = await page.evaluate(async () => {
      const key = await persistdude.generateEncryptionDecryptionKey();
      const iv = await persistdude.generateIV();
      return persistdude.wrapKey(TestData.passphrase, iv, key);
    });

    expect(typeof wrappedKey).toEqual("string");
    // base64 strings have length that is a multiple of 4
    expect(wrappedKey.length % 4).toBe(0);
  });

  it("should be able to unwrap a key", async () => {
    const unwrappedKey = await page.evaluate(async () => {
      return persistdude.unwrapKey(
        TestData.passphrase,
        TestData.passphraseIV,
        TestData.wrappedKey
      );
    });

    expect(typeof unwrappedKey).toEqual("object");
  });

  it("should be able to encrypt an object", async () => {
    const encryptedData = await page.evaluate(async () => {
      const unwrappedKey = await persistdude.unwrapKey(
        TestData.passphrase,
        TestData.passphraseIV,
        TestData.wrappedKey
      );

      return persistdude.encrypt(TestData.objectToEncrypt, unwrappedKey);
    });

    expect(typeof encryptedData).toEqual("string");
    // base64 strings have length that is a multiple of 4
    expect(encryptedData.length % 4).toBe(0);
  });

  it("should be able to decrypt an encrypted object", async () => {
    const expectedObject = await page.evaluate(async () => {
      return TestData.objectToEncrypt;
    });

    const decryptedData = await page.evaluate(async () => {
      const unwrappedKey = await persistdude.unwrapKey(
        TestData.passphrase,
        TestData.passphraseIV,
        TestData.wrappedKey
      );

      return persistdude.decrypt(TestData.encryptedData, unwrappedKey);
    });

    expect(typeof decryptedData).toEqual("object");
    expect(decryptedData).toEqual(expectedObject);
  });
});
