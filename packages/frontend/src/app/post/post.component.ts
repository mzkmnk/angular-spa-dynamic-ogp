import { Component, input } from '@angular/core';

@Component({
  selector: 'app-post',
  template: `
    <p>{{id()}}</p>
  `
})
export class PostComponent {
  id = input.required<string>();
}