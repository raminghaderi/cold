import { Component,ViewEncapsulation, OnInit, Input } from '@angular/core';
import { Message } from '../models/message.model';

@Component({
  selector: 'app-message-area',
  templateUrl: './message-area.component.html',
  styleUrls: ['./message-area.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class MessageAreaComponent implements OnInit {

  @Input() messagesList:Message[]

  constructor() { }

  ngOnInit() {
  }

  sortFunc(a,b){
   return a.dateCreated - b.dateCreated
  }
}
