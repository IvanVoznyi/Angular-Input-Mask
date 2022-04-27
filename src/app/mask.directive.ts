//mask.directive.ts
import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { filter, fromEvent, map } from 'rxjs';

interface InputData {
  inputType: string;
  selectionStart: number;
  selectionEnd: number;
  value: string;
}

@Directive({
  selector: '[mask], [validation]',
})
export class MaskDirective implements OnInit {
  @Input('mask')
  mask: string = '';

  @Input('validation')
  validation: string = '';

  constructor(private element: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    const maskCharacter = ['_', '#'];
    const input = this.element.nativeElement;
    input.value = this.mask;

    const getTextBeforeTyping = (inputData: InputData) =>
      inputData.value.slice(0, inputData.selectionEnd);

    const getTextAfterTyping = (
      inputData: InputData,
      isSkipNextCharacterAfterTyping = false
    ) => {
      const oneCharacterOrNone = isSkipNextCharacterAfterTyping ? 1 : 0;
      return inputData.value.slice(
        inputData.selectionEnd + oneCharacterOrNone,
        this.mask.length + oneCharacterOrNone
      );
    };

    const selectionEnd = (
      inputData: InputData,
      currentIndexCharacter: number,
      nextIndexSelection: number
    ) =>
      !maskCharacter.includes(this.mask[currentIndexCharacter])
        ? nextIndexSelection
        : inputData.selectionEnd;

    fromEvent<InputEvent>(input, 'input')
      .pipe(
        filter((event) => {
          const input = event.target as HTMLInputElement;
          const selectionEnd = input.selectionEnd ?? 0;

          if (selectionEnd >= this.mask.length) {
            input.value = input.value.slice(0, this.mask.length);
          }

          return selectionEnd < this.mask.length + 1;
        }),
        map((event) => {
          const input = event.target as HTMLInputElement;
          const start = (input.selectionStart ?? 0) - 1;
          const selectionStart = start < 0 ? 0 : start;

          return {
            inputType: event.inputType,
            selectionStart,
            selectionEnd: input.selectionEnd ?? 0,
            value: input.value,
          };
        }),
        map((inputData) => {         
          if (inputData.inputType === 'insertText') {
            if (!maskCharacter.includes(this.mask[inputData.selectionStart])) {
              inputData.selectionEnd = inputData.selectionStart;
            }

            const beforeInsertText = getTextBeforeTyping(inputData);
            const afterInsertText = getTextAfterTyping(inputData, true);

            input.value = `${beforeInsertText}${afterInsertText}`;

            input.selectionEnd = selectionEnd(
              inputData,
              inputData.selectionEnd,
              inputData.selectionEnd + 1
            );
          } else {
            const beforeDeleteText = getTextBeforeTyping(inputData);
            const maskCharacter = this.mask[inputData.selectionEnd];
            const afterDeleteText = getTextAfterTyping(inputData);

            input.value = `${beforeDeleteText}${maskCharacter}${afterDeleteText}`;

            input.selectionEnd = selectionEnd(
              inputData,
              inputData.selectionStart,
              inputData.selectionEnd - 1
            );
          }
          return input.value;
        }),
        filter((value) => new RegExp(this.validation, 'gi').test(value))
      )
      .subscribe((val) => console.log(val));
  }
}