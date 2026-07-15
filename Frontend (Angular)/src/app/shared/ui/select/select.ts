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
  selector: 'app-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor {

  @Input() label = '';

  @Input() disabled = false;

  @Input() options: {
    label: string;
    value: string;
  }[] = [];

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