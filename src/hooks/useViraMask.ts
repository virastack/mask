'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FieldValues, Path, PathValue } from 'react-hook-form';
import { processInput } from '../core/engine';
import { VALIDATORS } from '../core/logic';
import { PRESETS } from '../core/presets';
import { formatCurrency } from '../core/strategies/currency';
import { MaskField, MaskFields, MaskOptions, MaskPreset, MaskSchema, UseViraMaskProps } from '../types';
import { mergeRefs } from '../utils/ref';

function getDefaultInputMode(mask?: string): MaskField['inputMode'] {
  if (!mask) return 'text';
  const hasLetterSlot = mask.includes('a') || mask.includes('A') || mask.includes('*');
  return hasLetterSlot ? 'text' : 'tel';
}

/**
 * Normalize a form/DOM value into canonical raw.
 * Mask literals (spaces, parens) must never remain in raw state.
 */
function toCanonicalRaw(value: string, options: MaskOptions): string {
  if (!value) return '';
  if (options.currency) {
    // Internal raw always uses `.` as decimal; display may use locale separators.
    // If value is already canonical raw (from setValue), keep digits + single `.`.
    const looksLikeCanonicalRaw = /^\d+(\.\d*)?$/.test(value);
    if (looksLikeCanonicalRaw) return value;
    return processInput(value, options).value;
  }
  return processInput(value, options).value;
}

function toDisplayValue(rawValue: string, options: MaskOptions): string {
  if (!rawValue) return '';
  if (options.currency) {
    return formatCurrency(rawValue, options.currency);
  }
  return processInput(rawValue, options).displayValue;
}

export function useViraMask<
  TFieldValues extends FieldValues,
  TSchema extends MaskSchema<TFieldValues>
