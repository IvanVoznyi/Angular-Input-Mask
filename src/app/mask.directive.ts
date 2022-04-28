//mask.directive.ts
import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import {
  filter,
  fromEvent,
  map,
  merge,
  startWith,
  tap,
  withLatestFrom,
} from 'rxjs';

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

    const dragStartEvent = fromEvent<DragEvent>(input, 'dragstart').pipe(
      tap((event) => event.preventDefault())
    );
    const inputEvent = fromEvent<InputEvent>(input, 'input');
    const selectEvent = fromEvent(input, 'select').pipe(
      startWith({
        type: '',
        target: {
          value: input.value,
          selectionEnd: 0,
          selectionStart: 0,
        },
      }),
      map((event) => {
        return {
          target: event,
          value: (event.target as HTMLInputElement).value,
          type: event.type,
          selectionEnd: (event.target as HTMLInputElement).selectionEnd ?? 0,
          selectionStart:
            (event.target as HTMLInputElement).selectionStart ?? 0,
        };
      })
    );

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

    merge(inputEvent, dragStartEvent)
      .pipe(
        filter((event) => {
          return !(event instanceof DragEvent);
        }),
        withLatestFrom(selectEvent),
        filter(([event, select]) => {
          const input = event.target as HTMLInputElement;
          const selectionEnd = input.selectionEnd ?? 0;
          const isSelected = select.selectionEnd > select.selectionStart;

          if(isSelected) {
            select.selectionEnd = select.selectionStart;
            input.value = select.value;
            input.selectionStart = select.selectionStart;
            input.selectionEnd = select.selectionStart;
          }  

          if (selectionEnd >= this.mask.length && !isSelected) {           
            input.value = input.value.slice(0, this.mask.length);
          }

          return selectionEnd < this.mask.length + 1 && !isSelected
        }),
        map(([event]) => {
          const input = event.target as HTMLInputElement;
          let selectionStart = input.selectionStart ?? 0;
          let selectionEnd = input.selectionEnd ?? 0;
          let value = input.value;

          return {
            inputType: (event as InputEvent).inputType,
            selectionStart: selectionStart - 1,
            selectionEnd: selectionEnd,
            value: value
          };
        }),
        map((inputData) => {
          if (inputData.inputType === 'insertText') {
            const oneCharacter = 1;
            if (!maskCharacter.includes(this.mask[inputData.selectionStart])) {
              inputData.selectionEnd = inputData.selectionStart;
            }

            const beforeInsertText = getTextBeforeTyping(inputData);
            const afterInsertText = getTextAfterTyping(inputData, true);

            input.value = `${beforeInsertText}${afterInsertText}`;

            input.selectionEnd = selectionEnd(
              inputData,
              inputData.selectionEnd,
              inputData.selectionEnd + oneCharacter
            );
          } else {
            const beforeDeleteText = getTextBeforeTyping(inputData);
            const maskCharacter = this.mask[inputData.selectionEnd];
            const afterDeleteText = getTextAfterTyping(inputData);

            input.value = `${beforeDeleteText}${maskCharacter}${afterDeleteText}`;

            input.selectionEnd = selectionEnd(
              inputData,
              inputData.selectionStart,
              inputData.selectionEnd
            );
          }
          return input.value;
        }),
        filter((value) => new RegExp(this.validation, 'gi').test(value))
      )
      .subscribe((val) => console.log(val));
  }
}
