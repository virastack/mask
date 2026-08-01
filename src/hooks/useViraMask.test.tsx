import { renderHook, act, waitFor, render, screen } from "@testing-library/react";
import React from 'react';
import { useForm } from "react-hook-form";
import { describe, it, expect } from "vitest";
import { useViraMask } from "./useViraMask";
import { PRESETS } from "../core/presets";

window.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0);

describe("useViraMask", () => {
  it("should initialize correctly", () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: {
          phone: "",
        },
      });
      
      const fields = useViraMask({
        form,
        schema: {
          phone: PRESETS.phone,
        },
      });

      return { form, fields };
    });

    expect(result.current.fields.phone).toBeDefined();
    expect(result.current.fields.phone.name).toBe("phone");
  });

  it("should format initial value", async () => {
    const TestComponent = () => {
      const form = useForm({
        defaultValues: {
          phone: "5551234567",
        },
      });
      
      const fields = useViraMask({
        form,
        schema: {
          phone: PRESETS.phone,
        },
      });

      return <input {...fields.phone} data-testid="phone-input" />;
    };

    render(<TestComponent />);
    const input = screen.getByTestId("phone-input") as HTMLInputElement;

    await waitFor(() => {
      expect(input.value).toBe("(555) 123-4567");
    });
  });

  it("should handle input change", async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: {
          phone: "",
        },
      });
      
      const fields = useViraMask({
        form,
        schema: {
          phone: PRESETS.phone,
        },
      });

      return { form, fields };
    });

    const input = document.createElement("input");
    input.value = "555";
    input.selectionStart = 3;
    
    const event = {
      target: input,
      currentTarget: input,
      nativeEvent: { isComposing: false },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.fields.phone.onChange(event);
    });

    expect(result.current.form.getValues("phone")).toBe("555");
  });

  it("should ignore onChange while browser reports active composition", async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: {
          phone: "",
        },
      });

      const fields = useViraMask({
        form,
        schema: {
          phone: PRESETS.phone,
        },
      });

      return { form, fields };
    });

    await act(async () => {
      result.current.fields.phone.onCompositionStart({} as React.CompositionEvent<HTMLInputElement>);
    });

    const input = document.createElement("input");
    input.value = "5";
    input.selectionStart = 1;

    await act(async () => {
      result.current.fields.phone.onChange({
        target: input,
        currentTarget: input,
        nativeEvent: { isComposing: true },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.form.getValues("phone")).toBe("");
  });

  it("should recover when compositionend is dropped (dead-key lock)", async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: {
          card: "",
        },
      });

      const fields = useViraMask({
        form,
        schema: {
          card: "card",
        },
      });

      return { form, fields };
    });

    // Dead key (^): compositionstart without a matching compositionend.
    await act(async () => {
      result.current.fields.card.onCompositionStart({} as React.CompositionEvent<HTMLInputElement>);
    });

    const input = document.createElement("input");
    input.value = "4111";
    input.selectionStart = 4;

    // Next keystroke reports isComposing:false — must recover and apply the mask.
    await act(async () => {
      result.current.fields.card.onChange({
        target: input,
        currentTarget: input,
        nativeEvent: { isComposing: false },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.form.getValues("card")).toBe("4111");
  });

  it("should clear stuck composition flag on blur", async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: {
          phone: "",
        },
      });

      const fields = useViraMask({
        form,
        schema: {
          phone: PRESETS.phone,
        },
      });

      return { form, fields };
    });

    await act(async () => {
      result.current.fields.phone.onCompositionStart({} as React.CompositionEvent<HTMLInputElement>);
      result.current.fields.phone.onBlur({
        target: document.createElement("input"),
        currentTarget: document.createElement("input"),
      } as unknown as React.FocusEvent<HTMLInputElement>);
    });

    const input = document.createElement("input");
    input.value = "555";
    input.selectionStart = 3;

    await act(async () => {
      result.current.fields.phone.onChange({
        target: input,
        currentTarget: input,
        nativeEvent: { isComposing: false },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.form.getValues("phone")).toBe("555");
  });

  it("should keep card rawValue digit-only after blur even if form was polluted", async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: { card: "" },
      });
      const fields = useViraMask({
        form,
        schema: { card: "card" },
      });
      return { form, fields };
    });

    const input = document.createElement("input");
    input.value = "4111111111111111";
    input.selectionStart = 16;

    await act(async () => {
      result.current.fields.card.onChange({
        target: input,
        currentTarget: input,
        nativeEvent: { isComposing: false },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.fields.card.rawValue).toBe("4111111111111111");

    // Simulate RHF syncing masked DOM into form state around blur.
    input.value = "4111 1111 1111 1111";
    await act(async () => {
      result.current.form.setValue("card", "4111 1111 1111 1111");
      result.current.fields.card.onBlur({
        target: input,
        currentTarget: input,
      } as unknown as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.fields.card.rawValue).toBe("4111111111111111");
    expect(result.current.fields.card.rawValue).not.toContain(" ");
    expect(result.current.form.getValues("card")).toBe("4111111111111111");
  });

  it("should keep phone rawValue digit-only after blur", async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: { phone: "" },
      });
      const fields = useViraMask({
        form,
        schema: { phone: "phone" },
      });
      return { form, fields };
    });

    const input = document.createElement("input");
    input.value = "5551234567";
    input.selectionStart = 10;

    await act(async () => {
      result.current.fields.phone.onChange({
        target: input,
        currentTarget: input,
        nativeEvent: { isComposing: false },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    input.value = "(555) 123-4567";
    await act(async () => {
      result.current.form.setValue("phone", "(555) 123-4567");
      result.current.fields.phone.onBlur({
        target: input,
        currentTarget: input,
      } as unknown as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.fields.phone.rawValue).toBe("5551234567");
    expect(result.current.form.getValues("phone")).toBe("5551234567");
  });

  it("should truncate cvv rawValue when card type changes from amex to non-amex", async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: { card: "", cvv: "" },
      });
      const fields = useViraMask({
        form,
        schema: { card: "card", cvv: "cvv" },
      });
      return { form, fields };
    });

    const cardInput = document.createElement("input");
    const cvvInput = document.createElement("input");

    // Attach refs so layout sync can update both inputs.
    await act(async () => {
      result.current.fields.card.ref(cardInput);
      result.current.fields.cvv.ref(cvvInput);
    });

    // Amex → CVV allows 4 digits
    cardInput.value = "340000000000000";
    cardInput.selectionStart = 15;
    await act(async () => {
      result.current.fields.card.onChange({
        target: cardInput,
        currentTarget: cardInput,
        nativeEvent: { isComposing: false },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.form.getValues("card")).toMatch(/^34/);
    expect(result.current.fields.card.rawValue).toMatch(/^34/);

    cvvInput.value = "1234";
    cvvInput.selectionStart = 4;
    await act(async () => {
      result.current.fields.cvv.onChange({
        target: cvvInput,
        currentTarget: cvvInput,
        nativeEvent: { isComposing: false },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.fields.cvv.rawValue).toBe("1234");
    expect(result.current.fields.cvv.value).toBe("1234");

    // Switch to Visa → CVV mask becomes 3 digits
    cardInput.value = "4111111111111111";
    cardInput.selectionStart = 16;
    await act(async () => {
      result.current.fields.card.onChange({
        target: cardInput,
        currentTarget: cardInput,
        nativeEvent: { isComposing: false },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => {
      expect(result.current.fields.cvv.value).toBe("123");
      expect(result.current.fields.cvv.rawValue).toBe("123");
      expect(result.current.form.getValues("cvv")).toBe("123");
    });
  });
});
