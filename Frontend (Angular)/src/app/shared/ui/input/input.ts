import {
  Component,
  Input,
  forwardRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './input.html',
  styleUrl: './input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {

  @Input() label = '';

  @Input() placeholder = '';

  @Input() type = 'text';

  @Input() disabled = false;

  @Input() readonly = false;

  @Input() required = false;

  @Input() error = '';

  value = '';

  onChange = (_: string) => {};

  onTouched = () => {};

  writeValue(value: string): void {

    this.value = value ?? '';

  }

  registerOnChange(fn: any): void {

    this.onChange = fn;

  }

  registerOnTouched(fn: any): void {

    this.onTouched = fn;

  }

  setDisabledState(isDisabled: boolean): void {

    this.disabled = isDisabled;

  }

  updateValue(value: string) {

    this.value = value;

    this.onChange(value);
    this.onTouched();

  }

}