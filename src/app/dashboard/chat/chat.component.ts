import { Component, OnInit, OnDestroy,AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ChatService } from './chat.service';
import { Message } from '../../models/message.model';
import { PodHandlerService } from '../../services/pod-handler.service';
import { Workspace } from '../../models/workspace.model';

import * as SolidFileClient from "solid-file-client";
import { NbMenuService } from '@nebular/theme';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'ngx-chat',
  templateUrl: 'chat.component.html',
  styleUrls: ['chat.component.scss'],
  providers: [ ChatService ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit, OnDestroy,AfterViewInit {
 
 
  messages: any[]=[];
 
  activeWorkSpace: Workspace
  isIndexSubscribed:boolean = false
  isChatFileSubscribed:boolean = false
  private alive: boolean = true;

  fileClient = SolidFileClient
  selectedItem: any;

  constructor(protected chatService: ChatService,
    private podhandler:PodHandlerService,
            private _Activatedroute:ActivatedRoute,
            private menuService: NbMenuService,
            private cdr: ChangeDetectorRef
            ) 
            {
          //  this.messages = this.chatService.loadMessages();
        }

  ngOnInit(): void {
   setTimeout(() => {
     this.getSelectedItem()
   }, 500); 
   /* this._Activatedroute.queryParams.subscribe(params => { 
      this.activeWorkSpace = JSON.parse(params['ws']);

    });  */

  }
  ngAfterViewInit(): void {
 
  }
  
  ngOnDestroy() {
    this.alive = false;
  }

  sendMessage(event: any) {
    const files = !event.files ? [] : event.files.map((file) => {
      return {
        url: file.src,
        type: file.type,
        icon: 'nb-compose',
      };
    });
 let that = this
    this.podhandler.sendMessage(this.activeWorkSpace,
      event.message)
      .then(_=>{ 
         console.log( event.message)
     
     that.syncMessages();
    }
   ).catch(err=>{
     console.log("Error "+err)
   })

  
  /*
    const botReply = this.chatService.reply(event.message);
    if (botReply) {
      setTimeout(() => { this.messages.push(botReply); }, 500);
    } */
  }

  
 send=(msg:string)=>{
   let msgg = msg
 
}


syncMessages= async ()=> {

// get references to the index.ttl and chat.ttl files and load to store

let indexDoc = this.activeWorkSpace.indexFile+"#this"
await Promise.all([  this.podhandler.loadResource(indexDoc) ,
 this.podhandler.loadResource(this.activeWorkSpace.getChatStoreFile())
]) 
 .then(async _=>{
 
   let subject = this.podhandler.store.sym(indexDoc)
   let subjectDoc = subject.doc()
let chatDoc = this.podhandler.store.sym(this.activeWorkSpace.getChatStoreFile()).doc()
// Subscribe to receive changes


  this.podhandler.store.each(
   subject, this.podhandler.ns.wf('message'), null,subjectDoc).forEach( st => {   
    
       let messageFile = st.doc().uri
     this.fileClient.fetchAndParse(messageFile,'text/turtle').then(graph=>{

    this.parseMessage(graph,st)

    },err=> console.log(err) )
     
   })

 }, (err)=> {
   // error occurred
   console.log(err)
});


}


workingIndex():any{
  if(this.activeWorkSpace.isMine()) 
  {  
    console.log("ISMINE "+ this.activeWorkSpace.localIndexFile())
    return this.activeWorkSpace.localIndexFile()
  }
  else {
    let subject = this.podhandler.store.sym(this.activeWorkSpace.localIndexFile()+"#this")
    let pred =   this.podhandler.store.sym(this.podhandler.ns.rdf("seeAlso"))
    let innd =  this.podhandler.store.canon(this.podhandler.store.any(subject,pred))
    console.log("NOTMINE "+ innd)
    return innd      
  }
 }
 
 subscribe =(doc,refreshFunction)=>{
  this.podhandler.updater.addDownstreamChangeListener(doc, refreshFunction)
 }
 
 /**
  *  Parse the message to an object
  *  */ 
 parseMessage =async (graph:any,msgSym:any)=>{
 
 
  let msg = new Message()
  let content =  graph.any(msgSym,this.podhandler.ns.sioc('content'), null)
   let time =  graph.any(msgSym,this.podhandler.ns.dc("created"), null)
   let maker =  graph.any(msgSym,this.podhandler.ns.foaf("maker"), null)
 
  msg.uri = msgSym.value
  msg.content =  content != undefined ? content.value :"" 
  msg.dateCreated =  new Date(time) 
 
  msg.maker = maker.value
  
  msg.makerProfile =  await this.podhandler.rdf.getProfile(msg.maker)

 const alreadyExist = this.messages.find((msgObj) => msgObj.uri === msg.uri);
 if (alreadyExist === undefined) {
    //  this.messagesList.push(msg)
      this.messages.push({
  uri:msg.uri,
  text: msg.content,
  date: msg.dateCreated,
  reply: false,
  type:  'text', //files.length ? 'file' :
 // files: files,
  user: {
    name: msg.makerProfile.fn,
    avatar: msg.makerProfile.picture,
  },
});
this.cdr.markForCheck()
 }

 
  
 }

 setActiveWS= async(wkspace:any)=>{
  let me = this.podhandler.me
  this.activeWorkSpace = new Workspace(wkspace.name, wkspace.url,me)
  this.activeWorkSpace.setName(wkspace.name)


 this.activeWorkSpace.owner = await  this.podhandler.loadResource(this.activeWorkSpace.localIndexFile())
  .then(async (res)=>{
         let sym =  this.podhandler.store.sym(this.activeWorkSpace.localIndexFile()+"#this")
    let owner = this.podhandler.store.any(sym,
        this.podhandler.store.sym(this.podhandler.ns.dc("author"))).uri

        return owner
  })
  .catch(err=>{
      console.log(err)
  })


 this.activeWorkSpace.indexFile = await this.workingIndex()

 let subject = this.podhandler.store.sym(this.activeWorkSpace.indexFile+"#this")
 let subjectDoc = subject.doc()
 let chatDoc = this.podhandler.store.sym(this.activeWorkSpace.getChatStoreFile()).doc()
 // Subscribe to receive changes
 this.subscribe(subjectDoc,this.syncMessages)
  this.subscribe(chatDoc,this.syncMessages)
 
 

await  this.syncMessages()

}
 
getSelectedItem() {
  this.menuService.onItemSelect()
     .pipe(takeWhile(() => this.alive))
    .subscribe( (menuBag) => {
        this.messages = []
        this.cdr.markForCheck()
   //   if(this.selectedItem.link != menuBag.item.link){   }
         this.selectedItem = menuBag.item;
          this.setActiveWS(this.selectedItem['payload'])
   
      
      console.log("SelectedItem "+JSON.stringify(this.selectedItem))
     
      
     
    });
}

 
deleteFolder(){
let url = this.selectedItem['payload']
this.fileClient.deleteFolder(this.activeWorkSpace.getUri()).then(success => {
  console.log(`Deleted ${this.activeWorkSpace.getUri()}.`);
}, err => console.log(err) );
}

sortFunc(a,b){
  return a.date - b.date
 }


}
