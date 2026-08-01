import { describe, it, expect } from "vitest";
import {
  applyMask,
  cleanValue,
  formatCurrency,
  getCardType,
  processInput,
  stripMask,
  toSlug,
  unformatCurrency,
  unmask,
} from "./engine";
import { PRESETS } from "./presets";

describe("Core Engine", () => {
  describe("toSlug", () => {
    it("should convert string to slug", () => {
      expect(toSlug("Hello World")).toBe("hello-world");
      expect(toSlug("Ömer Gülçiçek")).toBe("omer-gulcicek");
      expect(toSlug("  Multiple   Spaces  ")).toBe("multiple-spaces");
      expect(toSlug("Special!@#Characters")).toBe("specialcharacters");
    });
  });

  describe("cleanValue", () => {
    it("should remove forbidden characters", () => {
      expect(cleanValue("abc123", undefined, /[a-z]/g)).toBe("123");
    });

    it("should keep only allowed characters", () => {
      expect(cleanValue("abc123", /[0-9]/)).toBe("123");
    });

    it("should handle both allowed and forbidden characters", () => {
      expect(cleanValue("abc123", /[0-9]/, /1/)).toBe("23");
    });
  });

  describe("applyMask", () => {
    it("should format phone number correctly", () => {
      const mask = "(999) 999 99 99";
      expect(applyMask("5551234567", mask)).toBe("(555) 123 45 67");
    });

    it("should handle partial inputs", () => {
      const mask = "99/99/9999";
      expect(applyMask("1205", mask)).toBe("12/05");
    });

    it("should handle alphanumeric mask", () => {
      const mask = "AA-99";
      expect(applyMask("AB12", mask)).toBe("AB-12");
    });

    it("should skip static characters in input", () => {
      const mask = "(999)";
      expect(applyMask("555", mask)).toBe("(555");
    });
  });

  describe("unmask", () => {
    it("should remove mask characters", () => {
      expect(unmask("(555) 123 45 67", "(999) 999 99 99")).toBe("5551234567");
    });
  });

  describe("stripMask", () => {
    it("should strip mask characters but keep values", () => {
      expect(stripMask("(555) 123", "(999) 999")).toBe("555123");
    });
  });

  describe("formatCurrency", () => {
    it("should format currency with US defaults", () => {
      expect(formatCurrency("123456", {})).toBe("123,456");
      expect(formatCurrency("1234.56", {})).toBe("1,234.56");
    });

    it("should format with custom symbol", () => {
      expect(formatCurrency("123456", { symbol: "$" })).toBe("$123,456");
    });

    it("should format Turkish separators when customized", () => {
      expect(
        formatCurrency("1234.56", {
          decimalSeparator: ",",
          thousandSeparator: ".",
        }),
      ).toBe("1.234,56");
    });
  });

  describe("unformatCurrency", () => {
    it("should unformat US currency string", () => {
      expect(unformatCurrency("1,234.56", {})).toBe("1234.56");
    });

    it("should unformat Turkish currency string", () => {
      expect(
        unformatCurrency("1.234,56", {
          decimalSeparator: ",",
          thousandSeparator: ".",
        }),
      ).toBe("1234.56");
    });
  });

  describe("getCardType", () => {
    it("should identify Visa", () => {
      expect(getCardType("4111")).toBe("visa");
    });

    it("should identify Mastercard", () => {
      expect(getCardType("5100")).toBe("mastercard");
    });

    it("should identify Amex", () => {
      expect(getCardType("3400")).toBe("amex");
    });

    it("should identify Troy", () => {
      expect(getCardType("9792")).toBe("troy");
    });

    it("should return unknown for others", () => {
      expect(getCardType("1234")).toBe("unknown");
    });
  });

  describe("processInput", () => {
    it("should process masked input", () => {
      const result = processInput("5551234567", { mask: "(999) 999 99 99" });
      expect(result.displayValue).toBe("(555) 123 45 67");
      expect(result.value).toBe("5551234567");
    });

    it("should keep phone raw digit-only when input is already masked", () => {
      const result = processInput("(555) 123-4567", PRESETS.phone);
      expect(result.displayValue).toBe("(555) 123-4567");
      expect(result.value).toBe("5551234567");
      expect(result.value).not.toMatch(/[\s()-]/);
    });

    it("should keep card raw digit-only (no spaces)", () => {
      const typed = processInput("4111111111111111", PRESETS.card);
      expect(typed.displayValue).toBe("4111 1111 1111 1111");
      expect(typed.value).toBe("4111111111111111");

      const fromDisplay = processInput("4111 1111 1111 1111", PRESETS.card);
      expect(fromDisplay.value).toBe("4111111111111111");
      expect(fromDisplay.value).not.toContain(" ");
    });

    it("should keep amex raw digit-only with Amex mask", () => {
      const result = processInput("340012345678901", {
        ...PRESETS.card,
        mask: "9999 999999 99999",
      });
      expect(result.displayValue).toBe("3400 123456 78901");
      expect(result.value).toBe("340012345678901");
      expect(result.value).not.toContain(" ");
    });

    it("should accept letters and digits for mixed aaa-999 masks", () => {
      const typed = processInput("a", { mask: "aaa-999", transform: "uppercase" });
      expect(typed.displayValue).toBe("A");
      expect(typed.value).toBe("A");

      const result = processInput("abc123", { mask: "aaa-999", transform: "uppercase" });
      expect(result.displayValue).toBe("ABC-123");
      expect(result.value).toBe("ABC123");
    });

    it("should process currency input with US defaults", () => {
      const result = processInput("123456", PRESETS.currency);
      expect(result.displayValue).toBe("123,456");
      expect(result.value).toBe("123456");
    });

    it("should process currency decimals (US)", () => {
      const result = processInput("1234.56", PRESETS.currency);
      expect(result.displayValue).toBe("1,234.56");
      expect(result.value).toBe("1234.56");
    });

    it("should process Turkish currency when customized", () => {
      const tr = {
        currency: {
          precision: 2,
          decimalSeparator: ",",
          thousandSeparator: ".",
        },
      };
      const result = processInput("123456", tr);
      expect(result.displayValue).toBe("123.456");
      expect(result.value).toBe("123456");

      const withDecimals = processInput("1234,56", tr);
      expect(withDecimals.displayValue).toBe("1.234,56");
      expect(withDecimals.value).toBe("1234.56");
    });

    it("should process uppercase transform", () => {
      const result = processInput("abc", { transform: "uppercase" });
      expect(result.displayValue).toBe("ABC");
      expect(result.value).toBe("abc");
    });

    it("should maintain cursor position for currency input", () => {
      const result = processInput("1234", PRESETS.currency, 2);
      expect(result.cursorPosition).toBe(3);
    });
  });
});
