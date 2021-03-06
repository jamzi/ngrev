import {
  Component,
  Output,
  EventEmitter,
  ViewChildren,
  ElementRef,
  Renderer2,
  QueryList,
  AfterViewInit,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Symbol } from 'ngast';
import { KeyValuePair } from './quick-access.component';

const EnterKeyCode = 13;
const UpArrowKeyCode = 38;
const DownArrowKeyCode = 40;

@Component({
  selector: 'ngrev-quick-access-list',
  template: `
    <ul *ngIf="bindData.length">
      <li #items *ngFor="let element of bindData; let i=index"
        [class.selected]="i === selection"
        (click)="selectItem($event, element)"
        [innerHtml]="formatText(element.key)">
      </li>
    </ul>
  `,
  host: {
    '(document:keydown)': 'onKeyDown($event)'
  },
  styles: [
    `
    :host {
      background: white;
      display: block;
      margin-top: 3px;
      width: 100%;
      max-height: calc(100% - 70px);
      border-top: 1px solid #ccc;
      overflow: auto;
    }
    ul {
      width: 100%;
      padding: 0;
      margin-top: 0;
      margin-bottom: 0;
    }
    li {
      list-style: none;
      padding: 16px;
      border-bottom: 1px solid #ccc;
      border-left: 1px solid #ccc;
      border-right: 1px solid #ccc;
      cursor: pointer;
    }
    .selected {
      background: #efefef;
    }
  `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAccessListComponent {
  bindData: KeyValuePair<any>[] = [];

  @Input() highlight: string;
  @Input()
  set data(val: KeyValuePair<any>[]) {
    this.bindData = val;
    if (this.selection >= val.length) {
      this.highlightItem(0);
    }
  }
  @Output() select = new EventEmitter<KeyValuePair<any>>();
  @ViewChildren('items') items: QueryList<ElementRef>;

  selection = 0;

  constructor(private renderer: Renderer2, private sanitizer: DomSanitizer) {}

  selectItem(e, element: KeyValuePair<any>) {
    this.select.emit(element);
    e.stopImmediatePropagation();
  }

  onKeyDown(e) {
    let nextIdx = this.selection;
    if (e.keyCode === UpArrowKeyCode) {
      nextIdx = this.selection - 1;
      if (nextIdx < 0) {
        nextIdx = this.bindData.length - 1;
      }
    }
    if (e.keyCode === DownArrowKeyCode) {
      nextIdx = (this.selection + 1) % this.bindData.length;
    }
    if (e.keyCode === EnterKeyCode && this.bindData[this.selection]) {
      this.select.emit(this.bindData[this.selection]);
    }
    this.highlightItem(nextIdx);
  }

  formatText(text: string): SafeHtml {
    const map = {};
    (this.highlight || '').split('').forEach(c => (map[c.toLowerCase()] = true));
    const textChars = text.split('');
    return this.sanitizer.bypassSecurityTrustHtml(
      textChars.reduce((a, c) => {
        return a + (map[c.toLowerCase()] ? `<b>${c}</b>` : c);
      }, '')
    );
  }

  private highlightItem(idx: number) {
    if (!this.items) return;
    this.unHighlightItem(this.selection);
    const elements = this.items.toArray();
    const item = elements[idx];
    if (item) {
      this.renderer.addClass(item.nativeElement, 'selected');
      this.ensureVisible(item);
    }
    this.selection = idx;
  }

  private unHighlightItem(idx: number) {
    if (!this.items) return;
    const elements = this.items.toArray();
    const item = elements[idx];
    if (item) {
      this.renderer.removeClass(item.nativeElement, 'selected');
    }
  }

  private ensureVisible(item: ElementRef) {
    const domNode = item.nativeElement;
    const directParent = domNode.parentNode;
    const scrollParent = directParent.parentNode;
    const nodeTop = domNode.offsetTop;
    const nodeBottom = nodeTop + domNode.offsetHeight;
    const visibleBottom = scrollParent.scrollTop + scrollParent.offsetHeight;
    if (nodeTop - domNode.offsetHeight < scrollParent.scrollTop) {
      scrollParent.scrollTop = nodeTop - domNode.offsetHeight;
    }
    if (nodeBottom > visibleBottom) {
      scrollParent.scrollTop = nodeBottom - scrollParent.offsetHeight - domNode.offsetHeight;
    }
  }
}
