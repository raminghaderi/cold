import { UpdateManager } from './../../assets/types/rdflib/index.d';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import * as SolidFileClient from 'solid-file-client';
//const filedc = require('solid-file-client');

import UI from 'solid-ui';

declare let $rdf:any;

@Component({
  selector: 'app-longchat',
  templateUrl: './longchat.component.html',
  styleUrls: ['./longchat.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LongchatComponent implements OnInit {
    
    ns = UI.ns;
    kb = $rdf.graph();
    fileClient = SolidFileClient;

    mainClass:string = this.ns.meeting('LongChat');
    name:string = "long chat";
    updater = new $rdf.UpdateManager(this.kb);


    longchat: String = `
@prefix : <#>.
@prefix mee: <http://www.w3.org/ns/pim/meeting#>.
@prefix ic: <http://www.w3.org/2002/12/cal/ical#>.
@prefix XML: <http://www.w3.org/2001/XMLSchema#>.
@prefix flow: <http://www.w3.org/2005/01/wf/flow#>.
@prefix c: </profile/card#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix n0: <http://purl.org/dc/elements/1.1/>.

:id1544542982461
    ic:dtstart "2018-12-11T15:43:02Z"^^XML:dateTime;
    flow:participant c:me;
    ui:backgroundColor "#faf8ca".
:this
    a mee:LongChat;
    n0:author c:me;
    n0:created "2018-12-11T15:42:07Z"^^XML:dateTime;
    n0:title "Chat channel";
    flow:participation :id1544542982461;
    ui:sharedPreferences :SharedPreferences.
    `;


  constructor() { }

  ngOnInit() {
    var paneOptions: any = {
        me: {
          uri:"https://apraku.solid.community/profile/card#me"
        },
        newBase: "https://apraku.solid.community/public/"
      };
    this.mintNew(paneOptions);
  }

  label(subject) {
    if (this.kb.holds(subject, this.ns.rdf('type'), this.ns.meeting('LongChat'))) { // subject is the object
      return 'Chat channnel';
    }
    return null; // Suppress pane otherwise
  }

  mintNew (newPaneOptions:any) {
    
    if (newPaneOptions.me && !newPaneOptions.me.uri) throw new Error('chat mintNew:  Invalid userid ' + newPaneOptions.me)

    var newInstance = newPaneOptions.newInstance = newPaneOptions.newInstance || this.kb.sym(newPaneOptions.newBase + 'index.ttl#this')
    var newChatDoc = newInstance.doc()

    this.kb.add(newInstance, this.ns.rdf('type'), this.ns.meeting('LongChat'), newChatDoc)
    this.kb.add(newInstance, this.ns.dc('title'), 'Chat channel', newChatDoc)
    this.kb.add(newInstance, this.ns.dc('created'), new Date(), newChatDoc)
    if (newPaneOptions.me) {
      this.kb.add(newInstance, this.ns.dc('author'), newPaneOptions.me, newChatDoc)
    }

    this.fileClient.createFile(newPaneOptions.newBase+"index.ttl").then( success => {
      if(!success) console.log(this.fileClient.err)
      else console.log( `Created file ${newPaneOptions.newBase}.`)
  })

  this.fileClient.updateFile( newPaneOptions.newBase+"index.ttl", this.longchat ).then( success => {
    if(!success) console.log(this.fileClient.err)
    else console.log( `Updated ${newPaneOptions.newBase}.`)
})

    /*return new Promise((resolve, reject) => {
      this.updater.update(
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
    })*/
  }

  render(uri, dom){

    let subject = this.kb.sym(uri);
     /* Preferences
    **
    **  Things like whether to color text by author webid, to expand image URLs inline,
    ** expanded inline image height. ...
    ** In general, preferences can be set per user, per user/app combo, per instance,
    ** and per instance/user combo. Per instance? not sure about unless it is valuable
    ** for everyone to be seeing the same thing.
    */
   const preferencesFormText = `
   @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
   @prefix solid: <http://www.w3.org/ns/solid/terms#>.
   @prefix ui: <http://www.w3.org/ns/ui#>.
   @prefix : <#>.
   :this
     <http://purl.org/dc/elements/1.1/title> "Chat preferences" ;
     a ui:Form ;
     ui:part :colorizeByAuthor, :expandImagesInline, :newestFirst, :inlineImageHeightEms;
     ui:parts ( :colorizeByAuthor :expandImagesInline :newestFirst :inlineImageHeightEms ).
 :colorizeByAuthor a ui:TristateField; ui:property solid:colorizeByAuthor;
   ui:label "Color user input by user".
 :expandImagesInline a ui:TristateField; ui:property solid:expandImagesInline;
   ui:label "Expand image URLs inline".
 :newestFirst a ui:TristateField; ui:property solid:newestFirst;
   ui:label "Newest messages at the top".
 :inlineImageHeightEms a ui:IntegerField; ui:property solid:inlineImageHeightEms;
   ui:label "Inline image height (lines)".
 `
     const preferencesForm = this.kb.sym('https://solid.github.io/solid-panes/longChatPane/preferencesForm.ttl#this')
     const preferencesFormDoc = preferencesForm.doc()
     if (!this.kb.holds(undefined, undefined, undefined, preferencesFormDoc)) { // If not loaded already
       $rdf.parse(preferencesFormText, this.kb, preferencesFormDoc.uri, 'text/turtle') // Load form directly
     }
     let preferenceProperties = this.kb.statementsMatching(null, this.ns.ui.property, null, preferencesFormDoc).map(st => st.object)
 
 
     var div = dom.createElement('div')
     div.setAttribute('class', 'chatPane')
     let options = {infinite: true, menuHandler: this.menuHandler} // Like newestFirst
     let context:any = {noun: 'chat room', div, dom}
     context.me = UI.authn.currentUser() // If already logged on
 
     UI.preferences.getPreferencesForClass(subject, this.mainClass, preferenceProperties, context).then(prefMap => {
       for (let propuri in prefMap) {
         options[propuri.split('#')[1]] = prefMap[propuri]
       }
       div.appendChild(UI.infiniteMesagseArea(dom, this.kb, subject, options))
     }, err => UI.widgets.complain(err))
 
     return div
   }
 
   
     //          Menu
     //
     // Build a menu a the side (@@ reactive: on top?)
     menuHandler (event, subject, menuOptions,preferencesForm) {
      let div = menuOptions.div
      let dom = menuOptions.dom
      // let me = menuOptions.me

      div.menuExpaded = !div.menuExpaded
      if (div.menuExpaded) { // Expand
        let menuArea = div.appendChild(dom.createElement('div'))
        // @@ style below fix .. just make it onviious while testing
        menuArea.style = 'border-radius: 1em; border: 0.1em solid purple; padding: 1em;'
        let menuTable = menuArea.appendChild(dom.createElement('table'))

        let participantsArea = menuTable.appendChild(dom.createElement('tr'))
        let registrationArea = menuTable.appendChild(dom.createElement('tr'))
        let preferencesArea = menuTable.appendChild(dom.createElement('tr'))
        // let commandsArea = menuTable.appendChild(dom.createElement('tr'))
        let statusArea = menuTable.appendChild(dom.createElement('tr'))

        UI.pad.manageParticipation(dom, participantsArea, subject.doc(), subject, menuOptions.me, {})

        var context = {noun: 'chat room', me: menuOptions.me, statusArea: statusArea, div: registrationArea, dom: dom}
        UI.authn.registrationControl(context, subject, this.mainClass).then(function (context) {
          console.log('Registration control finsished.')
        })

        var context2 =()=>{
          let kkb = this.kb;
          return {noun: 'chat room', me: menuOptions.me, statusArea: statusArea, div: preferencesArea, dom, kkb}
      } 
        if (!menuOptions.me) alert('menu: no me!')
        preferencesArea.appendChild(UI.preferences.renderPreferencesForm(subject, this.mainClass, preferencesForm, context2))

        div.menuArea = menuArea
      } else { // Close menu  (hide or delete??)
        div.removeChild(div.menuArea)
      }
    } // menuHandler

   


}