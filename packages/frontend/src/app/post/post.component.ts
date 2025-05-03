import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Component({
  selector: 'app-post',
  template: `
    <p>{{id()}}</p>
  `
})
export class PostComponent {
  id = input.required<string>();
  
  post = httpResource.text(() => this.id() === undefined ? undefined : `posts/${this.id()}.md`);
  
}