>({
  form,
  schema,
}: UseViraMaskProps<TFieldValues, TSchema>) {
  const { setValue, getValues, register, formState: { errors } } = form;
  const [focusedField, setFocusedField] = useState<string | null>(null);
  /** Forces a re-render after raw ref updates (setValue alone may not). */
  const [rawEpoch, setRawEpoch] = useState(0);

  const cursorRequestRef = useRef<{ name: string; position: number } | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const isComposingRef = useRef(false);
  /** Source of truth for raw values — never read masked DOM via getValues for rawValue. */
  const rawValuesRef = useRef<Record<string, string>>({});

  useLayoutEffect(() => {
    if (!cursorRequestRef.current) return;
    // Avoid breaking active IME / dead-key composition.
    if (isComposingRef.current) return;

    const { name, position } = cursorRequestRef.current;
    const input = fieldRefs.current[name];
    if (input) {
      const type = input.type;
      const supportsSelection = /text|search|url|tel|password/i.test(type);

      if (supportsSelection) {
        input.setSelectionRange(position, position);
      }
    }
    cursorRequestRef.current = null;
  });

  const getMaskOptions = useCallback((config: MaskPreset | MaskOptions): MaskOptions => {
    if (typeof config === 'string') {
      return PRESETS[config] || {};
    }
    if (config.preset) {
      return { ...PRESETS[config.preset], ...config };
    }
    return config;
  }, []);

  const getSchemaValues = useCallback(() => {
    // resolveMask (e.g. CVV) must see canonical raws, not possibly masked form/DOM values.
    const values = { ...(getValues() as Record<string, unknown>) };
    for (const key of Object.keys(rawValuesRef.current)) {
      const raw = rawValuesRef.current[key];
      if (raw !== undefined) values[key] = raw;
    }
    return values;
  }, [getValues]);

  const getEffectiveOptions = useCallback((options: MaskOptions, value: string): MaskOptions => {
    if (options.resolveMask) {
      const resolvedMask = options.resolveMask(value, getSchemaValues(), schema);
      if (resolvedMask) {
        return { ...options, mask: resolvedMask };
      }
    }
    return options;
  }, [getSchemaValues, schema]);

  const commitRaw = useCallback((
    name: Path<TFieldValues>,
    raw: string,
    setOpts?: Parameters<typeof setValue>[2]
  ) => {
    rawValuesRef.current[String(name)] = raw;
    setValue(name, raw as PathValue<TFieldValues, Path<TFieldValues>>, setOpts);
    setRawEpoch((n) => n + 1);
  }, [setValue]);

  /** Re-apply masks that depend on siblings (CVV length follows card type). */
  const syncDependentRaws = useCallback((exceptKey?: string) => {
    for (const key in schema) {
      if (exceptKey && key === exceptKey) continue;
      const config = schema[key];
      if (!config) continue;

      const options = getMaskOptions(config);
      if (!options.resolveMask) continue;

      const fieldName = key as unknown as Path<TFieldValues>;
      const storedRaw = rawValuesRef.current[key] ?? '';
      if (!storedRaw) continue;

      const effectiveOptions = getEffectiveOptions(options, storedRaw);
      const { value: canonicalRaw, displayValue } = processInput(storedRaw, effectiveOptions);
      if (canonicalRaw === storedRaw) continue;

      commitRaw(fieldName, canonicalRaw, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const input = fieldRefs.current[key];
      if (input && input.value !== displayValue) {
        input.value = displayValue;
      }
    }
  }, [schema, getMaskOptions, getEffectiveOptions, commitRaw]);

  useLayoutEffect(() => {
    // Imperative overwrites during composition drop compositionend on some browsers
    // (dead keys like ^), leaving isComposing stuck and freezing the input.
    if (isComposingRef.current) return;

    for (const key in schema) {
      const config = schema[key];
      if (!config) continue;

      const fieldName = key as unknown as Path<TFieldValues>;
      const options = getMaskOptions(config);
      const formValue = getValues(fieldName);
      const formStr = formValue !== undefined && formValue !== null ? String(formValue) : '';

      if (rawValuesRef.current[key] === undefined) {
        rawValuesRef.current[key] = toCanonicalRaw(
          formStr,
          getEffectiveOptions(options, formStr),
        );
      }

      const rawValue = rawValuesRef.current[key] ?? '';
      const effectiveOptions = getEffectiveOptions(options, rawValue);
      // Re-apply current mask so dependent length changes (Amex CVV 4 → 3) truncate raw too.
      const { value: canonicalRaw, displayValue } = processInput(rawValue, effectiveOptions);

      if (canonicalRaw !== rawValue) {
        commitRaw(fieldName, canonicalRaw, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      const input = fieldRefs.current[key];
      if (input && input.value !== displayValue) {
        input.value = displayValue;
      }
    }
  });

  const updateField = useCallback((
    name: Path<TFieldValues>,
    value: string,
    options: MaskOptions,
    selectionStart: number | null,
    inputElement: HTMLInputElement
  ) => {
    const key = String(name);
    let previousDisplayValue = '';
    const currentRawValue = rawValuesRef.current[key] ?? getValues(name);
    if (currentRawValue !== undefined && currentRawValue !== null && currentRawValue !== '') {
       const oldEffectiveOptions = getEffectiveOptions(options, String(currentRawValue));
       previousDisplayValue = toDisplayValue(String(currentRawValue), oldEffectiveOptions);
    }

    const effectiveOptions = getEffectiveOptions(options, value);
    const { value: finalRawValue, displayValue: finalDisplayValue, cursorPosition, cardType } = processInput(
        value, 
        effectiveOptions, 
        selectionStart,
        previousDisplayValue
    );

    if (cardType && options.onCardTypeChange) {
        options.onCardTypeChange(cardType);
    }

    inputElement.value = finalDisplayValue;
    commitRaw(name, finalRawValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    // Card type change must truncate CVV raw immediately (not only display).
    syncDependentRaws(key);

    const supportsSelection = /text|search|url|tel|password/i.test(inputElement.type);
    if (supportsSelection) {
       cursorRequestRef.current = { name: key, position: cursorPosition };
    }
  }, [commitRaw, getValues, getEffectiveOptions, syncDependentRaws]);

  const createChangeHandler = useCallback(
    (name: Path<TFieldValues>, options: MaskOptions) => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        const nativeEvent = e.nativeEvent as InputEvent;
        const browserComposing = Boolean(nativeEvent.isComposing);

        // Dead-key layouts (e.g. ^) can fire compositionstart without compositionend.
        // Trust the browser: if it reports not composing, clear a stuck flag and continue.
        if (isComposingRef.current && !browserComposing) {
          isComposingRef.current = false;
        }

        if (isComposingRef.current || browserComposing) return;

        updateField(name, e.target.value, options, e.target.selectionStart, e.target);
      };
    },
    [updateField]
  );

  const createCompositionStartHandler = useCallback(() => {
    return () => {
      isComposingRef.current = true;
    };
  }, []);

  const createCompositionEndHandler = useCallback(
    (name: Path<TFieldValues>, options: MaskOptions) => {
      return (e: React.CompositionEvent<HTMLInputElement>) => {
        isComposingRef.current = false;
        updateField(name, e.currentTarget.value, options, e.currentTarget.selectionStart, e.currentTarget);
      };
    },
    [updateField]
  );

  const createKeyDownHandler = useCallback(
    (name: Path<TFieldValues>, options: MaskOptions) => {
      return (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        const { selectionStart, selectionEnd, value } = input;

        if (
          e.key === 'Backspace' &&
          options.currency?.symbolPosition === 'suffix' &&
          selectionStart === value.length &&
          selectionStart === selectionEnd
        ) {
          e.preventDefault();

          const rawDigits = value.replace(/[^0-9]/g, '');
          if (!rawDigits) return;

          const newRawDigits = rawDigits.slice(0, -1);
          updateField(name, newRawDigits, options, null, input);
        }
      };
    },
    [updateField]
  );

  const maskedFields = useMemo(() => {
    const fields: Partial<MaskFields<TSchema>> = {};

    for (const key in schema) {
      const config = schema[key];
      if (!config) continue;

      const options = getMaskOptions(config);
      const fieldName = key as unknown as Path<TFieldValues>;
      
      const { ref: rhfRef, name, onBlur: rhfOnBlur, ...rest } = register(fieldName, {
        validate: {
          maskFormat: (value) => {
            if (!options.validate) return true;
            // Validate against canonical raw, never masked display.
            const raw = rawValuesRef.current[key] ?? toCanonicalRaw(String(value ?? ''), options);
            if (!raw) return true;

            let isValid = true;
            if (typeof options.validator === 'function') {
              isValid = options.validator(raw);
            } else if (typeof options.validator === 'string' && VALIDATORS[options.validator]) {
              if (options.validator === 'date') {
                isValid = VALIDATORS.date(raw, options.dateFormat);
              } else {
                isValid = VALIDATORS[options.validator](raw);
              }
            }

            return isValid || (options.errorMessage || false);
          }
        }
      });

      const { onChange: _onChange, ...cleanRest } = rest;

      const formValue = getValues(fieldName);
      const formStr = formValue !== undefined && formValue !== null ? String(formValue) : '';
      const baseOptions = getEffectiveOptions(options, formStr);

      if (rawValuesRef.current[key] === undefined && formStr) {
        rawValuesRef.current[key] = toCanonicalRaw(formStr, baseOptions);
      }

      const storedRaw = rawValuesRef.current[key] ?? '';
      const effectiveOptions = getEffectiveOptions(options, storedRaw);
      const { value: rawValue, displayValue } = processInput(storedRaw, effectiveOptions);

      const combinedRef = mergeRefs(rhfRef, (el: HTMLInputElement | null) => {
        fieldRefs.current[key] = el;
      });

      const handleChange = createChangeHandler(fieldName, options);
      const handleKeyDown = createKeyDownHandler(fieldName, options);
      const handleCompositionStart = createCompositionStartHandler();
      const handleCompositionEnd = createCompositionEndHandler(fieldName, options);

      const handleFocus = (_e: React.FocusEvent<HTMLInputElement>) => {
          setFocusedField(key);
          const raw = rawValuesRef.current[key] ?? '';
          if (raw) {
             const effective = getEffectiveOptions(options, raw);
             const { cardType } = processInput(raw, effective);
             
             if (cardType && options.onCardTypeChange) {
                options.onCardTypeChange(cardType);
             }
          }
      };

      const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
          // Focus loss mid-composition often skips compositionend; never leave the field stuck.
          isComposingRef.current = false;
          const raw = rawValuesRef.current[key] ?? '';
          const effective = getEffectiveOptions(options, raw);
          const { value: canonicalRaw } = processInput(raw, effective);
          // RHF register may sync masked DOM into form state on blur — re-assert raw after.
          rhfOnBlur(e);
          commitRaw(fieldName, canonicalRaw, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
          setFocusedField(null);
      };

      const fieldObj: MaskField = {
        ...cleanRest,
        name,
        value: displayValue,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onCompositionStart: handleCompositionStart,
        onCompositionEnd: handleCompositionEnd,
        onBlur: handleBlur,
        onFocus: handleFocus,
        type: options.type || 'text',
        inputMode: options.inputMode || (options.currency ? 'decimal' : getDefaultInputMode(options.mask)),
        autoComplete: options.autoComplete ?? (options.type === 'email' ? 'email' : options.type === 'password' ? 'current-password' : 'off'),
        'aria-invalid': !!errors[key],
        'aria-describedby': options.mask ? `${name}-description` : undefined,
        title: options.mask,
        ref: combinedRef,
        rawValue,
      };

      fields[key as keyof TSchema] = fieldObj as any;
    }

    return fields as MaskFields<TSchema>;
  }, [
    schema, 
    register, 
    getValues, 
    createChangeHandler, 
    createKeyDownHandler, 
    createCompositionStartHandler, 
    createCompositionEndHandler, 
    getMaskOptions, 
    getEffectiveOptions,
    commitRaw,
    focusedField,
    rawEpoch,
    errors
  ]);

  return maskedFields;
}
