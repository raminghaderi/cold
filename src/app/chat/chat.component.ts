import { Component, OnInit } from '@angular/core';
import UI from 'solid-ui';
declare let $rdf: any;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  ns = UI.ns;
  kb = $rdf.graph();

  mainClass = this.ns.meeting('LongChat');
  name = 'long chat';

  constructor() { }

  ngOnInit() {

    var paneOptions: any = {
      me: {
        uri:"https://raminholuiz.solid.community/profile/card#me"
      },
      newBase: "https://raminholuiz.solid.community/Long%20Chat/"
    };
    this.mintNew(paneOptions);

  }

  label(subject) {
    if (this.kb.holds(subject, this.ns.rdf('type'), this.ns.meeting('LongChat'))) { // subject is the object
      return 'Chat channnel';
    }
    return null; // Suppress pane otherwise
  }



  mintNew (newPaneOptions) {
    var updater = this.kb.updater
    if (newPaneOptions.me && !newPaneOptions.me.uri) throw new Error('chat mintNew:  Invalid userid ' + newPaneOptions.me)

    var newInstance = newPaneOptions.newInstance = newPaneOptions.newInstance || this.kb.sym(newPaneOptions.newBase + 'https://solid.github.io/solid-panes/longChatPane/preferencesForm.ttl#this')
    var newChatDoc = newInstance.doc()

    this.kb.add(newInstance, this.ns.rdf('type'), this.ns.meeting('LongChat'), newChatDoc)
    this.kb.add(newInstance, this.ns.dc('title'), 'Chat channel', newChatDoc)
    this.kb.add(newInstance, this.ns.dc('created'), new Date(), newChatDoc)
    if (newPaneOptions.me) {
      this.kb.add(newInstance, this.ns.dc('author'), newPaneOptions.me, newChatDoc)
    }

    return new Promise((resolve, reject) => {
      updater.put(
        newChatDoc,
        this.kb.statementsMatching(undefined, undefined, undefined, newChatDoc),
        'text/turtle',
        function (uri2, ok, message) {
          if (ok) {
            resolve(newPaneOptions)
          } else {
            reject(new Error('FAILED to save new chat channel at: ' + uri2 + ' : ' +
              message))
          };
        })
    })
  }



}
